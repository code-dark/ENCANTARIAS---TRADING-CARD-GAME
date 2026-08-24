/**
 * Affinity System
 * Determines contextual compatibility between cards and territories
 */

import { Affinity, AnyCard, TerritoryCard } from '../cards/types';

/**
 * Calculate shared affinities between card and territory
 */
export function getSharedAffinities(card: AnyCard, territory: TerritoryCard): Affinity[] {
  const cardAffs = card.affinities || [];
  const territoryAffs = territory.affinities || [];

  return cardAffs.filter((aff) => territoryAffs.includes(aff));
}

/**
 * Check if a card has ANY affinity match with territory
 */
export function hasAffinityMatch(card: AnyCard, territory: TerritoryCard): boolean {
  return getSharedAffinities(card, territory).length > 0;
}

/**
 * Check if card directly matches territory affinity
 */
export function matchesAffinity(card: AnyCard, affinity: Affinity): boolean {
  return (card.affinities || []).includes(affinity);
}

/**
 * Get all cards from array that match territory affinities
 */
export function filterByTerritory(cards: AnyCard[], territory: TerritoryCard): AnyCard[] {
  return cards.filter((card) => hasAffinityMatch(card, territory));
}

/**
 * Get affinity strength (0-N based on overlap)
 */
export function getAffinityStrength(card: AnyCard, territory: TerritoryCard): number {
  return getSharedAffinities(card, territory).length;
}
