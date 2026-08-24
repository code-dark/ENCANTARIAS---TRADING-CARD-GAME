/**
 * Deterministic randomness.
 *
 * The engine is pure and a match is replayable from its log, so rolls cannot
 * come from Math.random. The seed lives in the game state and every roll
 * returns the next one, which means the same seed always replays the same
 * match and tests can pin a result instead of hoping for one.
 */

/** Numerical Recipes LCG. Small, fast, and good enough for a d6. */
export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export interface Roll {
  value: number;
  seed: number;
}

/** Roll a single six-sided die. */
export function rollD6(seed: number): Roll {
  const advanced = nextSeed(seed);
  // Take from the high bits: the low bits of an LCG cycle short.
  return { value: (advanced >>> 16) % 6 + 1, seed: advanced };
}

/**
 * The Exploração threshold, from the design decision: 2+ on 1d6.
 *
 * 83% success keeps uncertainty without starving the Memória economy. A 3+ or
 * 4+ would drop average generation to 0.67 or 0.5 per turn against one attempt
 * per turn, which would deepen the economic bottleneck rather than temper it.
 */
export const EXPLORE_SUCCESS = 2;

/** A 6 finds the Memory and opens a choice between what the place offers. */
export const EXPLORE_BOON = 6;

export type ExploreOutcome = 'nothing' | 'found' | 'choice';

export function readExploreRoll(value: number, available: number): ExploreOutcome {
  if (value < EXPLORE_SUCCESS) return 'nothing';
  if (value === EXPLORE_BOON && available > 1) return 'choice';
  return 'found';
}
