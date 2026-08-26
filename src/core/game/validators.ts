/**
 * Action validation.
 *
 * Every rejection carries a reason written for a player, not a developer: the
 * GDD requires that someone can always tell why an action is unavailable.
 * Validation is pure and never mutates state.
 */

import { GameAction, ValidationResult, VALID, invalid } from './actions';
import {
  GameState,
  PHASE_ACTIONS,
  getCurrentPlayer,
  activeTerritoryOf,
} from './gameState';
import { getCard } from '../cards/cardRegistry';
import { PHASE_LABEL } from '../i18n/labels';
import { TerritoryCard } from '../cards/types';
import { effectiveTraversalCost } from '../mechanics/traversal';
import { bestListener, escutaOf, exploreContext, findByExploring } from '../mechanics/memory';
import { isStorage, remainingSpace, storedIn } from '../mechanics/objects';

export function validateAction(state: GameState, action: GameAction): ValidationResult {
  if (state.isEnded) {
    return invalid('A partida terminou.');
  }

  const current = getCurrentPlayer(state);
  if (action.playerId !== current.id) {
    return invalid(`É a vez de ${current.name}.`);
  }

  // A Memory found but not yet read holds everything else: it is not yours
  // until it has been transmitted.
  if (state.pendingDiscovery && action.type !== 'TransmitMemory') {
    return invalid('Leia a Memória que você encontrou antes de fazer qualquer outra coisa.');
  }

  // Passing is always available on your own turn.
  if (action.type === 'PassPhase') {
    return VALID;
  }

  // Reading aloud what you just found is not a phase action: it resolves an
  // interrupted moment. Gating it by phase would soft-lock a Memory surfaced
  // by an Acontecimento, which is played outside the Ação phase.
  if (state.pendingDiscovery && action.type === 'TransmitMemory') {
    return transmitCheck(state, action.memoryInstanceId);
  }

  if (!PHASE_ACTIONS[state.phase].includes(action.type)) {
    return invalid(
      `${labelFor(action.type)} não está disponível na fase de ${PHASE_LABEL[state.phase]}.`
    );
  }

  switch (action.type) {
    case 'DrawCard': {
      if (state.turnFlags.hasDrawn) {
        return invalid('Você já comprou uma carta neste turno.');
      }
      if (current.deck.length === 0) {
        return invalid('Seu deck está vazio.');
      }
      return VALID;
    }

    case 'PlayCard': {
      const card = current.hand.find((c) => c.instanceId === action.instanceId);
      if (!card) {
        return invalid('Essa carta não está na sua mão.');
      }

      const def = getCard(card.cardId);
      const cost = def.cost ?? 0;
      if (cost > current.resources.memoria) {
        return invalid(
          `${def.name} custa ${cost} de Memória; você tem ${current.resources.memoria}.`
        );
      }

      // Territories are not manifested onto the table — they join the
      // player's territory pool and become reachable by Travessia.
      if (def.type !== 'Territory' && !activeTerritoryOf(current)) {
        return invalid('Você precisa de um Território ativo para manifestar cartas.');
      }

      return VALID;
    }

    case 'Traverse': {
      if (state.turnFlags.hasTraversed) {
        return invalid('Você já fez uma Travessia neste turno.');
      }

      const target = current.territories.find(
        (t) => t.instanceId === action.territoryInstanceId
      );
      if (!target) {
        return invalid('Esse Território não é seu.');
      }
      if (target.instanceId === current.activeTerritoryId) {
        return invalid('Você já está nesse Território.');
      }

      // Travessia is never free.
      const origin = activeTerritoryOf(current);
      const cost = effectiveTraversalCost(
        origin ? (getCard(origin.cardId) as TerritoryCard) : undefined,
        getCard(target.cardId) as TerritoryCard,
        state.turnFlags
      );
      if (cost > current.resources.memoria) {
        return invalid(
          `Travessia para ${getCard(target.cardId).name} custa ${cost} de Memória; ` +
            `você tem ${current.resources.memoria}.`
        );
      }

      return VALID;
    }

    case 'Explore': {
      if (state.turnFlags.hasListened) {
        return invalid('Você já escutou este Território neste turno.');
      }

      const territory = activeTerritoryOf(current);
      if (!territory) {
        return invalid('Você precisa de um Território ativo para explorar.');
      }
      const territoryDef = getCard(territory.cardId) as TerritoryCard;

      // Someone has to be doing the listening.
      const listener = bestListener(current.inPlay, territory.instanceId);
      if (!listener) {
        return invalid(
          `Você precisa de um Personagem manifestado em ${territoryDef.name} para escutar.`
        );
      }

      // Refuse a dead end before it costs anything, rather than spending the
      // Personagem on nothing.
      const found = findByExploring(
        state.memoryPool,
        exploreContext(
          territoryDef, escutaOf(listener), current.inPlay, territory.instanceId
        )
      );
      if (found.length === 0) {
        return invalid(
          `${getCard(listener.cardId).name} não ouve mais nada em ${territoryDef.name}.`
        );
      }

      return VALID;
    }

    case 'StoreMemory': {
      const memory = current.inPlay.find((c) => c.instanceId === action.memoryInstanceId);
      if (!memory) {
        return invalid('Essa Memória não está na sua mesa.');
      }
      if (getCard(memory.cardId).type !== 'Memory') {
        return invalid('Só uma Memória pode ser guardada em um objeto.');
      }

      const container = current.inPlay.find(
        (c) => c.instanceId === action.containerInstanceId
      );
      if (!container) {
        return invalid('Esse objeto não está na sua mesa.');
      }
      if (!isStorage(container)) {
        return invalid(`${getCard(container.cardId).name} não guarda Memórias.`);
      }
      if (memory.linkedTo === container.instanceId) {
        return invalid('Essa Memória já está guardada aí.');
      }
      if (remainingSpace(current.inPlay, container) <= 0) {
        const def = getCard(container.cardId);
        return invalid(
          `${def.name} está cheia (${storedIn(current.inPlay, container.instanceId).length}).`
        );
      }

      return VALID;
    }

    case 'RetrieveMemory': {
      const memory = current.inPlay.find((c) => c.instanceId === action.memoryInstanceId);
      if (!memory) {
        return invalid('Essa Memória não está na sua mesa.');
      }

      const container = memory.linkedTo
        ? current.inPlay.find((c) => c.instanceId === memory.linkedTo)
        : undefined;
      if (!container || !isStorage(container)) {
        return invalid('Essa Memória não está guardada em nenhum objeto.');
      }

      if (!activeTerritoryOf(current)) {
        return invalid('Você precisa de um Território ativo para trazê-la de volta.');
      }

      return VALID;
    }

    case 'TransmitMemory':
      return transmitCheck(state, action.memoryInstanceId);

    case 'ActivateResonance': {
      const card = current.inPlay.find((c) => c.instanceId === action.instanceId);
      if (!card) {
        return invalid('Essa carta não está na mesa.');
      }
      if (card.exhausted) {
        return invalid(`${getCard(card.cardId).name} está exausta neste turno.`);
      }

      const territory = activeTerritoryOf(current);
      if (!territory) {
        return invalid('A Ressonância precisa de um Território ativo.');
      }

      // Only what is present resonates. A card left behind in another
      // Território, or kept inside an object, is not here to have a relation
      // with this place — that is what taking it out of circulation means.
      if (card.linkedTo !== territory.instanceId) {
        return invalid(
          `${getCard(card.cardId).name} não está neste Território.`
        );
      }

      // A Memória is what a Ressonância produces, not what enters into one.
      // Letting it resonate turned every account found into a second engine
      // for Vínculo.
      if (getCard(card.cardId).type === 'Memory') {
        return invalid('Uma Memória não ressoa: ela é o que a Ressonância abre.');
      }

      return VALID;
    }
  }
}

function transmitCheck(state: GameState, memoryInstanceId: string): ValidationResult {
  const pending = state.pendingDiscovery;
  if (!pending) {
    return invalid('Não há Memória aguardando leitura.');
  }
  if (!pending.options.some((o) => o.instanceId === memoryInstanceId)) {
    return invalid('Essa Memória não está entre as que você encontrou.');
  }
  return VALID;
}

function labelFor(type: GameAction['type']): string {
  switch (type) {
    case 'DrawCard':
      return 'Comprar carta';
    case 'PlayCard':
      return 'Manifestar carta';
    case 'Traverse':
      return 'Travessia';
    case 'Explore':
      return 'Escutar o Território';
    case 'StoreMemory':
      return 'Guardar uma Memória';
    case 'RetrieveMemory':
      return 'Retirar uma Memória';
    case 'TransmitMemory':
      return 'Transmitir uma Memória';
    case 'ActivateResonance':
      return 'Ressonância';
    default:
      return type;
  }
}
