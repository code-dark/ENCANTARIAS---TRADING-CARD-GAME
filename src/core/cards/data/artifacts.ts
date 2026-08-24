/**
 * Object Cards — the material supports of memory.
 *
 * An Object never creates a Memory. It is access to one that already exists in
 * the world, or a place to keep one out of circulation.
 *
 * Deliberately excluded here: anything sacred, ritual or restricted. Those are
 * research-dependent and are not invented to fill a slot. What follows are
 * generic material categories — a container, a clipping, a photograph.
 */

import { ArtifactCard } from '../types';

export const artifacts: ArtifactCard[] = [
  {
    id: 'objeto_caixa_recordacoes',
    type: 'Artifact',
    subtype: 'storage',
    name: 'Caixa de Recordações',
    affinities: ['Memory', 'History'],
    tags: ['guarda', 'domestico', 'preservacao'],
    capacity: 2,
    cost: 1,
    description:
      'Guarda até duas Memórias. O que está guardado fica protegido — e fora de circulação.',
    flavor: 'Preservar é uma forma de silêncio.',
    effect:
      'Memórias guardadas não participam de Ressonâncias enquanto estiverem na caixa.',
  },

  {
    id: 'objeto_recorte_jornal',
    type: 'Artifact',
    subtype: 'document',
    name: 'Recorte de Jornal',
    affinities: ['Circulation', 'City', 'History'],
    tags: ['documento', 'imprensa', 'midia'],
    accessTags: ['midia'],
    cost: 1,
    description:
      'Consulta uma Memória de circulação midiática ligada ao Território atual.',
    flavor: 'A notícia envelhece; o recorte permanece.',
    effect: 'Ao ser jogado, revela uma Memória midiática deste Território.',
  },

  {
    id: 'objeto_fotografia_beira_mar',
    type: 'Artifact',
    subtype: 'photograph',
    name: 'Fotografia da Beira-Mar',
    affinities: ['City', 'Memory', 'Circulation'],
    tags: ['fotografia', 'registro', 'beira_mar'],
    // The photograph reaches a place the player is not standing in.
    accessSources: ['beira_mar'],
    cost: 1,
    description:
      'Um registro visual da Beira-Mar. Revela uma Memória vinculada àquele lugar.',
    flavor: 'A imagem chega antes de quem a viu.',
    effect: 'Ao ser jogado, revela uma Memória de origem Beira-Mar.',
  },
];

export function getArtifactById(id: string): ArtifactCard | undefined {
  return artifacts.find((a) => a.id === id);
}
