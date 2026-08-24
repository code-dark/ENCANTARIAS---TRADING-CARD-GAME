import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, getCurrentPlayer, GameState } from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';
import {
  rollD6, readExploreRoll, EXPLORE_SUCCESS, EXPLORE_BOON,
} from '../../src/core/game/random';

const FONTE = 'territorio_fonte_ribeirao';
const ESCADARIA = 'territorio_escadaria_reviver';
const PATHS = 'memory_transmitida_paths';
const MEDIA = 'memory_midiatic_circulating';
const LISTENER = 'character_listener'; // Escuta 4
const ORAL = 'memory_oral_serpent';    // explore, Escuta 3, Fonte
const ROOTS = 'memory_enraizada_fountain';

/** Seeds pinned to a die face. */
const SEED = { one: 7, two: 3, three: 4, four: 5, five: 1, six: 2 };

function setup(pool: string[], seed: number, territoryId = FONTE): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const t = createInstance(territoryId, 'p1');
  p1.territories = [t];
  p1.activeTerritoryId = t.instanceId;
  p1.inPlay = [{ ...createInstance(LISTENER, 'p1'), linkedTo: t.instanceId }];

  const t2 = createInstance(FONTE, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState(
    [p1, p2], pool.map((id) => createInstance(id, 'world')), 20, seed
  );
}

function toAcao(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.phase !== 'Acao') {
    s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
    if (++guard > 40) throw new Error('never reached Acao');
  }
  return s;
}

const expectOk = (r: { state: GameState; error?: string }) => {
  expect(r.error).toBeUndefined();
  return r.state;
};

beforeEach(() => resetInstanceIds());

describe('the die is deterministic', () => {
  it('the same seed always gives the same face', () => {
    expect(rollD6(SEED.five).value).toBe(5);
    expect(rollD6(SEED.five).value).toBe(5);
    expect(rollD6(SEED.one).value).toBe(1);
  });

  it('advances the seed so a second roll differs from the first', () => {
    const first = rollD6(12345);
    const second = rollD6(first.seed);
    expect(second.seed).not.toBe(first.seed);
  });

  it('only ever produces faces 1 to 6, evenly enough', () => {
    const counts = new Array(7).fill(0);
    let seed = 99;
    for (let i = 0; i < 6000; i++) {
      const r = rollD6(seed);
      seed = r.seed;
      expect(r.value).toBeGreaterThanOrEqual(1);
      expect(r.value).toBeLessThanOrEqual(6);
      counts[r.value]++;
    }
    // Each face should land near 1000; generous bounds, this is a fairness
    // smoke test rather than a statistical proof.
    for (let face = 1; face <= 6; face++) {
      expect(counts[face]).toBeGreaterThan(800);
      expect(counts[face]).toBeLessThan(1200);
    }
  });

  it('succeeds on 2+, which is the 83% the design chose', () => {
    let seed = 4242;
    let successes = 0;
    const trials = 6000;
    for (let i = 0; i < trials; i++) {
      const r = rollD6(seed);
      seed = r.seed;
      if (r.value >= EXPLORE_SUCCESS) successes++;
    }
    expect(successes / trials).toBeGreaterThan(0.80);
    expect(successes / trials).toBeLessThan(0.86);
  });
});

describe('reading the roll', () => {
  it('a 1 finds nothing', () => {
    expect(readExploreRoll(1, 3)).toBe('nothing');
  });

  it('2 through 5 find one account', () => {
    for (const face of [2, 3, 4, 5]) {
      expect(readExploreRoll(face, 3)).toBe('found');
    }
  });

  it('a 6 opens a choice when the place has more than one to offer', () => {
    expect(readExploreRoll(EXPLORE_BOON, 2)).toBe('choice');
  });

  it('a 6 with only one account available is simply a find', () => {
    expect(readExploreRoll(EXPLORE_BOON, 1)).toBe('found');
  });
});

describe('Exploração with the die', () => {
  it('on a 1, nothing comes through — but the Personagem is still spent', () => {
    let s = toAcao(setup([ORAL], SEED.one));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    expect(s.pendingDiscovery).toBeUndefined();
    expect(s.memoryPool).toHaveLength(1); // still out there
    expect(s.players[0].inPlay[0].exhausted).toBe(true);
    expect(s.log[s.log.length - 1].message).toContain('Nothing comes through');
  });

  it('on a 5, one account waits to be read', () => {
    let s = toAcao(setup([ORAL], SEED.five));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    expect(s.pendingDiscovery!.options).toHaveLength(1);
    expect(s.pendingDiscovery!.roll).toBe(5);
    expect(s.memoryPool).toHaveLength(1); // not yours until read
  });

  it('on a 6, the place offers a choice between two', () => {
    // Escadaria is one of the places that holds more than one account.
    let s = toAcao(setup([PATHS, MEDIA], SEED.six, ESCADARIA));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    expect(s.pendingDiscovery!.roll).toBe(6);
    expect(s.log[s.log.length - 1].message).toContain('more than one account');
  });

  it('a found Memory is not yours until it has been read aloud', () => {
    let s = toAcao(setup([ORAL], SEED.five));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    // Everything else is held until the fact is read.
    const blocked = applyAction(s, { type: 'PassPhase', playerId: 'p1' });
    expect(blocked.error).toBe('Read the Memória you found before doing anything else.');

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));

    expect(s.memoryPool).toHaveLength(0);
    expect(s.players[0].inPlay.some((c) => c.cardId === ORAL)).toBe(true);
    expect(s.log[s.log.length - 1].message).toContain('reads Oral Account of the Serpent aloud');
  });

  it('refuses to transmit something that was not found', () => {
    let s = toAcao(setup([ORAL], SEED.five));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    const stranger = createInstance(ROOTS, 'world');
    const r = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1', memoryInstanceId: stranger.instanceId,
    });
    expect(r.error).toBe('That Memória is not among the ones you found.');
  });

  it('refuses to transmit when nothing is waiting', () => {
    const s = toAcao(setup([ORAL], SEED.five));
    const r = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1', memoryInstanceId: 'whatever',
    });
    expect(r.error).toBe('There is no Memória waiting to be read.');
  });

  it('the option not taken stays in the world', () => {
    let s = toAcao(setup([PATHS, MEDIA], SEED.six, ESCADARIA));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    const taken = s.pendingDiscovery!.options[0];
    const left = s.pendingDiscovery!.options[1];
    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1', memoryInstanceId: taken.instanceId,
    }));

    expect(s.memoryPool.some((m) => m.instanceId === left.instanceId)).toBe(true);
    expect(getCard(left.cardId).type).toBe('Memory');
  });
});

describe('a Memória names where it comes from', () => {
  it('is not overheard in another place that merely shares an affinity', () => {
    // The cathedral bells name Igreja da Sé and nowhere else. CEPRAMA shares
    // the Institution affinity, which is not the same as belonging there.
    let s = toAcao(setup(['memory_territorial_bells'], SEED.five, 'territorio_ceprama'));
    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('hears nothing further');
  });

  it('is found in the place it does name', () => {
    let s = toAcao(setup(['memory_territorial_bells'], SEED.five, 'territorio_igreja_se'));
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    expect(s.pendingDiscovery!.options).toHaveLength(1);
  });
});
