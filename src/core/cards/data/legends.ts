/**
 * Legend Cards - Encantados and supernatural manifestations
 */

import { LegendCard } from '../types';

export const legends: LegendCard[] = [
  {
    id: 'legend_serpent_enchanted',
    type: 'Legend',
    name: 'Serpente Encantada',
    affinities: ['Water', 'Underground', 'Mystery', 'Enchantment'],
    tags: ['serpente', 'agua', 'subterraneo', 'encantado'],
    cost: 3,
    linkedState: 'Manifestation',
    vinculo: 2,
    presence: 3,
    mystery: 4,
    description: '[PROVISIONAL] Uma serpente guardiã das águas e do subterrâneo.',
    flavor: 'Dizem que ela sonha a cidade. Dizem também que a cidade a sonha.',

    // The ability the card has always claimed, now stated as a rule the
    // engine reads: gatilho, condição implícita (estar aqui), efeito.
    effectRules: [
      {
        quando: 'aoDescobrirMemoria',
        texto: 'a Guardiã reconhece o que foi dito em voz alta.',
        entao: [{ kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 }],
      },
    ],

    resonanceManifestations: {
      'territorio_fonte_ribeirao': {
        name: 'Guardiã da Fonte',
        ability: 'Ao jogar uma Memória, ganhe 1 Vínculo.',
      },
      'territorio_escadaria_reviver': {
        name: 'Espírito Errante',
        ability: 'Custa 1 a menos. Pode fazer uma Travessia livre por turno.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 2',
        toState: 'Popularized',
        newAbility: 'Ganha alcance, e fica exposta ao controle institucional.',
      },
      {
        trigger: 'Institutional',
        toState: 'Institutional',
        newAbility: 'Ganha proteção, e fica presa ao lugar.',
      },
    ],
  },

  {
    id: 'legend_lady_of_bells',
    type: 'Legend',
    name: 'Senhora dos Sinos',
    affinities: ['Faith', 'Institution', 'History', 'Memory'],
    tags: ['sino', 'fe', 'instituicao', 'aparicao'],
    cost: 2,
    linkedState: 'Manifestation',
    vinculo: 3,
    presence: 2,
    mystery: 2,
    description: '[PROVISIONAL] Uma presença associada aos sinos da Sé.',
    flavor: 'Cada sino é uma batida da memória da cidade.',

    resonanceManifestations: {
      'territorio_igreja_se': {
        name: 'Guardiã dos Sinos',
        ability: 'Ao jogar uma Memória Corporate, compre uma carta.',
      },
      'territorio_ceprama': {
        name: 'Devoção Comercializada',
        ability: 'Ganha recursos. Perde Mistério.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 3',
        toState: 'Commercial',
        newAbility: 'Ganha alcance e perde Vínculo: torna-se mercadoria.',
      },
    ],
  },

  {
    id: 'legend_keeper_of_paths',
    type: 'Legend',
    name: 'Guardião dos Caminhos',
    affinities: ['Passage', 'Movement', 'Circulation', 'City'],
    tags: ['passagem', 'deslocamento', 'urbano'],
    cost: 2,
    linkedState: 'Manifestation',
    vinculo: 2,
    presence: 2,
    mystery: 3,
    description: '[PROVISIONAL] Um guardião das passagens. Aparece onde as histórias se cruzam.',
    flavor: 'Siga o caminho e o caminho te mostra.',

    // A rule with a condition: the place has to have been left changed.
    effectRules: [
      {
        quando: 'aoEncerrarTurno',
        se: { kind: 'territorioMarcado', marca: 'festa' },
        texto: 'num lugar que ainda está em festa, há mais passagem do que de costume.',
        entao: [{ kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 1 }],
      },
    ],

    resonanceManifestations: {
      'territorio_escadaria_reviver': {
        name: 'Guardião da Passagem',
        ability: 'Permite uma Travessia livre para qualquer Território.',
      },
      'territorio_ceprama': {
        name: 'O Mascate',
        ability: 'Ganha recursos. Pode ser trocado por outras cartas.',
      },
    },

    transformations: [
      {
        trigger: 'Circulation > 2',
        toState: 'Transmitted',
        newAbility: 'Passa a existir em mais de um Território ao mesmo tempo.',
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
