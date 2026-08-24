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
import { CardInstance, TerritoryCard } from '../cards/types';
import { evaluateMemoryPersistence, traversalCost } from '../mechanics/traversal';
import {
  detectResonances,
  detectConjunctions,
  participantNames,
} from '../mechanics/resonance';
import {
  bestListener, escutaOf, findByExploring, findByResonance, findBySourceId,
} from '../mechanics/memory';
import { findByObject } from '../mechanics/objects';
import { rollD6, readExploreRoll, EXPLORE_SUCCESS } from '../game/random';
import { ArtifactCard } from '../cards/types';

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
    case 'Explore':
      return { state: resolveExplore(state, action.playerId) };
    case 'StoreMemory':
      return {
        state: resolveStore(
          state, action.playerId, action.memoryInstanceId, action.containerInstanceId
        ),
      };
    case 'RetrieveMemory':
      return { state: resolveRetrieve(state, action.playerId, action.memoryInstanceId) };
    case 'TransmitMemory':
      return { state: resolveTransmit(state, action.playerId, action.memoryInstanceId) };
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
  const moved: GameState = { ...state, phase: next };

  // Encerramento reads what the turn produced rather than changing the world:
  // gatherings that came together are recognised here.
  return next === 'Encerramento' ? runEncerramento(moved) : moved;
}

/**
 * Encerramento: recognise Ressonâncias that need a whole gathering.
 *
 * A conjunction fires once. The Território records which ones have already
 * opened, so standing there with the same set every turn does not reopen it —
 * that would be the infinite-Ressonância loop the GDD's QA section warns about.
 */
export function runEncerramento(state: GameState): GameState {
  const player = getCurrentPlayer(state);
  const territory = activeTerritoryOf(player);
  if (!territory) return state;

  const territoryDef = getCard(territory.cardId) as TerritoryCard;
  const here = player.inPlay.filter((c) => c.linkedTo === territory.instanceId);

  let next = state;

  for (const match of detectConjunctions(here, territoryDef)) {
    // Already opened here? Then it is part of the scenery now.
    if (territory.counters[match.id]) continue;

    next = updatePlayer(next, player.id, (p) => ({
      ...p,
      territories: p.territories.map((t) =>
        t.instanceId === territory.instanceId
          ? { ...t, counters: { ...t.counters, [match.id]: 1 } }
          : t
      ),
      resources: { ...p.resources, vinculo: p.resources.vinculo + 1 },
    }));

    next = appendLog(
      next, player.id,
      `${match.name} forms in ${territoryDef.name} — ` +
        `${participantNames(match).join(' + ')}. ${match.effect}`
    );

    // The gathering opens a layer nothing else reaches.
    for (const memory of findBySourceId(next.memoryPool, match.id)) {
      next = claimMemory(next, player.id, memory, territory.instanceId);
      next = appendLog(
        next, player.id,
        `${match.name} uncovers ${getCard(memory.cardId).name}.`
      );
    }
  }

  return next;
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
    phase: 'Despertar',
    turnFlags: { ...FRESH_TURN_FLAGS },
    isEnded: ended,
  };

  if (ended) {
    return appendLog(rotated, state.players[state.currentPlayerIndex].id, 'The match reached its turn limit.');
  }

  // Despertar resolves immediately for the incoming player.
  return runAwaken(rotated);
}

/** Despertar: clear exhaustion so the incoming player's cards are usable again. */
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

  let out = appendLog(next, playerId, `${player.name} plays ${def.name} and ${where}.`);

  // A document or a record reaches a Memory that already exists in the world.
  // It never creates one: if nothing answers, nothing is added.
  if (def.type === 'Artifact') {
    const territory = activeTerritoryOf(out.players.find((p) => p.id === playerId)!);
    if (territory) {
      const reached = findByObject(
        out.memoryPool,
        def as ArtifactCard,
        getCard(territory.cardId) as TerritoryCard
      )[0];

      if (reached) {
        out = claimMemory(out, playerId, reached, territory.instanceId);
        out = appendLog(
          out, playerId,
          `${def.name} reaches ${getCard(reached.cardId).name}.`
        );
      } else if (def.accessSources?.length || def.accessTags?.length) {
        out = appendLog(out, playerId, `${def.name} points at nothing still unfound.`);
      }
    }
  }

  return out;
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
 * Moves a Memory out of the world and into play, rooted in the Território
 * where it was found. A discovered Memory belongs to the place that gave it up.
 */
function claimMemory(
  state: GameState,
  playerId: string,
  memory: CardInstance,
  territoryInstanceId: string
): GameState {
  const withoutIt = state.memoryPool.filter(
    (m) => m.instanceId !== memory.instanceId
  );

  return updatePlayer(
    { ...state, memoryPool: withoutIt },
    playerId,
    (p) => ({
      ...p,
      inPlay: [
        ...p.inPlay,
        { ...memory, ownerId: playerId, linkedTo: territoryInstanceId },
      ],
    })
  );
}

