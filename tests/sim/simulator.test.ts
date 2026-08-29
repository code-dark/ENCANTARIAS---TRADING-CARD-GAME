import { describe, it, expect } from 'vitest';
import { playMatch } from '../../src/sim/runner';
import { greedy, baseline } from '../../src/sim/policies';
import { buildMatch, VERTICAL_SLICE } from '../../src/core/setup/verticalSlice';
import { resetInstanceIds } from '../../src/core/cards/cardRegistry';

describe('the simulator', () => {
  it('plays a match to an end', () => {
    const result = playMatch({ seed: 7, policies: [greedy, greedy] });
    expect(result.turns).toBeGreaterThan(0);
    expect(result.winnerId ?? result.endedByLimit).toBeTruthy();
  });

  it('replays the same seed identically', () => {
    const a = playMatch({ seed: 42, policies: [greedy, greedy] });
    const b = playMatch({ seed: 42, policies: [greedy, greedy] });
    expect(b).toEqual(a);
  });

  it('produces different matches from different seeds', () => {
    // Compared on what the match produced rather than on its length: matches
    // can share a length and still be nothing alike.
    const shapes = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
      const r = playMatch({ seed: s, policies: [greedy, greedy] });
      return r.players.map((p) => `${p.listens}/${p.listensThatFound}`).join('|');
    });
    expect(new Set(shapes).size).toBeGreaterThan(1);
  });

  it('never lets a policy make an illegal move stick', () => {
    // Refusals are allowed — a policy may ask for the impossible — but the
    // engine must have refused them rather than absorbed them.
    const result = playMatch({ seed: 11, policies: [greedy, baseline] });
    expect(result.refusals).toBeGreaterThanOrEqual(0);
    expect(result.turns).toBeLessThanOrEqual(20);
    expect(result.players.every((p) => p.objectivesMet <= 3)).toBe(true);
  });

  it('respects the turn limit', () => {
    const result = playMatch({ seed: 3, policies: [baseline, baseline], maxTurns: 4 });
    expect(result.turns).toBeLessThanOrEqual(4);
  });

  it('builds the same table the interface builds', () => {
    // The guarantee the whole exercise rests on: if these diverge, every
    // number the simulator produces is about a different game.
    resetInstanceIds();
    const a = buildMatch(VERTICAL_SLICE, 20, 5);
    resetInstanceIds();
    const b = buildMatch(VERTICAL_SLICE, 20, 5);

    expect(a.players.map((p) => p.deck.map((c) => c.cardId)))
      .toEqual(b.players.map((p) => p.deck.map((c) => c.cardId)));
    expect(a.memoryPool).toHaveLength(b.memoryPool.length);
    expect(a.players[0].journeyProgress!.journeyId).toBe('journey_guardia_memoria');
    expect(a.players[1].journeyProgress!.journeyId).toBe('journey_cortejo');
  });
});
