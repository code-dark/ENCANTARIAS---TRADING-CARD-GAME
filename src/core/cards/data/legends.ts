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
    tags: ['serpente', 'agua', 'subterraneo', 'encantado'],
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
    tags: ['sino', 'fe', 'instituicao', 'aparicao'],
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
    tags: ['passagem', 'deslocamento', 'urbano'],
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

  {
    id: 'legend_carruagem_ana_jansen',
    type: 'Legend',
    name: 'Carruagem de Ana Jansen',
    affinities: ['City', 'Movement', 'History', 'Mystery'],
    tags: ['aparicao', 'noite', 'deslocamento', 'memoria_urbana', 'ana_jansen'],
    cost: 3,
    linkedState: 'Manifestation',
    vinculo: 1,
    presence: 3,
    mystery: 4,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    // The card is about the apparition as it circulates in the city, not a
    // biography. Ana Jansen was a real historical figure and the record of her
    // life — including its violence — is research, not design. See the note in
    // docs/PROGRESS.md before this card is finalised.
    description:
      '[PROVISIONAL] Uma carruagem que atravessa a cidade à noite. A narrativa circula muito além de onde começou.',
    flavor: 'Ouve-se primeiro. Depois já passou.',

    resonanceManifestations: {
      'territorio_cemiterio_gaviao': {
        name: 'Parada do Cortejo',
        ability: 'A passagem encontra um ponto de parada e abre o Território.',
      },
      'territorio_escadaria_reviver': {
        name: 'Rumor em Trânsito',
        ability: 'Circula com facilidade: a narrativa ganha alcance ao se deslocar.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 3',
        toState: 'Popularized',
        newAbility: 'Reconhecida em toda a cidade; perde o que a prendia a um lugar.',
      },
    ],
  },

  {
    id: 'legend_mula_carruagem_ana_jansen',
    type: 'Legend',
    // Named for its context on purpose: this is the manifestation tied to this
    // narrative, not a claim that every Brazilian Mula-sem-Cabeça is the same
    // tradition.
    name: 'Mula-sem-Cabeça — Carruagem de Ana Jansen',
    affinities: ['Movement', 'Mystery', 'City'],
    tags: ['aparicao', 'carruagem_ana_jansen', 'cortejo', 'noite'],
    cost: 2,
    linkedState: 'Manifestation',
    vinculo: 1,
    presence: 3,
    mystery: 3,
    description:
      '[PROVISIONAL] A montaria do cortejo, nomeada por este contexto e não por todos.',
    flavor: 'Vem com a carruagem, e só com ela.',

    resonanceManifestations: {
      'territorio_cemiterio_gaviao': {
        name: 'Montaria do Cortejo',
        ability: 'Junto da Carruagem, compõe a passagem completa.',
      },
    },
  },
];

export function getLegendById(id: string): LegendCard | undefined {
  return legends.find((l) => l.id === id);
}
