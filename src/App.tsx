import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { createGameState, Player } from './core/game/gameState';
import { emptyPlayer } from './core/rules/turnResolver';
import { createInstance, createInstances } from './core/cards/cardRegistry';
import { memories } from './core/cards/data/memories';
import { getJourneyById } from './core/cards/data/journeys';
import GameScreen from './ui/screens/GameScreen';
import './App.css';

/**
 * Two provisional decks for the vertical slice. They lean on different
 * affinities so the two ways of playing are visible from turn one:
 * water/underground listening versus institution/circulation.
 *
 * Note what is absent: no Memórias. A deck holds what you bring to a place —
 * Lendas, Personagens, Acontecimentos. Memories are not brought, they are
 * found, so they live in the world pool below.
 */
// Order matters: the first three are the opening hand. Each deck opens with a
// Personagem to listen with and something cheap to play on turn one.
const DECK_WATER = [
  'character_listener',
  'objeto_caixa_recordacoes',
  'legend_serpent_enchanted',
  'character_wanderer',
  'event_festival',
  'event_forgetting',
];

const DECK_INSTITUTION = [
  'character_mediator',
  'objeto_recorte_jornal',
  'legend_carruagem_ana_jansen',
  'legend_mula_carruagem_ana_jansen',
  'objeto_fotografia_beira_mar',
  'legend_lady_of_bells',
];

/**
 * Every Memory in the game waits in São Luís until someone reaches it. They
 * belong to no player until listened for, uncovered by a Lenda, or reached
 * through a record.
 */
const WORLD_MEMORIES = memories.map((m) => m.id);

function buildPlayer(
  id: string,
  name: string,
  deckList: string[],
  territoryIds: string[],
  journeyId: string
): Player {
  const player = emptyPlayer(id, name);

  player.territories = territoryIds.map((t) => createInstance(t, id));
  player.activeTerritoryId = player.territories[0].instanceId;

  const cards = createInstances(deckList, id);
  player.hand = cards.slice(0, 3);
  player.deck = cards.slice(3);
  // Manifesting on turn one needs something to spend.
  player.resources.memoria = 2;

  const journey = getJourneyById(journeyId)!;
  player.journeyProgress = {
    journeyId: journey.id,
    completedObjectiveIds: [],
    completed: false,
  };

  return player;
}

function App() {
  const { gameState, setGame } = useGameStore();

  useEffect(() => {
    // Each player is playing for a different reason, and the deck is chosen for
    // the Jornada: listening for what is still spoken, against reassembling a
    // passage the city only half remembers.
    const p1 = buildPlayer(
      'p1', 'Jogador 1', DECK_WATER,
      ['territorio_fonte_ribeirao', 'territorio_escadaria_reviver'],
      'journey_guardia_memoria'
    );
    // Three Territórios: the cortejo needs somewhere to gather, and the extra
    // choice is what makes Travessia a decision rather than a toggle.
    const p2 = buildPlayer(
      'p2', 'Jogador 2', DECK_INSTITUTION,
      ['territorio_igreja_se', 'territorio_ceprama', 'territorio_cemiterio_gaviao'],
      'journey_cortejo'
    );

    // Owned by the world, not by a player, until discovered.
    const pool = createInstances(WORLD_MEMORIES, 'world');

    setGame(createGameState([p1, p2], pool));
  }, [setGame]);

  if (!gameState) {
    return <div className="app loading">Preparando a mesa…</div>;
  }

  return (
    <div className="app">
      <GameScreen />
    </div>
  );
}

export default App;
