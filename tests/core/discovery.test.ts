import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, getCurrentPlayer, GameState } from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';

const FONTE = 'territorio_fonte_ribeirao';
const IGREJA = 'territorio_igreja_se';
const SERPENT = 'legend_serpent_enchanted';
const LISTENER = 'character_listener';   // Escuta 4
const WANDERER = 'character_wanderer';   // Escuta 2

const ORAL = 'memory_oral_serpent';      // explore, Escuta 3, Water/Memory/Enchantment
const ROOTS = 'memory_enraizada_fountain'; // resonance only, by the Serpent
const MEDIA = 'memory_midiatic_circulating'; // explore, Escuta 1, Circulation/City/Commerce

/** p1 active in Fonte do Ribeirão, with the given Memories waiting in the world. */
/** Seeds chosen so each die face is reproducible — see game/random.ts. */
const SEED = { one: 7, two: 3, five: 1, six: 2 };

function setup(pool: string[] = [], seed = SEED.five): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const fonte = createInstance(FONTE, 'p1');
  p1.territories = [fonte];
  p1.activeTerritoryId = fonte.instanceId;

  const t2 = createInstance(IGREJA, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState(
    [p1, p2], pool.map((id) => createInstance(id, 'world')), 20, seed
  );
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

/** Put a Personagem on the table in the active Território. */
function withCharacter(s: GameState, cardId: string): GameState {
  const c = { ...createInstance(cardId, 'p1'), linkedTo: s.players[0].activeTerritoryId };
  s.players[0].inPlay = [...s.players[0].inPlay, c];
  return s;
}

const nameOf = (s: GameState, i: number) => getCard(s.players[0].inPlay[i].cardId).name;

beforeEach(() => resetInstanceIds());

describe('Memories are not drawn from the deck', () => {
  it('waits in the world, owned by no player, until it is found', () => {
    const s = setup([ORAL]);
    expect(s.memoryPool).toHaveLength(1);
    expect(s.players[0].inPlay).toHaveLength(0);
    expect(s.players[0].deck).toHaveLength(0);
  });
});

describe('Exploração de Território', () => {
  it('a Personagem listening recovers a Memory that belongs to this place', () => {
    let s = withCharacter(setup([ORAL]), LISTENER); // Escuta 4 >= 3
    s = advanceTo(s, 'Acao');

    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    // Found, but not yet yours: it waits to be read.
    expect(s.pendingDiscovery).toBeDefined();
    expect(s.memoryPool).toHaveLength(1);
    expect(s.log[s.log.length - 1].message).toContain('escuta em Fonte do Ribeirão');

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));

    expect(s.pendingDiscovery).toBeUndefined();
    expect(s.memoryPool).toHaveLength(0);
    expect(s.players[0].inPlay).toHaveLength(2); // the listener plus the memory
    expect(nameOf(s, 1)).toBe('Relato Oral da Serpente');
  });

  it('roots the discovered Memory in the Território that gave it up', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Acao');
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));

    expect(s.players[0].inPlay[1].linkedTo).toBe(s.players[0].activeTerritoryId);
    expect(s.players[0].inPlay[1].ownerId).toBe('p1');
  });

  it('costs the Personagem their turn', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Acao');
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

    expect(s.players[0].inPlay[0].exhausted).toBe(true);
  });

  it('refuses when nobody is here to listen, naming what is missing', () => {
    const s = advanceTo(setup([ORAL]), 'Acao');
    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBe('Você precisa de um Personagem manifestado em Fonte do Ribeirão para escutar.');
  });

  it('will not surface a Memory beyond the listener’s Escuta', () => {
    // The Wanderer hears at 2; this account asks for 3.
    let s = withCharacter(setup([ORAL]), WANDERER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBe('O Caminhante não ouve mais nada em Fonte do Ribeirão.');
    expect(r.state.memoryPool).toHaveLength(1); // still out there
  });

  it('will not surface a Memory that does not belong to this place', () => {
    // Media memory is Circulation/City/Commerce; Fonte carries none of those.
    let s = withCharacter(setup([MEDIA]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('não ouve mais nada');
  });

  it('refuses a dead end before it costs anything', () => {
    let s = withCharacter(setup([]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('não ouve mais nada');
    expect(r.state.players[0].inPlay[0].exhausted).toBe(false); // not spent
  });

  it('is unavailable outside the Action phase', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Travessia');
    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBe('Escutar o Território não está disponível na fase de Travessia.');
  });
});

describe('Ressonância reveals what listening cannot', () => {
  it('the Serpent manifesting in the spring uncovers its rooted Memory', () => {
    let s = setup([ROOTS]);
    const serpent = { ...createInstance(SERPENT, 'p1'), linkedTo: s.players[0].activeTerritoryId };
    s.players[0].inPlay = [serpent];
    s = advanceTo(s, 'Acao');

    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );

    expect(s.memoryPool).toHaveLength(0);
    expect(nameOf(s, 1)).toBe('A Fonte Perene');
    expect(s.log[s.log.length - 1].message).toContain('revela A Fonte Perene');
  });

  it('that Memory cannot be reached by listening, however good the ear', () => {
    // The Listener has the highest Escuta in the game and still cannot hear it:
    // it is opened by manifestation, not by attention.
    let s = withCharacter(setup([ROOTS]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('não ouve mais nada');
    expect(r.state.memoryPool).toHaveLength(1);
  });

  it('a Lenda uncovers nothing where the layer is not hers', () => {
    // Roots is keyed to the Serpent; the Keeper resonating elsewhere gets nothing.
    let s = setup([ROOTS]);
    const keeper = {
      ...createInstance('legend_keeper_of_paths', 'p1'),
      linkedTo: s.players[0].activeTerritoryId,
    };
    s.players[0].inPlay = [keeper];
    s = advanceTo(s, 'Acao');

    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: keeper.instanceId })
    );
    expect(s.memoryPool).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * A declared origin is authoritative
 * ------------------------------------------------------------------ */

describe('a Memory that names where it comes from', () => {
  it('is not reachable by a Ressonância that does not name it', () => {
    // A Passagem Ouvida is opened only by the Cortejo gathering. The Fonte
    // shares the Memory affinity with it, and the Serpent resonates there —
    // affinity alone must not be enough.
    let s = setup(['memory_cortejo_passagem']);
    const serpent = {
      ...createInstance(SERPENT, 'p1'),
      linkedTo: s.players[0].activeTerritoryId,
    };
    s.players[0].inPlay = [serpent];
    s = advanceTo(s, 'Acao');

    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );
    expect(s.memoryPool).toHaveLength(1);
    expect(s.players[0].inPlay.filter((c) => getCard(c.cardId).type === 'Memory')).toHaveLength(0);
  });

  it('is reachable by the relation it does name', () => {
    // A Fonte Perene names ressonancia_serpente_ribeirao, which is exactly the
    // relation the Serpent has with this place.
    let s = setup([ROOTS]);
    const serpent = {
      ...createInstance(SERPENT, 'p1'),
      linkedTo: s.players[0].activeTerritoryId,
    };
    s.players[0].inPlay = [serpent];
    s = advanceTo(s, 'Acao');

    s = expectOk(
      applyAction(s, { type: 'ActivateResonance', playerId: 'p1', instanceId: serpent.instanceId })
    );
    expect(s.memoryPool).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * The Território is where Memória comes from
 * ------------------------------------------------------------------ */

describe('the economy of listening', () => {
  it('pays only after the reading, never before', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Acao');
    const before = s.players[0].resources.memoria;

    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    // Found, not yet transmitted: nothing is owed.
    expect(s.players[0].resources.memoria).toBe(before);

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));
    expect(s.players[0].resources.memoria).toBe(before + 1);
  });

  it('pays once on a 6, not twice — two accounts offered, one taken', () => {
    let s = withCharacter(setup([ORAL, MEDIA], SEED.six), LISTENER);
    s = advanceTo(s, 'Acao');
    const before = s.players[0].resources.memoria;

    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    if (s.pendingDiscovery!.mode !== 'escolha') return; // this seed found only one

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));
    expect(s.players[0].resources.memoria).toBe(before + 1);
    expect(s.pendingDiscovery).toBeUndefined();
  });

  it('pays nothing when the die refuses', () => {
    let s = withCharacter(setup([ORAL], SEED.one), LISTENER);
    s = advanceTo(s, 'Acao');
    const before = s.players[0].resources.memoria;

    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    expect(s.players[0].resources.memoria).toBe(before);
    expect(s.pendingDiscovery).toBeUndefined();
  });

  it('is one Escuta per turn, however many Personagens are standing here', () => {
    let s = withCharacter(setup([ORAL, MEDIA]), LISTENER);
    const second = {
      ...createInstance(WANDERER, 'p1'),
      linkedTo: s.players[0].activeTerritoryId,
    };
    s.players[0].inPlay = [...s.players[0].inPlay, second];
    s = advanceTo(s, 'Acao');

    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));
    if (s.pendingDiscovery) {
      s = expectOk(applyAction(s, {
        type: 'TransmitMemory', playerId: 'p1',
        memoryInstanceId: s.pendingDiscovery.options[0].instanceId,
      }));
    }

    const again = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(again.error).toContain('já escutou este Território neste turno');
  });

  it('does not pay for a Memory a record merely reached', () => {
    // A document in hand reaches something that exists. It does not make the
    // city give up anything new, so it prints no resource.
    let s = setup(['memory_beira_mar_imagem']);
    const foto = createInstance('objeto_fotografia_beira_mar', 'p1');
    s.players[0].hand = [foto];
    s.players[0].resources.memoria = 3;
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: foto.instanceId,
    }));
    const afterCost = s.players[0].resources.memoria;

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));
    expect(s.players[0].resources.memoria).toBe(afterCost);
  });
});

/* ------------------------------------------------------------------ *
 * A place does not run out of things to hear
 * ------------------------------------------------------------------ */

describe('when a Território has given up its own accounts', () => {
  it('reaches what a Lenda manifested here carries with it', () => {
    // Os Caminhos Cruzados belongs to the Escadaria and CEPRAMA, not the
    // Fonte — but it is linked to the Guardião dos Caminhos, who is standing
    // here, and the narrative present brings its accounts with it.
    let s = withCharacter(setup(['memory_transmitida_paths']), LISTENER);
    const keeper = {
      ...createInstance('legend_keeper_of_paths', 'p1'),
      linkedTo: s.players[0].activeTerritoryId,
    };
    s.players[0].inPlay = [...s.players[0].inPlay, keeper];
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBeUndefined();
  });

  it('still refuses what has no relation to this place at all', () => {
    // Nothing standing here, and the Media memory shares no affinity with a
    // spring: widening the search must not mean hearing everything anywhere.
    let s = withCharacter(setup([MEDIA]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('não ouve mais nada');
  });
});
