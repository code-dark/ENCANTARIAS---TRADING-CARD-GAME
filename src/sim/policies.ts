/**
 * Policies — how a simulated player decides.
 *
 * A policy proposes one action; the runner applies it through the same
 * `applyAction` the interface uses. A policy has no privileges: it reads the
 * state any player can see and it cannot make an illegal move stick, because
 * the validator refuses it exactly as it would refuse a person.
 *
 * Deliberately dumb. These exist to find extremes and impossibilities — a
 * Jornada nobody can finish, a Território nobody leaves, a resource nobody
 * spends — not to play well. Where a greedy player struggles, a person may not;
 * where a greedy player cannot even reach a requirement, nobody can.
 */

import { GameAction } from '../core/game/actions';
import { GameState, Player, getCurrentPlayer, activeTerritoryOf } from '../core/game/gameState';
import { validateAction } from '../core/game/validators';
import { getCard } from '../core/cards/cardRegistry';
import { AnyCard, TerritoryCard } from '../core/cards/types';
import { evaluateJourney } from '../core/mechanics/journey';
import { canResonate } from '../core/mechanics/resonance';
import { openContainers } from '../core/mechanics/objects';

export interface Policy {
  name: string;
  decide(state: GameState): GameAction;
}

const PASS = (state: GameState): GameAction => ({
  type: 'PassPhase',
  playerId: getCurrentPlayer(state).id,
});

const legal = (state: GameState, action: GameAction) =>
  validateAction(state, action).valid;

/** The first legal action from a list of candidates, or passing. */
function firstLegal(state: GameState, candidates: GameAction[]): GameAction {
  return candidates.find((a) => legal(state, a)) ?? PASS(state);
}

/* ------------------------------------------------------------------ *
 * Shared reading of the table
 * ------------------------------------------------------------------ */

function hereWith(player: Player) {
  return player.inPlay.filter((c) => c.linkedTo === player.activeTerritoryId);
}

/** Cards in hand, cheapest first — a tie-break, not a strategy. */
function affordable(player: Player) {
  return [...player.hand]
    .map((c) => ({ instance: c, def: getCard(c.cardId) }))
    .filter(({ def }) => (def.cost ?? 0) <= player.resources.memoria)
    .sort((a, b) => (a.def.cost ?? 0) - (b.def.cost ?? 0));
}

/* ------------------------------------------------------------------ *
 * Baseline: does the minimum a turn allows
 * ------------------------------------------------------------------ */

/**
 * The control. It draws and manifests, and never listens, resonates or
 * crosses. Whatever the greedy player achieves above this line is what those
 * actions are worth.
 */
export const baseline: Policy = {
  name: 'passiva',
  decide(state) {
    const player = getCurrentPlayer(state);

    if (state.pendingDiscovery?.playerId === player.id) {
      return {
        type: 'TransmitMemory',
        playerId: player.id,
        memoryInstanceId: state.pendingDiscovery.options[0].instanceId,
      };
    }

    if (state.phase === 'Memoria') {
      return firstLegal(state, [{ type: 'DrawCard', playerId: player.id }]);
    }

    if (state.phase === 'Manifestacao') {
      return firstLegal(
        state,
        affordable(player).map(({ instance }) => ({
          type: 'PlayCard' as const,
          playerId: player.id,
          instanceId: instance.instanceId,
        }))
      );
    }

    return PASS(state);
  },
};

/* ------------------------------------------------------------------ *
 * Greedy: chases its own Jornada
 * ------------------------------------------------------------------ */

/** Which requirements this player's Jornada still has open. */
function openNeeds(player: Player) {
  const status = evaluateJourney(player);
  return (status?.objectives ?? []).filter((o) => !o.met).map((o) => o.objective.requirement);
}

/**
 * Where to cross, when the Jornada asks for places. Prefers somewhere never
 * been — that is the only thing that moves `territoriosVisitados`.
 */
function crossingTarget(player: Player): GameAction | undefined {
  const visited = new Set(player.accomplishments.territoriesVisited);
  const active = activeTerritoryOf(player);

  const unseen = player.territories.filter(
    (t) => t.instanceId !== active?.instanceId && !visited.has(t.cardId)
  );

  // Failing that, somewhere this card could resonate — a relation not yet had.
  const promising = player.territories.filter((t) => {
    if (t.instanceId === active?.instanceId) return false;
    const def = getCard(t.cardId) as TerritoryCard;
    return hereWith(player).some((c) => canResonate(getCard(c.cardId), def));
  });

  const target = unseen[0] ?? promising[0];
  return target
    ? { type: 'Traverse', playerId: player.id, territoryInstanceId: target.instanceId }
    : undefined;
}

