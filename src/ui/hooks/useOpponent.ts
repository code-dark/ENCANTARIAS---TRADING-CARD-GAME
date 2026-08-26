import { useEffect, useRef } from 'react';
import { getCurrentPlayer } from '../../core/game/gameState';
import { greedy } from '../../core/ai/greedyPolicy';
import { useGameStore } from '../../store/gameStore';

/**
 * How long the opponent waits before each of its actions.
 *
 * Not for suspense — so the log can be read. The bot resolves a whole turn in
 * microseconds, and a turn that appears already finished teaches nobody what
 * happened in it. This is the pace at which a person can follow a line of the
 * log before the next one arrives.
 */
const THINKING_MS = 700;

/**
 * Drives the opponent's turn.
 *
 * It goes through `dispatch` like a click does, so the opponent is subject to
 * every rule a person is — the same validator, the same refusals. It has no
 * back door into the state.
 */
export function useOpponent(botIds: string[]) {
  const { gameState, dispatch } = useGameStore();
  // Guards against a second timer being armed while one is pending: React may
  // re-run this effect for reasons that have nothing to do with the turn.
  const pending = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState || gameState.isEnded) return;

    const current = getCurrentPlayer(gameState);
    if (!botIds.includes(current.id)) return;
    if (pending.current !== null) return;

    pending.current = window.setTimeout(() => {
      pending.current = null;
      dispatch(greedy.decide(gameState));
    }, THINKING_MS);

    return () => {
      if (pending.current !== null) {
        window.clearTimeout(pending.current);
        pending.current = null;
      }
    };
  }, [gameState, botIds, dispatch]);
}

/** Whose turn it is, for the interface to say so. */
export function isOpponentTurn(
  gameState: { players: { id: string }[]; currentPlayerIndex: number } | null,
  botIds: string[]
): boolean {
  if (!gameState) return false;
  return botIds.includes(gameState.players[gameState.currentPlayerIndex].id);
}
