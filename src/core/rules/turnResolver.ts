/**
 * Turn resolution: validate an action, apply it, advance the phase clock.
 *
 * applyAction is the only entry point that changes a match. It refuses invalid
 * actions rather than throwing, so the UI can show the reason.
 */

import { GameAction, ValidationResult } from '../game/actions';
import { validateAction } from '../game/validators';
import {
  GameState,
  Player,
  PHASE_ORDER,
  FRESH_TURN_FLAGS,
  getCurrentPlayer,
  activeTerritoryOf,
  updatePlayer,
  appendLog,
} from '../game/gameState';
import { getCard } from '../cards/cardRegistry';
import { TerritoryCard } from '../cards/types';
import { evaluateMemoryPersistence, traversalCost } from '../mechanics/traversal';
import { detectResonances } from '../mechanics/resonance';

export interface ApplyResult {
  state: GameState;
  /** Set when the action was rejected; state is returned unchanged. */
  error?: string;
}

export function applyAction(state: GameState, action: GameAction): ApplyResult {
  const check: ValidationResult = validateAction(state, action);
  if (!check.valid) {
    return { state, error: check.reason };
  }

  switch (action.type) {
    case 'DrawCard':
      return { state: resolveDraw(state, action.playerId) };
    case 'PlayCard':
      return { state: resolvePlay(state, action.playerId, action.instanceId) };
    case 'Traverse':
      return { state: resolveTraverse(state, action.playerId, action.territoryInstanceId) };
    case 'ActivateResonance':
      return { state: resolveResonance(state, action.playerId, action.instanceId) };
    case 'PassPhase':
      return { state: advancePhase(state) };
  }
}

/* ------------------------------------------------------------------ *
 * Phase clock
 * ------------------------------------------------------------------ */

/**
 * Move to the next phase. Passing from the last phase ends the turn and hands
 * play to the next player, whose Awaken then runs automatically.
 */
export function advancePhase(state: GameState): GameState {
  const index = PHASE_ORDER.indexOf(state.phase);

  if (index === PHASE_ORDER.length - 1) {
    return endTurn(state);
  }

  const next = PHASE_ORDER[index + 1];
  return { ...state, phase: next };
}

export function endTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const wrapped = nextIndex === 0;
  const turn = wrapped ? state.turn + 1 : state.turn;

  const ended = turn > state.maxTurns;

  const rotated: GameState = {
    ...state,
    currentPlayerIndex: nextIndex,
    turn,
    phase: 'Awaken',
    turnFlags: { ...FRESH_TURN_FLAGS },
    isEnded: ended,
  };

  if (ended) {
    return appendLog(rotated, state.players[state.currentPlayerIndex].id, 'The match reached its turn limit.');
  }

  // Awaken resolves immediately for the incoming player.
  return runAwaken(rotated);
}

/** Awaken: clear exhaustion so the incoming player's cards are usable again. */
export function runAwaken(state: GameState): GameState {
  const player = getCurrentPlayer(state);

  const refreshed = updatePlayer(state, player.id, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) => (c.exhausted ? { ...c, exhausted: false } : c)),
    territories: p.territories.map((c) => (c.exhausted ? { ...c, exhausted: false } : c)),
  }));

  return appendLog(refreshed, player.id, `${player.name} awakens.`);
}

/* ------------------------------------------------------------------ *
 * Action resolution
 * ------------------------------------------------------------------ */

function resolveDraw(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const [drawn, ...rest] = player.deck;

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    deck: rest,
    hand: [...p.hand, drawn],
    // Recovering a Memory also yields the Memória that pays for manifestations.
    resources: { ...p.resources, memoria: p.resources.memoria + 1 },
  }));

  return appendLog(
    { ...next, turnFlags: { ...next.turnFlags, hasDrawn: true } },
    playerId,
    `${player.name} recovers ${getCard(drawn.cardId).name}.`
  );
}

