import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  getCurrentPlayer,
  activeTerritoryOf,
  GameState,
} from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';
import { evaluateMemoryPersistence } from '../../src/core/mechanics/traversal';
import { MemoryCard, TerritoryCard } from '../../src/core/cards/types';

const FONTE = 'territorio_fonte_ribeirao';
const IGREJA = 'territorio_igreja_se';
const SERPENT = 'legend_serpent_enchanted';
const ROOTS = 'memory_enraizada_fountain';
const SHARED = 'memory_transmitida_paths';

/** p1 holds both Fonte and Igreja, active in Fonte. */
function setup(): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const fonte = createInstance(FONTE, 'p1');
  const igreja = createInstance(IGREJA, 'p1');
  p1.territories = [fonte, igreja];
  p1.activeTerritoryId = fonte.instanceId;

  const t2 = createInstance(FONTE, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState([p1, p2]);
}

function advanceTo(state: GameState, phase: string): GameState {
  let s = state;
  let guard = 0;
  while (s.phase !== phase) {
    s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
    if (++guard > 40) throw new Error(`never reached ${phase}`);
  }
  return s;
}

function expectOk(r: { state: GameState; error?: string }): GameState {
  expect(r.error).toBeUndefined();
  return r.state;
}

const igrejaOf = (s: GameState) =>
  s.players[0].territories.find((t) => t.cardId === IGREJA)!;

beforeEach(() => resetInstanceIds());

describe('Travessia', () => {
  it('carries a Shared memory to the new Território and leaves a Roots one behind', () => {
    let s = setup();
    const fonteId = s.players[0].activeTerritoryId;

    const roots = { ...createInstance(ROOTS, 'p1'), linkedTo: fonteId };
    const shared = { ...createInstance(SHARED, 'p1'), linkedTo: fonteId };
    s.players[0].inPlay = [roots, shared];

    s = advanceTo(s, 'Movement');
    s = expectOk(
      applyAction(s, {
        type: 'Traverse',
        playerId: 'p1',
        territoryInstanceId: igrejaOf(s).instanceId,
      })
    );

    const newTerritoryId = s.players[0].activeTerritoryId;
    expect(getCard(activeTerritoryOf(s.players[0])!.cardId).name).toBe('Igreja da Sé');

    const after = (id: string) => s.players[0].inPlay.find((c) => c.instanceId === id)!;

    // The transmitted story follows the player.
    expect(after(shared.instanceId).linkedTo).toBe(newTerritoryId);
    // The rooted one stays with the ground it belongs to.
    expect(after(roots.instanceId).linkedTo).toBe(fonteId);
  });

  it('records what stayed and what travelled in the log', () => {
    let s = setup();
    const fonteId = s.players[0].activeTerritoryId;
    s.players[0].inPlay = [
      { ...createInstance(ROOTS, 'p1'), linkedTo: fonteId },
      { ...createInstance(SHARED, 'p1'), linkedTo: fonteId },
    ];

    s = advanceTo(s, 'Movement');
    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );

    const last = s.log[s.log.length - 1].message;
    expect(last).toContain('carrying Shared: The Crossed Paths');
    expect(last).toContain('leaving Roots: The Eternal Spring behind');
  });

  it('allows only one Travessia per turn', () => {
    let s = advanceTo(setup(), 'Movement');
    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );

    const fonteId = s.players[0].territories.find((t) => t.cardId === FONTE)!.instanceId;
    const again = applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: fonteId });
    expect(again.error).toBe('You have already made a Travessia this turn.');
  });

  it('refuses crossing to where you already are', () => {
    const s = advanceTo(setup(), 'Movement');
    const r = applyAction(s, {
      type: 'Traverse',
      playerId: 'p1',
      territoryInstanceId: s.players[0].activeTerritoryId,
    });
    expect(r.error).toBe('You are already in that Território.');
  });

  it("refuses crossing to another player's Território", () => {
    const s = advanceTo(setup(), 'Movement');
    const foreign = s.players[1].territories[0].instanceId;
    const r = applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: foreign });
    expect(r.error).toBe('That Território is not one of yours.');
  });
});

describe('memory persistence rules', () => {
  // These exercise the state-driven rules directly, independent of any card
  // that happens to declare an explicit traversalBehavior.
  const territory = (affinities: string[]) =>
    ({ id: 't', type: 'Territory', name: 'T', category: 'x', affinities } as unknown as TerritoryCard);

  const memory = (state: string, affinities: string[] = []) =>
    ({
      id: 'm', type: 'Memory', name: 'M', affinities, memoryState: state,
    } as unknown as MemoryCard);

  const from = territory(['Water']);
  const to = territory(['Faith']);

  it('keeps Roots in place', () => {
    expect(evaluateMemoryPersistence(memory('Roots'), from, to)).toBe('stays');
  });

  it('carries Shared along', () => {
    expect(evaluateMemoryPersistence(memory('Shared'), from, to)).toBe('travels');
  });

  it('leaves Corporate with the institution', () => {
    expect(evaluateMemoryPersistence(memory('Corporate'), from, to)).toBe('stays');
  });

  it('lets an Oral memory follow only where it has an affinity', () => {
    expect(evaluateMemoryPersistence(memory('Oral', ['Faith']), from, to)).toBe('travels');
    expect(evaluateMemoryPersistence(memory('Oral', ['Water']), from, to)).toBe('stays');
  });

  it('honours the state of the copy in play over the definition', () => {
    // A definition that starts Shared, transformed into Roots on the table.
    expect(evaluateMemoryPersistence(memory('Shared'), from, to, 'Roots')).toBe('stays');
  });
});

describe('Ressonância', () => {
  it('fires when the Território matches and grants Vínculo', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Action');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    expect(s.players[0].resources.vinculo).toBeGreaterThan(0);
    expect(s.log[s.log.length - 1].message).toContain('resonates with Fonte do Ribeirão');
  });

  it('reports no Ressonância in an unrelated Território', () => {
    let s = setup();
    // Move the player to Igreja first, where the Serpent shares no affinity.
    s.players[0].activeTerritoryId = igrejaOf(s).instanceId;
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Action');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    expect(s.players[0].resources.vinculo).toBe(0);
    expect(s.log[s.log.length - 1].message).toContain('finds no Ressonância');
  });

  it('exhausts the card so it cannot resonate twice in one turn', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Action');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    const again = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId,
    });
    expect(again.error).toBe('Serpent Encantada is exhausted this turn.');
  });
});

describe('Despertar', () => {
  it('clears exhaustion when the turn comes back around', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Action');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );
    expect(s.players[0].inPlay[0].exhausted).toBe(true);

    // Play round-trip: p1 finishes, p2 plays a full turn, back to p1.
    let guard = 0;
    while (!(getCurrentPlayer(s).id === 'p1' && s.phase === 'Awaken')) {
      s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
      if (++guard > 40) throw new Error('never returned to p1');
    }

    expect(s.players[0].inPlay[0].exhausted).toBe(false);
  });
});
