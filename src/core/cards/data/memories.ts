/**
 * Memory Cards - Transmissions and narratives
 */

import { MemoryCard } from '../types';

export const memories: MemoryCard[] = [
  {
    id: 'memory_oral_serpent',
    type: 'Memory',
    name: 'Relato Oral da Serpente',
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
    description: '[PROVISIONAL] Uma história falada, passada de boca em boca. Carrega o peso da voz.',
    flavor: 'As histórias mais antigas são as sussurradas.',
    effect: 'Ao ser jogada: procure no deck uma Lenda com afinidade Água.',
  },

  {
    id: 'memory_territorial_bells',
    type: 'Memory',
    name: 'Memória Territorial dos Sinos',
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
    description: '[PROVISIONAL] Presa a um lugar específico. Os sinos tocam só aqui.',
    flavor: 'Algumas músicas só tocam num lugar.',
    effect: 'Vinculada à Igreja da Sé. Não faz Travessia.',
  },

  {
    id: 'memory_enraizada_fountain',
    type: 'Memory',
    name: 'Roots: A Fonte Perene',
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
    description: '[PROVISIONAL] Enraizada tão fundo que virou o próprio Território. Não se move.',
    flavor: 'Algumas coisas não se movem porque são tudo.',
    effect: 'Reforça o Território ativo. Não sai daqui.',
  },

  {
    id: 'memory_transmitida_paths',
    type: 'Memory',
    name: 'Shared: Os Caminhos Cruzados',
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
    description: '[PROVISIONAL] Uma história que viaja e se transforma ao se mover.',
    flavor: 'A história muda a cada vez que é contada, e segue verdadeira.',
    effect: 'A Travessia custa 1 a menos enquanto você carrega esta Memória.',
  },

  {
    id: 'memory_institutional_bells',
    type: 'Memory',
    name: 'Corporate: Registros da Sé',
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
    description: '[PROVISIONAL] Registros oficiais e saber institucional. Organizados e protegidos.',
    flavor: 'Posto no papel, vira lei.',
    effect: 'Ganha força para cada carta Corporate em jogo.',
  },

  {
    id: 'memory_midiatic_circulating',
    type: 'Memory',
    name: 'Media: A Lenda Viral',
    memoryState: 'Media',
    discovery: {
      // Everyone has already heard this one; almost no listening required.
      via: ['explore', 'event'],
      escuta: 1,
    },
    affinities: ['Circulation', 'City', 'Commerce'],
    sources: [
      'territorio_escadaria_reviver',
      'territorio_ceprama',
      'territorio_cemiterio_gaviao',
    ],
    tags: ['midia', 'circulacao', 'urbano'],
    linkedTo: undefined,
    traversalBehavior: 'travels',
    cost: 0,
    description: '[PROVISIONAL] Circula pela mídia e pelo comércio. Visível em toda parte, compreendida em lugar nenhum.',
    flavor: 'Todo mundo conhece. Ninguém lembra por quê.',
    circulationThreshold: 2,
    transformationOn: 'Decontextualized',
    effect: 'Ganha recursos por marcador de Circulação. Perde Vínculo.',
  },

  {
    id: 'memory_beira_mar_imagem',
    type: 'Memory',
    name: 'Imagem Recorrente da Beira-Mar',
    memoryState: 'Media',
    discovery: {
      // Reached through a record that points at the place, not by standing there.
      via: ['artifact'],
    },
    affinities: ['City', 'Circulation', 'Memory'],
    sources: ['beira_mar'],
    tags: ['beira_mar', 'fotografia', 'midia', 'circulacao'],
    traversalBehavior: 'travels',
    cost: 0,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    // Deliberately a claim about the circulation of images, not about any
    // community, practice or event at the Beira-Mar. What that shoreline holds
    // is research, not design.
    description:
      '[PROVISIONAL] Uma vista que retorna em cartões, jornais e álbuns. Circula mais do que é lembrada.',
    flavor: 'A imagem viaja sozinha, e chega sem o que a cercava.',
    effect: 'Só pode ser alcançada por um registro que aponte para a Beira-Mar.',
  },

  {
    id: 'memory_cortejo_passagem',
    type: 'Memory',
    name: 'A Passagem Ouvida',
    memoryState: 'Oral',
    discovery: {
      // Opened only by the whole gathering. No amount of listening reaches it.
      via: ['resonance'],
    },
    affinities: ['City', 'Memory', 'Mystery'],
    sources: ['ressonancia_cortejo_maldito'],
    tags: ['aparicao', 'noite', 'memoria_urbana', 'cortejo'],
    traversalBehavior: 'travels',
    cost: 1,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    description:
      '[PROVISIONAL] O relato de quem diz ter ouvido a passagem — nunca de quem diz tê-la visto.',
    flavor: 'Todo mundo conhece alguém que ouviu.',
    effect: 'Só se abre quando o cortejo se forma por inteiro.',
  },
];

export function getMemoryById(id: string): MemoryCard | undefined {
  return memories.find((m) => m.id === id);
}
