/**
 * Event Cards - Challenges and transformations
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
    consequence: 'Memórias com Circulação ganham alcance.',
    duration: 'persistent',
    description: '[PROVISIONAL] Quando a cidade celebra, as narrativas circulam soltas.',
    flavor: 'A festa traz todas as histórias à tona.',
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
  },

  {
    id: 'event_institutional_embrace',
    type: 'Event',
    name: 'Abraço Institucional',
    affinities: ['Institution', 'Faith', 'History'],
    cost: 1,
    trigger: 'Jogue estando na Igreja da Sé',
    condition: 'Transforme uma Lenda para o estado Institucional',
    consequence: 'A Lenda ganha alcance e perde a Travessia.',
    duration: 'persistent',
    description: '[PROVISIONAL] Instituições preservam histórias prendendo-as ao lugar.',
    flavor: 'Proteção por captura.',
  },

  {
    id: 'event_transformation_wave',
    type: 'Event',
    name: 'Onda de Transformação',
    affinities: ['Circulation', 'Commerce', 'Culture'],
    cost: 2,
    trigger: 'Jogado na mesa',
    condition: 'Pode escolher qualquer Lenda',
    consequence: 'Transforma a Lenda em outra manifestação conforme sua circulação.',
    duration: 'instant',
    description: '[PROVISIONAL] A circulação transforma narrativas depressa.',
    flavor: 'A mudança é a única constante.',
  },
];

export function getEventById(id: string): EventCard | undefined {
  return events.find((e) => e.id === id);
}
