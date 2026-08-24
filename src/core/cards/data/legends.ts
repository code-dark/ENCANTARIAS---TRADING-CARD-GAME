/**
 * Legend Cards - Encantados and supernatural manifestations
 */

import { LegendCard } from '../types';

export const legends: LegendCard[] = [
  {
    id: 'legend_serpent_enchanted',
    type: 'Legend',
    name: 'Serpent Encantada',
    affinities: ['Water', 'Underground', 'Mystery', 'Enchantment'],
    cost: 3,
    linkedState: 'Manifestation',
    vinculo: 2,
    presence: 3,
    mystery: 4,
    description: 'A legendary serpent guardian of waters and underground realms.',
    flavor: 'Some say she dreams the city into being. Others say the city dreams her.',

    resonanceManifestations: {
      'territorio_fonte_ribeirao': {
        name: 'Guardian of the Source',
        ability: 'When you play a Memory, gain 1 Vínculo. When you draw from this territory, gain +1 Power.',
      },
      'territorio_escadaria_reviver': {
        name: 'Wandering Spirit',
        ability: 'Costs 1 less. Can Traverse freely once per turn.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 2',
        toState: 'Popularized',
        newAbility: 'Gain +1 Power. Becomes vulnerable to institutional control.',
      },
      {
        trigger: 'Institutional',
        toState: 'Institutional',
        newAbility: 'Gain protection. Becomes bound to place.',
      },
    ],
  },

  {
    id: 'legend_lady_of_bells',
    type: 'Legend',
    name: 'Lady of Bells',
    affinities: ['Faith', 'Institution', 'History', 'Memory'],
    cost: 2,
    linkedState: 'Manifestation',
    vinculo: 3,
    presence: 2,
    mystery: 2,
    description: 'A spirit associated with the bells of the Cathedral, ringing out historical moments.',
    flavor: 'Each bell is a heartbeat of the city\'s memory.',

    resonanceManifestations: {
      'territorio_igreja_se': {
        name: 'Guardian of Sacred Bells',
        ability: 'Gain +2 Power. When a Corporate Memory is played, draw a card.',
      },
      'territorio_ceprama': {
        name: 'Commercialized Saint',
        ability: 'Gain resources. Lose Mystery.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 3',
        toState: 'Commercial',
        newAbility: 'Gain +2 Power but lose Vínculo. Becomes commodity.',
      },
    ],
  },

  {
    id: 'legend_keeper_of_paths',
    type: 'Legend',
    name: 'Keeper of Paths',
    affinities: ['Passage', 'Movement', 'Circulation', 'City'],
    cost: 2,
    linkedState: 'Manifestation',
    vinculo: 2,
    presence: 2,
    mystery: 3,
    description: 'A guardian of transitions and crossings. Appears where stories meet.',
    flavor: 'Follow the path and the path will show you.',

    resonanceManifestations: {
      'territorio_escadaria_reviver': {
        name: 'Crossing Guardian',
        ability: 'Gain +1 Power. Enables free Traversal to any territory.',
      },
      'territorio_ceprama': {
        name: 'The Wandering Merchant',
        ability: 'Gain resources. Can be traded for other cards.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 2',
        toState: 'Transmitted',
        newAbility: 'Can exist in multiple territories simultaneously.',
      },
    ],
  },
];

export function getLegendById(id: string): LegendCard | undefined {
  return legends.find((l) => l.id === id);
}
