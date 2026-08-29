/**
 * Policies for the simulator.
 *
 * The greedy one is the game's own opponent, imported rather than reimplemented
 * — measuring one bot and shipping another would make every number here a
 * statement about a game nobody plays. The baseline exists only in here: it is
 * the control that says what the greedy behaviours are worth.
 */

import { GameAction } from '../core/game/actions';
import { GameState, Player, getCurrentPlayer } from '../core/game/gameState';
import { validateAction } from '../core/game/validators';
import { getCard } from '../core/cards/cardRegistry';
import { Policy, greedy } from '../core/ai/greedyPolicy';

export type { Policy };
export { greedy };

const PASS = (state: GameState): GameAction => ({
  type: 'PassPhase',
  playerId: getCurrentPlayer(state).id,
});

const legal = (state: GameState, action: GameAction) =>
  validateAction(state, action).valid;

function firstLegal(state: GameState, candidates: GameAction[]): GameAction {
  return candidates.find((a) => legal(state, a)) ?? PASS(state);
}

/** Cards in hand this player could pay for, cheapest first. */
function affordable(player: Player) {
  return [...player.hand]
    .map((c) => ({ instance: c, def: getCard(c.cardId) }))
    .filter(({ def }) => (def.cost ?? 0) <= player.resources.memoria)
    .sort((a, b) => (a.def.cost ?? 0) - (b.def.cost ?? 0));
}

/* ------------------------------------------------------------------ *
 * Baseline: does the minimum a turn allows
 * ------------------------------------------------------------------ */

/**
 * The control. It draws and manifests, and never listens, resonates or
 * crosses. Whatever the greedy player achieves above this line is what those
 * actions are worth.
 */
export const baseline: Policy = {
  name: 'passiva',
  decide(state) {
    const player = getCurrentPlayer(state);

    if (state.pendingDiscovery?.playerId === player.id) {
      return {
        type: 'TransmitMemory',
        playerId: player.id,
        memoryInstanceId: state.pendingDiscovery.options[0].instanceId,
      };
    }

    if (state.phase === 'Memoria') {
      return firstLegal(state, [{ type: 'DrawCard', playerId: player.id }]);
    }

    if (state.phase === 'Manifestacao') {
      return firstLegal(
        state,
        affordable(player).map(({ instance }) => ({
          type: 'PlayCard' as const,
          playerId: player.id,
          instanceId: instance.instanceId,
        }))
      );
    }

    return PASS(state);
  },
};


export const POLICIES: Record<string, Policy> = {
  gulosa: greedy,
  passiva: baseline,
};
