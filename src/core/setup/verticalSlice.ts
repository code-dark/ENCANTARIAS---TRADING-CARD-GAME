/**
 * The match the vertical slice plays.
 *
 * Both the interface and the simulator build a match from here. That is not
 * tidiness: a simulator that seeds its own table measures a different game, and
 * every number it produces would be about that other game instead of this one.
 */

import { createGameState, GameState, Player } from '../game/gameState';
import { emptyPlayer } from '../rules/turnResolver';
import { createInstance, createInstances } from '../cards/cardRegistry';
import { memories } from '../cards/data/memories';
import { getJourneyById } from '../cards/data/journeys';

/**
 * Order matters: the first three cards are the opening hand. Each deck opens
 * with a Personagem to listen with and something cheap to play on turn one.
 *
 * Neither deck holds Memórias. A deck is what you bring to a place; Memórias
 * are not brought, they are found.
 */
export const DECK_WATER = [
  'character_listener',
  'objeto_caixa_recordacoes',
  'legend_serpent_enchanted',
  'character_wanderer',
  'event_festival',
  'event_forgetting',
];

export const DECK_INSTITUTION = [
  'character_mediator',
  'objeto_recorte_jornal',
  'legend_carruagem_ana_jansen',
  'legend_mula_carruagem_ana_jansen',
  'objeto_fotografia_beira_mar',
  'legend_lady_of_bells',
];

/** Every Memory in the game waits in São Luís until someone reaches it. */
export const WORLD_MEMORIES = memories.map((m) => m.id);

export interface PlayerSetup {
  id: string;
  name: string;
  deck: string[];
  territories: string[];
  journeyId: string;
}

/**
 * Each player is playing for a different reason, and the deck is chosen for
 * the Jornada: listening for what is still spoken, against reassembling a
 * passage the city only half remembers.
 */
export const VERTICAL_SLICE: PlayerSetup[] = [
  {
    id: 'p1',
    name: 'Jogador 1',
    deck: DECK_WATER,
    territories: ['territorio_fonte_ribeirao', 'territorio_escadaria_reviver'],
    journeyId: 'journey_guardia_memoria',
  },
  {
    // Three Territórios: the cortejo needs somewhere to gather, and the extra
    // choice is what makes Travessia a decision rather than a toggle.
    id: 'p2',
    name: 'Jogador 2',
    deck: DECK_INSTITUTION,
    territories: [
      'territorio_igreja_se',
      'territorio_ceprama',
      'territorio_cemiterio_gaviao',
    ],
    journeyId: 'journey_cortejo',
  },
];

/**
 * Who is not a person. The vertical slice is one human against the opponent in
 * core/ai — the same policy the simulator measures the balance with.
 */
export const OPPONENT_IDS = ['p2'];

export function buildPlayer(setup: PlayerSetup): Player {
  const player = emptyPlayer(setup.id, setup.name);

  player.territories = setup.territories.map((t) => createInstance(t, setup.id));
  player.activeTerritoryId = player.territories[0].instanceId;

  const cards = createInstances(setup.deck, setup.id);
  player.hand = cards.slice(0, 3);
  player.deck = cards.slice(3);
  // Manifesting on turn one needs something to spend.
  player.resources.memoria = 2;

  const journey = getJourneyById(setup.journeyId)!;
  player.journeyProgress = {
    journeyId: journey.id,
    completedObjectiveIds: [],
    completed: false,
  };

  return player;
}

export function buildMatch(
  setups: PlayerSetup[] = VERTICAL_SLICE,
  maxTurns = 20,
  seed?: number
): GameState {
  const players = setups.map(buildPlayer);
  const pool = createInstances(WORLD_MEMORIES, 'world');
  return createGameState(players, pool, maxTurns, seed);
}
