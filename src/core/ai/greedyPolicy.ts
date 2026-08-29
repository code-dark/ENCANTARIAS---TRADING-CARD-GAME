/**
 * How a player who is not a person decides.
 *
 * The same brain answers to two callers: the simulator, which plays thousands
 * of matches to measure the game, and the interface, where it is the opponent
 * a person actually faces. That is deliberate — a bot that played differently
 * from the one the balance was measured against would make every one of those
 * numbers a statement about a game nobody plays.
 *
 * It proposes one action; the caller applies it through the same `applyAction`
 * a click goes through. It has no privileges: it reads the state any player can
 * see, and it cannot make an illegal move stick, because the validator refuses
 * it exactly as it would refuse a person.
 *
 * Deliberately simple. It follows its own Jornada — listens before it spends,
 * establishes an ear before it crosses, saves for what its Jornada names — and
 * that is all. It is a first opponent, not a good one.
 */

import { GameAction } from '../game/actions';
import { GameState, Player, getCurrentPlayer, activeTerritoryOf } from '../game/gameState';
import { validateAction } from '../game/validators';
import { getCard } from '../cards/cardRegistry';
import { AnyCard, CardInstance, TerritoryCard } from '../cards/types';
import { evaluateJourney } from '../mechanics/journey';
import { canResonate } from '../mechanics/resonance';
import { openContainers } from '../mechanics/objects';
import { exploreThreshold } from '../game/random';

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

/**
 * Whether this Território still has enough left to say to be worth an action.
 *
 * The die needed here climbs with every account already taken. At 2+ or 3+ a
 * listen succeeds more often than not; from 4+ it is a coin flip at best, and
 * the turn is better spent earning the Vínculo that pays for going elsewhere.
 */
function listenIsWorthIt(player: Player): boolean {
  const active = activeTerritoryOf(player);
  if (!active) return false;
  const heard = player.accomplishments.listensByTerritory[active.cardId] ?? 0;
  return exploreThreshold(heard) <= 3;
}

/** The die this player would need in a Território, given what they have heard. */
function dieAt(player: Player, cardId: string): number {
  return exploreThreshold(player.accomplishments.listensByTerritory[cardId] ?? 0);
}

/**
 * Whether somewhere else would answer more easily than here.
 *
 * This is the whole reason Travessia exists now, so the policy has to be able
 * to see it. Judging staleness only by an absolute threshold made the bot sit
 * still through every calibration we tried, which measured the policy rather
 * than the rule.
 */
function somewhereBetter(player: Player): boolean {
  const active = activeTerritoryOf(player);
  if (!active) return false;
  const here = dieAt(player, active.cardId);
  return player.territories.some(
    (t) => t.instanceId !== active.instanceId && dieAt(player, t.cardId) < here
  );
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
        // Somewhere you have not been is the easiest place to hear something
        // new, so a Território that has stopped answering is itself a reason
        // to move — not only a Jornada that names another place.
        const stale = !listenIsWorthIt(player) || somewhereBetter(player);
        const nothingToPlay = affordable(player).length === 0;
        if (!wantsPlaces && !wantsGathering && !nothingToPlay && !stale) {
          return PASS(state);
        }

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

        // Listening used to come first unconditionally, because listening was
        // the income and it never got worse. Now a place tells less the longer
        // you stand in it, and Vínculo — which only Ressonância pays — is what
        // buys the way out. So the order depends on whether this place still
        // has much to say: while it does, listen; once the die has climbed, a
        // new relation is worth more than another failed attempt.
        const fresh = listenIsWorthIt(player);
        if (fresh) candidates.push({ type: 'Explore', playerId: player.id });

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

        // A stale place is still better listened to than not acted in at all.
        if (!fresh) candidates.push({ type: 'Explore', playerId: player.id });

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

