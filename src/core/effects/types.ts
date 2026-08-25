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

import { Affinity, CardType, TransformationState } from '../cards/types';

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

/** Where an effect is happening, and on whose behalf. */
export interface EffectContext {
  playerId: string;
  /** The card whose text this is, for the log. */
  sourceName: string;
  /** The Território it happens in; where revealed Memórias root themselves. */
  territoryInstanceId?: string;
}
