/**
 * The effect executor.
 *
 * One entry point for every card that does something. Each effect returns a
 * new state and a sentence for the log, so what happened is always visible:
 * a card whose effect fired silently is a card the player cannot learn.
 *
 * An effect that finds nothing to act on is not an error. The log says so and
 * the match continues — refusing here would punish a player for the state of
 * the table rather than for a decision.
 */

import {
  GameState,
  updatePlayer,
  appendLog,
  record,
} from '../game/gameState';
import { getCard } from '../cards/cardRegistry';
import { LegendCard } from '../cards/types';
import { findBySourceId } from '../mechanics/memory';
import { claimMemory } from '../rules/claimMemory';
import { EffectContext, GameEffect, Recurso } from './types';

const RECURSO_LABEL: Record<Recurso, string> = {
  vinculo: 'Vínculo',
  memoria: 'Memória',
  circulacao: 'Circulação',
};

/** Run a list of effects in order, logging each as it lands. */
export function executeEffects(
  state: GameState,
  effects: GameEffect[] | undefined,
  context: EffectContext
): GameState {
  return (effects ?? []).reduce(
    (current, effect) => executeEffect(current, effect, context),
    state
  );
}

export function executeEffect(
  state: GameState,
  effect: GameEffect,
  context: EffectContext
): GameState {
  switch (effect.kind) {
    case 'ganharRecurso':
      return gainResource(state, effect.recurso, effect.quantidade, context);
    case 'comprarCarta':
      return drawCards(state, effect.quantidade, context);
    case 'revelarMemoria':
      return revealMemories(state, effect.fonte, effect.limite ?? 1, context);
    case 'travessiaLivre':
      return freeTraversal(state, context);
    case 'despertarPersonagens':
      return awakenCharacters(state, context);
    case 'transformar':
      return transform(state, effect, context);
  }
}

/* ------------------------------------------------------------------ *
 * The effects themselves
 * ------------------------------------------------------------------ */

function gainResource(
  state: GameState,
  recurso: Recurso,
  quantidade: number,
  context: EffectContext
): GameState {
  const next = updatePlayer(state, context.playerId, (p) => ({
    ...p,
    resources: { ...p.resources, [recurso]: p.resources[recurso] + quantidade },
  }));

  return appendLog(
    next, context.playerId,
    `${context.sourceName}: +${quantidade} de ${RECURSO_LABEL[recurso]}.`
  );
}

function drawCards(
  state: GameState,
  quantidade: number,
  context: EffectContext
): GameState {
  const player = state.players.find((p) => p.id === context.playerId)!;
  const drawn = player.deck.slice(0, quantidade);

  if (drawn.length === 0) {
    return appendLog(
      state, context.playerId,
      `${context.sourceName} pede uma carta, mas o deck acabou.`
    );
  }

  const next = updatePlayer(state, context.playerId, (p) => ({
    ...p,
    deck: p.deck.slice(drawn.length),
    hand: [...p.hand, ...drawn],
  }));

  return appendLog(
    next, context.playerId,
    `${context.sourceName}: ${player.name} compra ` +
      `${drawn.map((c) => getCard(c.cardId).name).join(', ')}.`
  );
}

/**
 * Hands over what the world holds under this origin. The origin is an opaque
 * string; the executor never interprets it, which is what lets a new card name
 * a new origin without the engine changing.
 */
function revealMemories(
  state: GameState,
  fonte: string,
  limite: number,
  context: EffectContext
): GameState {
  if (!context.territoryInstanceId) return state;

  const found = findBySourceId(state.memoryPool, fonte).slice(0, limite);

  if (found.length === 0) {
    return appendLog(
      state, context.playerId,
      `${context.sourceName} aponta para algo que já não está por descobrir.`
    );
  }

  return found.reduce((current, memory) => {
    const claimed = claimMemory(
      current, context.playerId, memory, context.territoryInstanceId!
    );
    return appendLog(
      claimed, context.playerId,
      `${context.sourceName} traz à tona ${getCard(memory.cardId).name}.`
    );
  }, state);
}

function freeTraversal(state: GameState, context: EffectContext): GameState {
  const next: GameState = {
    ...state,
    turnFlags: { ...state.turnFlags, travessiaLivre: true },
  };

  return appendLog(
    next, context.playerId,
    `${context.sourceName}: a próxima Travessia deste turno não custa nada.`
  );
}

function awakenCharacters(state: GameState, context: EffectContext): GameState {
  const player = state.players.find((p) => p.id === context.playerId)!;
  const here = player.inPlay.filter(
    (c) =>
      c.exhausted &&
      c.linkedTo === context.territoryInstanceId &&
      getCard(c.cardId).type === 'Character'
  );

  if (here.length === 0) {
    return appendLog(
      state, context.playerId,
      `${context.sourceName}: não há quem despertar aqui.`
    );
  }

  const ids = new Set(here.map((c) => c.instanceId));
  const next = updatePlayer(state, context.playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      ids.has(c.instanceId) ? { ...c, exhausted: false } : c
    ),
  }));

  return appendLog(
    next, context.playerId,
    `${context.sourceName}: ${here.map((c) => getCard(c.cardId).name).join(', ')} ` +
      `pode escutar de novo.`
  );
}

/**
 * A narrative becomes something else. The card stays on the table and stays
 * itself — what changes is what it has turned into, which is the whole point:
 * nothing is destroyed, things are transformed by how they circulate.
 */
function transform(
  state: GameState,
  effect: Extract<GameEffect, { kind: 'transformar' }>,
  context: EffectContext
): GameState {
  const player = state.players.find((p) => p.id === context.playerId)!;

  const target = player.inPlay.find((c) => {
    if (c.linkedTo !== context.territoryInstanceId) return false;
    if (c.transformationState === effect.para) return false;

    const def = getCard(c.cardId);
    if (effect.alvoTipo && def.type !== effect.alvoTipo) return false;
    if (effect.alvoAfinidade && !def.affinities.includes(effect.alvoAfinidade)) {
      return false;
    }
    return true;
  });

  if (!target) {
    return appendLog(
      state, context.playerId,
      `${context.sourceName}: nada aqui para transformar.`
    );
  }

  const def = getCard(target.cardId);
  const next = updatePlayer(state, context.playerId, (p) => ({
    ...p,
    inPlay: p.inPlay.map((c) =>
      c.instanceId === target.instanceId
        ? { ...c, transformationState: effect.para }
        : c
    ),
    accomplishments: {
      ...p.accomplishments,
      transformations: record(p.accomplishments.transformations, target.instanceId),
    },
  }));

  // What the Lenda becomes it says itself, when it has something to say.
  const becomes =
    def.type === 'Legend'
      ? (def as LegendCard).transformations?.find((t) => t.toState === effect.para)
          ?.newAbility
      : undefined;

  return appendLog(
    next, context.playerId,
    `${def.name} se transforma. ${becomes ?? ''}`.trim()
  );
}