/**
 * Exploração. A Personagem listens in the active Território and rolls 1d6.
 *
 * 2+ finds something (83%); a 6 finds it and opens a choice between what the
 * place has to offer; a 1 means the listening turned up nothing this time. The
 * Personagem is spent either way — the attempt is what costs, not the result.
 *
 * Nothing is gained yet. What is found waits to be read: a Memory only counts
 * once it has been transmitted.
 */
function resolveExplore(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const territory = activeTerritoryOf(player)!;
  const territoryDef = getCard(territory.cardId) as TerritoryCard;

  const listener = bestListener(player.inPlay, territory.instanceId)!;
  const listenerName = getCard(listener.cardId).name;

  const available = findByExploring(state.memoryPool, {
    territory: territoryDef,
    escuta: escutaOf(listener),
  });

  const { value: roll, seed } = rollD6(state.rngSeed);
  const outcome = readExploreRoll(roll, available.length);

  // The listening costs the Personagem their turn whatever the die says.
  let next = updatePlayer({ ...state, rngSeed: seed }, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === listener.instanceId ? { ...c, exhausted: true } : c
    ),
  }));

  if (outcome === 'nothing') {
    return appendLog(
      next, playerId,
      `${listenerName} listens in ${territoryDef.name} — rolls ${roll}. ` +
        `Nothing comes through this time.`
    );
  }

  const options = outcome === 'choice' ? available.slice(0, 2) : available.slice(0, 1);

  next = appendLog(
    next, playerId,
    outcome === 'choice'
      ? `${listenerName} listens in ${territoryDef.name} — rolls ${roll}. ` +
          `The place offers more than one account.`
      : `${listenerName} listens in ${territoryDef.name} — rolls ${roll} ` +
          `(${EXPLORE_SUCCESS}+). Something comes through.`
  );

  return {
    ...next,
    pendingDiscovery: {
      playerId,
      options,
      territoryInstanceId: territory.instanceId,
      roll,
    },
  };
}

/**
 * Transmitting what was found. At the table the fact is read aloud before the
 * Memory counts; here the player confirms having read it. Only now does it
 * leave the world and root itself in the Território.
 *
 * When the roll opened a choice, the options not taken stay in the world.
 */
function resolveTransmit(
  state: GameState,
  playerId: string,
  memoryInstanceId: string
): GameState {
  const pending = state.pendingDiscovery!;
  const chosen = pending.options.find((o) => o.instanceId === memoryInstanceId)!;

  const claimed = claimMemory(
    { ...state, pendingDiscovery: undefined },
    playerId,
    chosen,
    pending.territoryInstanceId
  );

  const player = state.players.find((p) => p.id === playerId)!;
  return appendLog(
    claimed, playerId,
    `${player.name} reads ${getCard(chosen.cardId).name} aloud. ` +
      `It is remembered.`
  );
}

/**
 * Keeping a Memória in an object. It stays in the game and keeps its state,
 * but it now points at the container rather than at the Território, which is
 * exactly what takes it out of circulation: Ressonância reads the table.
 */
function resolveStore(
  state: GameState,
  playerId: string,
  memoryInstanceId: string,
  containerInstanceId: string
): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const memory = player.inPlay.find((c) => c.instanceId === memoryInstanceId)!;
  const container = player.inPlay.find((c) => c.instanceId === containerInstanceId)!;

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === memoryInstanceId ? { ...c, linkedTo: containerInstanceId } : c
    ),
  }));

  return appendLog(
    next, playerId,
    `${getCard(memory.cardId).name} is kept in ${getCard(container.cardId).name}, ` +
      `protected and out of circulation.`
  );
}

/** Taking a Memória back out, into the Território the player is standing in. */
function resolveRetrieve(
  state: GameState,
  playerId: string,
  memoryInstanceId: string
): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const memory = player.inPlay.find((c) => c.instanceId === memoryInstanceId)!;
  const territory = activeTerritoryOf(player)!;

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === memoryInstanceId ? { ...c, linkedTo: territory.instanceId } : c
    ),
  }));

  return appendLog(
    next, playerId,
    `${getCard(memory.cardId).name} returns to circulation in ` +
      `${getCard(territory.cardId).name}.`
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

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === instanceId ? { ...c, exhausted: true } : c
    ),
    resources: { ...p.resources, vinculo: p.resources.vinculo + matches.length },
  }));

  next = appendLog(
    next,
    playerId,
    `${def.name} resonates with ${territoryDef.name}: ${matches.map((m) => m.effect).join(' ')}`
  );

  // The manifestation opens layers of the place that listening alone cannot
  // reach. These Memories exist nowhere else in the game.
  const revealed = findByResonance(next.memoryPool, def.id, territoryDef);
  for (const memory of revealed) {
    next = claimMemory(next, playerId, memory, territory.instanceId);
    next = appendLog(
      next,
      playerId,
      `The manifestation uncovers ${getCard(memory.cardId).name} in ${territoryDef.name}.`
    );
  }

  return next;
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
