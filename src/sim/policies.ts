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
import { AnyCard, CardInstance, TerritoryCard } from '../core/cards/types';
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
 * A Território where this player could assemble a gathering: it declares a
 * conjunction and every card it asks for is in hand or already on the table.
 *
 * Without this a policy whose Jornada asks for a Cortejo simply never goes
 * where one can form, and the Jornada reads as impossible when it is only
 * unvisited.
 */
function couldGatherAt(player: Player, territory: CardInstance): boolean {
  const owned = new Set([...player.hand, ...player.inPlay].map((c) => c.cardId));
  const def = getCard(territory.cardId) as TerritoryCard;

  return (def.conjunctions ?? []).some(
    (conjunction) =>
      !territory.counters[conjunction.id] &&
      conjunction.requires.every((required) => owned.has(required))
  );
}

function gatheringTarget(player: Player) {
  const active = activeTerritoryOf(player);
  return player.territories.find(
    (t) => t.instanceId !== active?.instanceId && couldGatherAt(player, t)
  );
}

/**
 * Where to cross. Ordered by what the Jornada is asking for: somewhere a
 * gathering could form, then somewhere never been, then somewhere a card
 * already on the table would find a relation it does not have yet.
 */
function crossingTarget(player: Player, wantsGathering: boolean): GameAction | undefined {
  const visited = new Set(player.accomplishments.territoriesVisited);
  const active = activeTerritoryOf(player);

  const gathering = wantsGathering ? gatheringTarget(player) : undefined;

  const unseen = player.territories.filter(
    (t) => t.instanceId !== active?.instanceId && !visited.has(t.cardId)
  );

  const promising = player.territories.filter((t) => {
    if (t.instanceId === active?.instanceId) return false;
    const def = getCard(t.cardId) as TerritoryCard;
    return hereWith(player).some((c) => canResonate(getCard(c.cardId), def));
  });

  const target = gathering ?? unseen[0] ?? promising[0];
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
    const wantsGathering = needs.some((n) => n.kind === 'cortejosFormados');

    switch (state.phase) {
      case 'Memoria':
        return firstLegal(state, [{ type: 'DrawCard', playerId: player.id }]);

      case 'Travessia': {
        // Already standing where the gathering can form: stay and save for the
        // cards it needs. Wandering on to somewhere unvisited spends exactly
        // the Memória those cards cost.
        const active = activeTerritoryOf(player);
        if (wantsGathering && active && couldGatherAt(player, active)) {
          return PASS(state);
        }

        // Never cross before there is someone to listen with. Crossing spends
        // the same Memória that manifests, and the only income is listening,
        // which needs a Personagem on the table — so a player who crosses
        // first can end up unable to do anything at all for the rest of the
        // match. Establish the income, then move.
        const hasEar = player.inPlay.some(
          (c) => getCard(c.cardId).type === 'Character'
        );
        if (!hasEar) return PASS(state);

        // Crossing costs the same Memória that manifests, so it is only worth
        // it when the Jornada asks for somewhere else — a place not yet been,
        // or the one place a gathering could form.
        const nothingToPlay = affordable(player).length === 0;
        if (!wantsPlaces && !wantsGathering && !nothingToPlay) return PASS(state);

        const crossing = crossingTarget(player, wantsGathering);
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

        // Cards the player's own Jornada names, one way or another.
        const requiredByGathering = new Set(
          player.territories.flatMap((t) => {
            const def = getCard(t.cardId) as TerritoryCard;
            return (def.conjunctions ?? [])
              .filter((c) => !t.counters[c.id])
              .flatMap((c) => c.requires);
          })
        );
        const wantedAffinities = needs.flatMap((n) =>
          n.kind === 'lendaComAfinidade' ? [n.afinidade] : []
        );

        /**
         * What the Jornada names, one way or another. These are worth saving
         * for: a card a gathering requires does not become affordable by
         * spending on something cheaper that merely resonates here.
         */
        const critical = (def: AnyCard) =>
          (wantsGathering && requiredByGathering.has(def.id)) ||
          (def.type === 'Legend' &&
            wantedAffinities.some((a) => def.affinities.includes(a)));

        /** Useful, but not what the Jornada is asking for. */
        const helpful = (def: AnyCard) =>
          def.type === 'Character' ||
          (territoryDef ? canResonate(def, territoryDef) : false);

        const inHand = player.hand.map((c) => ({ instance: c, def: getCard(c.cardId) }));
        const canPay = ({ def }: { def: AnyCard }) =>
          (def.cost ?? 0) <= player.resources.memoria;
        const play = ({ instance }: { instance: { instanceId: string } }) => ({
          type: 'PlayCard' as const,
          playerId: player.id,
          instanceId: instance.instanceId,
        });

        // Nothing listens without a Personagem, and nothing at all happens
        // without the income listening brings. That comes before the Jornada.
        const noEar = !player.inPlay.some((c) => getCard(c.cardId).type === 'Character');
        const ears = inHand.filter(({ def }) => def.type === 'Character');
        if (noEar && ears.some(canPay)) {
          return firstLegal(state, ears.filter(canPay).map(play));
        }

        const wanted = inHand.filter(({ def }) => critical(def));
        if (wanted.length > 0) {
          const payable = wanted.filter(canPay);
          // Hold the Memória rather than spend it on something cheaper that
          // does not advance the Jornada.
          return payable.length > 0
            ? firstLegal(
                state,
                [...payable].sort((a, b) => (a.def.cost ?? 0) - (b.def.cost ?? 0)).map(play)
              )
            : PASS(state);
        }

        const useful = inHand.filter(({ def }) => helpful(def));
        if (useful.length > 0) {
          const payable = useful.filter(canPay);
          // Same rule one level down: a card that would actually do something
          // here is worth waiting for, rather than spending the Memória on one
          // that would not.
          return payable.length > 0
            ? firstLegal(
                state,
                [...payable]
                  .sort((a, b) => {
                    const rank = (t: string) => (t === 'Character' ? 0 : 1);
                    return (
                      rank(a.def.type) - rank(b.def.type) ||
                      (a.def.cost ?? 0) - (b.def.cost ?? 0)
                    );
                  })
                  .map(play)
              )
            : PASS(state);
        }

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

        // Listening comes first, because listening is the income. A single
        // Personagem is both the only ear and, sometimes, the only card with a
        // relation to this place — spending them on a Ressonância leaves
        // nobody to listen, and a player with no Memória cannot do anything
        // else either.
        candidates.push({ type: 'Explore', playerId: player.id });

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
