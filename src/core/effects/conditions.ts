/**
 * Conditions — the questions a card is allowed to ask.
 *
 * Closed on purpose. A card that needs a new question becomes a new entry in
 * the union, checked by the compiler, rather than a new branch buried in the
 * resolver where nobody will find it.
 */

import { GameState } from '../game/gameState';
import { getCard } from '../cards/cardRegistry';
import { MemoryCard } from '../cards/types';
import { EffectCondition } from './types';

export function meets(
  state: GameState,
  condition: EffectCondition | undefined,
  playerId: string
): boolean {
  if (!condition) return true;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  switch (condition.kind) {
    case 'recursoMinimo':
      return player.resources[condition.recurso] >= condition.minimo;

    case 'memoriasEmJogo': {
      const count = player.inPlay.filter((instance) => {
        const def = getCard(instance.cardId);
        if (def.type !== 'Memory') return false;
        if (!condition.estado) return true;
        const state_ = instance.memoryState ?? (def as MemoryCard).memoryState;
        return state_ === condition.estado;
      }).length;
      return count >= condition.minimo;
    }

    case 'territorioMarcado': {
      const active = player.territories.find(
        (t) => t.instanceId === player.activeTerritoryId
      );
      return (active?.counters[condition.marca] ?? 0) >= (condition.minimo ?? 1);
    }

    case 'cartaPresente':
      return player.inPlay.some((instance) => {
        if (instance.linkedTo !== player.activeTerritoryId) return false;
        const def = getCard(instance.cardId);
        if (condition.cardId && def.id !== condition.cardId) return false;
        if (condition.tipo && def.type !== condition.tipo) return false;
        if (condition.afinidade && !def.affinities.includes(condition.afinidade)) {
          return false;
        }
        return true;
      });

    case 'nao':
      return !meets(state, condition.condicao, playerId);
  }
}
