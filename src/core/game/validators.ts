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
import { TerritoryCard } from '../cards/types';
import { traversalCost } from '../mechanics/traversal';
import { bestListener, escutaOf, findByExploring } from '../mechanics/memory';
import { isStorage, remainingSpace, storedIn } from '../mechanics/objects';

export function validateAction(state: GameState, action: GameAction): ValidationResult {
  if (state.isEnded) {
    return invalid('The match is over.');
  }

  const current = getCurrentPlayer(state);
  if (action.playerId !== current.id) {
    return invalid(`It is ${current.name}'s turn.`);
  }

  // A Memory found but not yet read holds everything else: it is not yours
  // until it has been transmitted.
  if (state.pendingDiscovery && action.type !== 'TransmitMemory') {
    return invalid('Read the Memória you found before doing anything else.');
  }

  // Passing is always available on your own turn.
  if (action.type === 'PassPhase') {
    return VALID;
  }

  if (!PHASE_ACTIONS[state.phase].includes(action.type)) {
    return invalid(
      `${labelFor(action.type)} is not available during ${state.phase}.`
    );
  }

  switch (action.type) {
    case 'DrawCard': {
      if (state.turnFlags.hasDrawn) {
        return invalid('You have already recovered a Memory this turn.');
      }
      if (current.deck.length === 0) {
        return invalid('Your deck is empty.');
      }
      return VALID;
    }

    case 'PlayCard': {
      const card = current.hand.find((c) => c.instanceId === action.instanceId);
      if (!card) {
        return invalid('That card is not in your hand.');
      }

      const def = getCard(card.cardId);
      const cost = def.cost ?? 0;
      if (cost > current.resources.memoria) {
        return invalid(
          `${def.name} costs ${cost} Memória; you have ${current.resources.memoria}.`
        );
      }

      // Territories are not manifested onto the table — they join the
      // player's territory pool and become reachable by Travessia.
      if (def.type !== 'Territory' && !activeTerritoryOf(current)) {
        return invalid('You need an active Território before manifesting cards.');
      }

      return VALID;
    }

    case 'Traverse': {
      if (state.turnFlags.hasTraversed) {
        return invalid('You have already made a Travessia this turn.');
      }

      const target = current.territories.find(
        (t) => t.instanceId === action.territoryInstanceId
      );
      if (!target) {
        return invalid('That Território is not one of yours.');
      }
      if (target.instanceId === current.activeTerritoryId) {
        return invalid('You are already in that Território.');
      }

      // Travessia is never free.
      const origin = activeTerritoryOf(current);
      const cost = traversalCost(
        origin ? (getCard(origin.cardId) as TerritoryCard) : undefined,
        getCard(target.cardId) as TerritoryCard
      );
      if (cost > current.resources.memoria) {
        return invalid(
          `Travessia to ${getCard(target.cardId).name} costs ${cost} Memória; ` +
            `you have ${current.resources.memoria}.`
        );
      }

      return VALID;
    }

    case 'Explore': {
      const territory = activeTerritoryOf(current);
      if (!territory) {
        return invalid('You need an active Território to explore.');
      }
      const territoryDef = getCard(territory.cardId) as TerritoryCard;

      // Someone has to be doing the listening.
      const listener = bestListener(current.inPlay, territory.instanceId);
      if (!listener) {
        return invalid(
          `You need a Personagem manifested in ${territoryDef.name} to listen.`
        );
      }

      // Refuse a dead end before it costs anything, rather than spending the
      // Personagem on nothing.
      const found = findByExploring(state.memoryPool, {
        territory: territoryDef,
        escuta: escutaOf(listener),
      });
      if (found.length === 0) {
        return invalid(
          `${getCard(listener.cardId).name} hears nothing further in ${territoryDef.name}.`
        );
      }

      return VALID;
    }

    case 'StoreMemory': {
      const memory = current.inPlay.find((c) => c.instanceId === action.memoryInstanceId);
      if (!memory) {
        return invalid('That Memória is not on your table.');
      }
      if (getCard(memory.cardId).type !== 'Memory') {
        return invalid('Only a Memória can be kept in an object.');
      }

      const container = current.inPlay.find(
        (c) => c.instanceId === action.containerInstanceId
      );
      if (!container) {
        return invalid('That object is not on your table.');
      }
      if (!isStorage(container)) {
        return invalid(`${getCard(container.cardId).name} does not keep Memórias.`);
      }
      if (memory.linkedTo === container.instanceId) {
        return invalid('That Memória is already kept there.');
      }
      if (remainingSpace(current.inPlay, container) <= 0) {
        const def = getCard(container.cardId);
        return invalid(
          `${def.name} is full (${storedIn(current.inPlay, container.instanceId).length}).`
        );
      }

      return VALID;
    }

    case 'RetrieveMemory': {
      const memory = current.inPlay.find((c) => c.instanceId === action.memoryInstanceId);
      if (!memory) {
        return invalid('That Memória is not on your table.');
      }

      const container = memory.linkedTo
        ? current.inPlay.find((c) => c.instanceId === memory.linkedTo)
        : undefined;
      if (!container || !isStorage(container)) {
        return invalid('That Memória is not being kept in an object.');
      }

      if (!activeTerritoryOf(current)) {
        return invalid('You need an active Território to bring it back out.');
      }

      return VALID;
    }

    case 'TransmitMemory': {
      const pending = state.pendingDiscovery;
      if (!pending) {
        return invalid('There is no Memória waiting to be read.');
      }
      if (!pending.options.some((o) => o.instanceId === action.memoryInstanceId)) {
        return invalid('That Memória is not among the ones you found.');
      }
      return VALID;
    }

    case 'ActivateResonance': {
      const card = current.inPlay.find((c) => c.instanceId === action.instanceId);
      if (!card) {
        return invalid('That card is not on the table.');
      }
      if (card.exhausted) {
        return invalid(`${getCard(card.cardId).name} is exhausted this turn.`);
      }

      const territory = activeTerritoryOf(current);
      if (!territory) {
        return invalid('Ressonância needs an active Território.');
      }
      return VALID;
    }
  }
}

function labelFor(type: GameAction['type']): string {
  switch (type) {
    case 'DrawCard':
      return 'Recovering a Memory';
    case 'PlayCard':
      return 'Manifesting a card';
    case 'Traverse':
      return 'Travessia';
    case 'Explore':
      return 'Exploring the Território';
    case 'StoreMemory':
      return 'Keeping a Memória';
    case 'RetrieveMemory':
      return 'Bringing a Memória back out';
    case 'TransmitMemory':
      return 'Transmitting a Memória';
    case 'ActivateResonance':
      return 'Ressonância';
    default:
      return type;
  }
}
