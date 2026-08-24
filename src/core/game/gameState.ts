/**
 * Central game state.
 *
 * Zones hold CardInstances, never definitions — see cards/cardRegistry.ts.
 * Every function here is pure: it returns a new state and never mutates its
 * argument, so the action log can replay a match from the start.
 */

import { CardInstance } from '../cards/types';

export type GamePhase =
  | 'Awaken'
  | 'Memory'
  | 'Movement'
  | 'Manifestation'
  | 'Action'
  | 'Consequence';

export const PHASE_ORDER: GamePhase[] = [
  'Awaken',
  'Memory',
  'Movement',
  'Manifestation',
  'Action',
  'Consequence',
];

/** What each phase lets a player do, beyond always being able to pass. */
export const PHASE_ACTIONS: Record<GamePhase, string[]> = {
  Awaken: [],
  Memory: ['DrawCard'],
  Movement: ['Traverse'],
  Manifestation: ['PlayCard'],
  Action: ['ActivateResonance', 'Explore'],
  Consequence: [],
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

export interface LogEntry {
  turn: number;
  phase: GamePhase;
  playerId: string;
  message: string;
}

export function createGameState(
  players: Player[],
  memoryPool: CardInstance[] = [],
  maxTurns = 20
): GameState {
  return {
    id: `game_${Date.now()}`,
    phase: 'Awaken',
    turn: 1,
    currentPlayerIndex: 0,
    players,
    memoryPool,
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
