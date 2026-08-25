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
        id: 'ressonancia_serpente_ribeirao',
        cardId: 'legend_serpent_enchanted',
        effect: 'A Guardiã reconhece quem escuta: +1 de Vínculo, e quem escutou aqui pode escutar de novo.',
        effects: [
          { kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 },
          { kind: 'despertarPersonagens' },
        ],
      },
      {
        affinity: 'Water',
        effect: 'A água guarda o que passa: +1 de Memória.',
        effects: [{ kind: 'ganharRecurso', recurso: 'memoria', quantidade: 1 }],
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
        effect: 'A instituição acolhe e prende: a narrativa passa a existir sob guarda.',
        effects: [{ kind: 'transformar', para: 'Institutional', alvoTipo: 'Legend' }],
      },
      {
        id: 'ressonancia_sinos_se',
        affinity: 'Faith',
        effect: 'A devoção sustenta quem sustenta: +1 de Vínculo.',
        effects: [{ kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 }],
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
        effect: 'A passagem se abre: a próxima Travessia deste turno não custa nada.',
        effects: [{ kind: 'travessiaLivre' }],
      },
      {
        affinity: 'Circulation',
        effect: 'O que circula alcança mais longe: +1 de Circulação.',
        effects: [{ kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 1 }],
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
        effect: 'A troca abre caminho: compre uma carta.',
        effects: [{ kind: 'comprarCarta', quantidade: 1 }],
      },
      {
        affinity: 'Craft',
        effect: 'O ofício se transmite de mão em mão: +1 de Vínculo.',
        effects: [{ kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 }],
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
        effect: 'O lugar sustenta o que se lembra: +1 de Vínculo.',
        effects: [{ kind: 'ganharRecurso', recurso: 'vinculo', quantidade: 1 }],
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
        effects: [
          { kind: 'ganharRecurso', recurso: 'circulacao', quantidade: 1 },
          // A passagem inteira reunida é vista, e ser vista muda o que ela é.
          { kind: 'transformar', para: 'Popularized', alvoTipo: 'Legend' },
        ],
      },
    ],
  },
];

export function getTerritoryById(id: string): TerritoryCard | undefined {
  return territories.find((t) => t.id === id);
}
