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
  const memoryCard: MemoryCard = currentState
    ? { ...definition, memoryState: currentState }
    : definition;

  // Explicit behavior
  if (memoryCard.traversalBehavior) {
    if (memoryCard.traversalBehavior === 'stays') return 'stays';
    if (memoryCard.traversalBehavior === 'travels') return 'travels';
    if (memoryCard.traversalBehavior === 'transforms') return 'transforms';
  }

  // Memory state rules
  if (memoryCard.memoryState === 'Roots') {
    return 'stays'; // Rooted in territory, stays by default
  }

  if (memoryCard.memoryState === 'Shared') {
    return 'travels'; // Passed on, travels by default
  }

  if (memoryCard.memoryState === 'Corporate') {
    return 'stays'; // Held by an institution, tied to place
  }

  // For others (Oral, Territorial, Media):
  // Check if memory has affinity match with new territory
  const newTerritoryAffs = newTerritory.affinities || [];
  const memoryAffs = memory.affinities || [];

  const matches = memoryAffs.filter((aff) => newTerritoryAffs.includes(aff));

  return matches.length > 0 ? 'travels' : 'stays';
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
