/**
 * Moving a Memory out of the world and into play.
 *
 * Every way of reaching a Memory — listening, a Lenda opening a layer, a
 * document, an Acontecimento — ends here, so a discovered Memory always roots
 * itself in the Território that gave it up, whatever found it.
 */

import { GameState, updatePlayer } from '../game/gameState';
import { CardInstance } from '../cards/types';

export function claimMemory(
  state: GameState,
  playerId: string,
  memory: CardInstance,
  territoryInstanceId: string
): GameState {
  const withoutIt = state.memoryPool.filter(
    (m) => m.instanceId !== memory.instanceId
  );

  return updatePlayer({ ...state, memoryPool: withoutIt }, playerId, (p) => ({
    ...p,
    inPlay: [
      ...p.inPlay,
      { ...memory, ownerId: playerId, linkedTo: territoryInstanceId },
    ],
  }));
}
