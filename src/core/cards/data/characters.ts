/**
 * Character Cards - Player roles and agents
 */

import { CharacterCard } from '../types';

export const characters: CharacterCard[] = [
  {
    id: 'character_listener',
    type: 'Character',
    name: 'A Ouvinte',
    role: 'Guardiã da Memória',
    affinities: ['Memory', 'Culture', 'History'],
    cost: 2,

    escuta: 4,
    presenca: 2,
    memoria: 3,
    vinculo: 3,
    astutia: 1,

    description: 'Quem escuta as histórias. Reúne memórias de todos os Territórios.',
    flavor: 'Escutar é compreender. Compreender é preservar.',

    ability: 'Escuta 4: ao jogar uma Memória, ganhe +1 Vínculo. Compre uma carta.',
    exhaustedEffect: 'Enquanto exausta, sua Escuta é 0.',
  },

  {
    id: 'character_wanderer',
    type: 'Character',
    name: 'O Caminhante',
    role: 'Viajante Entre Mundos',
    affinities: ['Passage', 'Movement', 'City'],
    cost: 2,

    escuta: 2,
    presenca: 3,
    memoria: 2,
    vinculo: 2,
    astutia: 3,

    description: 'Move-se livremente entre Territórios. Carrega histórias em trânsito.',
    flavor: 'Todo lugar é casa. Nenhum lugar me segura.',

    ability: 'Presença 3: a Travessia custa 1 a menos.',
    exhaustedEffect: 'Enquanto exausto, não pode fazer Travessia.',
  },

  {
    id: 'character_mediator',
    type: 'Character',
    name: 'O Mediador',
    role: 'Ponte Entre Mundos',
    affinities: ['Institution', 'Circulation', 'Commerce'],
    cost: 2,

    escuta: 3,
    presenca: 2,
    memoria: 2,
    vinculo: 2,
    astutia: 3,

    description: 'Conecta narrativas a instituições. Negocia transformações.',
    flavor: 'A história precisa sobreviver. Às vezes isso significa mudar de forma.',

    ability: 'Astúcia 3: ao jogar uma Memória, você pode transformá-la em Corporate.',
    exhaustedEffect: 'Enquanto exausto, não ativa habilidades Corporate.',
  },
];

export function getCharacterById(id: string): CharacterCard | undefined {
  return characters.find((c) => c.id === id);
}
