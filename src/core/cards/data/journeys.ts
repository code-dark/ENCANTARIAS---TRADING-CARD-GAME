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
    name: 'Guardiã da Memória',
    description: 'Estabeleça uma cadeia de transmissão de Memória por três Territórios.',
    objectives: [
      {
        id: 'obj_1_collect_3_memories',
        description: 'Reúna 3 Memórias diferentes',
        completed: false,
      },
      {
        id: 'obj_2_transmit_2_memories',
        description: 'Transmita 2 Memórias para novos Territórios',
        completed: false,
      },
      {
        id: 'obj_3_maintain_vínculo',
        description: 'Mantenha Vínculo 5 ou mais',
        completed: false,
      },
    ],
  },

  {
    id: 'journey_wanderer_of_cities',
    name: 'Caminhante da Cidade',
    description: 'Percorra a cidade e estabeleça presença em cada lugar.',
    objectives: [
      {
        id: 'obj_1_visit_2_territories',
        description: 'Faça Travessia para ao menos 2 Territórios diferentes',
        completed: false,
      },
      {
        id: 'obj_2_activate_resonance_3',
        description: 'Ative 3 Ressonâncias diferentes',
        completed: false,
      },
      {
        id: 'obj_3_control_passage',
        description: 'Tenha ao menos uma Lenda de afinidade Passagem',
        completed: false,
      },
    ],
  },

  {
    id: 'journey_bridge_of_worlds',
    name: 'Ponte Entre Mundos',
    description: 'Transforme narrativas e ligue o registro institucional à tradição oral.',
    objectives: [
      {
        id: 'obj_1_create_transformation',
        description: 'Transforme 1 Lenda',
        completed: false,
      },
      {
        id: 'obj_2_oral_and_institutional',
        description: 'Tenha em jogo Memórias Oral e Corporate',
        completed: false,
      },
      {
        id: 'obj_3_mediate_circulation',
        description: 'Atinja o limiar de Circulação em ao menos 2 cartas',
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
