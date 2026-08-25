import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, getCurrentPlayer, GameState } from '../../src/core/game/gameState';
import { applyAction, emptyPlayer } from '../../src/core/rules/turnResolver';
import { createInstance, resetInstanceIds, getCard } from '../../src/core/cards/cardRegistry';
import { isOutOfCirculation, storedIn, remainingSpace } from '../../src/core/mechanics/objects';

const FONTE = 'territorio_fonte_ribeirao';
const ESCADARIA = 'territorio_escadaria_reviver';
const SERPENT = 'legend_serpent_enchanted';
const ORAL = 'memory_oral_serpent';
const MEDIA = 'memory_midiatic_circulating';
const BEIRA_MAR = 'memory_beira_mar_imagem';

const CAIXA = 'objeto_caixa_recordacoes';
const RECORTE = 'objeto_recorte_jornal';
const FOTO = 'objeto_fotografia_beira_mar';

function setup(territoryId = FONTE, pool: string[] = []): GameState {
  const p1 = emptyPlayer('p1', 'Player One');
  const p2 = emptyPlayer('p2', 'Player Two');

  const t = createInstance(territoryId, 'p1');
  p1.territories = [t];
  p1.activeTerritoryId = t.instanceId;
  p1.resources.memoria = 5;

  const t2 = createInstance(FONTE, 'p2');
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

const expectOk = (r: { state: GameState; error?: string }) => {
  expect(r.error).toBeUndefined();
  return r.state;
};

/** Put a card straight onto the table, linked to the active Território. */
function onTable(s: GameState, cardId: string) {
  const c = { ...createInstance(cardId, 'p1'), linkedTo: s.players[0].activeTerritoryId };
  s.players[0].inPlay = [...s.players[0].inPlay, c];
  return c;
}

const named = (s: GameState, name: string) =>
  s.players[0].inPlay.find((c) => getCard(c.cardId).name === name)!;

beforeEach(() => resetInstanceIds());

describe('storage: preservation costs circulation', () => {
  it('keeps a Memória in the box and takes it off the table', () => {
    let s = setup();
    const box = onTable(s, CAIXA);
    const memory = onTable(s, ORAL);
    s = advanceTo(s, 'Acao');

    s = expectOk(applyAction(s, {
      type: 'StoreMemory', playerId: 'p1',
      memoryInstanceId: memory.instanceId, containerInstanceId: box.instanceId,
    }));

    const kept = s.players[0].inPlay.find((c) => c.instanceId === memory.instanceId)!;
    expect(kept.linkedTo).toBe(box.instanceId);
    expect(kept.linkedTo).not.toBe(s.players[0].activeTerritoryId);
    expect(storedIn(s.players[0].inPlay, box.instanceId)).toHaveLength(1);
  });

  it('a kept Memória is out of circulation', () => {
    let s = setup();
    const box = onTable(s, CAIXA);
    const memory = onTable(s, ORAL);
    s = advanceTo(s, 'Acao');

    expect(isOutOfCirculation(memory, s.players[0].inPlay)).toBe(false);

    s = expectOk(applyAction(s, {
      type: 'StoreMemory', playerId: 'p1',
      memoryInstanceId: memory.instanceId, containerInstanceId: box.instanceId,
    }));

    const kept = s.players[0].inPlay.find((c) => c.instanceId === memory.instanceId)!;
    expect(isOutOfCirculation(kept, s.players[0].inPlay)).toBe(true);
  });

  it('refuses once the box is full, saying so', () => {
    let s = setup();
    const box = onTable(s, CAIXA); // capacity 2
    const a = onTable(s, ORAL);
    const b = onTable(s, MEDIA);
    const c = onTable(s, BEIRA_MAR);
    s = advanceTo(s, 'Acao');

    const store = (id: string) => ({
      type: 'StoreMemory' as const, playerId: 'p1',
      memoryInstanceId: id, containerInstanceId: box.instanceId,
    });

    s = expectOk(applyAction(s, store(a.instanceId)));
    s = expectOk(applyAction(s, store(b.instanceId)));
    expect(remainingSpace(s.players[0].inPlay, box)).toBe(0);

    const third = applyAction(s, store(c.instanceId));
    expect(third.error).toBe('Caixa de Recordações está cheia (2).');
  });

  it('refuses to keep something that is not a Memória', () => {
    let s = setup();
    const box = onTable(s, CAIXA);
    const legend = onTable(s, SERPENT);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, {
      type: 'StoreMemory', playerId: 'p1',
      memoryInstanceId: legend.instanceId, containerInstanceId: box.instanceId,
    });
    expect(r.error).toBe('Só uma Memória pode ser guardada em um objeto.');
  });

  it('refuses a container that does not keep anything', () => {
    let s = setup();
    const clipping = onTable(s, RECORTE);
    const memory = onTable(s, ORAL);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, {
      type: 'StoreMemory', playerId: 'p1',
      memoryInstanceId: memory.instanceId, containerInstanceId: clipping.instanceId,
    });
    expect(r.error).toBe('Recorte de Jornal não guarda Memórias.');
  });

  it('brings a kept Memória back into circulation', () => {
    let s = setup();
    const box = onTable(s, CAIXA);
    const memory = onTable(s, ORAL);
    s = advanceTo(s, 'Acao');

    s = expectOk(applyAction(s, {
      type: 'StoreMemory', playerId: 'p1',
      memoryInstanceId: memory.instanceId, containerInstanceId: box.instanceId,
    }));
    s = expectOk(applyAction(s, {
      type: 'RetrieveMemory', playerId: 'p1', memoryInstanceId: memory.instanceId,
    }));

    const back = s.players[0].inPlay.find((c) => c.instanceId === memory.instanceId)!;
    expect(back.linkedTo).toBe(s.players[0].activeTerritoryId);
    expect(isOutOfCirculation(back, s.players[0].inPlay)).toBe(false);
  });

  it('refuses to retrieve something that was never kept', () => {
    let s = setup();
    const memory = onTable(s, ORAL);
    s = advanceTo(s, 'Acao');

    const r = applyAction(s, {
      type: 'RetrieveMemory', playerId: 'p1', memoryInstanceId: memory.instanceId,
    });
    expect(r.error).toBe('Essa Memória não está guardada em nenhum objeto.');
  });
});

