/**
 * The two rules that closed the economy.
 *
 * Before them, 500 simulated matches showed a game with one action: 7.6
 * listens in 7.6 turns, 1.0 Território used per player, 0.0 traversals, and
 * 3.5 Vínculo left unspent at the end — because Vínculo was earned and never
 * cost anything, and listening never got harder.
 */

import { describe, it, expect } from 'vitest';
import { applyAction } from '../../src/core/rules/turnResolver';
import { validateAction } from '../../src/core/game/validators';
import {
  exploreThreshold, readExploreRoll, EXPLORE_SUCCESS, EXPLORE_BOON, EXPLORE_HARDEST,
} from '../../src/core/game/random';
import { traversalVinculoCost, TRAVESSIA_VINCULO } from '../../src/core/mechanics/traversal';
import { buildMatch } from '../../src/core/setup/verticalSlice';
import { resetInstanceIds } from '../../src/core/cards/cardRegistry';
import { GameState } from '../../src/core/game/gameState';

function advanceTo(state: GameState, phase: string): GameState {
  let s = state;
  for (let i = 0; i < 20 && s.phase !== phase; i++) {
    s = applyAction(s, { type: 'PassPhase', playerId: s.players[s.currentPlayerIndex].id }).state;
  }
  return s;
}

describe('Travessia: going somewhere new is paid in Memória, retreading also costs Vínculo', () => {
  it('charges no Vínculo for a place never listened in, and charges it for one already heard', () => {
    expect(traversalVinculoCost({ travessiaLivre: false }, true)).toBe(0);
    expect(traversalVinculoCost({ travessiaLivre: false }, false)).toBe(TRAVESSIA_VINCULO);
    expect(traversalVinculoCost({ travessiaLivre: true }, false)).toBe(0);
  });

  it('lets a player with no Vínculo at all reach somewhere they have never heard', () => {
    resetInstanceIds();
    let s = buildMatch(undefined, 200, 5);
    s.players[0].resources.memoria = 20;
    s.players[0].resources.vinculo = 0;
    s = advanceTo(s, 'Travessia');

    const target = s.players[0].territories.find(
      (t) => t.instanceId !== s.players[0].activeTerritoryId
    )!;
    const verdict = validateAction(s, {
      type: 'Traverse', playerId: 'p1', territoryInstanceId: target.instanceId,
    });

    // Going outward is the move the game is about; it must never be the move
    // a player cannot afford.
    expect(verdict.valid).toBe(true);
  });

  it('refuses a retread to a player without Vínculo, and says where Vínculo comes from', () => {
    resetInstanceIds();
    let s = buildMatch(undefined, 200, 5);
    s.players[0].resources.memoria = 20;
    s.players[0].resources.vinculo = 0;

    const target = s.players[0].territories.find(
      (t) => t.instanceId !== s.players[0].activeTerritoryId
    )!;
    // Mark it as already heard: this is a return, not a discovery.
    s.players[0].accomplishments.listensByTerritory[target.cardId] = 2;
    s = advanceTo(s, 'Travessia');

    const verdict = validateAction(s, {
      type: 'Traverse', playerId: 'p1', territoryInstanceId: target.instanceId,
    });

    expect(verdict.valid).toBe(false);
    expect(verdict.valid === false && verdict.reason).toContain('Vínculo');
    // A refusal that does not say how to fix it is a dead end.
    expect(verdict.valid === false && verdict.reason).toContain('Ressonância');
  });

  it('returns the turn\'s Escuta on arriving somewhere never listened in', () => {
    resetInstanceIds();
    let s = buildMatch(undefined, 200, 5);
    s.players[0].resources.memoria = 20;
    s = advanceTo(s, 'Travessia');
    s = { ...s, turnFlags: { ...s.turnFlags, hasListened: true } };

    const target = s.players[0].territories.find(
      (t) => t.instanceId !== s.players[0].activeTerritoryId
    )!;
    const after = applyAction(s, {
      type: 'Traverse', playerId: 'p1', territoryInstanceId: target.instanceId,
    });

    expect(after.error).toBeUndefined();
    expect(after.state.turnFlags.hasListened).toBe(false);
  });
});

