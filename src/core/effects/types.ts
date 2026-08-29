/**
 * Effects — what a card's text actually does.
 *
 * Until now every effect in the game was prose: the log printed the sentence
 * and the match went on unchanged. That works while the rules are being
 * designed and stops working the moment someone plays. An effect here is data
 * the engine executes, so a Ressonância, um Acontecimento and a gathering all
 * reach the same executor and no card carries code of its own.
 *
 * The union is deliberately small. Every member is something the engine can
 * really do today; a card that promises more than this promises nothing.
 */

import { Affinity, CardType, MemoryState, TransformationState } from '../cards/types';

export type Recurso = 'vinculo' | 'memoria' | 'circulacao';

export type GameEffect =
  /** Gain a resource. */
  | { kind: 'ganharRecurso'; recurso: Recurso; quantidade: number }
  /**
   * Draw from the deck. The card only — not the Memória the Memory phase
   * grants, which belongs to the turn's economy and not to a card's text.
   */
  | { kind: 'comprarCarta'; quantidade: number }
  /**
   * Hand over Memórias the world already holds under this origin. It never
   * creates one: if nothing in the world answers to the origin, nothing
   * happens. This is what makes an Acontecimento a way of reaching memory
   * rather than a way of inventing it.
   */
  | { kind: 'revelarMemoria'; fonte: string; limite?: number }
  /** The next Travessia this turn costs nothing. */
  | { kind: 'travessiaLivre' }
  /** Personagens here can listen again this turn. */
  | { kind: 'despertarPersonagens' }
  /**
   * Leave a mark on the active Território. This is how an Acontecimento
   * changes a place rather than a card: the mark stays on the Território,
   * outlives the turn, and other cards can ask about it by name.
   */
  | { kind: 'marcarTerritorio'; marca: string; quantidade?: number }
  /**
   * Change what a card manifested here has become. Filters pick the target
   * among the cards linked to the active Território; the first that is not
   * already in that state is transformed.
   */
  | {
      kind: 'transformar';
      para: TransformationState;
      alvoTipo?: CardType;
      alvoAfinidade?: Affinity;
    };

/**
 * When a rule on a card in play gets its chance.
 *
 * A card that wants to act at a moment the engine already passes through
 * declares the moment rather than being wired into it. Adding a card that
 * reacts to a discovery does not touch the resolver.
 */
export type EffectTrigger =
  /** The card itself was just manifested. */
  | 'aoManifestar'
  /** This card's relation with the place was just activated. */
  | 'aoRessoar'
  /** A Memory was just transmitted in the Território this card stands in. */
  | 'aoDescobrirMemoria'
  /** The turn of the player who owns this card is ending. */
  | 'aoEncerrarTurno';

/**
 * A test the state has to pass for the rule to fire. Conditions are data for
 * the same reason effects are: a card that needs a new question asked should
 * be a new entry here, not a new branch somewhere in the resolver.
 */
export type EffectCondition =
  /** The player holds at least this much. */
  | { kind: 'recursoMinimo'; recurso: Recurso; minimo: number }
  /** Memórias on the table, optionally of one state. */
  | { kind: 'memoriasEmJogo'; minimo: number; estado?: MemoryState }
  /** The active Território carries this mark, at least this many times. */
  | { kind: 'territorioMarcado'; marca: string; minimo?: number }
  /** A card of this description is manifested in the active Território. */
  | { kind: 'cartaPresente'; tipo?: CardType; afinidade?: Affinity; cardId?: string }
  /** Passes only when the inner condition fails. */
  | { kind: 'nao'; condicao: EffectCondition };

/**
 * What a card declares: at this moment, if this holds, do this.
 *
 * gatilho → condição → efeito, all data. The executor reads it; the card
 * carries no code, and a new card needs no change to the engine.
 */
export interface EffectRule {
  quando: EffectTrigger;
  se?: EffectCondition;
  entao: GameEffect[];
  /** What the player reads when it fires. */
  texto?: string;
}

/** Where an effect is happening, and on whose behalf. */
export interface EffectContext {
  playerId: string;
  /** The card whose text this is, for the log. */
  sourceName: string;
  /** The Território it happens in; where revealed Memórias root themselves. */
  territoryInstanceId?: string;
}