export const greedy: Policy = {
  name: 'gulosa',
  decide(state) {
    const player = getCurrentPlayer(state);

    // Reading aloud comes before anything: nothing else is allowed until then.
    if (state.pendingDiscovery?.playerId === player.id) {
      return {
        type: 'TransmitMemory',
        playerId: player.id,
        memoryInstanceId: state.pendingDiscovery.options[0].instanceId,
      };
    }

    const needs = openNeeds(player);
    const wantsPlaces = needs.some((n) => n.kind === 'territoriosVisitados');

    switch (state.phase) {
      case 'Memoria':
        return firstLegal(state, [{ type: 'DrawCard', playerId: player.id }]);

      case 'Travessia': {
        // Crossing costs the same Memória that manifests. Only cross when the
        // Jornada asks for places, or when there is nothing to manifest here.
        const nothingToPlay = affordable(player).length === 0;
        if (!wantsPlaces && !nothingToPlay) return PASS(state);

        const crossing = crossingTarget(player);
        return crossing && legal(state, crossing) ? crossing : PASS(state);
      }

      case 'Manifestacao': {
        // Saving up matters. A policy that spends its Memória on whatever is
        // cheapest every turn can never afford the one card its Jornada needs,
        // and then measures a game nobody would play that way.
        const territory = activeTerritoryOf(player);
        const territoryDef = territory
          ? (getCard(territory.cardId) as TerritoryCard)
          : undefined;

        const useful = (def: AnyCard) =>
          // A Personagem is how anything gets listened for at all.
          def.type === 'Character' ||
          // Anything that has a relation with where we are standing.
          (territoryDef ? canResonate(def, territoryDef) : false);

        const wanted = player.hand
          .map((c) => ({ instance: c, def: getCard(c.cardId) }))
          .filter(({ def }) => useful(def));

        const affordableWanted = wanted.filter(
          ({ def }) => (def.cost ?? 0) <= player.resources.memoria
        );

        // Something worth having and affordable: take it, cheapest first.
        if (affordableWanted.length > 0) {
          return firstLegal(
            state,
            [...affordableWanted]
              .sort((a, b) => {
                const rank = (t: string) => (t === 'Character' ? 0 : 1);
                return (
                  rank(a.def.type) - rank(b.def.type) ||
                  (a.def.cost ?? 0) - (b.def.cost ?? 0)
                );
              })
              .map(({ instance }) => ({
                type: 'PlayCard' as const,
                playerId: player.id,
                instanceId: instance.instanceId,
              }))
          );
        }

        // Something worth having but out of reach: hold the Memória for it
        // rather than spending it on something that does not help.
        if (wanted.length > 0) return PASS(state);

        return firstLegal(
          state,
          affordable(player).map(({ instance }) => ({
            type: 'PlayCard' as const,
            playerId: player.id,
            instanceId: instance.instanceId,
          }))
        );
      }

      case 'Acao': {
        const candidates: GameAction[] = [];

        // Resonate with everything that can, one card per turn each.
        const territory = activeTerritoryOf(player);
        if (territory) {
          const territoryDef = getCard(territory.cardId) as TerritoryCard;
          for (const card of hereWith(player)) {
            const def = getCard(card.cardId);
            if (!canResonate(def, territoryDef)) continue;

            // A relation already recognised here pays no Vínculo again. Still
            // worth re-activating when its effects are what is wanted, but a
            // new relation comes first.
            const known = player.accomplishments.resonancesActivated.includes(
              `${def.id}@${territoryDef.id}`
            );
            candidates.push({
              type: 'ActivateResonance',
              playerId: player.id,
              instanceId: card.instanceId,
              ...(known ? { known: true } : {}),
            } as GameAction);
          }
          // New relations first.
          candidates.sort(
            (a, b) => Number('known' in a) - Number('known' in b)
          );
        }

        // Then listen. A find has to be read before anything else happens,
        // so this is always the last thing attempted in a turn.
        candidates.push({ type: 'Explore', playerId: player.id });

        // With room to spare and nothing else to do, put something away.
        const container = openContainers(player.inPlay)[0];
        if (container) {
          const loose = hereWith(player).find(
            (c) => getCard(c.cardId).type === 'Memory'
          );
          if (loose) {
            candidates.push({
              type: 'StoreMemory',
              playerId: player.id,
              memoryInstanceId: loose.instanceId,
              containerInstanceId: container.instanceId,
            });
          }
        }

        return firstLegal(state, candidates);
      }

      default:
        return PASS(state);
    }
  },
};

export const POLICIES: Record<string, Policy> = {
  gulosa: greedy,
  passiva: baseline,
};
