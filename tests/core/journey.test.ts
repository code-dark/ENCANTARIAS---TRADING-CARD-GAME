import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState, getCurrentPlayer, GameState, Player,
} from '../../src/core/game/gameState';
import { applyAction, emptyPlayer, verifyJourneys } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds } from '../../src/core/cards/cardRegistry';
import { evaluateJourney, measure, isMet } from '../../src/core/mechanics/journey';
import { journeys, getJourneyById } from '../../src/core/cards/data/journeys';

const GAVIAO = 'territorio_cemiterio_gaviao';
const FONTE = 'territorio_fonte_ribeirao';
const ESCADARIA = 'territorio_escadaria_reviver';
const CARRUAGEM = 'legend_carruagem_ana_jansen';
const MULA = 'legend_mula_carruagem_ana_jansen';
const SERPENTE = 'legend_serpent_enchanted';
const CAIXA = 'objeto_caixa_recordacoes';
const ORAL_SERPENTE = 'memory_oral_serpent';
const PASSAGEM = 'memory_cortejo_passagem';
const GAVIAO_PORTAO = 'memory_gaviao_portao';
const GAVIAO_OUVIU = 'memory_gaviao_quem_ouviu';

beforeEach(() => resetInstanceIds());

function setup(journeyId: string, territoryIds = [FONTE], pool: string[] = []): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  p1.territories = territoryIds.map((t) => createInstance(t, 'p1'));
  p1.activeTerritoryId = p1.territories[0].instanceId;
  p1.journeyProgress = { journeyId, completedObjectiveIds: [], completed: false };

  const p2 = emptyPlayer('p2', 'Player Two');
  const t2 = createInstance(ESCADARIA, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;
  p2.journeyProgress = {
    journeyId: 'journey_caminhante_cidade', completedObjectiveIds: [], completed: false,
  };

  return createGameState([p1, p2], pool.map((id) => createInstance(id, 'world')));
}

