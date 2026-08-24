/**
 * Event Cards - Challenges and transformations
 */

import { EventCard } from '../types';

export const events: EventCard[] = [
  {
    id: 'event_festival',
    type: 'Event',
    name: 'Festival Season',
    affinities: ['Circulation', 'City', 'Commerce'],
    cost: 1,
    trigger: 'Play on board',
    condition: 'Always active',
    consequence: 'All Memories with Circulation trait gain +1 Power.',
    duration: 'persistent',
    description: 'When the city celebrates, narratives circulate freely.',
    flavor: 'The festival brings all stories to light.',
  },

  {
    id: 'event_forgetting',
    type: 'Event',
    name: 'Forgetting',
    affinities: ['Memory'],
    cost: 0,
    trigger: 'When a Memory is not played for 2 turns',
    condition: 'Memory loses Vínculo',
    consequence: 'Memory moves to discard unless its Vínculo is refreshed.',
    duration: 'persistent',
    description: 'Stories fade when no one remembers them.',
    flavor: 'Silence is the greatest transformation.',
  },

  {
    id: 'event_institutional_embrace',
    type: 'Event',
    name: 'Institutional Embrace',
    affinities: ['Institution', 'Faith', 'History'],
    cost: 1,
    trigger: 'Play when controlling Igreja da Sé',
    condition: 'Transform one Legend to Institutional state',
    consequence: 'Legend gains +2 Power. Loses ability to Traverse.',
    duration: 'persistent',
    description: 'Institutions preserve stories by binding them to place.',
    flavor: 'Protection through capture.',
  },

  {
    id: 'event_transformation_wave',
    type: 'Event',
    name: 'Wave of Transformation',
    affinities: ['Circulation', 'Commerce', 'Culture'],
    cost: 2,
    trigger: 'Play on board',
    condition: 'Can target any Legend',
    consequence: 'Transform Legend to new manifestation based on circulation.',
    duration: 'instant',
    description: 'Circulation causes rapid transformation of narratives.',
    flavor: 'Change is the only constant.',
  },
];

export function getEventById(id: string): EventCard | undefined {
  return events.find((e) => e.id === id);
}