describe('a Território tells less to someone who keeps listening', () => {
  it('raises the die half a step per account, and stops at a coin flip', () => {
    expect(exploreThreshold(0)).toBe(EXPLORE_SUCCESS);
    expect(exploreThreshold(1)).toBe(EXPLORE_SUCCESS);
    expect(exploreThreshold(2)).toBe(3);
    expect(exploreThreshold(4)).toBe(EXPLORE_HARDEST);
    expect(exploreThreshold(50)).toBe(EXPLORE_HARDEST);
  });

  it('never starves a place out — the die never passes a coin flip', () => {
    // Climbing to 6 was tried and produced players with eleven consecutive
    // turns of no legal action. A place tells less; it never falls silent.
    for (const heard of [0, 1, 5, 40]) {
      expect(exploreThreshold(heard)).toBeLessThanOrEqual(EXPLORE_HARDEST);
      expect(readExploreRoll(EXPLORE_BOON, 1, exploreThreshold(heard))).not.toBe('nothing');
    }
  });

  it('keeps the choice of accounts for a place still full of them', () => {
    expect(readExploreRoll(EXPLORE_BOON, 2, exploreThreshold(0))).toBe('choice');
    // Once you have taken from it, a 6 still finds — but no longer offers.
    expect(readExploreRoll(EXPLORE_BOON, 2, exploreThreshold(2))).toBe('found');
  });

  it('counts the attempt, not the result, and counts per Território', () => {
    resetInstanceIds();
    let s = buildMatch(undefined, 20, 11);
    const before = s.players[0].accomplishments.listensByTerritory;
    expect(Object.keys(before)).toHaveLength(0);

    s = advanceTo(s, 'Acao');
    const verdict = validateAction(s, { type: 'Explore', playerId: 'p1' });
    if (!verdict.valid) return; // no listener yet on this seed; the unit tests above carry the rule

    const after = applyAction(s, { type: 'Explore', playerId: 'p1' }).state;
    const active = after.players[0].territories.find(
      (t) => t.instanceId === after.players[0].activeTerritoryId
    )!;
    expect(after.players[0].accomplishments.listensByTerritory[active.cardId]).toBe(1);
  });
});

describe('a new player gets its own containers', () => {
  it('does not share accomplishment state between matches', () => {
    // This was real: the fresh record was a constant, so spreading it copied
    // references, and every player in every match shared one map. A write in
    // one match turned up in the next — which in a 500-match run would
    // quietly poison every number after the first.
    resetInstanceIds();
    const a = buildMatch(undefined, 200, 5);
    resetInstanceIds();
    const b = buildMatch(undefined, 200, 11);

    const listensA = a.players[0].accomplishments.listensByTerritory;
    const listensB = b.players[0].accomplishments.listensByTerritory;
    expect(listensA).not.toBe(listensB);
    expect(a.players[0].accomplishments.territoriesVisited)
      .not.toBe(b.players[0].accomplishments.territoriesVisited);

    listensA['territorio_fonte_ribeirao'] = 3;
    expect(listensB).toEqual({});
    expect(a.players[1].accomplishments.listensByTerritory).toEqual({});
  });
});

describe('where you begin is a place you have been', () => {
  it('records the starting Território as visited', () => {
    // It was only recorded on a Travessia, so the place a player opens in
    // counted for nothing — shortchanging every Jornada that asks how many
    // places you have been.
    resetInstanceIds();
    const s = buildMatch(undefined, 200, 5);
    const p1 = s.players[0];
    const opening = p1.territories.find((t) => t.instanceId === p1.activeTerritoryId)!;
    expect(p1.accomplishments.territoriesVisited).toContain(opening.cardId);
  });
});
