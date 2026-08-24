/**
 * Resonância System
 * Core differentiator: territory + legend = special manifestations
 */

import { AnyCard, LegendCard, TerritoryCard, Affinity } from '../cards/types';
import { hasAffinityMatch, getSharedAffinities } from './affinity';

export interface ResonanceMatch {
  cardId: string;
  territoryId: string;
  affinities: Affinity[];
  effect: string;
}

/**
 * Detect valid resonances when card is played or territory activated
 * Returns all resonances that can activate based on current context
 */
export function detectResonances(
  card: AnyCard,
  territory: TerritoryCard
): ResonanceMatch[] {
  if (!hasAffinityMatch(card, territory)) {
    return [];
  }

  const matches: ResonanceMatch[] = [];
  const sharedAffinities = getSharedAffinities(card, territory);

  // Check territory's resonance registry
  if (territory.resonances) {
    for (const resonance of territory.resonances) {
      // Direct card ID match
      if (resonance.cardId === card.id) {
        matches.push({
          cardId: card.id,
          territoryId: territory.id,
          affinities: sharedAffinities,
          effect: resonance.effect,
        });
      }
      // Affinity-based match
      else if (resonance.affinity && sharedAffinities.includes(resonance.affinity)) {
        matches.push({
          cardId: card.id,
          territoryId: territory.id,
          affinities: [resonance.affinity],
          effect: resonance.effect,
        });
      }
    }
  }

  return matches;
}

/**
 * Get resonance manifestation for a legend in a territory
 * Used to determine what ability legend shows in this context
 */
export function getResonanceManifestation(
  legend: LegendCard,
  territoryId: string
): { name: string; ability: string } | null {
  if (!legend.resonanceManifestations) {
    return null;
  }

  return legend.resonanceManifestations[territoryId] || null;
}

/**
 * Check if a card can resonate in a territory
 * (simplified check for rule validation)
 */
export function canResonate(card: AnyCard, territory: TerritoryCard): boolean {
  return detectResonances(card, territory).length > 0;
}
