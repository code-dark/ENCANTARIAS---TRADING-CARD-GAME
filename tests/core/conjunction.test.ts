import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, getCurrentPlayer, GameState } from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';
import { detectConjunctions } from '../../src/core/mechanics/resonance';
import { TerritoryCard } from '../../src/core/cards/types';

const GAVIAO = 'territorio_cemiterio_gaviao';
const FONTE = 'territorio_fonte_ribeirao';
const CARRUAGEM = 'legend_carruagem_ana_jansen';
const MULA = 'legend_mula_carruagem_ana_jansen';
const CAIXA = 'objeto_caixa_recordacoes';
const PASSAGEM = 'memory_cortejo_passagem';

function setup(territoryId = GAVIAO, pool: string[] = [PASSAGEM]): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const t = createInstance(territoryId, 'p1');
  p1.territories = [t];
  p1.activeTerritoryId = t.instanceId;

  const t2 = createInstance(FONTE, 'p2');
  p2.territories = [t2];
  p2.activeTerritoryId = t2.instanceId;

  return createGameState([p1, p2], pool.map((id) => createInstance(id, 'world')));
}

function place(s: GameState, cardId: string, linkedTo?: string) {
  const c = {
    ...createInstance(cardId, 'p1'),
    linkedTo: linkedTo ?? s.players[0].activeTerritoryId,
  };
  s.players[0].inPlay = [...s.players[0].inPlay, c];
  return c;
}

/** Pass until the given phase of the current player's turn. */
function advanceTo(state: GameState, phase: string): GameState {
  let s = state;
  let guard = 0;
  while (s.phase !== phase) {
    s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
    if (++guard > 60) throw new Error(`never reached ${phase}`);
  }
  return s;
}

const logged = (s: GameState, text: string) =>
  s.log.some((e) => e.message.includes(text));

beforeEach(() => resetInstanceIds());

describe('Cortejo Maldito: a Ressonância that needs a gathering', () => {
  it('does not form with only part of the cortejo', () => {
    let s = setup();
    place(s, CARRUAGEM);
    s = advanceTo(s, 'Encerramento');

    expect(logged(s, 'Cortejo Maldito')).toBe(false);
    expect(s.memoryPool).toHaveLength(1);
  });

  it('forms when the whole gathering is present in the Território', () => {
    let s = setup();
    place(s, CARRUAGEM);
    place(s, MULA);
    s = advanceTo(s, 'Encerramento');

    expect(logged(s, 'Cortejo Maldito forms in Cemitério do Gavião')).toBe(true);
    expect(s.players[0].resources.vinculo).toBe(1);
  });

  it('uncovers a Memory that nothing else in the game reaches', () => {
    let s = setup();
    place(s, CARRUAGEM);
    place(s, MULA);
    s = advanceTo(s, 'Encerramento');

    expect(s.memoryPool).toHaveLength(0);
    const found = s.players[0].inPlay.find((c) => c.cardId === PASSAGEM);
    expect(found).toBeDefined();
    expect(found!.linkedTo).toBe(s.players[0].activeTerritoryId);
    expect(logged(s, 'uncovers A Passagem Ouvida')).toBe(true);
  });

  it('fires once, so standing there does not reopen it every turn', () => {
    let s = setup();
    place(s, CARRUAGEM);
    place(s, MULA);
    s = advanceTo(s, 'Encerramento');

    const firstCount = s.log.filter((e) => e.message.includes('Cortejo Maldito forms')).length;
    expect(firstCount).toBe(1);

    // Full round trip back to this player's Encerramento with the same table.
    let guard = 0;
    do {
      s = applyAction(s, { type: 'PassPhase', playerId: getCurrentPlayer(s).id }).state;
      if (++guard > 60) throw new Error('never came back around');
    } while (!(getCurrentPlayer(s).id === 'p1' && s.phase === 'Encerramento'));

    const afterCount = s.log.filter((e) => e.message.includes('Cortejo Maldito forms')).length;
    expect(afterCount).toBe(1);
    expect(s.players[0].resources.vinculo).toBe(1); // no repeated payout
  });

  it('does not form in a Território that has no such gathering', () => {
    let s = setup(FONTE);
    place(s, CARRUAGEM);
    place(s, MULA);
    s = advanceTo(s, 'Encerramento');

    expect(logged(s, 'Cortejo Maldito')).toBe(false);
  });

  it('a participant kept in an object is not present at the gathering', () => {
    let s = setup();
    place(s, CARRUAGEM);
    const box = place(s, CAIXA);
    place(s, MULA, box.instanceId); // inside the box, not on the ground
    s = advanceTo(s, 'Encerramento');

    expect(logged(s, 'Cortejo Maldito')).toBe(false);
  });
});

describe('detectConjunctions in isolation', () => {
  const gaviao = getCard(GAVIAO) as TerritoryCard;

  it('returns nothing for a Território that declares none', () => {
    const fonte = getCard(FONTE) as TerritoryCard;
    expect(detectConjunctions([], fonte)).toEqual([]);
  });

  it('names the participants for the log', () => {
    const cards = [createInstance(CARRUAGEM, 'p1'), createInstance(MULA, 'p1')];
    const [match] = detectConjunctions(cards, gaviao);
    expect(match.name).toBe('Cortejo Maldito');
    expect(match.participants).toHaveLength(2);
  });

  it('is order-independent', () => {
    const a = [createInstance(CARRUAGEM, 'p1'), createInstance(MULA, 'p1')];
    const b = [createInstance(MULA, 'p1'), createInstance(CARRUAGEM, 'p1')];
    expect(detectConjunctions(a, gaviao)).toHaveLength(1);
    expect(detectConjunctions(b, gaviao)).toHaveLength(1);
  });
});

describe('the map after Cemitério do Gavião', () => {
  it('connects Fonte do Ribeirão, which had been isolated', () => {
    const fonte = getCard(FONTE) as TerritoryCard;
    const gaviao = getCard(GAVIAO) as TerritoryCard;
    const shared = fonte.affinities.filter((a) => gaviao.affinities.includes(a));
    expect(shared).toContain('Memory');
  });
});
