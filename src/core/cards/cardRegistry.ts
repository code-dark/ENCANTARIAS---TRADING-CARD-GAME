/**
 * Card registry: the single lookup from a card id to its definition.
 *
 * Definitions are immutable and shared. Play state never lives here — it lives
 * on CardInstance. Adding cards means adding data files below, never touching
 * the engine.
 */

import { AnyCard, CardInstance } from './types';
import { territories } from './data/territories';
import { legends } from './data/legends';
import { characters } from './data/characters';
import { memories } from './data/memories';
import { events } from './data/events';

export const ALL_CARDS: AnyCard[] = [
  ...territories,
  ...legends,
  ...characters,
  ...memories,
  ...events,
];

const BY_ID = new Map<string, AnyCard>(ALL_CARDS.map((c) => [c.id, c]));

/** Throws on an unknown id: a dangling reference is a data bug, not a runtime state. */
export function getCard(cardId: string): AnyCard {
  const card = BY_ID.get(cardId);
  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return card;
}

export function hasCard(cardId: string): boolean {
  return BY_ID.has(cardId);
}

/** Resolve the definition behind an instance. */
export function definitionOf(instance: CardInstance): AnyCard {
  return getCard(instance.cardId);
}

let instanceCounter = 0;

/** Reset instance numbering. Tests call this to keep ids stable across runs. */
export function resetInstanceIds(): void {
  instanceCounter = 0;
}

export function createInstance(cardId: string, ownerId: string): CardInstance {
  const def = getCard(cardId); // validates the id up front
  instanceCounter += 1;

  return {
    instanceId: `${cardId}#${instanceCounter}`,
    cardId,
    ownerId,
    exhausted: false,
    counters: {},
    memoryState: def.memoryState,
    transformationState: def.transformationState,
  };
}

/** Build a set of instances from a list of card ids (a decklist). */
export function createInstances(cardIds: string[], ownerId: string): CardInstance[] {
  return cardIds.map((id) => createInstance(id, ownerId));
}
