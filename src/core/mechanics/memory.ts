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
import { hasAllTags, hasAnyTag } from './tags';

/** Origins a Território opens onto. Defaults to the place itself. */
export function sourcesOf(territory: TerritoryCard): string[] {
  return territory.memorySources ?? [territory.id];
}

/**
 * Memories reachable from a named origin.
 *
 * The origin is an opaque string — a Território id, a Ressonância id, an
 * Acontecimento id, a place a photograph points at. The engine never needs to
 * know what any of them mean, which is what lets new cards name new origins
 * without a code change.
 */
export function findBySourceId(pool: CardInstance[], sourceId: string): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    return (memory.sources ?? []).includes(sourceId);
  });
}

/** Memories reachable from any of these origins. */
export function findByAnySourceId(
  pool: CardInstance[],
  sourceIds: string[]
): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const sources = memory.sources ?? [];
    return sourceIds.some((id) => sources.includes(id));
  });
}

/** Memories carrying these tags. */
export function findByTags(
  pool: CardInstance[],
  tags: string[],
  mode: 'all' | 'any' = 'all'
): CardInstance[] {
  return pool.filter((instance) => {
    const card = getCard(instance.cardId);
    return mode === 'all' ? hasAllTags(card, tags) : hasAnyTag(card, tags);
  });
}

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
  const origins = sourcesOf(ctx.territory);

  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const discovery = memory.discovery;
    if (!discovery?.via.includes('explore')) return false;
    if ((discovery.escuta ?? 0) > ctx.escuta) return false;

    // When a Memory names where it comes from, that is authoritative: it is
    // reachable there and nowhere else. Sharing an affinity with another place
    // is not the same as belonging to it — an account rooted in the cathedral
    // should not be overheard at the market.
    //
    // Affinity is the fallback only for Memories that name no origin at all.
    const sources = memory.sources ?? [];
    return sources.length > 0
      ? sources.some((s) => origins.includes(s))
      : belongsHere(memory, ctx.territory);
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
