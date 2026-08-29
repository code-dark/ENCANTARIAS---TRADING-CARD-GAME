import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  getCurrentPlayer,
  activeTerritoryOf,
  GameState,
} from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';
import {
  evaluateMemoryPersistence,
  traversalCost,
  TRAVESSIA_BASE_COST,
  TRAVESSIA_UNRELATED_SURCHARGE,
} from '../../src/core/mechanics/traversal';
import { MemoryCard, TerritoryCard } from '../../src/core/cards/types';
import { memories, getMemoryById } from '../../src/core/cards/data/memories';

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

  // Travessia costs Memória and Vínculo; these tests are about what crossing
  // does, not about affording it, so fund the crossing player with both.
  p1.resources.memoria = 5;
  p1.resources.vinculo = 3;

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

    s = advanceTo(s, 'Travessia');
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

    s = advanceTo(s, 'Travessia');
    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );

    const last = s.log[s.log.length - 1].message;
    expect(last).toContain('levando Os Caminhos Cruzados');
    expect(last).toContain('deixando A Fonte Perene para trás');
  });

  it('allows only one Travessia per turn', () => {
    let s = advanceTo(setup(), 'Travessia');
    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );

    const fonteId = s.players[0].territories.find((t) => t.cardId === FONTE)!.instanceId;
    const again = applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: fonteId });
    expect(again.error).toBe('Você já fez uma Travessia neste turno.');
  });

  it('refuses crossing to where you already are', () => {
    const s = advanceTo(setup(), 'Travessia');
    const r = applyAction(s, {
      type: 'Traverse',
      playerId: 'p1',
      territoryInstanceId: s.players[0].activeTerritoryId,
    });
    expect(r.error).toBe('Você já está nesse Território.');
  });

  it("refuses crossing to another player's Território", () => {
    const s = advanceTo(setup(), 'Travessia');
    const foreign = s.players[1].territories[0].instanceId;
    const r = applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: foreign });
    expect(r.error).toBe('Esse Território não é seu.');
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

  it('keeps Territorial with the ground it is a detail of', () => {
    expect(evaluateMemoryPersistence(memory('Territorial', ['Faith']), from, to)).toBe('stays');
  });

  it('lets Media circulate regardless of where it is going', () => {
    expect(evaluateMemoryPersistence(memory('Media', ['Water']), from, to)).toBe('travels');
  });

  it('honours the state of the copy in play over the definition', () => {
    // A definition that starts Shared, transformed into Roots on the table.
    expect(evaluateMemoryPersistence(memory('Shared'), from, to, 'Roots')).toBe('stays');
  });
});

describe('Travessia cost', () => {
  const territory = (affinities: string[]) =>
    ({ id: 't', type: 'Territory', name: 'T', category: 'x', affinities } as unknown as TerritoryCard);

  it('charges less when the two Territórios share an affinity', () => {
    const from = territory(['Water', 'Memory']);
    const to = territory(['Memory', 'Faith']);
    expect(traversalCost(from, to)).toBe(TRAVESSIA_BASE_COST);
  });

  it('charges a surcharge for jumping to an unrelated context', () => {
    const from = territory(['Water']);
    const to = territory(['Commerce']);
    expect(traversalCost(from, to)).toBe(TRAVESSIA_BASE_COST + TRAVESSIA_UNRELATED_SURCHARGE);
  });

  it('costs nothing to take up a first Território', () => {
    expect(traversalCost(undefined, territory(['Water']))).toBe(0);
  });

  it('is never free: every crossing charges at least the base cost', () => {
    const from = territory(['Water', 'Memory', 'Faith']);
    const to = territory(['Water', 'Memory', 'Faith']); // maximum overlap
    expect(traversalCost(from, to)).toBeGreaterThan(0);
  });

  it('deducts the cost from Memória when crossing', () => {
    let s = setup();
    s.players[0].resources.memoria = 4;
    s.players[0].resources.vinculo = 2;
    s = advanceTo(s, 'Travessia');

    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );

    // Fonte and Igreja share no affinity, so this is the surcharged price.
    expect(s.players[0].resources.memoria).toBe(4 - (TRAVESSIA_BASE_COST + TRAVESSIA_UNRELATED_SURCHARGE));
  });

  it('refuses a crossing the player cannot pay, naming the price', () => {
    let s = setup();
    s.players[0].resources.memoria = 0;
    s = advanceTo(s, 'Travessia');

    const r = applyAction(s, {
      type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId,
    });
    expect(r.error).toBe('Travessia para Igreja da Sé custa 2 de Memória; você tem 0.');
    expect(r.state).toBe(s); // nothing moved, nothing spent
  });

  it('records the price paid in the log', () => {
    let s = advanceTo(setup(), 'Travessia');
    s = expectOk(
      applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: igrejaOf(s).instanceId })
    );
    expect(s.log[s.log.length - 1].message).toContain('por 2 de Memória');
  });
});

