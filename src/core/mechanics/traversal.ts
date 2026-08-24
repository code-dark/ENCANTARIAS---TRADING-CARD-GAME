/**
 * Traversal (Travessia) System
 * Territory swaps with memory persistence rules
 */

import { AnyCard, MemoryCard, MemoryState, TerritoryCard } from '../cards/types';

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
