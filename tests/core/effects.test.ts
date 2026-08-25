import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, getCurrentPlayer, GameState } from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds } from '../../src/core/cards/cardRegistry';
import { executeEffects, executeEffect } from '../../src/core/effects/executor';
import { GameEffect } from '../../src/core/effects/types';
import { effectiveTraversalCost, traversalCost } from '../../src/core/mechanics/traversal';
import { getCard } from '../../src/core/cards/cardRegistry';

/** Memórias on the table — the Acontecimento that surfaced them is there too. */
const memoriesOf = (s: GameState) =>
  s.players[0].inPlay.filter((c) => getCard(c.cardId).type === 'Memory');
import { TerritoryCard } from '../../src/core/cards/types';

const FONTE = 'territorio_fonte_ribeirao';
const ESCADARIA = 'territorio_escadaria_reviver';
const SE = 'territorio_igreja_se';
const GAVIAO = 'territorio_cemiterio_gaviao';
const CEPRAMA = 'territorio_ceprama';
const SERPENTE = 'legend_serpent_enchanted';
const SINOS = 'legend_lady_of_bells';
const CAMINHOS = 'legend_keeper_of_paths';
const CARRUAGEM = 'legend_carruagem_ana_jansen';
const MULA = 'legend_mula_carruagem_ana_jansen';
const OUVINTE = 'character_listener';
const FESTA = 'event_festival';
const ABRACO = 'event_institutional_embrace';
const FESTA_MEMORIA_A = 'memory_festa_versao_de_rua';
const FESTA_MEMORIA_B = 'memory_festa_o_que_ficou_de_fora';

beforeEach(() => resetInstanceIds());

/** Seed 1 makes the die read 5 — a find, without a choice. See game/random.ts. */
function setup(territoryIds = [FONTE], pool: string[] = [], seed = 1): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  p1.territories = territoryIds.map((t) => createInstance(t, 'p1'));
  p1.activeTerritoryId = p1.territories[0].instanceId;
  p1.resources.memoria = 10;

  const p2 = emptyPlayer('p2', 'Player Two');
  const t2 = createInstance(CEPRAMA, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState(
    [p1, p2], pool.map((id) => createInstance(id, 'world')), 20, seed
  );
}

/** Pass until this player's *next* turn reaches the phase. Always moves. */
function nextTurnOf(state: GameState, playerId: string, phase: string): GameState {
  let s = applyAction(state, {
    type: 'PassPhase', playerId: getCurrentPlayer(state).id,
  }).state;
  let guard = 0;
  while (!(s.phase === phase && getCurrentPlayer(s).id === playerId)) {
    s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
    if (++guard > 120) throw new Error(`never reached ${phase} for ${playerId}`);
  }
  return s;
}

function place(state: GameState, cardId: string, exhausted = false) {
  const player = state.players[0];
  const instance = {
    ...createInstance(cardId, 'p1'),
    linkedTo: player.activeTerritoryId,
    exhausted,
  };
  player.inPlay = [...player.inPlay, instance];
  return instance;
}

function hold(state: GameState, cardId: string) {
  const player = state.players[0];
  const instance = createInstance(cardId, 'p1');
  player.hand = [...player.hand, instance];
  return instance;
}

function advanceTo(state: GameState, phase: string): GameState {
  let s = state;
  let guard = 0;
  while (s.phase !== phase) {
    s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
    if (++guard > 60) throw new Error(`never reached ${phase}`);
  }
  return s;
}

const logged = (s: GameState, text: string) => s.log.some((e) => e.message.includes(text));

const ctx = (state: GameState) => ({
  playerId: 'p1',
  sourceName: 'Teste',
  territoryInstanceId: state.players[0].activeTerritoryId,
});

/* ------------------------------------------------------------------ *
 * The executor itself
 * ------------------------------------------------------------------ */

