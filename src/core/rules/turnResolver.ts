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
  record,
  freshAccomplishments,
} from '../game/gameState';
import { evaluateJourney, completedObjectiveIds } from '../mechanics/journey';
import { getCard } from '../cards/cardRegistry';
import { TerritoryCard } from '../cards/types';
import {
  evaluateMemoryPersistence, effectiveTraversalCost, traversalVinculoCost,
} from '../mechanics/traversal';
import { executeEffects } from '../effects/executor';
import { meets } from '../effects/conditions';
import { EffectTrigger } from '../effects/types';
import { claimMemory } from './claimMemory';
import {
  detectResonances,
  detectConjunctions,
  participantNames,
} from '../mechanics/resonance';
import {
  bestListener, escutaOf, exploreContext, findByExploring, findByResonance, findBySourceId,
} from '../mechanics/memory';
import { findByObject } from '../mechanics/objects';
import { rollD6, readExploreRoll, exploreThreshold } from '../game/random';
import { ArtifactCard, EventCard } from '../cards/types';

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

  // What the cards themselves do as the turn closes, before the table is read
  // for gatherings.
  let next = fireTrigger(state, 'aoEncerrarTurno', player.id);

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
      accomplishments: {
        ...p.accomplishments,
        conjunctionsFormed: record(p.accomplishments.conjunctionsFormed, match.id),
      },
    }));

    next = appendLog(
      next, player.id,
      `${match.name} se forma em ${territoryDef.name} — ` +
        `${participantNames(match).join(' + ')}. ${match.effect}`
    );

    next = executeEffects(next, match.effects, {
      playerId: player.id,
      sourceName: match.name,
      territoryInstanceId: territory.instanceId,
    });

    // The gathering opens a layer nothing else reaches.
    for (const memory of findBySourceId(next.memoryPool, match.id)) {
      next = claimMemory(next, player.id, memory, territory.instanceId);
      next = appendLog(
        next, player.id,
        `${match.name} revela ${getCard(memory.cardId).name}.`
      );
    }
  }

  return verifyJourneys(next);
}

/**
 * The end-of-turn verification. Nobody claims a victory: the system reads the
 * Jornada against what is true now, and if every requirement is met the match
 * is over at once — which is what makes the other player's defeat a matter of
 * having been slower rather than of having been attacked.
 *
 * Only the player whose turn is ending is checked. A Jornada is completed on
 * your own turn, by what you did in it.
 */
export function verifyJourneys(state: GameState): GameState {
  const player = getCurrentPlayer(state);
  const status = evaluateJourney(player);
  if (!status) return state;

  const met = completedObjectiveIds(status);
  const already = player.journeyProgress?.completedObjectiveIds ?? [];

  let next = updatePlayer(state, player.id, (p) => ({
    ...p,
    journeyProgress: {
      journeyId: status.journey.id,
      completedObjectiveIds: met,
      completed: status.completed,
    },
  }));

  // Say what was reached this turn, so progress is legible without a panel.
  for (const objective of status.objectives) {
    if (objective.met && !already.includes(objective.objective.id)) {
      next = appendLog(
        next, player.id,
        `${status.journey.name}: ${objective.objective.description} — cumprido.`
      );
    }
  }

  if (!status.completed) return next;

  next = appendLog(
    next, player.id,
    `${player.name} completa a Jornada ${status.journey.name}. A partida termina.`
  );

  return { ...next, isEnded: true, winnerId: player.id };
}

export function endTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const wrapped = nextIndex === 0;
  const turn = wrapped ? state.turn + 1 : state.turn;

  // Not a losing condition: a match is decided by a Jornada and by nothing
  // else. This only stops a harness that would otherwise loop forever, and a
  // real match is built with NO_TURN_LIMIT so it never trips.
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
    return appendLog(
      rotated,
      state.players[state.currentPlayerIndex].id,
      'A simulação atingiu o limite de turnos sem que nenhuma Jornada se completasse.'
    );
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

  return appendLog(refreshed, player.id, `${player.name} desperta.`);
}