describe('records give access, they do not create', () => {
  it('a photograph reaches a Memory of the place it points at', () => {
    let s = setup(FONTE, [BEIRA_MAR]);
    const foto = createInstance(FOTO, 'p1');
    s.players[0].hand = [foto];
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: foto.instanceId,
    }));

    // Access is not transmission: it waits to be read aloud, like any find.
    expect(s.pendingDiscovery!.mode).toBe('leitura');
    expect(s.log.some((e) => e.message.includes('alcança Imagem Recorrente'))).toBe(true);

    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));
    expect(s.memoryPool).toHaveLength(0);
    expect(named(s, 'Imagem Recorrente da Beira-Mar')).toBeDefined();
  });

  it('reaches a place the player is not standing in', () => {
    // The player is at Fonte; the Beira-Mar memory names no Território at all.
    const s = setup(FONTE, [BEIRA_MAR]);
    const memory = getCard(BEIRA_MAR) as any;
    expect(memory.sources).toEqual(['beira_mar']);
    expect(s.players[0].activeTerritoryId).not.toContain('beira_mar');
  });

  it('creates nothing when the world holds no answer', () => {
    let s = setup(FONTE, []); // empty world
    const foto = createInstance(FOTO, 'p1');
    s.players[0].hand = [foto];
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: foto.instanceId,
    }));

    // The object is on the table; no Memory was invented to satisfy it.
    expect(s.players[0].inPlay.filter((c) => getCard(c.cardId).type === 'Memory')).toHaveLength(0);
    expect(s.log[s.log.length - 1].message).toContain('aponta para algo que já não está por descobrir');
  });

  it('a clipping reaches a media Memory of the place the player is in', () => {
    let s = setup(ESCADARIA, [MEDIA, BEIRA_MAR]);
    const recorte = createInstance(RECORTE, 'p1');
    s.players[0].hand = [recorte];
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: recorte.instanceId,
    }));

    // It reaches the media memory rooted at Escadaria, not the Beira-Mar one.
    s = expectOk(applyAction(s, {
      type: 'TransmitMemory', playerId: 'p1',
      memoryInstanceId: s.pendingDiscovery!.options[0].instanceId,
    }));
    expect(named(s, 'A Lenda Viral')).toBeDefined();
    expect(s.memoryPool).toHaveLength(1);
    expect(getCard(s.memoryPool[0].cardId).name).toBe('Imagem Recorrente da Beira-Mar');
  });

  it('a clipping reaches nothing where the place holds no media memory', () => {
    let s = setup(FONTE, [MEDIA]); // Fonte is not among the media memory's origins
    const recorte = createInstance(RECORTE, 'p1');
    s.players[0].hand = [recorte];
    s = advanceTo(s, 'Manifestacao');

    s = expectOk(applyAction(s, {
      type: 'PlayCard', playerId: 'p1', instanceId: recorte.instanceId,
    }));
    expect(s.memoryPool).toHaveLength(1);
  });
});
