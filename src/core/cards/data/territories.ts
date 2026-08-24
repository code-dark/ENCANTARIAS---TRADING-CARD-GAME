/**
 * Territory Cards - Real places in São Luís, Maranhão
 */

import { TerritoryCard } from '../types';

export const territories: TerritoryCard[] = [
  {
    id: 'territorio_fonte_ribeirao',
    type: 'Territory',
    name: 'Fonte do Ribeirão',
    category: 'Fonte',
    affinities: ['Water', 'Underground', 'Memory', 'Enchantment'],
    tags: ['agua', 'subterraneo', 'memoria', 'urbano', 'fonte'],
    memorySources: ['territorio_fonte_ribeirao'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Fonte de água do século XIX em São Luís.',
    narrativeLayer: '[PROVISIONAL] Associada a narrativas de água e de serpente.',
    description: '[PROVISIONAL] Uma fonte de onde a água brota da terra. Aqui nascem narrativas de proteção e transformação.',
    flavor: 'A água lembra de cada história que carregou.',

    permanentEffect: {
      description: 'Cartas de afinidade Água encontram apoio neste Território.',
      effect: 'waterBonus',
    },

    placeAction: {
      name: 'Beber da Fonte',
      description: 'Procure uma Memória ligada a este Território.',
      cost: 1,
      effect: 'drawMemory',
    },

    resonances: [
      {
        cardId: 'legend_serpent_enchanted',
        effect: 'Desbloqueia Guardiã da Fonte: ao recuperar uma Memória, ganhe 1 Vínculo.',
      },
      {
        affinity: 'Water',
        effect: 'Cartas de afinidade Água ganham força neste Território.',
      },
    ],
  },

  {
    id: 'territorio_igreja_se',
    type: 'Territory',
    name: 'Igreja da Sé',
    category: 'Igreja',
    affinities: ['Faith', 'Institution', 'History', 'Culture'],
    tags: ['fe', 'instituicao', 'patrimonio', 'urbano', 'centro'],
    memorySources: ['territorio_igreja_se'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Catedral histórica no centro de São Luís.',
    narrativeLayer: '[PROVISIONAL] Lugar de narrativas institucionais e memória colonial.',
    description: '[PROVISIONAL] Uma catedral que atravessou séculos de São Luís. Narrativas institucionais ganham força aqui.',
    flavor: 'Cada pedra guarda uma reza, cada reza vira história.',

    permanentEffect: {
      description: 'Memórias Corporate ficam mais fortes neste Território.',
      effect: 'institutionalBonus',
    },

    placeAction: {
      name: 'Pedir Bênção',
      description: 'Jogue uma Memória sem custo.',
      cost: 0,
      effect: 'freeMemory',
    },

    resonances: [
      {
        affinity: 'Institution',
        effect: 'Cartas de afinidade Instituição têm seus efeitos ampliados.',
      },
      {
        affinity: 'Faith',
        effect: 'Cartas de afinidade Fé ficam protegidas de Transformações.',
      },
    ],
  },

  {
    id: 'territorio_escadaria_reviver',
    type: 'Territory',
    name: 'Escadaria do Reviver',
    category: 'Rua / Escadaria',
    affinities: ['Passage', 'City', 'Movement', 'Circulation', 'History'],
    tags: ['passagem', 'encontro', 'urbano', 'centro', 'circulacao'],
    memorySources: ['territorio_escadaria_reviver'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Escadaria pública ligando níveis diferentes da cidade.',
    narrativeLayer: '[PROVISIONAL] Lugar de encontro, troca e circulação de narrativas.',
    description: '[PROVISIONAL] Onde histórias e pessoas diferentes se cruzam. Circulação e troca são naturais aqui.',
    flavor: 'Cada degrau é uma história cruzando outra.',

    permanentEffect: {
      description: 'Cartas custam 1 a menos neste Território.',
      effect: 'reduceCost',
    },

    placeAction: {
      name: 'Encontro',
      description: 'Recupere uma carta do descarte.',
      cost: 1,
      effect: 'drawFromDiscard',
    },

    resonances: [
      {
        affinity: 'Passage',
        effect: 'Cartas de afinidade Passagem permitem Travessia livre.',
      },
      {
        affinity: 'Circulation',
        effect: 'Narrativas em circulação ganham força.',
      },
    ],
  },

  {
    id: 'territorio_ceprama',
    type: 'Territory',
    name: 'CEPRAMA',
    category: 'Centro Cultural',
    affinities: ['Craft', 'Commerce', 'Culture', 'Circulation', 'Institution'],
    tags: ['oficio', 'comercio', 'cultura', 'circulacao', 'instituicao'],
    memorySources: ['territorio_ceprama'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Centro de cultura e ofício no Maranhão.',
    narrativeLayer: '[PROVISIONAL] Lugar onde saber tradicional encontra comércio e visibilidade.',
    description: '[PROVISIONAL] Um ponto de encontro onde ofício e comércio abrem possibilidades. A circulação ganha visibilidade aqui.',
    flavor: 'Mãos passam histórias. Histórias viram mercadoria. Mercadoria volta como história.',

    permanentEffect: {
      description: 'Narrativas em circulação rendem recursos extras.',
      effect: 'circulationResource',
    },

    placeAction: {
      name: 'Trocar Narrativa',
      description: 'Troque uma carta da mão por uma do descarte.',
      cost: 1,
      effect: 'exchangeCard',
    },

    resonances: [
      {
        affinity: 'Commerce',
        effect: 'Trocas comerciais abrem novas possibilidades.',
      },
      {
        affinity: 'Craft',
        effect: 'Cartas de afinidade Ofício ganham Vínculo.',
      },
    ],
  },

  {
    id: 'territorio_cemiterio_gaviao',
    type: 'Territory',
    name: 'Cemitério do Gavião',
    category: 'Cemitério',
    affinities: ['History', 'City', 'Memory'],
    tags: ['cemiterio', 'noite', 'memoria_urbana', 'aparicao', 'urbano'],
    memorySources: ['territorio_cemiterio_gaviao'],
    cost: 0,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    // A burial ground in São Luís. Nothing about the practices, beliefs or
    // communities attached to it is asserted here: that is research.
    historicalLayer: '[PROVISIONAL] Cemitério urbano de São Luís.',
    narrativeLayer:
      '[PROVISIONAL] Território associado a narrativas noturnas de aparição que circulam na cidade.',
    description:
      'Um campo de repouso dentro da cidade. As narrativas noturnas encontram aqui um ponto de parada.',
    flavor: 'A cidade continua do outro lado do muro.',

    permanentEffect: {
      description: 'Narrativas de aparição encontram passagem neste Território.',
      effect: 'apparitionPassage',
    },

    placeAction: {
      name: 'Percorrer as Alamedas',
      description: 'Procure uma Memória urbana ligada a este Território.',
      cost: 1,
      effect: 'searchUrbanMemory',
    },

    resonances: [
      {
        affinity: 'Memory',
        effect: 'Cartas de Memória encontram apoio neste Território.',
      },
    ],

    conjunctions: [
      {
        id: 'ressonancia_cortejo_maldito',
        name: 'Cortejo Maldito',
        requires: [
          'legend_carruagem_ana_jansen',
          'legend_mula_carruagem_ana_jansen',
        ],
        effect:
          'O cortejo se forma: a passagem abre uma camada do Território que nenhuma escuta alcança.',
      },
    ],
  },
];

export function getTerritoryById(id: string): TerritoryCard | undefined {
  return territories.find((t) => t.id === id);
}