describe('the effect executor', () => {
  it('grants a resource and says so', () => {
    const s = setup();
    const after = executeEffect(
      s, { kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 2 }, ctx(s)
    );
    expect(after.players[0].resources.vinculo).toBe(2);
    expect(logged(after, '+2 de Vínculo')).toBe(true);
  });

  it('draws cards without granting the turn\'s Memória', () => {
    const s = setup();
    s.players[0].deck = [createInstance(SERPENTE, 'p1'), createInstance(OUVINTE, 'p1')];
    const before = s.players[0].resources.memoria;

    const after = executeEffect(s, { kind: 'comprarCarta', quantidade: 2 }, ctx(s));
    expect(after.players[0].hand).toHaveLength(2);
    expect(after.players[0].deck).toHaveLength(0);
    expect(after.players[0].resources.memoria).toBe(before);
  });

  it('says so instead of failing when the deck is empty', () => {
    const s = setup();
    const after = executeEffect(s, { kind: 'comprarCarta', quantidade: 1 }, ctx(s));
    expect(after.players[0].hand).toHaveLength(0);
    expect(logged(after, 'o deck acabou')).toBe(true);
  });

  it('surfaces what the world holds, and gains nothing until it is read', () => {
    const s = setup([FONTE], [FESTA_MEMORIA_A, FESTA_MEMORIA_B]);
    const after = executeEffect(
      s,
      { kind: 'revelarMemoria', fonte: 'acontecimento_tempo_de_festa', limite: 2 },
      ctx(s)
    );

    // Still in the world, and nothing on the table: the rule is about the
    // Memory, not about which action turned it up.
    expect(after.memoryPool).toHaveLength(2);
    expect(after.players[0].inPlay).toHaveLength(0);
    expect(after.pendingDiscovery!.mode).toBe('leitura');
    expect(after.pendingDiscovery!.options).toHaveLength(2);
  });

  it('respects the limit, leaving the rest unmentioned', () => {
    const s = setup([FONTE], [FESTA_MEMORIA_A, FESTA_MEMORIA_B]);
    const after = executeEffect(
      s, { kind: 'revelarMemoria', fonte: 'acontecimento_tempo_de_festa', limite: 1 }, ctx(s)
    );
    expect(after.pendingDiscovery!.options).toHaveLength(1);
    expect(after.memoryPool).toHaveLength(2);
  });

  it('adds to what is already waiting instead of losing it', () => {
    const s = setup([FONTE], [FESTA_MEMORIA_A, FESTA_MEMORIA_B]);
    const once = executeEffect(
      s, { kind: 'revelarMemoria', fonte: 'acontecimento_tempo_de_festa', limite: 1 }, ctx(s)
    );
    const twice = executeEffect(
      once,
      { kind: 'revelarMemoria', fonte: 'acontecimento_tempo_de_festa', limite: 2 },
      ctx(once)
    );
    expect(twice.pendingDiscovery!.options.length).toBeGreaterThan(1);
  });

  it('never invents a Memory when nothing answers the origin', () => {
    const s = setup();
    const after = executeEffect(
      s, { kind: 'revelarMemoria', fonte: 'acontecimento_inexistente' }, ctx(s)
    );
    expect(after.players[0].inPlay).toHaveLength(0);
    expect(logged(after, 'já não está por descobrir')).toBe(true);
  });

  it('wakes only the exhausted Personagens standing here', () => {
    const s = setup();
    const listener = place(s, OUVINTE, true);
    const legend = place(s, SERPENTE, true);

    const after = executeEffect(s, { kind: 'despertarPersonagens' }, ctx(s));
    const back = after.players[0].inPlay;
    expect(back.find((c) => c.instanceId === listener.instanceId)!.exhausted).toBe(false);
    expect(back.find((c) => c.instanceId === legend.instanceId)!.exhausted).toBe(true);
  });

  it('says so when there is nobody to wake', () => {
    const s = setup();
    const after = executeEffect(s, { kind: 'despertarPersonagens' }, ctx(s));
    expect(logged(after, 'não há quem despertar')).toBe(true);
  });

  it('transforms a card here and records it as done', () => {
    const s = setup();
    const legend = place(s, SERPENTE);

    const after = executeEffect(
      s, { kind: 'transformar', para: 'Institutional', alvoTipo: 'Legend' }, ctx(s)
    );
    const changed = after.players[0].inPlay.find((c) => c.instanceId === legend.instanceId)!;
    expect(changed.transformationState).toBe('Institutional');
    expect(after.players[0].accomplishments.transformations).toEqual([legend.instanceId]);
  });

  it('does not transform what the filter excludes', () => {
    const s = setup();
    place(s, OUVINTE);
    const after = executeEffect(
      s, { kind: 'transformar', para: 'Popularized', alvoTipo: 'Legend' }, ctx(s)
    );
    expect(after.players[0].inPlay[0].transformationState).toBeUndefined();
    expect(logged(after, 'nada aqui para transformar')).toBe(true);
  });

  it('does not transform a card already in that state', () => {
    const s = setup();
    const legend = place(s, SERPENTE);
    s.players[0].inPlay = s.players[0].inPlay.map((c) => ({
      ...c, transformationState: 'Institutional' as const,
    }));

    const after = executeEffect(
      s, { kind: 'transformar', para: 'Institutional', alvoTipo: 'Legend' }, ctx(s)
    );
    expect(after.players[0].accomplishments.transformations).toHaveLength(0);
    expect(logged(after, 'nada aqui para transformar')).toBe(true);
    expect(legend.instanceId).toBeDefined();
  });

  it('runs a list in order', () => {
    const s = setup();
    const effects: GameEffect[] = [
      { kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 },
      { kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 3 },
    ];
    const after = executeEffects(s, effects, ctx(s));
    expect(after.players[0].resources.vinculo).toBe(1);
    expect(after.players[0].resources.circulacao).toBe(3);
  });

  it('treats an absent effect list as nothing happening', () => {
    const s = setup();
    expect(executeEffects(s, undefined, ctx(s))).toBe(s);
  });
});

