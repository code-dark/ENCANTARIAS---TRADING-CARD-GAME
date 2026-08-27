import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { buildMatch } from './core/setup/verticalSlice';
import GameScreen from './ui/screens/GameScreen';
import TutorialScreen from './ui/screens/TutorialScreen';
import './App.css';

const SEEN_KEY = 'encantarias:tutorial-visto';

/** Reading it can throw outright in a private window or with site data blocked,
 *  so a player who has never seen the tutorial is the safe answer. */
function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* A tutorial shown twice is a smaller problem than a crash. */
  }
}

function App() {
  const { gameState, setGame } = useGameStore();
  const [tutorial, setTutorial] = useState(() => !alreadySeen());

  // The table is built in core/setup so the simulator plays exactly this match.
  useEffect(() => setGame(buildMatch()), [setGame]);

  if (!gameState) {
    return <div className="app loading">Preparando a mesa…</div>;
  }

  return (
    <div className="app">
      <GameScreen onShowHelp={() => setTutorial(true)} />
      {tutorial && (
        <TutorialScreen
          onDone={() => {
            remember();
            setTutorial(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
