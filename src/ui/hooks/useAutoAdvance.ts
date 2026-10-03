/**
 * Skips the phases where the player has nothing to decide.
 *
 * The engine's seven phases are a rule, not an interface. Three of them —
 * Despertar, Acontecimento, Encerramento — never ask the player anything, and
 * two more usually offer a single button. Shown raw, a turn became six clicks
 * around one decision, and the game opened on a screen where every card and
 * every Território was disabled with the only live control being "next phase".
 *
 * So the UI asks the engine, generically, whether *any* action other than
 * passing is legal right now. If none is, it passes for the player. Nothing
 * is skipped that could have been played: the question is answered by the same
 * validators that would have refused the click.
 */

import { useEffect, useRef } from 'react';
import { GameAction } from '../../core/game/actions';
import { Player, activeTerritoryOf, getCurrentPlayer } from '../../core/game/gameState';
import { useGameStore } from '../../store/gameStore';

/** Every action the player could attempt right now, for the engine to judge. */
function candidateActions(player: Player): GameAction[] {
  const id = player.id;
  const actions: GameAction[] = [
    { type: 'DrawCard', playerId: id },
    { type: 'Explore', playerId: id },
  ];

  for (const card of player.hand) {
    actions.push({ type: 'PlayCard', playerId: id, instanceId: card.instanceId });
  }

  const active = activeTerritoryOf(player);
  for (const t of player.territories) {
    if (t.instanceId === active?.instanceId) continue;
    actions.push({ type: 'Traverse', playerId: id, territoryInstanceId: t.instanceId });
  }

  for (const card of player.inPlay) {
    actions.push({ type: 'ActivateResonance', playerId: id, instanceId: card.instanceId });
    actions.push({ type: 'RetrieveMemory', playerId: id, memoryInstanceId: card.instanceId });
    for (const box of player.inPlay) {
      if (box.instanceId === card.instanceId) continue;
      actions.push({
        type: 'StoreMemory',
        playerId: id,
        memoryInstanceId: card.instanceId,
        containerInstanceId: box.instanceId,
      });
    }
  }

  return actions;
}

export function hasAnyChoice(
  player: Player,
  check: (a: GameAction) => { valid: boolean },
): boolean {
  return candidateActions(player).some((a) => check(a).valid);
}

export function useAutoAdvance(humanId: string) {
  const { gameState, dispatch, check } = useGameStore();
  // Each phase is passed at most once from here, so a phase that legitimately
  // has nothing to do cannot become a loop.
  const passed = useRef<string>('');

  useEffect(() => {
    if (!gameState || gameState.isEnded) return;
    if (getCurrentPlayer(gameState).id !== humanId) return;
    // A found Memória has to be read aloud before anything else happens.
    if (gameState.pendingDiscovery) return;

    const key = `${gameState.turn}:${gameState.phase}:${humanId}`;
    if (passed.current === key) return;

    const player = gameState.players.find((p) => p.id === humanId);
    if (!player) return;
    if (hasAnyChoice(player, check)) return;

    passed.current = key;
    dispatch({ type: 'PassPhase', playerId: humanId });
  }, [gameState, humanId, dispatch, check]);
}
