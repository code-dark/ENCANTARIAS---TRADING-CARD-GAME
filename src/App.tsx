import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Player } from './core/game/gameState';
import { territories } from './core/cards/data/territories';
import { legends } from './core/cards/data/legends';
import { memories } from './core/cards/data/memories';
import { characters } from './core/cards/data/characters';
import { events } from './core/cards/data/events';
import { getRandomJourney } from './core/cards/data/journeys';
import GameScreen from './ui/screens/GameScreen';
import './App.css';

function App() {
  const { gameState, initializeGame } = useGameStore();

  useEffect(() => {
    // Initialize game with test decks
    const testDeck = [
      territories[0],
      territories[1],
      legends[0],
      legends[1],
      characters[0],
      memories[0],
      memories[1],
      memories[2],
      events[0],
    ];

    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      hand: testDeck.slice(0, 3),
      deck: testDeck.slice(3),
      discard: [],
      activeTerritory: territories[0],
      linkedCards: new Map(),
      journeyProgress: {
        journeyId: getRandomJourney().id,
        objectives: [],
        completed: false,
      },
      resources: { vínculo: 0, memoria: 0, circulation: 0 },
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player 2',
      hand: testDeck.slice(0, 3),
      deck: testDeck.slice(3),
      discard: [],
      activeTerritory: territories[2],
      linkedCards: new Map(),
      journeyProgress: {
        journeyId: getRandomJourney().id,
        objectives: [],
        completed: false,
      },
      resources: { vínculo: 0, memoria: 0, circulation: 0 },
    };

    initializeGame([player1, player2]);
  }, [initializeGame]);

  if (!gameState) {
    return <div className="app loading">Initializing ENCANTARIAS...</div>;
  }

  return (
    <div className="app">
      <GameScreen gameState={gameState} />
    </div>
  );
}

export default App;
