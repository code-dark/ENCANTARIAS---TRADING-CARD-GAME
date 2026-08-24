/**
 * Journey Cards - Win conditions and strategic objectives
 */

export interface Journey {
  id: string;
  name: string;
  description: string;
  objectives: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
}

export const journeys: Journey[] = [
  {
    id: 'journey_keeper_of_memories',
    name: 'Keeper of Memories',
    description: 'Establish a chain of Memory transmission across three territories.',
    objectives: [
      {
        id: 'obj_1_collect_3_memories',
        description: 'Collect 3 different Memory cards',
        completed: false,
      },
      {
        id: 'obj_2_transmit_2_memories',
        description: 'Transmit 2 Memories to new territories',
        completed: false,
      },
      {
        id: 'obj_3_maintain_vínculo',
        description: 'Maintain Vínculo of 5+ for 2 turns',
        completed: false,
      },
    ],
  },

  {
    id: 'journey_wanderer_of_cities',
    name: 'Wanderer of Cities',
    description: 'Visit all territories and establish local presence.',
    objectives: [
      {
        id: 'obj_1_visit_2_territories',
        description: 'Traverse to at least 2 different territories',
        completed: false,
      },
      {
        id: 'obj_2_activate_resonance_3',
        description: 'Activate 3 different Resonances',
        completed: false,
      },
      {
        id: 'obj_3_control_passage',
        description: 'Control at least one Passage-aligned Legend',
        completed: false,
      },
    ],
  },

  {
    id: 'journey_bridge_of_worlds',
    name: 'Bridge of Worlds',
    description: 'Transform narratives and bridge institutional and oral traditions.',
    objectives: [
      {
        id: 'obj_1_create_transformation',
        description: 'Successfully transform 1 Legend',
        completed: false,
      },
      {
        id: 'obj_2_oral_and_institutional',
        description: 'Have both Oral and Corporate Memories in play',
        completed: false,
      },
      {
        id: 'obj_3_mediate_circulation',
        description: 'Achieve Circulation threshold on at least 2 cards',
        completed: false,
      },
    ],
  },
];

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find((j) => j.id === id);
}

export function getRandomJourney(): Journey {
  return journeys[Math.floor(Math.random() * journeys.length)];
}
