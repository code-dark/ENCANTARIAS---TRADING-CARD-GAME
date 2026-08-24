/**
 * Character Cards - Player roles and agents
 */

import { CharacterCard } from '../types';

export const characters: CharacterCard[] = [
  {
    id: 'character_listener',
    type: 'Character',
    name: 'The Listener',
    role: 'Guardian of Memory',
    affinities: ['Memory', 'Culture', 'History'],
    cost: 2,

    escuta: 4,
    presenca: 2,
    memoria: 3,
    vinculo: 3,
    astutia: 1,

    description: 'One who hears the stories. Gathers memories from all territories.',
    flavor: 'To listen is to understand. To understand is to preserve.',

    ability: 'Escuta 4: When you play a Memory, gain +1 Vínculo. Draw a card.',
    exhaustedEffect: 'While exhausted, reduce Escuta to 0.',
  },

  {
    id: 'character_wanderer',
    type: 'Character',
    name: 'The Wanderer',
    role: 'Traveler Between Worlds',
    affinities: ['Passage', 'Movement', 'City'],
    cost: 2,

    escuta: 2,
    presenca: 3,
    memoria: 2,
    vinculo: 2,
    astutia: 3,

    description: 'Moves freely between territories. Carries stories in transit.',
    flavor: 'Every place is home. No place can hold me.',

    ability: 'Presença 3: Traversal costs 1 less. Can move territories multiple times.',
    exhaustedEffect: 'While exhausted, cannot Traverse.',
  },

  {
    id: 'character_mediator',
    type: 'Character',
    name: 'The Mediator',
    role: 'Bridge Between Worlds',
    affinities: ['Institution', 'Circulation', 'Commerce'],
    cost: 2,

    escuta: 3,
    presenca: 2,
    memoria: 2,
    vinculo: 2,
    astutia: 3,

    description: 'Connects narratives to institutions. Negotiates transformation.',
    flavor: 'The story must survive. Sometimes that means changing shape.',

    ability: 'Astúcia 3: When playing Memory, you may transform it to Corporate.',
    exhaustedEffect: 'While exhausted, cannot activate Corporate abilities.',
  },
];

export function getCharacterById(id: string): CharacterCard | undefined {
  return characters.find((c) => c.id === id);
}
