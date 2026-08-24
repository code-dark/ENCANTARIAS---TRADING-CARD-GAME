/**
 * Jornadas — each one is its own victory condition.
 *
 * Requirements are data, not code: a new Jornada is a new entry here, and the
 * evaluator in mechanics/journey.ts already knows how to read it. That is what
 * lets different Jornadas reward genuinely different play instead of all
 * collapsing into "score more points".
 */

import { Affinity, MemoryState } from '../types';

export type JourneyRequirement =
  /** Memories on the table, optionally of one state or carrying one tag. */
  | { kind: 'memoriasEmJogo'; count: number; state?: MemoryState; tag?: string }
  /** Distinct Territórios the player has been active in. */
  | { kind: 'territoriosVisitados'; count: number }
  /** Distinct Ressonâncias fired, counted once per card-and-place pair. */
  | { kind: 'ressonanciasAtivadas'; count: number }
  /** Gatherings formed — the conjunction Ressonâncias. */
  | { kind: 'cortejosFormados'; count: number }
  /**
   * Cards whose state has been transformed. Reserved: nothing in the turn
   * resolver transforms a card yet, so a Jornada asking for one would be
   * unwinnable. A test guards against writing one before the trigger exists.
   */
  | { kind: 'transformacoes'; count: number }
  /** A resource held at or above a threshold. */
  | { kind: 'recurso'; recurso: 'vinculo' | 'memoria' | 'circulacao'; minimo: number }
  /** A Lenda of this affinity manifested on the table. */
  | { kind: 'lendaComAfinidade'; afinidade: Affinity };

export interface JourneyObjective {
  id: string;
  description: string;
  requirement: JourneyRequirement;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  objectives: JourneyObjective[];
}

export const journeys: Journey[] = [
  {
    id: 'journey_guardia_memoria',
    name: 'Guardiã da Memória',
    description:
      'Reunir e sustentar o que se conta, mantendo o vínculo com quem contou.',
    objectives: [
      {
        id: 'gm_1',
        description: 'Tenha 3 Memórias em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 3 },
      },
      {
        id: 'gm_2',
        description: 'Tenha 1 Memória Oral em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 1, state: 'Oral' },
      },
      {
        id: 'gm_3',
        description: 'Alcance 3 de Vínculo',
        requirement: { kind: 'recurso', recurso: 'vinculo', minimo: 3 },
      },
    ],
  },

  {
    id: 'journey_caminhante_cidade',
    name: 'Caminhante da Cidade',
    description:
      'Atravessar a cidade e deixar que o deslocamento produza o que a permanência não produz.',
    objectives: [
      {
        id: 'cc_1',
        description: 'Esteja ativo em 2 Territórios diferentes',
        requirement: { kind: 'territoriosVisitados', count: 2 },
      },
      {
        id: 'cc_2',
        description: 'Ative 2 Ressonâncias',
        requirement: { kind: 'ressonanciasAtivadas', count: 2 },
      },
      {
        id: 'cc_3',
        description: 'Tenha 2 Memórias em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 2 },
      },
    ],
  },

  {
    id: 'journey_ponte_mundos',
    name: 'Ponte Entre Mundos',
    description:
      'Ligar o que está arquivado ao que ainda é falado, sem que um apague o outro.',
    objectives: [
      {
        id: 'pm_1',
        description: 'Tenha 1 Memória Corporate em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 1, state: 'Corporate' },
      },
      {
        id: 'pm_2',
        description: 'Tenha 1 Memória Oral em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 1, state: 'Oral' },
      },
      {
        id: 'pm_3',
        description: 'Ative 1 Ressonância',
        requirement: { kind: 'ressonanciasAtivadas', count: 1 },
      },
    ],
  },

  {
    id: 'journey_cortejo',
    name: 'O Cortejo',
    description:
      'Reunir a passagem inteira num só lugar e ouvir o que só ela abre.',
    objectives: [
      {
        id: 'co_1',
        description: 'Forme 1 Cortejo',
        requirement: { kind: 'cortejosFormados', count: 1 },
      },
      {
        id: 'co_2',
        description: 'Tenha uma Lenda de afinidade Movimento em jogo',
        requirement: { kind: 'lendaComAfinidade', afinidade: 'Movement' },
      },
      {
        id: 'co_3',
        description: 'Tenha 3 Memórias em jogo',
        requirement: { kind: 'memoriasEmJogo', count: 3 },
      },
    ],
  },
];

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find((j) => j.id === id);
}
