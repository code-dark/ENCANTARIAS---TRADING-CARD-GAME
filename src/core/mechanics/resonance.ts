/**
 * Resonância System
 * Core differentiator: territory + legend = special manifestations
 */

import { AnyCard, CardInstance, LegendCard, TerritoryCard, Affinity } from '../cards/types';
import { hasAffinityMatch, getSharedAffinities } from './affinity';
import { getCard } from '../cards/cardRegistry';

export interface ConjunctionMatch {
  id: string;
  name: string;
  effect: string;
  /** Instances that make up the gathering. */
  participants: CardInstance[];
}

/**
 * Ressonâncias that need a gathering rather than a single card.
 *
 * A Lenda in the right place is one relation; several arriving together is
 * another, and some layers of a place open only to the whole set. Everything
 * required must be manifested in this Território — a card kept in an object or
 * left behind elsewhere is not present.
 */
export function detectConjunctions(
  inPlayHere: CardInstance[],
  territory: TerritoryCard
): ConjunctionMatch[] {
  if (!territory.conjunctions?.length) return [];

  return territory.conjunctions.flatMap((conjunction) => {
    const participants: CardInstance[] = [];

    for (const required of conjunction.requires) {
      const present = inPlayHere.find((c) => c.cardId === required);
      if (!present) return []; // the gathering is incomplete
      participants.push(present);
    }

    return [{
      id: conjunction.id,
      name: conjunction.name,
      effect: conjunction.effect,
      participants,
    }];
  });
}

/** Human-readable list of what forms a gathering, for the log. */
export function participantNames(match: ConjunctionMatch): string[] {
  return match.participants.map((p) => getCard(p.cardId).name);
}

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
