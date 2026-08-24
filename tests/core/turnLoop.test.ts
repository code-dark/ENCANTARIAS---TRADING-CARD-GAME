import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  getCurrentPlayer,
  activeTerritoryOf,
  GameState,
} from '../../src/core/game/gameState';
import { applyAction } from '../../src/core/rules/turnResolver';
import { emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds } from '../../src/core/cards/cardRegistry';
import { GameAction } from '../../src/core/game/actions';

const FONTE = 'territorio_fonte_ribeirao';
const IGREJA = 'territorio_igreja_se';
const SERPENT = 'legend_serpent_enchanted';
const ROOTS = 'memory_enraizada_fountain';   // memoryState: Roots  -> stays
const SHARED = 'memory_transmitida_paths';   // memoryState: Shared -> travels

/** A two-player game with p1 active in Fonte do Ribeirão. */
function setup(): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const fonte = createInstance(FONTE, 'p1');
  p1.territories = [fonte];
  p1.activeTerritoryId = fonte.instanceId;

  const fonte2 = createInstance(FONTE, 'p2');
  p2.territories = [fonte2];
  p2.activeTerritoryId = fonte2.instanceId;

  return createGameState([p1, p2]);
}

/** Drive the phase clock forward to a named phase. */
function advanceTo(state: GameState, phase: string): GameState {
  let s = state;
  let guard = 0;
  while (s.phase !== phase) {
    const r = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id });
    s = r.state;
    if (++guard > 20) throw new Error(`never reached ${phase}`);
  }
  return s;
}

function expectOk(result: { state: GameState; error?: string }): GameState {
  expect(result.error).toBeUndefined();
  return result.state;
}

beforeEach(() => resetInstanceIds());

describe('phase clock', () => {
  it('runs the seven phases in order and then passes the turn', () => {
    let s = setup();
    expect(s.phase).toBe('Despertar');
    expect(getCurrentPlayer(s).id).toBe('p1');

    const seen: string[] = [s.phase];
    for (let i = 0; i < 6; i++) {
      s = expectOk(applyAction(s, { type: 'PassPhase', playerId: 'p1' }));
      seen.push(s.phase);
    }
    expect(seen).toEqual([
      'Despertar', 'Memoria', 'Travessia', 'Manifestacao', 'Acao',
      'Acontecimento', 'Encerramento',
    ]);

    // Passing out of the last phase hands play to the other player.
    s = expectOk(applyAction(s, { type: 'PassPhase', playerId: 'p1' }));
    expect(getCurrentPlayer(s).id).toBe('p2');
    expect(s.phase).toBe('Despertar');
    expect(s.turn).toBe(1); // turn advances only after everyone has played
  });

  it('increments the turn once play wraps back to the first player', () => {
    let s = setup();
    for (let i = 0; i < 14; i++) {
      s = expectOk(applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }));
    }
    expect(s.turn).toBe(2);
    expect(getCurrentPlayer(s).id).toBe('p1');
  });
});

describe('turn ownership', () => {
  it('refuses actions from the player who is not active, with a reason', () => {
    const s = setup();
    const r = applyAction(s, { type: 'PassPhase', playerId: 'p2' });
    expect(r.error).toBe('É a vez de Player One.');
    expect(r.state).toBe(s); // state untouched on rejection
  });
});

describe('Memory phase', () => {
  it('draws one card and yields the Memória that pays for manifestations', () => {
    let s = setup();
    s.players[0].deck = [createInstance(SERPENT, 'p1')];
    s = advanceTo(s, 'Memoria');

    s = expectOk(applyAction(s, { type: 'DrawCard', playerId: 'p1' }));

    expect(s.players[0].hand).toHaveLength(1);
    expect(s.players[0].deck).toHaveLength(0);
    expect(s.players[0].resources.memoria).toBe(1);
  });

  it('allows only one recovery per turn', () => {
    let s = setup();
    s.players[0].deck = [createInstance(SERPENT, 'p1'), createInstance(ROOTS, 'p1')];
    s = advanceTo(s, 'Memoria');
    s = expectOk(applyAction(s, { type: 'DrawCard', playerId: 'p1' }));

    const second = applyAction(s, { type: 'DrawCard', playerId: 'p1' });
    expect(second.error).toBe('Você já comprou uma carta neste turno.');
  });

  it('explains an empty deck rather than failing silently', () => {
    let s = advanceTo(setup(), 'Memoria');
    const r = applyAction(s, { type: 'DrawCard', playerId: 'p1' });
    expect(r.error).toBe('Seu deck está vazio.');
  });

  it('rejects drawing outside the Memory phase', () => {
    const s = advanceTo(setup(), 'Manifestacao');
    const r = applyAction(s, { type: 'DrawCard', playerId: 'p1' });
    expect(r.error).toBe('Comprar carta não está disponível na fase de Manifestação.');
  });
});

describe('Manifestation phase', () => {
  it('moves a card from hand to the table, linked to the active Território', () => {
    let s = setup();
    const card = createInstance(SHARED, 'p1'); // cost 1
    s.players[0].hand = [card];
    s.players[0].resources.memoria = 3;
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, { type: 'PlayCard', playerId: 'p1', instanceId: card.instanceId }));

    expect(s.players[0].hand).toHaveLength(0);
    expect(s.players[0].inPlay).toHaveLength(1);
    expect(s.players[0].inPlay[0].linkedTo).toBe(s.players[0].activeTerritoryId);
    expect(s.players[0].resources.memoria).toBe(2); // cost paid
  });

  it('names the cost it cannot pay', () => {
    let s = setup();
    const card = createInstance(SERPENT, 'p1'); // cost 3
    s.players[0].hand = [card];
    s.players[0].resources.memoria = 1;
    s = advanceTo(s, 'Manifestacao');

    const r = applyAction(s, { type: 'PlayCard', playerId: 'p1', instanceId: card.instanceId });
    expect(r.error).toBe('Serpente Encantada custa 3 de Memória; você tem 1.');
  });

  it('sends a Território to the pool instead of the table', () => {
    let s = setup();
    const card = createInstance(IGREJA, 'p1');
    s.players[0].hand = [card];
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, { type: 'PlayCard', playerId: 'p1', instanceId: card.instanceId }));

    expect(s.players[0].inPlay).toHaveLength(0);
    expect(s.players[0].territories).toHaveLength(2);
    // Playing it does not move the player there.
    expect(activeTerritoryOf(s.players[0])!.cardId).toBe(FONTE);
  });
});
