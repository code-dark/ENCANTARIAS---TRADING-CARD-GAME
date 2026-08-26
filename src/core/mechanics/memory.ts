/**
 * Memory discovery.
 *
 * Memories are not shuffled into a deck and drawn. They wait in the world and
 * are reached by interacting with it — listening in a Território, a Lenda
 * manifesting and opening a layer of a place, an Acontecimento, an object that
 * carries a record. Memory is a relation before it is a resource.
 */

import { AnyCard, CardInstance, MemoryCard, MemorySource, TerritoryCard } from '../cards/types';
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
  /**
   * Cards manifested here. Once the place's own accounts run out, what is
   * standing in it is what keeps listening alive.
   */
  presentCards: AnyCard[];
}

/**
 * What listening in this Território with this much Escuta would surface.
 * Ordered as the pool is ordered; the caller takes the first.
 */
/** Reachable by listening because this place is where it comes from. */
function findByOwnSources(pool: CardInstance[], ctx: ExploreContext): CardInstance[] {
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
 * The wider circle: what is related to what is standing here.
 *
 * A place does not run out of things to hear. When its own accounts have all
 * been told, listening reaches what the Lendas manifested here carry with them,
 * and what shares the ground's own vocabulary — related by tag rather than by
 * origin. Nothing is repeated: a Memory already discovered is no longer in the
 * world to be found again.
 */
function findByRelation(pool: CardInstance[], ctx: ExploreContext): CardInstance[] {
  // The place's own vocabulary and that of the Lendas manifested in it. A
  // Personagem standing here does not widen what the ground holds: they are
  // who listens, not what there is to hear.
  const legendsHere = ctx.presentCards.filter((c) => c.type === 'Legend');
  const vocabulary = new Set([
    ...(ctx.territory.tags ?? []),
    ...legendsHere.flatMap((c) => c.tags ?? []),
  ]);
  const legends = new Set(legendsHere.map((c) => c.id));

  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const discovery = memory.discovery;
    if (!discovery?.via.includes('explore')) return false;
    if ((discovery.escuta ?? 0) > ctx.escuta) return false;

    // A Lenda manifested here carries its own accounts with it. That link is
    // strong enough on its own: the narrative is present, so what belongs to
    // the narrative is present.
    if (memory.linkedTo && legends.has(memory.linkedTo)) return true;

    // Otherwise the relation has to be real on two counts. Tags like `urbano`
    // sit on four of the five Territórios, so a shared word alone would make
    // every account audible everywhere — which is precisely the leak this
    // fallback must not reopen. The place must also be somewhere the Memory
    // could belong.
    const sharesVocabulary = (memory.tags ?? []).some((t) => vocabulary.has(t));
    return sharesVocabulary && belongsHere(memory, ctx.territory);
  });
}

/**
 * What listening in this Território with this much Escuta would surface.
 *
 * The place's own accounts come first and are exhausted first; only then does
 * listening widen to what is related to it. That order matters: a place should
 * give up what is its own before it gives up what merely rhymes with it.
 */
export function findByExploring(
  pool: CardInstance[],
  ctx: ExploreContext
): CardInstance[] {
  const own = findByOwnSources(pool, ctx);
  return own.length > 0 ? own : findByRelation(pool, ctx);
}

/**
 * Layers of a place that only open when a particular Lenda manifests there.
 * This is what makes Ressonância reveal something the world would not
 * otherwise hand over.
 */
export function findByResonance(
  pool: CardInstance[],
  legendCardId: string,
  territory: TerritoryCard,
  /** Names of the relations that actually fired here. */
  resonanceIds: string[] = []
): CardInstance[] {
  return pool.filter((instance) => {
    const memory = getCard(instance.cardId) as MemoryCard;
    const discovery = memory.discovery;
    if (!discovery?.via.includes('resonance')) return false;
    if (discovery.byLegend && discovery.byLegend !== legendCardId) return false;

    // A Memory that names where it comes from is reachable there and nowhere
    // else. Sharing an affinity with a place is not the same as belonging to
    // it — that is how a Memory opened only by a gathering was turning up
    // under any Lenda that happened to resonate somewhere similar.
    const sources = memory.sources ?? [];
    if (sources.length > 0) {
      return sources.some((source) => resonanceIds.includes(source));
    }

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

/** The context of listening in a place, as both the validator and the resolver see it. */
export function exploreContext(
  territory: TerritoryCard,
  escuta: number,
  inPlay: CardInstance[],
  territoryInstanceId: string
): ExploreContext {
  return {
    territory,
    escuta,
    presentCards: inPlay
      .filter((c) => c.linkedTo === territoryInstanceId)
      .map((c) => getCard(c.cardId)),
  };
}
