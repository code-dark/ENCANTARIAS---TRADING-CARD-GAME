/**
 * Territory Cards - Real places in São Luís, Maranhão
 */

import { TerritoryCard } from '../types';

export const territories: TerritoryCard[] = [
  {
    id: 'territorio_fonte_ribeirao',
    type: 'Territory',
    name: 'Fonte do Ribeirão',
    category: 'Spring',
    affinities: ['Water', 'Underground', 'Memory', 'Enchantment'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] 19th-century water source in São Luís.',
    narrativeLayer: '[PROVISIONAL] Associated with Water spirits and serpent legends.',
    description: 'A sacred spring where water flows from the earth. Lendas of protection and transformation are born here.',
    flavor: 'The water remembers every story it has carried.',

    permanentEffect: {
      description: 'Water-aligned cards gain bonuses while active.',
      effect: 'waterBonus',
    },

    placeAction: {
      name: 'Draw from the Spring',
      description: 'Search your deck for a Memory card.',
      cost: 1,
      effect: 'drawMemory',
    },

    resonances: [
      {
        cardId: 'legend_serpent_enchanted',
        effect: 'Unlock: Guardian of the Source. When you draw a Memory, gain 1 Vínculo.',
      },
      {
        affinity: 'Water',
        effect: 'Water-aligned cards gain +1 Power in this territory.',
      },
    ],
  },

  {
    id: 'territorio_igreja_se',
    type: 'Territory',
    name: 'Igreja da Sé',
    category: 'Church',
    affinities: ['Faith', 'Institution', 'History', 'Culture'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Historic cathedral in central São Luís.',
    narrativeLayer: '[PROVISIONAL] Site of institutional narratives and colonial memory.',
    description: 'A cathedral that has witnessed centuries of São Luís. Institutional narratives gain strength here.',
    flavor: 'Every stone holds a prayer, every prayer becomes history.',

    permanentEffect: {
      description: 'Corporate Memories become stronger in this territory.',
      effect: 'institutionalBonus',
    },

    placeAction: {
      name: 'Seek Blessing',
      description: 'Play a Memory card for free.',
      cost: 0,
      effect: 'freeMemory',
    },

    resonances: [
      {
        affinity: 'Institution',
        effect: 'Institution-aligned cards have their effects doubled.',
      },
      {
        affinity: 'Faith',
        effect: 'Faith-aligned cards gain protection from transformation.',
      },
    ],
  },

  {
    id: 'territorio_escadaria_reviver',
    type: 'Territory',
    name: 'Escadaria do Reviver',
    category: 'Street/Stairway',
    affinities: ['Passage', 'City', 'Movement', 'Circulation', 'History'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Public stairway connecting different urban levels.',
    narrativeLayer: '[PROVISIONAL] Site of encounter, exchange, and circulation of narratives.',
    description: 'Where different stories and people meet. Circulation and exchange are natural here.',
    flavor: 'Every step is a story crossing another.',

    permanentEffect: {
      description: 'Cards cost 1 less to play in this territory.',
      effect: 'reduceCost',
    },

    placeAction: {
      name: 'Encounter',
      description: 'Draw a card from the discard pile.',
      cost: 1,
      effect: 'drawFromDiscard',
    },

    resonances: [
      {
        affinity: 'Passage',
        effect: 'Passage-aligned cards enable free Traversal.',
      },
      {
        affinity: 'Circulation',
        effect: 'Circulating narratives become more powerful.',
      },
    ],
  },

  {
    id: 'territorio_ceprama',
    type: 'Territory',
    name: 'CEPRAMA',
    category: 'Cultural Center',
    affinities: ['Craft', 'Commerce', 'Culture', 'Circulation', 'Institution'],
    cost: 0,
    historicalLayer: '[PROVISIONAL] Cultural and craft center in Maranhão.',
    narrativeLayer: '[PROVISIONAL] Site where traditional knowledge meets commerce and visibility.',
    description: 'A meeting place where craft and commerce create new possibilities. Circulation gains visibility here.',
    flavor: 'Hands pass stories. Stories become goods. Goods return as stories.',

    permanentEffect: {
      description: 'Circulating narratives gain additional resources.',
      effect: 'circulationResource',
    },

    placeAction: {
      name: 'Trade Narrative',
      description: 'Exchange a card in hand with a card in your discard pile.',
      cost: 1,
      effect: 'exchangeCard',
    },

    resonances: [
      {
        affinity: 'Commerce',
        effect: 'Commercial interactions unlock new possibilities.',
      },
      {
        affinity: 'Craft',
        effect: 'Craft-aligned cards gain Vínculo.',
      },
    ],
  },
];

export function getTerritoryById(id: string): TerritoryCard | undefined {
  return territories.find((t) => t.id === id);
}
