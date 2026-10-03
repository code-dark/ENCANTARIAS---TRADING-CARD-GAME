import { describe, it, expect } from 'vitest';
import { greedy as shipped } from '../../src/core/ai/greedyPolicy';
import { POLICIES, greedy as measured } from '../../src/sim/policies';
import { playMatch } from '../../src/sim/runner';
import { OPPONENT_IDS, VERTICAL_SLICE } from '../../src/core/setup/verticalSlice';

describe('the opponent a person faces', () => {
  it('is the same policy the simulator measures the balance with', () => {
    // If these ever diverge, every number the simulator produced becomes a
    // statement about a game nobody plays.
    expect(shipped).toBe(measured);
    expect(POLICIES.gulosa).toBe(shipped);
  });

  it('is a player the match actually has', () => {
    const ids = VERTICAL_SLICE.map((s) => s.id);
    for (const bot of OPPONENT_IDS) expect(ids).toContain(bot);
  });

  it('leaves someone for a person to play', () => {
    const human = VERTICAL_SLICE.filter((s) => !OPPONENT_IDS.includes(s.id));
    expect(human.length).toBeGreaterThan(0);
  });

  it('plays a match through to a decision, without asking for the impossible', () => {
    // What a person will meet: the same policy, driven by the same applyAction.
    const results = [1, 2, 3, 4, 5].map((seed) =>
      playMatch({ seed, policies: [shipped, shipped] })
    );
    for (const r of results) {
      expect(r.winnerId ?? r.endedByLimit).toBeTruthy();
      // A bot that constantly proposes illegal actions would be unreadable to
      // watch: the log would fill with refusals nobody caused.
      expect(r.refusals).toBe(0);
    }
  });
});
