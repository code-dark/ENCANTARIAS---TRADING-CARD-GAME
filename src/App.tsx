import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { buildMatch } from './core/setup/verticalSlice';
import GameScreen from './ui/screens/GameScreen';
import './App.css';

function App() {
  const { gameState, setGame } = useGameStore();

  // The table is built in core/setup so the simulator plays exactly this match.
  useEffect(() => setGame(buildMatch()), [setGame]);

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
