/**
 * Game State Store (Zustand)
 * Manages all game state mutations
 */

import { create } from 'zustand';
import {
  GameState,
  GameAction,
  Player,
  createGameState,
  advancePhase,
  endTurn,
  recordAction,
} from '../core/game/gameState';

interface GameStore {
  gameState: GameState | null;
  selectedCardId: string | null;

  // State mutations
  initializeGame: (players: Player[]) => void;
  nextPhase: () => void;
  nextTurn: () => void;
  recordGameAction: (action: GameAction) => void;
  selectCard: (cardId: string | null) => void;
  endGame: (winnerId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  selectedCardId: null,

  initializeGame: (players: Player[]) => {
    const initialState = createGameState(players);
    set({ gameState: initialState });
  },

  nextPhase: () => {
    set((state) => {
      if (!state.gameState) return state;
      return { gameState: advancePhase(state.gameState) };
    });
  },

  nextTurn: () => {
    set((state) => {
      if (!state.gameState) return state;
      return { gameState: endTurn(state.gameState) };
    });
  },

  recordGameAction: (action: GameAction) => {
    set((state) => {
      if (!state.gameState) return state;
      return { gameState: recordAction(state.gameState, action) };
    });
  },

  selectCard: (cardId: string | null) => {
    set({ selectedCardId: cardId });
  },

  endGame: (winnerId: string) => {
    set((state) => {
      if (!state.gameState) return state;
      return {
        gameState: {
          ...state.gameState,
          isEnded: true,
          winner: winnerId,
        },
      };
    });
  },
}));
