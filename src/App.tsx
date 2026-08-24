import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { createGameState, Player } from './core/game/gameState';
import { emptyPlayer } from './core/rules/turnResolver';
import { createInstance, createInstances } from './core/cards/cardRegistry';
import { getRandomJourney } from './core/cards/data/journeys';
import GameScreen from './ui/screens/GameScreen';
import './App.css';

/**
 * Two provisional decks for the vertical slice. They lean on different
 * affinities so the two ways of playing are visible from turn one:
 * water/underground memory versus institution/circulation.
 */
const DECK_WATER = [
  'legend_serpent_enchanted',
  'character_listener',
  'memory_oral_serpent',
  'memory_enraizada_fountain',
  'memory_transmitida_paths',
  'event_festival',
];

const DECK_INSTITUTION = [
  'legend_lady_of_bells',
  'legend_keeper_of_paths',
  'character_mediator',
  'memory_territorial_bells',
  'memory_institutional_bells',
  'memory_midiatic_circulating',
];

function buildPlayer(
  id: string,
  name: string,
  deckList: string[],
  territoryIds: string[]
): Player {
  const player = emptyPlayer(id, name);

  player.territories = territoryIds.map((t) => createInstance(t, id));
  player.activeTerritoryId = player.territories[0].instanceId;

  const cards = createInstances(deckList, id);
  player.hand = cards.slice(0, 3);
  player.deck = cards.slice(3);

  const journey = getRandomJourney();
  player.journeyProgress = {
    journeyId: journey.id,
    objectives: journey.objectives.map((o) => ({ ...o })),
    completed: false,
  };

  return player;
}

function App() {
  const { gameState, setGame } = useGameStore();

  useEffect(() => {
    const p1 = buildPlayer('p1', 'Jogador 1', DECK_WATER, [
      'territorio_fonte_ribeirao',
      'territorio_escadaria_reviver',
    ]);
    const p2 = buildPlayer('p2', 'Jogador 2', DECK_INSTITUTION, [
      'territorio_igreja_se',
      'territorio_ceprama',
    ]);

    setGame(createGameState([p1, p2]));
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
