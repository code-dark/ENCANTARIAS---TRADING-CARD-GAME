/**
 * Tag queries.
 *
 * Cards ask about tags instead of naming other cards. "Is there a Território
 * tagged subterraneo?" keeps working when a new place is added, so content can
 * grow without the engine growing.
 */

import { AnyCard, CardInstance } from '../cards/types';
import { getCard } from '../cards/cardRegistry';

export function tagsOf(card: AnyCard): string[] {
  return card.tags ?? [];
}

export function hasTag(card: AnyCard, tag: string): boolean {
  return tagsOf(card).includes(tag);
}

/** True when the card carries every one of these tags. */
export function hasAllTags(card: AnyCard, tags: string[]): boolean {
  const own = tagsOf(card);
  return tags.every((t) => own.includes(t));
}

/** True when the card carries at least one of these tags. */
export function hasAnyTag(card: AnyCard, tags: string[]): boolean {
  const own = tagsOf(card);
  return tags.some((t) => own.includes(t));
}

export function sharedTags(a: AnyCard, b: AnyCard): string[] {
  const other = tagsOf(b);
  return tagsOf(a).filter((t) => other.includes(t));
}

/** Filter instances by the tags of the cards behind them. */
export function filterInstancesByTags(
  instances: CardInstance[],
  tags: string[],
  mode: 'all' | 'any' = 'all'
): CardInstance[] {
  return instances.filter((i) => {
    const card = getCard(i.cardId);
    return mode === 'all' ? hasAllTags(card, tags) : hasAnyTag(card, tags);
  });
}
