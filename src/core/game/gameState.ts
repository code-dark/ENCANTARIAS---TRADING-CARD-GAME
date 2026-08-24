/**
 * Central game state.
 *
 * Zones hold CardInstances, never definitions — see cards/cardRegistry.ts.
 * Every function here is pure: it returns a new state and never mutates its
 * argument, so the action log can replay a match from the start.
 */

import { CardInstance } from '../cards/types';

/**
 * The turn, named as the design document names it. Consequência is split into
 * Acontecimento (events resolve) and Encerramento (Ressonâncias, Transformações
 * and end conditions are checked), because those are different moments: one
 * changes the world, the other reads what the change produced.
 */
export type GamePhase =
  | 'Despertar'
  | 'Memoria'
  | 'Travessia'
  | 'Manifestacao'
  | 'Acao'
  | 'Acontecimento'
  | 'Encerramento';

export const PHASE_ORDER: GamePhase[] = [
  'Despertar',
  'Memoria',
  'Travessia',
  'Manifestacao',
  'Acao',
  'Acontecimento',
  'Encerramento',
];

/** What each phase lets a player do, beyond always being able to pass. */
export const PHASE_ACTIONS: Record<GamePhase, string[]> = {
  Despertar: [],
  Memoria: ['DrawCard'],
  Travessia: ['Traverse'],
  Manifestacao: ['PlayCard'],
  Acao: [
    'ActivateResonance', 'Explore', 'StoreMemory', 'RetrieveMemory', 'TransmitMemory',
  ],
  Acontecimento: [],
  Encerramento: [],
};

export interface PlayerResources {
  vinculo: number;
  memoria: number;
  circulacao: number;
}

/**
 * The Jornada a player is playing for, and the last verification of it.
 *
 * The objectives themselves live in the Jornada data; what is kept here is the
 * result of the check the system runs at the end of each turn, so the log and
 * the end-of-match summary can say what was true when the match ended.
 */
export interface JourneyProgress {
  journeyId: string;
  /** Objectives met at the last end-of-turn verification. */
  completedObjectiveIds: string[];
  completed: boolean;
}

/**
 * What a player has done, as opposed to what they are holding.
 *
 * Some Jornadas ask about the table (Memórias in play, a Lenda manifested) and
 * the table answers for itself. Others ask about the match — places crossed,
 * Ressonâncias opened, gatherings formed — and nothing in the zones remembers
 * those once the moment has passed. Each list holds identities rather than a
 * number so an action that repeats itself does not count twice.
 */
export interface Accomplishments {
  /** cardIds of the Territórios the player has been active in. */
  territoriesVisited: string[];
  /** `cardId@territoryCardId` — the same relation in the same place counts once. */
  resonancesActivated: string[];
  /** Conjunction ids, e.g. the Cortejo Maldito. */
  conjunctionsFormed: string[];
  /** instanceIds of cards whose state has changed. */
  transformations: string[];
}

export const FRESH_ACCOMPLISHMENTS: Accomplishments = {
  territoriesVisited: [],
  resonancesActivated: [],
  conjunctionsFormed: [],
  transformations: [],
};

/** Add to an accomplishment list without repeating an entry. */
export function record(list: string[], entry: string): string[] {
  return list.includes(entry) ? list : [...list, entry];
}

export interface Player {
  id: string;
  name: string;

  // Zones
  deck: CardInstance[];
  hand: CardInstance[];
  /** Manifestations on the table, each linked to a territory or a legend. */
  inPlay: CardInstance[];
  discard: CardInstance[];
  /** The player's own territory cards; exactly one is active at a time. */
  territories: CardInstance[];
  activeTerritoryId: string;

  resources: PlayerResources;
  journeyProgress?: JourneyProgress;
  accomplishments: Accomplishments;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];

  /**
   * Memories still waiting in the world. They belong to no deck and no player:
   * they are reached by exploring, by a Lenda resonating, by an Acontecimento
   * or by an object that carries a record.
   */
  memoryPool: CardInstance[];

  /**
   * A Memory found but not yet transmitted. At the table the player reads the
   * fact aloud before it counts; here it waits for the player to confirm they
   * have read it. Until then it belongs to no one.
   */
  pendingDiscovery?: PendingDiscovery;

  /** Deterministic roll state — see game/random.ts. */
  rngSeed: number;

  log: LogEntry[];
  /** Once-per-turn allowances, cleared when the turn passes. */
  turnFlags: TurnFlags;
  isEnded: boolean;
  winnerId?: string;
  maxTurns: number;
}

/**
 * Guards the actions the GDD limits to one per turn. Without these, Memory
 * would draw a whole deck and Movement would make Travessia free.
 */
export interface TurnFlags {
  hasDrawn: boolean;
  hasTraversed: boolean;
}

export const FRESH_TURN_FLAGS: TurnFlags = { hasDrawn: false, hasTraversed: false };

export interface PendingDiscovery {
  playerId: string;
  /** One option normally; two when the roll opened a choice. */
  options: CardInstance[];
  /** Where it was found, and where it will be rooted. */
  territoryInstanceId: string;
  /** What the die said, so the UI can explain the moment. */
  roll: number;
}

export interface LogEntry {
  turn: number;
  phase: GamePhase;
  playerId: string;
  message: string;
}

export function createGameState(
  players: Player[],
  memoryPool: CardInstance[] = [],
  maxTurns = 20,
  /** Pin this in tests; any number works for a real match. */
  rngSeed = Date.now() >>> 0
): GameState {
  return {
    id: `game_${Date.now()}`,
    phase: 'Despertar',
    turn: 1,
    currentPlayerIndex: 0,
    players,
    memoryPool,
    rngSeed,
    log: [],
    turnFlags: { ...FRESH_TURN_FLAGS },
    isEnded: false,
    maxTurns,
  };
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((p) => p.id === playerId);
}

export function activeTerritoryOf(player: Player): CardInstance | undefined {
  return player.territories.find((t) => t.instanceId === player.activeTerritoryId);
}

/** Find an instance anywhere in a player's zones. */
export function findInstance(
  player: Player,
  instanceId: string
): CardInstance | undefined {
  return (
    player.hand.find((c) => c.instanceId === instanceId) ??
    player.inPlay.find((c) => c.instanceId === instanceId) ??
    player.deck.find((c) => c.instanceId === instanceId) ??
    player.discard.find((c) => c.instanceId === instanceId) ??
    player.territories.find((c) => c.instanceId === instanceId)
  );
}

/** Replace one player in the state, leaving the others untouched. */
export function updatePlayer(
  state: GameState,
  playerId: string,
  update: (player: Player) => Player
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? update(p) : p)),
  };
}

export function appendLog(state: GameState, playerId: string, message: string): GameState {
  return {
    ...state,
    log: [...state.log, { turn: state.turn, phase: state.phase, playerId, message }],
  };
}
