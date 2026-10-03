/**
 * Objects — the material supports of memory.
 *
 * Two things objects do, and one thing they never do.
 *
 * They store: a Memory kept in a Caixa points at the box instead of at the
 * Território, so it leaves the table and stops taking part in Ressonância.
 * Preservation costs circulation, and the model says so structurally rather
 * than through a special rule.
 *
 * They give access: a document or a photograph names an origin and reaches a
 * Memory that already exists in the world.
 *
 * They never create a Memory. Nothing here adds to the world; it only moves
 * what is already in it.
 */

import { ArtifactCard, CardInstance, TerritoryCard } from '../cards/types';
import { getCard } from '../cards/cardRegistry';
import { findByAnySourceId, findByTags } from './memory';

export function asArtifact(instance: CardInstance): ArtifactCard | undefined {
  const def = getCard(instance.cardId);
  return def.type === 'Artifact' ? def : undefined;
}

export function isStorage(instance: CardInstance): boolean {
  return asArtifact(instance)?.subtype === 'storage';
}

/** Memories currently kept inside this object. */
export function storedIn(inPlay: CardInstance[], containerId: string): CardInstance[] {
  return inPlay.filter((c) => c.linkedTo === containerId);
}

export function capacityOf(instance: CardInstance): number {
  return asArtifact(instance)?.capacity ?? 0;
}

export function remainingSpace(inPlay: CardInstance[], container: CardInstance): number {
  return capacityOf(container) - storedIn(inPlay, container.instanceId).length;
}

/**
 * A stored Memory is out of circulation. Ressonância reads the table, and the
 * table is what is linked to the active Território — so this follows from the
 * link, not from a rule that has to remember to exclude it.
 */
export function isOutOfCirculation(
  instance: CardInstance,
  inPlay: CardInstance[]
): boolean {
  if (!instance.linkedTo) return false;
  const container = inPlay.find((c) => c.instanceId === instance.linkedTo);
  return container ? isStorage(container) : false;
}

/** Storage objects on the table with room left. */
export function openContainers(inPlay: CardInstance[]): CardInstance[] {
  return inPlay.filter((c) => isStorage(c) && remainingSpace(inPlay, c) > 0);
}

/**
 * What an object reaches when it is played. Documents reach by tag within the
 * current place; photographs and records reach a named origin anywhere.
 */
export function findByObject(
  pool: CardInstance[],
  object: ArtifactCard,
  territory: TerritoryCard
): CardInstance[] {
  if (object.accessSources?.length) {
    return findByAnySourceId(pool, object.accessSources);
  }

  if (object.accessTags?.length) {
    // Tag reach is bounded by where the player is standing.
    const byTag = findByTags(pool, object.accessTags, 'any');
    const origins = territory.memorySources ?? [territory.id];
    return byTag.filter((instance) => {
      const memory = getCard(instance.cardId);
      const sources = (memory as { sources?: string[] }).sources ?? [];
      return sources.some((s) => origins.includes(s));
    });
  }

  return [];
}
