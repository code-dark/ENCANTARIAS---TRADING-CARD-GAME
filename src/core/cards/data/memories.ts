/**
 * Memory Cards - Transmissions and narratives
 */

import { MemoryCard } from '../types';

export const memories: MemoryCard[] = [
  {
    id: 'memory_oral_serpent',
    type: 'Memory',
    name: 'Oral Account of the Serpent',
    memoryState: 'Oral',
    discovery: {
      // A spoken account: you have to actually listen for it.
      via: ['explore'],
      escuta: 3,
    },
    affinities: ['Water', 'Memory', 'Enchantment'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['serpente', 'oralidade', 'agua'],
    linkedTo: 'legend_serpent_enchanted',
    traversalBehavior: 'travels',
    cost: 1,
    description: 'A spoken story passed from mouth to mouth. Carries the weight of voice.',
    flavor: 'The oldest stories are the ones whispered.',
    effect: 'When played: Search deck for a Legend with Water affinity.',
  },

  {
    id: 'memory_territorial_bells',
    type: 'Memory',
    name: 'Territorial Memory of Bells',
    memoryState: 'Territorial',
    discovery: {
      via: ['explore'],
      escuta: 3,
    },
    affinities: ['Faith', 'Institution', 'History'],
    sources: ['territorio_igreja_se'],
    tags: ['sino', 'fe', 'patrimonio'],
    linkedTo: 'legend_lady_of_bells',
    traversalBehavior: 'stays',
    cost: 1,
    description: 'Deeply rooted in a specific place. The bells ring only here.',
    flavor: 'Some songs only play in one place.',
    effect: 'Linked to Igreja da Sé. Cannot traverse.',
  },

  {
    id: 'memory_enraizada_fountain',
    type: 'Memory',
    name: 'Roots: The Eternal Spring',
    memoryState: 'Roots',
    discovery: {
      // Not something anyone can be told. Only the Serpent manifesting here
      // opens this layer of the place.
      via: ['resonance'],
      byLegend: 'legend_serpent_enchanted',
    },
    affinities: ['Water', 'Underground'],
    sources: ['ressonancia_serpente_ribeirao'],
    tags: ['serpente', 'subterraneo', 'agua'],
    linkedTo: 'legend_serpent_enchanted',
    traversalBehavior: 'stays',
    cost: 2,
    description: 'Rooted so deep that it has become the territory itself. Immovable.',
    flavor: 'Some things do not move because they are everything.',
    effect: 'Gives +2 Presence to active territory. Cannot leave.',
  },

  {
    id: 'memory_transmitida_paths',
    type: 'Memory',
    name: 'Shared: The Crossed Paths',
    memoryState: 'Shared',
    discovery: {
      via: ['explore'],
      escuta: 2,
    },
    affinities: ['Passage', 'Movement', 'Circulation'],
    sources: ['territorio_escadaria_reviver', 'territorio_ceprama'],
    tags: ['passagem', 'circulacao'],
    linkedTo: 'legend_keeper_of_paths',
    traversalBehavior: 'travels',
    cost: 1,
    description: 'A story that travels, transforms as it moves. Always relevant.',
    flavor: 'The story changes with each telling but remains true.',
    effect: 'Traversal cost reduced by 1 when carrying this memory.',
  },

  {
    id: 'memory_institutional_bells',
    type: 'Memory',
    name: 'Corporate Memory: Cathedral Records',
    memoryState: 'Corporate',
    discovery: {
      via: ['resonance'],
      byLegend: 'legend_lady_of_bells',
    },
    affinities: ['Institution', 'Faith', 'History'],
    sources: ['ressonancia_sinos_se'],
    tags: ['sino', 'instituicao', 'arquivo'],
    linkedTo: 'legend_lady_of_bells',
    traversalBehavior: 'stays',
    cost: 1,
    description: 'Official records and institutional knowledge. Organized and protected.',
    flavor: 'Written down, it becomes law.',
    effect: 'Gain +1 Power for each Corporate card in play.',
  },

  {
    id: 'memory_midiatic_circulating',
    type: 'Memory',
    name: 'Media: The Viral Legend',
    memoryState: 'Media',
    discovery: {
      // Everyone has already heard this one; almost no listening required.
      via: ['explore', 'event'],
      escuta: 1,
    },
    affinities: ['Circulation', 'City', 'Commerce'],
    sources: ['territorio_escadaria_reviver', 'territorio_ceprama'],
    tags: ['midia', 'circulacao', 'urbano'],
    linkedTo: undefined,
    traversalBehavior: 'travels',
    cost: 0,
    description: 'Circulating through media and commerce. Visible everywhere, understood nowhere.',
    flavor: 'Everyone knows it. No one remembers why.',
    circulationThreshold: 2,
    transformationOn: 'Decontextualized',
    effect: 'Gain resources for each Circulation marker. Loses Vínculo.',
  },
];

export function getMemoryById(id: string): MemoryCard | undefined {
  return memories.find((m) => m.id === id);
}
