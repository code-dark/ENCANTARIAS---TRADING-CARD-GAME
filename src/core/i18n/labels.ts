/**
 * Display labels.
 *
 * Identifiers stay in English because they are code — renaming a union member
 * ripples through every file that reasons about it. What the player reads is
 * translated here, in one place.
 */

import {
  Affinity, CardType, MemoryState, TransformationState,
} from '../cards/types';
import { GamePhase } from '../game/gameState';

export const AFFINITY_LABEL: Record<Affinity, string> = {
  Water: 'Água',
  Underground: 'Subterrâneo',
  Memory: 'Memória',
  Faith: 'Fé',
  Institution: 'Instituição',
  Craft: 'Ofício',
  Commerce: 'Comércio',
  Passage: 'Passagem',
  City: 'Cidade',
  Movement: 'Movimento',
  History: 'História',
  Culture: 'Cultura',
  Circulation: 'Circulação',
  Enchantment: 'Encantamento',
  Mystery: 'Mistério',
};

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  Territory: 'Território',
  Legend: 'Lenda',
  Character: 'Personagem',
  Memory: 'Memória',
  Event: 'Acontecimento',
  Artifact: 'Objeto',
};

/**
 * Memory states keep the names chosen for them in English. Everything else the
 * player reads is in Portuguese; these four were named deliberately and are
 * left as they were rather than silently reverted.
 */
export const MEMORY_STATE_LABEL: Record<MemoryState, string> = {
  Oral: 'Oral',
  Territorial: 'Territorial',
  Roots: 'Roots',
  Shared: 'Shared',
  Corporate: 'Corporate',
  Media: 'Media',
};

export const TRANSFORMATION_LABEL: Record<TransformationState, string> = {
  Original: 'Original',
  Popularized: 'Popularizada',
  Institutional: 'Institucionalizada',
  Commercial: 'Comercializada',
  Ressignified: 'Ressignificada',
  Decontextualized: 'Descontextualizada',
  Transmitted: 'Transmitida',
};

export const PHASE_LABEL: Record<GamePhase, string> = {
  Despertar: 'Despertar',
  Memoria: 'Memória',
  Travessia: 'Travessia',
  Manifestacao: 'Manifestação',
  Acao: 'Ação',
  Acontecimento: 'Acontecimento',
  Encerramento: 'Encerramento',
};
