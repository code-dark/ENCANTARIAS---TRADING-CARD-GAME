/**
 * Traversal (Travessia) System
 * Territory swaps with memory persistence rules
 */

import { AnyCard, MemoryCard, MemoryState, TerritoryCard } from '../cards/types';
import { getSharedAffinities } from './affinity';

/**
 * Travessia is never free: the GDD requires it to charge an action, a
 * resource, a card or a condition, so that changing Território is a decision
 * rather than a free reskin of the table.
 *
 * The price is paid in Memória, the same resource that manifests cards, which
 * is what makes crossing an opportunity cost: cross, or manifest, not both.
 *
 * Crossing between Territórios that share an affinity is cheaper than jumping
 * to an unrelated context — the map, not a flat toll, sets the price. Both
 * numbers are balance dials and want playtest, not argument.
 */
export const TRAVESSIA_BASE_COST = 1;
export const TRAVESSIA_UNRELATED_SURCHARGE = 1;

/**
 * What it costs to cross from one Território to another.
 * Taking up a first Território is not a crossing and costs nothing.
 */
export function traversalCost(
  from: TerritoryCard | undefined,
  to: TerritoryCard
): number {
  if (!from) return 0;

  const continuous = getSharedAffinities(from, to).length > 0;
  return TRAVESSIA_BASE_COST + (continuous ? 0 : TRAVESSIA_UNRELATED_SURCHARGE);
}

/**
 * What crossing costs right now, after anything a card has opened this turn.
 *
 * Kept in one place because the price is asked twice — once to refuse the
 * action, once to charge it — and those two answers must never disagree.
 */
/**
 * What a Travessia costs in Vínculo, on top of its cost in Memória.
 *
 * Vínculo used to be earned and never spent — a faucet with no drain, which
 * made Ressonância optional, which made the Território a constant. 500
 * simulated matches showed the consequence plainly: players ended with 3.5
 * Vínculo unspent and used 1.0 Território each, standing still for the whole
 * match while listening once per turn.
 *
 * Moving through the city now draws on the bonds you have made there as well
 * as the stories you carry, so Ressonância feeds Travessia and Travessia opens
 * new Ressonâncias.
 */
export const TRAVESSIA_VINCULO = 1;

export function traversalVinculoCost(flags: { travessiaLivre: boolean }): number {
  return flags.travessiaLivre ? 0 : TRAVESSIA_VINCULO;
}

export function effectiveTraversalCost(
  from: TerritoryCard | undefined,
  to: TerritoryCard,
  flags: { travessiaLivre: boolean }
): number {
  return flags.travessiaLivre ? 0 : traversalCost(from, to);
}

export type MemoryPersistence = 'stays' | 'travels' | 'transforms';

/**
 * Determine what happens to a memory card during traversal
 */
export function evaluateMemoryPersistence(
  memory: AnyCard,
  _oldTerritory: TerritoryCard,
  newTerritory: TerritoryCard,
  /**
   * The state of the specific copy in play, which may have been transformed
   * away from what its definition started with.
   */
  currentState?: MemoryState
): MemoryPersistence {
  if (memory.type !== 'Memory') {
    return 'travels'; // Non-memories travel by default
  }

  const definition = memory as MemoryCard;
  const state = currentState ?? definition.memoryState;

  // An explicit declaration is an exception the card takes deliberately, and
  // it wins. It is meant to be rare: a Memory that behaves like its state
  // should not have to say so, or the states stop meaning anything.
  if (definition.traversalBehavior) {
    return definition.traversalBehavior;
  }

  switch (state) {
    // Rooted so deep it became the ground; held in an archive that does not
    // move; a detail of the place itself. None of these leave.
    case 'Roots':
    case 'Corporate':
    case 'Territorial':
      return 'stays';

    // Passed from hand to hand, or circulating far past where it started.
    case 'Shared':
    case 'Media':
      return 'travels';

    // Oral is the contextual one, and deliberately so: an account that lives
    // only in speech carries over where the new place gives it something to
    // hold on to, and loses its footing where it does not.
    case 'Oral': {
      const shared = (memory.affinities ?? []).filter((a) =>
        (newTerritory.affinities ?? []).includes(a)
      );
      return shared.length > 0 ? 'travels' : 'stays';
    }
  }
}

/**
 * Process traversal: return which cards travel, which stay
 */
export function resolveTraversal(
  linkedCards: AnyCard[],
  oldTerritory: TerritoryCard,
  newTerritory: TerritoryCard
): {
  travels: AnyCard[];
  stays: AnyCard[];
  transforms: AnyCard[];
} {
  const travels: AnyCard[] = [];
  const stays: AnyCard[] = [];
  const transforms: AnyCard[] = [];

  for (const card of linkedCards) {
    const persistence = evaluateMemoryPersistence(card, oldTerritory, newTerritory);

    if (persistence === 'travels') {
      travels.push(card);
    } else if (persistence === 'stays') {
      stays.push(card);
    } else if (persistence === 'transforms') {
      transforms.push(card);
    }
  }

  return { travels, stays, transforms };
}

/**
 * Check if traversal is allowed (can be extended with cost/condition validation)
 */
export function canTraverse(
  currentTerritory: TerritoryCard,
  targetTerritory: TerritoryCard
): boolean {
  // For now, always allow. Add cost/condition checks later.
  return currentTerritory.id !== targetTerritory.id;
}