function resolvePlay(state: GameState, playerId: string, instanceId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const card = player.hand.find((c) => c.instanceId === instanceId)!;
  const def = getCard(card.cardId);
  const cost = def.cost ?? 0;

  const next = updatePlayer(state, playerId, (p) => {
    const hand = p.hand.filter((c) => c.instanceId !== instanceId);
    const resources = { ...p.resources, memoria: p.resources.memoria - cost };

    if (def.type === 'Territory') {
      // A Território joins the pool; reaching it is a Travessia, not a play.
      return { ...p, hand, resources, territories: [...p.territories, card] };
    }

    return {
      ...p,
      hand,
      resources,
      inPlay: [...p.inPlay, { ...card, linkedTo: p.activeTerritoryId }],
    };
  });

  const where =
    def.type === 'Territory'
      ? 'adds it to their Territórios'
      : 'manifests it';

  return appendLog(next, playerId, `${player.name} plays ${def.name} and ${where}.`);
}

/**
 * Travessia. The player moves; their manifestations do not all follow.
 * Cards that stay keep pointing at the territory they were rooted in, which is
 * what makes "Roots stays behind" visible on the table instead of implied.
 */
function resolveTraverse(
  state: GameState,
  playerId: string,
  territoryInstanceId: string
): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const from = activeTerritoryOf(player);
  const to = player.territories.find((t) => t.instanceId === territoryInstanceId)!;

  const fromDef = from ? (getCard(from.cardId) as TerritoryCard) : undefined;
  const toDef = getCard(to.cardId) as TerritoryCard;
  const cost = traversalCost(fromDef, toDef);

  const stayed: string[] = [];
  const travelled: string[] = [];

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    activeTerritoryId: territoryInstanceId,
    resources: { ...p.resources, memoria: p.resources.memoria - cost },
    inPlay: p.inPlay.map((c) => {
      // Only cards rooted in the territory being left are re-evaluated.
      if (!from || c.linkedTo !== from.instanceId) return c;

      const def = getCard(c.cardId);
      const verdict = fromDef
        ? evaluateMemoryPersistence(def, fromDef, toDef, c.memoryState)
        : 'travels';

      if (verdict === 'travels') {
        travelled.push(def.name);
        return { ...c, linkedTo: territoryInstanceId };
      }

      stayed.push(def.name);
      return c; // stays linked to the territory left behind
    }),
  }));

  const parts = [`${player.name} crosses to ${toDef.name} for ${cost} Memória`];
  if (travelled.length) parts.push(`carrying ${travelled.join(', ')}`);
  if (stayed.length) parts.push(`leaving ${stayed.join(', ')} behind`);

  return appendLog(
    { ...next, turnFlags: { ...next.turnFlags, hasTraversed: true } },
    playerId,
    `${parts.join('; ')}.`
  );
}

/**
 * Ressonância. Detects what the active Território unlocks for this card and
 * exhausts it. The unlocked effects themselves are Phase C; for now the match
 * records which manifestation fired and grants the Vínculo it represents.
 */
function resolveResonance(state: GameState, playerId: string, instanceId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const card = player.inPlay.find((c) => c.instanceId === instanceId)!;
  const territory = activeTerritoryOf(player)!;

  const def = getCard(card.cardId);
  const territoryDef = getCard(territory.cardId) as TerritoryCard;
  const matches = detectResonances(def, territoryDef);

  if (matches.length === 0) {
    return appendLog(
      state,
      playerId,
      `${def.name} finds no Ressonância in ${territoryDef.name}.`
    );
  }

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === instanceId ? { ...c, exhausted: true } : c
    ),
    resources: { ...p.resources, vinculo: p.resources.vinculo + matches.length },
  }));

  return appendLog(
    next,
    playerId,
    `${def.name} resonates with ${territoryDef.name}: ${matches.map((m) => m.effect).join(' ')}`
  );
}

/** Convenience for tests and setup: a player with empty zones. */
export function emptyPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    deck: [],
    hand: [],
    inPlay: [],
    discard: [],
    territories: [],
    activeTerritoryId: '',
    resources: { vinculo: 0, memoria: 0, circulacao: 0 },
  };
}