/* ------------------------------------------------------------------ *
 * Free traversal
 * ------------------------------------------------------------------ */

describe('a Travessia opened by a card', () => {
  it('costs nothing while the flag stands', () => {
    const from = getCard(FONTE) as TerritoryCard;
    const to = getCard(SE) as TerritoryCard;

    expect(traversalCost(from, to)).toBeGreaterThan(0);
    expect(effectiveTraversalCost(from, to, { travessiaLivre: true })).toBe(0);
    expect(effectiveTraversalCost(from, to, { travessiaLivre: false }))
      .toBe(traversalCost(from, to));
  });

  it('is spent by crossing, not by the turn ending', () => {
    let s = setup([ESCADARIA, SE]);
    s.players[0].resources.memoria = 0; // nothing to pay with
    place(s, CAMINHOS); // Passage: opens the way at the Escadaria

    s = advanceTo(s, 'Acao');
    const legend = s.players[0].inPlay[0];
    s = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: legend.instanceId,
    }).state;
    expect(s.turnFlags.travessiaLivre).toBe(true);

    // Next turn of p1: the crossing it opened is still standing this turn only.
    s = advanceTo(s, 'Encerramento');
    s = applyAction(s, { type: 'PassPhase', playerId: 'p1' }).state;
    expect(s.turnFlags.travessiaLivre).toBe(false);
  });

  it('lets a broke player cross, and clears afterwards', () => {
    let s = setup([ESCADARIA, SE]);
    s.players[0].resources.memoria = 0;
    place(s, CAMINHOS);

    s = advanceTo(s, 'Acao');
    s = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: s.players[0].inPlay[0].instanceId,
    }).state;

    // Back round to p1's Travessia phase.
    s = nextTurnOf(s, 'p1', 'Travessia');
    expect(s.turnFlags.travessiaLivre).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Cards that now do what they say
 * ------------------------------------------------------------------ */