function place(state: GameState, playerId: string, cardId: string, linkedTo?: string) {
  const player = state.players.find((p) => p.id === playerId)!;
  player.inPlay = [
    ...player.inPlay,
    { ...createInstance(cardId, playerId), linkedTo: linkedTo ?? player.activeTerritoryId },
  ];
  return player.inPlay[player.inPlay.length - 1];
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

/**
 * Pass until it is this player's *next* turn, at the given phase. Always moves
 * at least one phase, so calling it from that same phase does not return the
 * turn you are already in.
 */
function advanceToTurnOf(state: GameState, playerId: string, phase: string): GameState {
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

const logged = (s: GameState, text: string) => s.log.some((e) => e.message.includes(text));

/* ------------------------------------------------------------------ *
 * Reading a requirement
 * ------------------------------------------------------------------ */

describe('measuring a Jornada requirement', () => {
  it('counts Memórias on the table', () => {
    const s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);
    expect(measure(s.players[0], { kind: 'memoriasEmJogo', count: 3 }))
      .toEqual({ current: 1, needed: 3 });
  });

  it('counts a Memória by its state', () => {
    const s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);   // Oral
    place(s, 'p1', GAVIAO_PORTAO);   // Territorial
    expect(isMet(s.players[0], { kind: 'memoriasEmJogo', count: 1, state: 'Oral' })).toBe(true);
    expect(isMet(s.players[0], { kind: 'memoriasEmJogo', count: 2, state: 'Oral' })).toBe(false);
  });

  it('counts a Memória by tag', () => {
    const s = setup('journey_cortejo');
    place(s, 'p1', PASSAGEM);
    expect(isMet(s.players[0], { kind: 'memoriasEmJogo', count: 1, tag: 'aparicao' })).toBe(true);
    expect(isMet(s.players[0], { kind: 'memoriasEmJogo', count: 1, tag: 'oficio' })).toBe(false);
  });

  it('counts a Memória kept in an object: preserving it is still holding it', () => {
    const s = setup('journey_guardia_memoria');
    const caixa = place(s, 'p1', CAIXA);
    place(s, 'p1', ORAL_SERPENTE, caixa.instanceId);
    expect(isMet(s.players[0], { kind: 'memoriasEmJogo', count: 1 })).toBe(true);
  });

  it('counts the Território the player is standing in as visited', () => {
    const s = setup('journey_caminhante_cidade', [FONTE, ESCADARIA]);
    expect(measure(s.players[0], { kind: 'territoriosVisitados', count: 2 }))
      .toEqual({ current: 1, needed: 2 });
  });

  it('reads a resource straight from the player', () => {
    const s = setup('journey_guardia_memoria');
    s.players[0].resources.vinculo = 3;
    expect(isMet(s.players[0], { kind: 'recurso', recurso: 'vinculo', minimo: 3 })).toBe(true);
    expect(isMet(s.players[0], { kind: 'recurso', recurso: 'vinculo', minimo: 4 })).toBe(false);
  });

  it('finds a Lenda by affinity, and ignores one without it', () => {
    const s = setup('journey_cortejo');
    place(s, 'p1', SERPENTE); // Water/Underground, no Movement
    expect(isMet(s.players[0], { kind: 'lendaComAfinidade', afinidade: 'Movement' })).toBe(false);
    place(s, 'p1', CARRUAGEM); // Movement
    expect(isMet(s.players[0], { kind: 'lendaComAfinidade', afinidade: 'Movement' })).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * What the match records
 * ------------------------------------------------------------------ */

describe('what the match records as done', () => {
  it('records each Território travessed, once', () => {
    let s = setup('journey_caminhante_cidade', [FONTE, ESCADARIA]);
    s.players[0].resources.memoria = 10;
    const escadaria = s.players[0].territories[1].instanceId;
    const fonte = s.players[0].territories[0].instanceId;

    s = advanceTo(s, 'Travessia');
    s = applyAction(s, { type: 'Traverse', playerId: 'p1', territoryInstanceId: escadaria }).state;
    expect(s.players[0].accomplishments.territoriesVisited).toEqual([ESCADARIA]);

    // Going back names a second place; coming here a third time would not.
    s = advanceToTurnOf(s, 'p1', 'Travessia');
    const back = applyAction(s, {
      type: 'Traverse', playerId: 'p1', territoryInstanceId: fonte,
    });
    expect(back.error).toBeUndefined();
    s = back.state;
    expect(s.players[0].accomplishments.territoriesVisited).toEqual([ESCADARIA, FONTE]);
    expect(isMet(s.players[0], { kind: 'territoriosVisitados', count: 2 })).toBe(true);
  });

  it('records a Ressonância once, however often it is activated', () => {
    let s = setup('journey_ponte_mundos');
    const serpente = place(s, 'p1', SERPENTE);

    s = advanceTo(s, 'Acao');
    s = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: serpente.instanceId,
    }).state;
    expect(s.players[0].accomplishments.resonancesActivated).toEqual([`${SERPENTE}@${FONTE}`]);

    // Same Lenda, same place, a turn later: one relation, not two.
    s = advanceToTurnOf(s, 'p1', 'Acao');
    s = applyAction(s, {
      type: 'ActivateResonance', playerId: 'p1', instanceId: serpente.instanceId,
    }).state;
    expect(s.players[0].accomplishments.resonancesActivated).toHaveLength(1);
  });

  it('records a gathering when the cortejo forms', () => {
    let s = setup('journey_cortejo', [GAVIAO], [PASSAGEM]);
    place(s, 'p1', CARRUAGEM);
    place(s, 'p1', MULA);

    s = advanceTo(s, 'Encerramento');
    expect(s.players[0].accomplishments.conjunctionsFormed)
      .toEqual(['ressonancia_cortejo_maldito']);
  });
});

/* ------------------------------------------------------------------ *
 * Verification and victory
 * ------------------------------------------------------------------ */

describe('the end-of-turn verification', () => {
  it('does not end the match while an objective is unmet', () => {
    let s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);
    s.players[0].resources.vinculo = 3;

    s = advanceTo(s, 'Encerramento');
    expect(s.isEnded).toBe(false);
    expect(s.players[0].journeyProgress!.completedObjectiveIds).toEqual(['gm_2', 'gm_3']);
  });

  it('ends the match the moment every requirement is met', () => {
    let s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);
    place(s, 'p1', GAVIAO_PORTAO);
    place(s, 'p1', GAVIAO_OUVIU);
    s.players[0].resources.vinculo = 3;

    s = advanceTo(s, 'Encerramento');
    expect(s.isEnded).toBe(true);
    expect(s.winnerId).toBe('p1');
    expect(s.players[0].journeyProgress!.completed).toBe(true);
    expect(logged(s, 'completa a Jornada Guardiã da Memória')).toBe(true);
  });

  it('names each objective in the log the turn it is first met, and not again', () => {
    let s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);

    s = advanceTo(s, 'Encerramento');
    expect(s.log.filter((e) => e.message.includes('Tenha 1 Memória Oral em jogo'))).toHaveLength(1);

    s = advanceToTurnOf(s, 'p1', 'Encerramento'); // p1 again, nothing new
    expect(s.log.filter((e) => e.message.includes('Tenha 1 Memória Oral em jogo'))).toHaveLength(1);
  });

  it('checks only the player whose turn is ending', () => {
    let s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);
    place(s, 'p1', GAVIAO_PORTAO);
    place(s, 'p1', GAVIAO_OUVIU);
    s.players[0].resources.vinculo = 3;

    // p2 passes through their own Encerramento first: p1's finished Jornada
    // is not verified on someone else's turn.
    s.currentPlayerIndex = 1;
    s = advanceTo(s, 'Encerramento');
    expect(s.isEnded).toBe(false);
  });

  it('takes an objective back when what it asked for is spent', () => {
    const s = setup('journey_guardia_memoria');
    s.players[0].resources.vinculo = 3;
    expect(evaluateJourney(s.players[0])!.objectives.find((o) => o.objective.id === 'gm_3')!.met)
      .toBe(true);

    s.players[0].resources.vinculo = 1;
    expect(evaluateJourney(s.players[0])!.objectives.find((o) => o.objective.id === 'gm_3')!.met)
      .toBe(false);
  });

  it('locks the match once won: no further action is accepted', () => {
    let s = setup('journey_guardia_memoria');
    place(s, 'p1', ORAL_SERPENTE);
    place(s, 'p1', GAVIAO_PORTAO);
    place(s, 'p1', GAVIAO_OUVIU);
    s.players[0].resources.vinculo = 3;
    s = advanceTo(s, 'Encerramento');

    const after = applyAction(s, { type: 'PassPhase', playerId: 'p1' });
    expect(after.error).toBeDefined();
    expect(after.state.winnerId).toBe('p1');
  });

  it('leaves a player without a Jornada untouched', () => {
    const s = setup('journey_guardia_memoria');
    delete s.players[0].journeyProgress;
    expect(verifyJourneys(s).isEnded).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * The Jornadas themselves
 * ------------------------------------------------------------------ */

describe('the Jornadas as written', () => {
  it('gives every Jornada objectives with distinct ids', () => {
    for (const journey of journeys) {
      expect(journey.objectives.length).toBeGreaterThan(0);
      const ids = journey.objectives.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('asks nothing that the engine cannot yet record', () => {
    // A Jornada requiring Transformações would be unwinnable: nothing in the
    // turn resolver transforms a card yet. Guard against writing one.
    const kinds = journeys.flatMap((j) => j.objectives.map((o) => o.requirement.kind));
    expect(kinds).not.toContain('transformacoes');
  });

  it('starts every player with nothing achieved', () => {
    const journey = getJourneyById('journey_cortejo')!;
    const fresh: Player = emptyPlayer('p9', 'Fresh');
    fresh.journeyProgress = {
      journeyId: journey.id, completedObjectiveIds: [], completed: false,
    };
    const status = evaluateJourney(fresh)!;
    expect(status.completed).toBe(false);
    expect(status.objectives.every((o) => !o.met)).toBe(true);
  });
});
