/**
 * Acontecimentos — what happens to narratives, as opposed to what players do
 * with them.
 *
 * An Acontecimento is played into the Território the player is standing in and
 * resolves there. What it does is `effects`; `consequence` is what the player
 * reads. Where the two would disagree, the text was rewritten: a card must not
 * promise a rule the engine does not have.
 */

import { EventCard } from '../types';

export const events: EventCard[] = [
  {
    id: 'event_festival',
    type: 'Event',
    name: 'Tempo de Festa',
    affinities: ['Circulation', 'City', 'Commerce'],
    cost: 1,
    trigger: 'Jogado na mesa',
    condition: 'Sempre ativo',
    consequence:
      'A ocasião faz circular: +1 de Circulação, e vêm à tona os relatos que ' +
      'só aparecem quando há gente reunida.',
    duration: 'instant',
    description: '[PROVISIONAL] Quando a cidade celebra, as narrativas circulam soltas.',
    flavor: 'A festa traz todas as histórias à tona.',
    effects: [
      { kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 1 },
      // Reaches what the world already holds under this occasion. If nothing
      // answers, nothing is added: the festival does not invent memory.
      { kind: 'revelarMemoria', fonte: 'acontecimento_tempo_de_festa', limite: 2 },
    ],
  },

  {
    id: 'event_forgetting',
    type: 'Event',
    name: 'Esquecimento',
    affinities: ['Memory'],
    cost: 0,
    trigger: 'Quando uma Memória fica 2 turnos sem ser usada',
    condition: 'A Memória perde Vínculo',
    consequence: 'A Memória vai para o descarte, a menos que seu Vínculo seja renovado.',
    duration: 'persistent',
    description: 'As histórias somem quando ninguém as lembra.',
    flavor: 'O silêncio é a maior das transformações.',
    // Sem `effects` de propósito: este Acontecimento descreve uma regra que
    // dispara sozinha com o passar dos turnos, e o motor ainda não tem
    // gatilhos temporais. Fica marcado em docs/PROGRESS.md em vez de fingir.
  },

  {
    id: 'event_institutional_embrace',
    type: 'Event',
    name: 'Abraço Institucional',
    affinities: ['Institution', 'Faith', 'History'],
    cost: 1,
    trigger: 'Jogado no Território onde você está',
    condition: 'Precisa de uma Lenda manifestada aqui',
    consequence: 'A Lenda passa a existir sob guarda: ganha proteção e +1 de Vínculo.',
    duration: 'instant',
    description: '[PROVISIONAL] Instituições preservam histórias prendendo-as ao lugar.',
    flavor: 'Proteção por captura.',
    effects: [
      { kind: 'transformar', para: 'Institutional', alvoTipo: 'Legend' },
      { kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 },
    ],
  },

  {
    id: 'event_transformation_wave',
    type: 'Event',
    name: 'Onda de Transformação',
    affinities: ['Circulation', 'Commerce', 'Culture'],
    cost: 2,
    trigger: 'Jogado no Território onde você está',
    condition: 'Precisa de uma Lenda manifestada aqui',
    consequence:
      'A Lenda se populariza: reconhecida em toda parte, e +1 de Circulação.',
    duration: 'instant',
    description: '[PROVISIONAL] A circulação transforma narrativas depressa.',
    flavor: 'A mudança é a única constante.',
    effects: [
      { kind: 'transformar', para: 'Popularized', alvoTipo: 'Legend' },
      { kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 1 },
    ],
  },
];

export function getEventById(id: string): EventCard | undefined {
  return events.find((e) => e.id === id);
}
