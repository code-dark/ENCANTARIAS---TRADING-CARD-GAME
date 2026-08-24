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

export function validateAction(state: GameState, action: GameAction): ValidationResult {
  if (state.isEnded) {
    return invalid('The match is over.');
  }

  const current = getCurrentPlayer(state);
  if (action.playerId !== current.id) {
    return invalid(`It is ${current.name}'s turn.`);
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
    case 'ActivateResonance':
      return 'Ressonância';
    default:
      return type;
  }
}
