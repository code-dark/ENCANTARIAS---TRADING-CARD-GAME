/**
 * Zustand store. It owns no rules — every change goes through applyAction, so
 * the UI cannot reach a state the engine would reject.
 */

import { create } from 'zustand';
import { GameState } from '../core/game/gameState';
import { GameAction } from '../core/game/actions';
import { applyAction } from '../core/rules/turnResolver';
import { validateAction } from '../core/game/validators';

interface GameStore {
  gameState: GameState | null;
  /** Why the last attempted action was refused, for the player to read. */
  lastError: string | null;
  selectedInstanceId: string | null;

  setGame: (state: GameState) => void;
  dispatch: (action: GameAction) => void;
  select: (instanceId: string | null) => void;
  /** Ask the engine whether an action would be allowed, without taking it. */
  check: (action: GameAction) => { valid: boolean; reason?: string };
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  lastError: null,
  selectedInstanceId: null,

  setGame: (state) => set({ gameState: state, lastError: null }),

  dispatch: (action) => {
    const current = get().gameState;
    if (!current) return;

    const { state, error } = applyAction(current, action);
    set({
      gameState: state,
      lastError: error ?? null,
      // Keep a rejected card selected so the player can try something else.
      selectedInstanceId: error ? get().selectedInstanceId : null,
    });
  },

  select: (instanceId) => set({ selectedInstanceId: instanceId, lastError: null }),

  check: (action) => {
    const current = get().gameState;
    if (!current) return { valid: false, reason: 'No match in progress.' };

    const result = validateAction(current, action);
    return result.valid ? { valid: true } : { valid: false, reason: result.reason };
  },
}));
