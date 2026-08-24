/**
 * Central Game State
 * Single source of truth for all game logic
 */

import { AnyCard, TerritoryCard } from '../cards/types';

export type GamePhase =
  | 'Awaken'      // Reactivate cards
  | 'Memory'      // Draw/manage resources
  | 'Movement'    // Stay or traverse territory
  | 'Manifestation' // Play cards
  | 'Action'      // Activate abilities/resonances
  | 'Consequence'; // Resolve effects

export const PHASE_ORDER: GamePhase[] = [
  'Awaken',
  'Memory',
  'Movement',
  'Manifestation',
  'Action',
  'Consequence',
];

export interface Player {
  id: string;
  name: string;
  hand: AnyCard[];
  deck: AnyCard[];
  discard: AnyCard[];
  activeTerritory?: TerritoryCard;
  linkedCards: Map<string, AnyCard[]>; // cardId -> linked cards
  journeyProgress?: JourneyProgress;
  resources?: {
    vínculo?: number;
    memoria?: number;
    circulation?: number;
  };
}

export interface JourneyProgress {
  journeyId: string;
  objectives: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  completed: boolean;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];

  // Shared zones
  commonEvents: AnyCard[]; // Shared events on the table

  // History for undo/replay
  actionHistory: GameAction[];

  // Game flags
  isEnded: boolean;
  winner?: string;
  maxTurns?: number;
}

export type GameAction =
  | { type: 'PlayCard'; playerId: string; card: AnyCard }
  | { type: 'Traverse'; playerId: string; fromTerritory: TerritoryCard; toTerritory: TerritoryCard }
  | { type: 'ActivateResonance'; playerId: string; cardId: string; resonanceEffect: string }
  | { type: 'ActivateAbility'; playerId: string; cardId: string }
  | { type: 'PassPhase'; playerId: string }
  | { type: 'EndTurn'; playerId: string }
  | { type: 'DrawCard'; playerId: string; card: AnyCard }
  | { type: 'Discard'; playerId: string; card: AnyCard }
  | { type: 'TransformCard'; playerId: string; cardId: string; newState: string };

/**
 * Creates initial game state
 */
export function createGameState(players: Player[]): GameState {
  return {
    id: `game_${Date.now()}`,
    phase: 'Awaken',
    turn: 1,
    currentPlayerIndex: 0,
    players,
    commonEvents: [],
    actionHistory: [],
    isEnded: false,
    maxTurns: 20,
  };
}

/**
 * Get current active player
 */
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/**
 * Get next player index (circular)
 */
export function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

/**
 * Advance to next phase
 */
export function advancePhase(state: GameState): GameState {
  const currentIndex = PHASE_ORDER.indexOf(state.phase);
  const isLastPhase = currentIndex === PHASE_ORDER.length - 1;

  return {
    ...state,
    phase: isLastPhase ? 'Awaken' : PHASE_ORDER[currentIndex + 1],
  };
}

/**
 * End current turn and move to next player
 */
export function endTurn(state: GameState): GameState {
  const nextPlayerIndex = getNextPlayerIndex(state);
  const isTurnComplete = nextPlayerIndex === 0;

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turn: isTurnComplete ? state.turn + 1 : state.turn,
    phase: 'Awaken', // Reset to first phase
  };
}

/**
 * Add action to history (for replay/undo)
 */
export function recordAction(state: GameState, action: GameAction): GameState {
  return {
    ...state,
    actionHistory: [...state.actionHistory, action],
  };
}
