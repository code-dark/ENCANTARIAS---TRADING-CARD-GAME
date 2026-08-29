/**
 * The runner: plays a match to its end and records what happened.
 *
 * It drives the engine through `applyAction`, the same entry point the
 * interface uses. Nothing here knows a rule. If the simulator and a real match
 * ever disagree, that is a bug in the engine, not a difference in the harness —
 * which is the only reason the numbers below are worth anything.
 */

import { applyAction } from '../core/rules/turnResolver';
import { GameState, getCurrentPlayer, Player } from '../core/game/gameState';
import { getCard } from '../core/cards/cardRegistry';
import { buildMatch, PlayerSetup, VERTICAL_SLICE } from '../core/setup/verticalSlice';
import { resetInstanceIds } from '../core/cards/cardRegistry';
import { Policy } from './policies';

export interface PlayerMetrics {
  id: string;
  policy: string;
  journeyId: string;
  objectivesMet: number;
  objectivesTotal: number;
  /** Ressonâncias activated — counted per activation, not per relation. */
  resonances: number;
  /** Times a Personagem listened, and how often the die turned something up. */
  listens: number;
  listensThatFound: number;
  /** Memórias transmitted from any source at all — listening, relation, record. */
  transmitted: number;
  /** Memórias actually transmitted and standing on the table. */
  memories: number;
  traversals: number;
  territoriesUsed: number;
  conjunctions: number;
  transformations: number;
  /** Left unspent when the match ended — what the player never found a use for. */
  idle: { vinculo: number; memoria: number; circulacao: number };
  /** Vínculo divided by turns played, so matches of different length compare. */
  vinculoPerTurn: number;
}

export interface MatchResult {
  seed: number;
  turns: number;
  /** Undefined when the turn limit ran out with no Jornada finished. */
  winnerId?: string;
  winnerJourneyId?: string;
  endedByLimit: boolean;
  /** Actions refused by the validator — a policy asking for the impossible. */
  refusals: number;
  players: PlayerMetrics[];
}

/** Counts the log can answer, so the runner does not have to keep a parallel ledger. */
function countLog(state: GameState, playerId: string, needle: string): number {
  return state.log.filter((e) => e.playerId === playerId && e.message.includes(needle)).length;
}

function measure(state: GameState, player: Player, policy: string, turns: number): PlayerMetrics {
  const memories = player.inPlay.filter((c) => getCard(c.cardId).type === 'Memory').length;
  // Every listen logs 'escuta em'; the ones the die refused say so as well, so
  // the difference is what listening actually turned up.
  const listens = countLog(state, player.id, 'escuta em');
  const empty = countLog(state, player.id, 'Nada vem à tona');

  return {
    id: player.id,
    policy,
    journeyId: player.journeyProgress?.journeyId ?? '—',
    objectivesMet: player.journeyProgress?.completedObjectiveIds.length ?? 0,
    objectivesTotal: 3,
    resonances: countLog(state, player.id, 'ressoa com'),
    listens,
    listensThatFound: listens - empty,
    transmitted: countLog(state, player.id, 'em voz alta'),
    memories,
    traversals: countLog(state, player.id, 'atravessa para'),
    // The place standing in counts as used, traversed to or not.
    territoriesUsed: new Set([
      ...player.accomplishments.territoriesVisited,
      ...player.territories
        .filter((t) => t.instanceId === player.activeTerritoryId)
        .map((t) => t.cardId),
    ]).size,
    conjunctions: player.accomplishments.conjunctionsFormed.length,
    transformations: player.accomplishments.transformations.length,
    idle: { ...player.resources },
    vinculoPerTurn: turns > 0 ? player.resources.vinculo / turns : 0,
  };
}

export interface MatchOptions {
  seed: number;
  policies: Policy[];
  setups?: PlayerSetup[];
  maxTurns?: number;
  /** Safety net: a policy that stops proposing progress must not hang the run. */
  maxActions?: number;
}

export function playMatch(options: MatchOptions): MatchResult {
  const { seed, policies, setups = VERTICAL_SLICE, maxTurns = 200, maxActions = 40000 } = options;

  resetInstanceIds();
  let state = buildMatch(setups, maxTurns, seed);

  const byPlayer = new Map<string, Policy>();
  setups.forEach((setup, i) => byPlayer.set(setup.id, policies[i % policies.length]));

  let refusals = 0;
  let actions = 0;

  while (!state.isEnded && actions < maxActions) {
    const current = getCurrentPlayer(state);
    const policy = byPlayer.get(current.id)!;
    const action = policy.decide(state);

    const result = applyAction(state, action);
    actions++;

    if (result.error) {
      refusals++;
      // A refused action must not loop: fall back to passing, which is always
      // available on your own turn.
      const passed = applyAction(state, { type: 'PassPhase', playerId: current.id });
      if (passed.error) break; // the match cannot continue at all
      state = passed.state;
      continue;
    }

    state = result.state;
  }

  // The clock reads maxTurns + 1 the moment the limit ends a match; what was
  // played is the turn before that.
  const turnsPlayed = Math.min(state.turn, maxTurns);

  return {
    seed,
    turns: turnsPlayed,
    winnerId: state.winnerId,
    winnerJourneyId: state.players.find((p) => p.id === state.winnerId)?.journeyProgress
      ?.journeyId,
    endedByLimit: !state.winnerId,
    refusals,
    players: state.players.map((p) =>
      measure(state, p, byPlayer.get(p.id)!.name, turnsPlayed)
    ),
  };
}