describe('Ressonância', () => {
  it('fires when the Território matches and grants Vínculo', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Acao');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    expect(s.players[0].resources.vinculo).toBeGreaterThan(0);
    // The relation is announced, and what it opens is logged after it.
    expect(s.log.some((e) => e.message.includes('ressoa com Fonte do Ribeirão'))).toBe(true);
  });

  it('reports no Ressonância in an unrelated Território', () => {
    let s = setup();
    // Move the player to Igreja first, where the Serpent shares no affinity.
    s.players[0].activeTerritoryId = igrejaOf(s).instanceId;
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Acao');
    const before = s.players[0].resources.vinculo;
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    // What matters is that nothing was earned, not the absolute figure — the
    // fixture funds Vínculo so its players can afford to cross.
    expect(s.players[0].resources.vinculo).toBe(before);
    expect(s.log[s.log.length - 1].message).toContain('não encontra Ressonância');
  });

  it('exhausts the card so it cannot resonate twice in one turn', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Acao');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    const again = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId,
    });
    expect(again.error).toBe('Serpente Encantada está exausta neste turno.');
  });
});

describe('Despertar', () => {
  it('clears exhaustion when the turn comes back around', () => {
    let s = setup();
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];

    s = advanceTo(s, 'Acao');
    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );
    expect(s.players[0].inPlay[0].exhausted).toBe(true);

    // Play round-trip: p1 finishes, p2 plays a full turn, back to p1.
    let guard = 0;
    while (!(getCurrentPlayer(s).id === 'p1' && s.phase === 'Despertar')) {
      s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
      if (++guard > 40) throw new Error('never returned to p1');
    }

    expect(s.players[0].inPlay[0].exhausted).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * The state is the rule; a declaration is an exception
 * ------------------------------------------------------------------ */

describe('what decides whether a Memory crosses', () => {
  it('reads the state when the card declares nothing', () => {
    const enraizada = getMemoryById('memory_enraizada_fountain')!;
    expect(enraizada.traversalBehavior).toBeUndefined();

    const fonte = getCard('territorio_fonte_ribeirao') as TerritoryCard;
    const se = getCard('territorio_igreja_se') as TerritoryCard;
    expect(evaluateMemoryPersistence(enraizada, fonte, se)).toBe('stays');
  });

  it('lets a card that declares one override its state', () => {
    const excecao = getMemoryById('memory_festa_o_que_ficou_de_fora')!;

    // Oral, so contextual by rule — and it shares City with the Escadaria,
    // which would carry it. It declares otherwise, and the declaration wins.
    const fonte = getCard('territorio_fonte_ribeirao') as TerritoryCard;
    const escadaria = getCard('territorio_escadaria_reviver') as TerritoryCard;
    expect(excecao.affinities).toContain('City');
    expect(evaluateMemoryPersistence(excecao, fonte, escadaria)).toBe('stays');
  });

  it('keeps exceptions rare, so the states keep meaning something', () => {
    const declared = memories.filter((m: MemoryCard) => m.traversalBehavior);
    expect(declared.map((m: MemoryCard) => m.id)).toEqual([
      'memory_festa_o_que_ficou_de_fora',
    ]);
  });
});
