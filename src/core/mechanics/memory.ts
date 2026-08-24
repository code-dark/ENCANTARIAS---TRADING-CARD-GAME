/**
 * Memory discovery.
 *
 * Memories are not shuffled into a deck and drawn. They wait in the world and
 * are reached by interacting with it — listening in a Território, a Lenda
 * manifesting and opening a layer of a place, an Acontecimento, an object that
 * carries a record. Memory is a relation before it is a resource.
 */

import { CardInstance, MemoryCard, MemorySource, TerritoryCard } from '../cards/types';
import { getCard } from '../cards/cardRegistry';

/** Where a Memory can surface: its own affinities unless it says otherwise. */
export function discoveryAffinities(memory: MemoryCard) {
  return memory.discovery?.inAffinities ?? memory.affinities;
}

/** Does this Território carry an affinity this Memory belongs to? */
export function belongsHere(memory: MemoryCard, territory: TerritoryCard): boolean {
  const where = discoveryAffinities(memory);
  return where.some((a) => territory.affinities.includes(a));
}

export interface ExploreContext {
  territory: TerritoryCard;
  /** Escuta of the Personagem doing the listening. */
  escuta: number;
}

/**
 * What listening in this Território with this much Escuta would surface.
 * Ordered as the pool is ordered; the caller takes the first.
 */
export function findByExploring(
  pool: CardInstance[],
  ctx: ExploreContext
): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const discovery = memory.discovery;
    if (!discovery?.via.includes('explore')) return false;
    if (!belongsHere(memory, ctx.territory)) return false;
    return (discovery.escuta ?? 0) <= ctx.escuta;
  });
}

/**
 * Layers of a place that only open when a particular Lenda manifests there.
 * This is what makes Ressonância reveal something the world would not
 * otherwise hand over.
 */
export function findByResonance(
  pool: CardInstance[],
  legendCardId: string,
  territory: TerritoryCard
): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const discovery = memory.discovery;
    if (!discovery?.via.includes('resonance')) return false;
    if (discovery.byLegend && discovery.byLegend !== legendCardId) return false;
    return belongsHere(memory, territory);
  });
}

/** Generic source query, for Acontecimentos and objects once those resolve. */
export function findBySource(
  pool: CardInstance[],
  source: MemorySource,
  territory: TerritoryCard
): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    if (!memory.discovery?.via.includes(source)) return false;
    return belongsHere(memory, territory);
  });
}

/** Highest Escuta among a player's unexhausted Personagens in this Território. */
export function bestListener(
  inPlay: CardInstance[],
  territoryInstanceId: string
): CardInstance | undefined {
  const listeners = inPlay.filter((c) => {
    if (c.exhausted) return false;
    if (c.linkedTo !== territoryInstanceId) return false;
    return getCard(c.cardId).type === 'Character';
  });

  return listeners.sort((a, b) => escutaOf(b) - escutaOf(a))[0];
}

export function escutaOf(instance: CardInstance): number {
  const def = getCard(instance.cardId);
  return def.type === 'Character' ? (def.escuta ?? 0) : 0;
}
