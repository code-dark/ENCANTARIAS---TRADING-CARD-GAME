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

/**
 * How hard it is to hear something here, given how much you have already heard.
 *
 * A place never runs dry — a 6 always finds something, however long you have
 * stood in it. But it has less left to tell someone who has been listening all
 * match, so each account already taken from a Território raises the die by one,
 * to a floor of the boon face.
 *
 * This is what gives Travessia a reason. Before it, listening cost nothing and
 * never got worse, so the measured game was one action repeated: 7.6 listens in
 * 7.6 turns, 1.0 Território used, 0.0 traversals. Somewhere you have not been
 * is now the easiest place to hear something new.
 */
export const EXPLORE_HARDEST = 4;

export function exploreThreshold(listensHere: number): number {
  // Half a step per account, and never past a coin flip. Climbing a full step
  // each time reached 6 by the fourth listen, which did not nudge a player
  // elsewhere — it starved them: measured at 27% success, income collapsed and
  // matches showed players with eleven consecutive turns of no legal action at
  // all. A place should have less to say, not nothing.
  return Math.min(EXPLORE_SUCCESS + Math.floor(listensHere / 2), EXPLORE_HARDEST);
}

export function readExploreRoll(
  value: number,
  available: number,
  threshold: number = EXPLORE_SUCCESS
): ExploreOutcome {
  if (value < threshold) return 'nothing';
  // The luxury of choosing belongs to a place still full of stories.
  if (value === EXPLORE_BOON && threshold === EXPLORE_SUCCESS && available > 1) {
    return 'choice';
  }
  return 'found';
}
