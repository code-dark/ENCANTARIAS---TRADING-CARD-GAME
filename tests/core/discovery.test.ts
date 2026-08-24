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
function setup(pool: string[] = []): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const fonte = createInstance(FONTE, 'p1');
  p1.territories = [fonte];
  p1.activeTerritoryId = fonte.instanceId;

  const t2 = createInstance(IGREJA, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState([p1, p2], pool.map((id) => createInstance(id, 'world')));
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

    expect(s.memoryPool).toHaveLength(0);
    expect(s.players[0].inPlay).toHaveLength(2); // the listener plus the memory
    expect(nameOf(s, 1)).toBe('Oral Account of the Serpent');
    expect(s.log[s.log.length - 1].message).toContain('listens in Fonte do Ribeirão');
  });

  it('roots the discovered Memory in the Território that gave it up', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Acao');
    s = expectOk(applyAction(s, { type: 'Explore', playerId: 'p1' }));

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
    expect(r.error).toBe('You need a Personagem manifested in Fonte do Ribeirão to listen.');
  });

  it('will not surface a Memory beyond the listener’s Escuta', () => {
    // The Wanderer hears at 2; this account asks for 3.
    let s = withCharacter(setup([ORAL]), WANDERER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBe('The Wanderer hears nothing further in Fonte do Ribeirão.');
    expect(r.state.memoryPool).toHaveLength(1); // still out there
  });

  it('will not surface a Memory that does not belong to this place', () => {
    // Media memory is Circulation/City/Commerce; Fonte carries none of those.
    let s = withCharacter(setup([MEDIA]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('hears nothing further');
  });

  it('refuses a dead end before it costs anything', () => {
    let s = withCharacter(setup([]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('hears nothing further');
    expect(r.state.players[0].inPlay[0].exhausted).toBe(false); // not spent
  });

  it('is unavailable outside the Action phase', () => {
    let s = withCharacter(setup([ORAL]), LISTENER);
    s = advanceTo(s, 'Travessia');
    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toBe('Exploring the Território is not available during Travessia.');
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
    expect(nameOf(s, 1)).toBe('Roots: The Eternal Spring');
    expect(s.log[s.log.length - 1].message).toContain('uncovers Roots: The Eternal Spring');
  });

  it('that Memory cannot be reached by listening, however good the ear', () => {
    // The Listener has the highest Escuta in the game and still cannot hear it:
    // it is opened by manifestation, not by attention.
    let s = withCharacter(setup([ROOTS]), LISTENER);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, { type: 'Explore', playerId: 'p1' });
    expect(r.error).toContain('hears nothing further');
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