describe('cards whose text the engine executes', () => {
  it('Tempo de Festa brings out what only an occasion brings out', () => {
    let s = setup([FONTE], [FESTA_MEMORIA_A, FESTA_MEMORIA_B]);
    hold(s, FESTA);

    s = advanceTo(s, 'Manifestacao');
    const result = applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: s.players[0].hand[0].instanceId,
    });
    expect(result.error).toBeUndefined();
    s = result.state;

    expect(s.players[0].resources.circulacao).toBe(1);
    expect(logged(s, 'Falta ler em voz alta')).toBe(true);

    // Reading is a queue here: each one counts only once it has been read.
    expect(s.pendingDiscovery!.options).toHaveLength(2);
    s = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }).state;
    expect(s.pendingDiscovery!.options).toHaveLength(1);
    expect(memoriesOf(s)).toHaveLength(1);

    s = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }).state;
    expect(s.pendingDiscovery).toBeUndefined();
    expect(s.memoryPool).toHaveLength(0);
    expect(memoriesOf(s)).toHaveLength(2);
  });

  it('lets a Memória surfaced outside the Ação phase be read at once', () => {
    // Tempo de Festa is played in Manifestação, where TransmitMemory is not a
    // phase action. Reading aloud resolves an interrupted moment instead.
    let s = setup([FONTE], [FESTA_MEMORIA_A]);
    hold(s, FESTA);
    s = advanceTo(s, 'Manifestacao');
    s = applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: s.players[0].hand[0].instanceId,
    }).state;

    expect(s.phase).toBe('Manifestacao');
    const read = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    });
    expect(read.error).toBeUndefined();
    expect(memoriesOf(read.state)).toHaveLength(1);
  });

  it('refuses everything else until what was found has been read', () => {
    let s = setup([FONTE], [FESTA_MEMORIA_A]);
    hold(s, FESTA);
    s = advanceTo(s, 'Manifestacao');
    s = applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: s.players[0].hand[0].instanceId,
    }).state;

    const blocked = applyAction(s, { type: 'PassPhase', playerId: 'p1' });
    expect(blocked.error).toContain('Leia a Memória');
  });

  it('Abraço Institucional puts a Lenda under guard', () => {
    let s = setup([SE]);
    const legend = place(s, SINOS);
    hold(s, ABRACO);

    s = advanceTo(s, 'Manifestacao');
    s = applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: s.players[0].hand[0].instanceId,
    }).state;

    const changed = s.players[0].inPlay.find((c) => c.instanceId === legend.instanceId)!;
    expect(changed.transformationState).toBe('Institutional');
    expect(s.players[0].resources.vinculo).toBe(1);
  });

  it('the Guardiã da Fonte lets a spent Personagem listen again', () => {
    let s = setup([FONTE]);
    const listener = place(s, OUVINTE, true);
    const legend = place(s, SERPENTE);

    s = advanceTo(s, 'Acao');
    s = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: legend.instanceId,
    }).state;

    const back = s.players[0].inPlay.find((c) => c.instanceId === listener.instanceId)!;
    expect(back.exhausted).toBe(false);
  });

  it('the Cortejo transforms what it gathers', () => {
    let s = setup([GAVIAO], ['memory_cortejo_passagem']);
    place(s, CARRUAGEM);
    place(s, MULA);

    s = advanceTo(s, 'Encerramento');

    const transformed = s.players[0].inPlay.filter(
      (c) => c.transformationState === 'Popularized'
    );
    expect(transformed).toHaveLength(1);
    expect(s.players[0].resources.circulacao).toBe(1);
    expect(s.players[0].accomplishments.transformations).toHaveLength(1);
  });

  it('leaves Esquecimento inert on purpose, rather than faking a trigger', async () => {
    const { getEventById } = await import('../../src/core/cards/data/events');
    expect(getEventById('event_forgetting')!.effects).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * Trigger and condition as data
 * ------------------------------------------------------------------ */

describe('rules a card declares for itself', () => {
  it('fires when the moment it named arrives', () => {
    // The Serpente reacts to a Memory being read aloud here. Nothing in the
    // resolver knows that; the card said so.
    let s = setup([FONTE], ['memory_oral_serpent']);
    place(s, SERPENTE);
    place(s, OUVINTE);

    s = advanceTo(s, 'Acao');
    s = applyAction(s, { type: 'Explore', playerId: 'p1' }).state;
    const before = s.players[0].resources.vinculo;

    s = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }).state;

    expect(s.players[0].resources.vinculo).toBe(before + 1);
    expect(logged(s, 'reconhece o que foi dito em voz alta')).toBe(true);
  });

  it('does not fire for a card standing somewhere else', () => {
    let s = setup([FONTE, ESCADARIA], ['memory_oral_serpent']);
    const serpent = place(s, SERPENTE);
    place(s, OUVINTE);
    // The Serpente stays rooted at a Território the player is not in.
    s.players[0].inPlay = s.players[0].inPlay.map((c) =>
      c.instanceId === serpent.instanceId
        ? { ...c, linkedTo: s.players[0].territories[1].instanceId }
        : c
    );

    s = advanceTo(s, 'Acao');
    s = applyAction(s, { type: 'Explore', playerId: 'p1' }).state;
    const before = s.players[0].resources.vinculo;
    s = applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }).state;

    expect(s.players[0].resources.vinculo).toBe(before);
  });

  it('holds back while its condition fails, and fires once it holds', () => {
    let s = setup([ESCADARIA]);
    place(s, CAMINHOS);

    // No festa here yet: the rule stays quiet at Encerramento.
    s = advanceTo(s, 'Encerramento');
    expect(s.players[0].resources.circulacao).toBe(0);

    // Mark the place, and the same rule now has something to answer to.
    s = executeEffect(s, { kind: 'marcarTerritorio', marca: 'festa' }, ctx(s));
    s = nextTurnOf(s, 'p1', 'Encerramento');
    expect(s.players[0].resources.circulacao).toBe(1);
    expect(logged(s, 'mais passagem do que de costume')).toBe(true);
  });

  it('leaves a mark on the place that outlives the turn', () => {
    let s = setup([FONTE]);
    s = executeEffect(s, { kind: 'marcarTerritorio', marca: 'festa' }, ctx(s));
    expect(s.players[0].territories[0].counters.festa).toBe(1);

    s = nextTurnOf(s, 'p1', 'Despertar');
    expect(s.players[0].territories[0].counters.festa).toBe(1);
  });
});
