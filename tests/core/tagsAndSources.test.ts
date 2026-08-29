import { describe, it, expect, beforeEach } from 'vitest';
import { createInstance, resetInstanceIds, getCard, ALL_CARDS } from '../../src/core/cards/cardRegistry';
import { hasTag, hasAllTags, hasAnyTag, filterInstancesByTags } from '../../src/core/mechanics/tags';
import {
  findBySourceId,
  findByAnySourceId,
  findByTags,
  sourcesOf,
} from '../../src/core/mechanics/memory';
import { TerritoryCard } from '../../src/core/cards/types';

const FONTE = 'territorio_fonte_ribeirao';
const ESCADARIA = 'territorio_escadaria_reviver';
const ORAL = 'memory_oral_serpent';
const ROOTS = 'memory_enraizada_fountain';
const SHARED = 'memory_transmitida_paths';

const pool = (ids: string[]) => ids.map((id) => createInstance(id, 'world'));

beforeEach(() => resetInstanceIds());

describe('tags', () => {
  it('lets a card ask about a place without naming it', () => {
    const fonte = getCard(FONTE);
    expect(hasTag(fonte, 'subterraneo')).toBe(true);
    expect(hasTag(fonte, 'comercio')).toBe(false);
  });

  it('matches on all tags or on any', () => {
    const fonte = getCard(FONTE);
    expect(hasAllTags(fonte, ['agua', 'subterraneo'])).toBe(true);
    expect(hasAllTags(fonte, ['agua', 'comercio'])).toBe(false);
    expect(hasAnyTag(fonte, ['agua', 'comercio'])).toBe(true);
  });

  it('treats a card with no tags as matching nothing', () => {
    const untagged = { id: 'x', type: 'Memory', name: 'X', affinities: [] } as any;
    expect(hasTag(untagged, 'agua')).toBe(false);
    expect(hasAnyTag(untagged, ['agua'])).toBe(false);
    // Vacuously true for "all of nothing", which is the standard reading.
    expect(hasAllTags(untagged, [])).toBe(true);
  });

  it('filters instances by the tags of the cards behind them', () => {
    const instances = pool([ORAL, SHARED]);
    const serpentine = filterInstancesByTags(instances, ['serpente']);
    expect(serpentine).toHaveLength(1);
    expect(getCard(serpentine[0].cardId).name).toBe('Relato Oral da Serpente');
  });
});

describe('addressable sources', () => {
  it('a Território opens onto its own id by default', () => {
    const fonte = getCard(FONTE) as TerritoryCard;
    expect(sourcesOf(fonte)).toContain(FONTE);
  });

  it('finds the Memories a named origin can hand over', () => {
    const found = findBySourceId(pool([ORAL, ROOTS, SHARED]), FONTE);
    expect(found).toHaveLength(1);
    expect(getCard(found[0].cardId).name).toBe('Relato Oral da Serpente');
  });

  it('addresses a Ressonância as an origin of its own', () => {
    const found = findBySourceId(pool([ORAL, ROOTS]), 'ressonancia_serpente_ribeirao');
    expect(found).toHaveLength(1);
    expect(getCard(found[0].cardId).name).toBe('A Fonte Perene');
  });

  it('returns nothing for an origin no Memory names', () => {
    // An Acontecimento that has not been written yet is simply empty, not an error.
    expect(findBySourceId(pool([ORAL, ROOTS, SHARED]), 'evento_reurbanizacao')).toHaveLength(0);
  });

  it('a Memory can be reachable from more than one place', () => {
    const p = pool([SHARED]);
    expect(findBySourceId(p, ESCADARIA)).toHaveLength(1);
    expect(findBySourceId(p, 'territorio_ceprama')).toHaveLength(1);
  });

  it('gathers across several origins at once', () => {
    const found = findByAnySourceId(pool([ORAL, ROOTS, SHARED]), [FONTE, ESCADARIA]);
    expect(found).toHaveLength(2);
  });

  it('queries the pool by tag', () => {
    const found = findByTags(pool([ORAL, ROOTS, SHARED]), ['serpente'], 'any');
    expect(found).toHaveLength(2); // the oral account and the rooted spring
  });
});

describe('data integrity', () => {
  it('every Memory names at least one origin it can be reached from', () => {
    const orphans = ALL_CARDS.filter(
      (c) => c.type === 'Memory' && !((c as any).sources?.length)
    );
    expect(orphans.map((c) => c.name)).toEqual([]);
  });

  it('every Território declares tags, so cards can query it generically', () => {
    const untagged = ALL_CARDS.filter((c) => c.type === 'Territory' && !c.tags?.length);
    expect(untagged.map((c) => c.name)).toEqual([]);
  });
});
