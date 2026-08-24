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

export interface JourneyProgress {
  journeyId: string;
  objectives: { id: string; description: string; completed: boolean }[];
  completed: boolean;
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