/**
 * Give every card standing in the active Território its chance at this moment.
 *
 * The resolver announces moments; cards decide whether they care. Nothing here
 * knows what any particular card does, which is the whole point: a card that
 * reacts to a discovery is a data entry, not a branch in this file.
 *
 * Only what is present acts. A card left behind in another Território is not
 * there to react, and a card kept inside an object is out of circulation.
 */
export function fireTrigger(
  state: GameState,
  trigger: EffectTrigger,
  playerId: string,
  /** Restrict to one card — used when the moment is about that card itself. */
  onlyInstanceId?: string
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  const territory = activeTerritoryOf(player);
  if (!territory) return state;

  const standing = [
    ...player.inPlay.filter((c) => c.linkedTo === territory.instanceId),
    territory,
  ].filter((c) => !onlyInstanceId || c.instanceId === onlyInstanceId);

  return standing.reduce((current, instance) => {
    const def = getCard(instance.cardId);
    const rules = (def.effectRules ?? []).filter((r) => r.quando === trigger);

    return rules.reduce((afterRules, rule) => {
      if (!meets(afterRules, rule.se, playerId)) return afterRules;

      const announced = rule.texto
        ? appendLog(afterRules, playerId, `${def.name}: ${rule.texto}`)
        : afterRules;

      return executeEffects(announced, rule.entao, {
        playerId,
        sourceName: def.name,
        territoryInstanceId: territory.instanceId,
      });
    }, current);
  }, state);
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
    // Drawing gives a card and nothing else. The resource comes from listening
    // to a place — see resolveTransmit. Granting it here as well would be the
    // abstract income this design deliberately does not have.
  }));

  return appendLog(
    { ...next, turnFlags: { ...next.turnFlags, hasDrawn: true } },
    playerId,
    `${player.name} compra ${getCard(drawn.cardId).name}.`
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
      ? 'e o acrescenta aos seus Territórios'
      : 'e a manifesta';

  let out = appendLog(next, playerId, `${player.name} joga ${def.name} ${where}.`);

  // An Acontecimento happens where the player is standing.
  if (def.type === 'Event') {
    const territory = activeTerritoryOf(out.players.find((p) => p.id === playerId)!);
    out = executeEffects(out, (def as EventCard).effects, {
      playerId,
      sourceName: def.name,
      territoryInstanceId: territory?.instanceId,
    });
  }

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
        // A record gives access; it does not transmit. The Memory waits to be
        // read aloud like any other, because the rule is about the Memory.
        out = appendLog(
          {
            ...out,
            pendingDiscovery: {
              playerId,
              options: [reached],
              territoryInstanceId: territory.instanceId,
              roll: 0,
              mode: 'leitura',
              origin: 'outro',
            },
          },
          playerId,
          `${def.name} alcança ${getCard(reached.cardId).name}. Falta ler em voz alta.`
        );
      } else if (def.accessSources?.length || def.accessTags?.length) {
        out = appendLog(out, playerId, `${def.name} aponta para algo que já não está por descobrir.`);
      }
    }
  }

  // The card itself may have something to say about having arrived.
  return def.type === 'Territory'
    ? out
    : fireTrigger(out, 'aoManifestar', playerId, instanceId);
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
  const cost = effectiveTraversalCost(fromDef, toDef, state.turnFlags);


  // Arriving somewhere you have never listened gives the turn's Escuta back.
  //
  // Without this, standing still was strictly dominant and no amount of tuning
  // fixed it: listening cost nothing and crossing cost 1–2 Memória plus a
  // Vínculo, so the arithmetic said stay. 500 matches agreed — 1.0 Território
  // used per player, every match, across every threshold we tried. Crossing
  // has to buy something now, not merely cost less later; what it buys is the
  // first account of a place that has not been asked yet.
  const firstTimeHere = (player.accomplishments.listensByTerritory[to.cardId] ?? 0) === 0;
  const vinculoCost = traversalVinculoCost(state.turnFlags, firstTimeHere);

  const stayed: string[] = [];
  const travelled: string[] = [];

  const next = updatePlayer(state, playerId, (p) => ({
    ...p,
    activeTerritoryId: territoryInstanceId,
    resources: {
      ...p.resources,
      memoria: p.resources.memoria - cost,
      vinculo: p.resources.vinculo - vinculoCost,
    },
    accomplishments: {
      ...p.accomplishments,
      territoriesVisited: record(p.accomplishments.territoriesVisited, to.cardId),
    },
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

  const parts = [
    cost === 0 && vinculoCost === 0
      ? `${player.name} atravessa para ${toDef.name} sem custo`
      : `${player.name} atravessa para ${toDef.name} por ${cost} de Memória ` +
        `e ${vinculoCost} de Vínculo`,
  ];
  if (travelled.length) parts.push(`levando ${travelled.join(', ')}`);
  if (stayed.length) parts.push(`deixando ${stayed.join(', ')} para trás`);
  if (firstTimeHere) parts.push('e o lugar ainda tem tudo a dizer');

  return appendLog(
    {
      ...next,
      turnFlags: {
        ...next.turnFlags,
        // A free crossing is spent by crossing, not by the turn ending.
        hasTraversed: true,
        travessiaLivre: false,
        // Somewhere never listened to gives this turn's Escuta back.
        hasListened: firstTimeHere ? false : next.turnFlags.hasListened,
      },
    },
    playerId,
    `${parts.join('; ')}.`
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

  const available = findByExploring(
    state.memoryPool,
    exploreContext(territoryDef, escutaOf(listener), player.inPlay, territory.instanceId)
  );

  // What this place has already told this player raises the die.
  const heard = player.accomplishments.listensByTerritory[territory.cardId] ?? 0;
  const threshold = exploreThreshold(heard);

  const { value: roll, seed } = rollD6(state.rngSeed);
  const outcome = readExploreRoll(roll, available.length, threshold);

  // The listening costs the Personagem their turn whatever the die says, and
  // the Território's Escuta is one action per turn however many Personagens
  // are standing in it.
  let next = updatePlayer(
    {
      ...state,
      rngSeed: seed,
      turnFlags: { ...state.turnFlags, hasListened: true },
    },
    playerId,
    (p) => ({
      ...p,
      inPlay: p.inPlay.map((c) =>
        c.instanceId === listener.instanceId ? { ...c, exhausted: true } : c
      ),
      // The attempt counts, not the result: a place gives up what it has to
      // someone who keeps asking, and then has less to give.
      accomplishments: {
        ...p.accomplishments,
        listensByTerritory: {
          ...p.accomplishments.listensByTerritory,
          [territory.cardId]: heard + 1,
        },
      },
    })
  );

  if (outcome === 'nothing') {
    return appendLog(
      next, playerId,
      `${listenerName} escuta em ${territoryDef.name} — rola ${roll} ` +
        `(precisava ${threshold}+). Nada vem à tona desta vez.`
    );
  }

  const options = outcome === 'choice' ? available.slice(0, 2) : available.slice(0, 1);

  next = appendLog(
    next, playerId,
    outcome === 'choice'
      ? `${listenerName} escuta em ${territoryDef.name} — rola ${roll}. ` +
          `O lugar oferece mais de um relato.`
      : `${listenerName} escuta em ${territoryDef.name} — rola ${roll} ` +
          `(${threshold}+). Algo vem à tona.`
  );

  return {
    ...next,
    pendingDiscovery: {
      playerId,
      options,
      territoryInstanceId: territory.instanceId,
      roll,
      // A 6 offers alternatives; anything else surfaced one account to read.
      mode: outcome === 'choice' ? 'escolha' : 'leitura',
      origin: 'escuta',
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

  // In 'escolha' the options are alternatives and the rest stay in the world.
  // In 'leitura' they are a queue: reading one leaves the others waiting.
  const remaining =
    pending.mode === 'leitura'
      ? pending.options.filter((o) => o.instanceId !== memoryInstanceId)
      : [];

  const claimed = claimMemory(
    {
      ...state,
      pendingDiscovery:
        remaining.length > 0 ? { ...pending, options: remaining } : undefined,
    },
    playerId,
    chosen,
    pending.territoryInstanceId
  );

  const player = state.players.find((p) => p.id === playerId)!;

  /**
   * Where the Memória that pays for things comes from.
   *
   * Not from drawing — a player does not gain mana. They listen to a place,
   * find something the city had not given up yet, and say it out loud; only
   * then is it theirs to spend. Which also means the resource cannot arrive
   * before the reading: the reading is what completes the transmission.
   *
   * Only the Território's Escuta produces it. A record already in hand reaches
   * a Memory that exists, but it does not make the city yield anything new,
   * and paying for it would let a deck of documents print the economy.
   */
  const earns = pending.origin === 'escuta';

  const paid = earns
    ? updatePlayer(claimed, playerId, (p) => ({
        ...p,
        resources: { ...p.resources, memoria: p.resources.memoria + 1 },
      }))
    : claimed;

  const spoken = appendLog(
    paid, playerId,
    `${player.name} lê ${getCard(chosen.cardId).name} em voz alta. ` +
      `A Memória é lembrada${earns ? ', e vale +1 de Memória' : ''}.`
  );

  // Something in this place may be listening for exactly this.
  return fireTrigger(spoken, 'aoDescobrirMemoria', playerId);
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
    `${getCard(memory.cardId).name} é guardada em ${getCard(container.cardId).name}, ` +
      `protegida e fora de circulação.`
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
    `${getCard(memory.cardId).name} volta à circulação em ` +
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
      `${def.name} não encontra Ressonância em ${territoryDef.name}.`
    );
  }

  // A relation is recognised once. Re-activating it in the same place every
  // turn still runs its effects — that is why you would do it — but it does
  // not pay Vínculo again: the same faucet the per-relation payout opened in
  // breadth, re-activation was opening in time.
  // Still recorded per relation: the Jornada counts relations recognised, not
  // times activated. Only the payment stopped being capped.
  const relation = `${def.id}@${territoryDef.id}`;

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === instanceId ? { ...c, exhausted: true } : c
    ),
    // One Vínculo for the act of resonating, however many relations the place
    // recognises. Paying per relation made a two-relation Território hand out
    // three Vínculo at once and race the Jornadas that ask for it. Extra
    // relations still matter — they widen what the Ressonância *does*.
    //
    // It pays on every activation, including a relation already recognised.
    // The cap existed because Vínculo was income with nothing to spend it on,
    // so an uncapped faucet simply raced the Jornada that counts it. Now that
    // Travessia is paid in Vínculo the faucet has a drain, and capping it
    // instead produced deadlock: a player needed Vínculo to reach the new
    // relations that were the only source of Vínculo.
    resources: {
      ...p.resources,
      vinculo: p.resources.vinculo + 1,
    },
    accomplishments: {
      ...p.accomplishments,
      // The same relation in the same place is one Ressonância, however many
      // times it is activated: the Jornada counts relations, not activations.
      resonancesActivated: record(p.accomplishments.resonancesActivated, relation),
    },
  }));

  next = appendLog(
    next,
    playerId,
    `${def.name} ressoa com ${territoryDef.name}: ${matches.map((m) => m.effect).join(' ')}`
  );

  // What the relation opens, if this place has anything to open. A Ressonância
  // with no effects is still a Ressonância: the recognition and its Vínculo.
  for (const match of matches) {
    next = executeEffects(next, match.effects, {
      playerId,
      sourceName: `${def.name} em ${territoryDef.name}`,
      territoryInstanceId: territory.instanceId,
    });
  }

  // Standing rules this card carries for its own resonance.
  next = fireTrigger(next, 'aoRessoar', playerId, instanceId);

  // The manifestation opens layers of the place that listening alone cannot
  // reach. These Memories exist nowhere else in the game.
  const revealed = findByResonance(
    next.memoryPool,
    def.id,
    territoryDef,
    matches.flatMap((m) => (m.id ? [m.id] : []))
  );
  for (const memory of revealed) {
    next = claimMemory(next, playerId, memory, territory.instanceId);
    next = appendLog(
      next,
      playerId,
      `A manifestação revela ${getCard(memory.cardId).name} em ${territoryDef.name}.`
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
    accomplishments: freshAccomplishments(),
  };
}
