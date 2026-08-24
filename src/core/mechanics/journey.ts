/**
 * Jornadas — the only way a match is won.
 *
 * There is no life total and nothing to remove from the table. A player wins by
 * having done a particular kind of thing with the city, and the Jornada names
 * which kind. Because every requirement is data, two players can be playing for
 * genuinely different reasons at the same table.
 *
 * The evaluation is a snapshot, not a ledger: what the system verifies at the
 * end of a turn is what is true then. Storing a Memória in a box keeps it in
 * play, so it still counts; spending Vínculo can take an objective back off.
 * That is deliberate — the Jornada asks what you are sustaining, not what you
 * once touched.
 */

import { Player } from '../game/gameState';
import { getCard } from '../cards/cardRegistry';
import { LegendCard, MemoryCard, MemoryState } from '../cards/types';
import { Journey, JourneyObjective, JourneyRequirement, getJourneyById } from '../cards/data/journeys';

export interface ObjectiveStatus {
  objective: JourneyObjective;
  met: boolean;
  /** Where the player stands, for the UI: 2 of 3. */
  current: number;
  needed: number;
}

export interface JourneyStatus {
  journey: Journey;
  objectives: ObjectiveStatus[];
  completed: boolean;
}

/** Memórias on the table, including the ones kept inside an object. */
function memoriesInPlay(player: Player): { instanceMemoryState?: MemoryState; def: MemoryCard }[] {
  return player.inPlay.flatMap((c) => {
    const def = getCard(c.cardId);
    return def.type === 'Memory'
      ? [{ instanceMemoryState: c.memoryState, def: def as MemoryCard }]
      : [];
  });
}

/**
 * Distinct places the player has been active in. The Território they are
 * standing in now counts without having been traversed to: they are there.
 */
function territoriesVisited(player: Player): string[] {
  const active = player.territories.find(
    (t) => t.instanceId === player.activeTerritoryId
  );
  const visited = [...player.accomplishments.territoriesVisited];

  if (active && !visited.includes(active.cardId)) visited.push(active.cardId);
  return visited;
}

/**
 * How far along one requirement is. Returns a count and a threshold rather than
 * a boolean so the UI can show progress instead of only pass or fail.
 */
export function measure(
  player: Player,
  requirement: JourneyRequirement
): { current: number; needed: number } {
  switch (requirement.kind) {
    case 'memoriasEmJogo': {
      const matching = memoriesInPlay(player).filter(({ instanceMemoryState, def }) => {
        const state = instanceMemoryState ?? def.memoryState;
        if (requirement.state && state !== requirement.state) return false;
        if (requirement.tag && !(def.tags ?? []).includes(requirement.tag)) return false;
        return true;
      });
      return { current: matching.length, needed: requirement.count };
    }

    case 'territoriosVisitados':
      return { current: territoriesVisited(player).length, needed: requirement.count };

    case 'ressonanciasAtivadas':
      return {
        current: player.accomplishments.resonancesActivated.length,
        needed: requirement.count,
      };

    case 'cortejosFormados':
      return {
        current: player.accomplishments.conjunctionsFormed.length,
        needed: requirement.count,
      };

    case 'transformacoes':
      return {
        current: player.accomplishments.transformations.length,
        needed: requirement.count,
      };

    case 'recurso':
      return {
        current: player.resources[requirement.recurso],
        needed: requirement.minimo,
      };

    case 'lendaComAfinidade': {
      const legends = player.inPlay.filter((c) => {
        const def = getCard(c.cardId);
        return (
          def.type === 'Legend' &&
          (def as LegendCard).affinities.includes(requirement.afinidade)
        );
      });
      return { current: legends.length, needed: 1 };
    }
  }
}

export function isMet(player: Player, requirement: JourneyRequirement): boolean {
  const { current, needed } = measure(player, requirement);
  return current >= needed;
}

/**
 * Read a player's Jornada as it stands right now. Undefined only when the
 * player has no Jornada at all, which the setup never produces.
 */
export function evaluateJourney(player: Player): JourneyStatus | undefined {
  if (!player.journeyProgress) return undefined;

  const journey = getJourneyById(player.journeyProgress.journeyId);
  if (!journey) return undefined;

  const objectives: ObjectiveStatus[] = journey.objectives.map((objective) => {
    const { current, needed } = measure(player, objective.requirement);
    return { objective, met: current >= needed, current, needed };
  });

  return {
    journey,
    objectives,
    completed: objectives.every((o) => o.met),
  };
}

/** The objectives currently met, in the order the Jornada lists them. */
export function completedObjectiveIds(status: JourneyStatus): string[] {
  return status.objectives.filter((o) => o.met).map((o) => o.objective.id);
}
