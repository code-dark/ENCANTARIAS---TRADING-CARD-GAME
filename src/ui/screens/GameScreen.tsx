import { GameState, getCurrentPlayer } from '../../core/game/gameState';
import PhaseIndicator from '../components/HUD/PhaseIndicator';
import Board from '../components/Board/Board';
import Hand from '../components/Hand/Hand';
import './GameScreen.css';

interface GameScreenProps {
  gameState: GameState;
}

export default function GameScreen({ gameState }: GameScreenProps) {
  const currentPlayer = getCurrentPlayer(gameState);

  return (
    <div className="game-screen">
      <header className="game-header">
        <h1>ENCANTARIAS — Lendas do Maranhão</h1>
        <div className="game-info">
          <div className="turn-info">
            Turn {gameState.turn} · {currentPlayer.name}
          </div>
          <PhaseIndicator phase={gameState.phase} />
        </div>
      </header>

      <div className="game-main">
        <div className="board-area">
          <Board gameState={gameState} />
        </div>

        <div className="player-area">
          <div className="player-panel active">
            <h3>{currentPlayer.name}</h3>
            {currentPlayer.activeTerritory && (
              <div className="territory-info">
                <strong>Territory:</strong> {currentPlayer.activeTerritory.name}
              </div>
            )}
            <div className="resources">
              <div className="resource">
                <span className="label">Vínculo:</span>
                <span className="value">{currentPlayer.resources?.vínculo || 0}</span>
              </div>
              <div className="resource">
                <span className="label">Memória:</span>
                <span className="value">{currentPlayer.resources?.memoria || 0}</span>
              </div>
            </div>
            <div className="deck-info">
              <span>Deck: {currentPlayer.deck.length}</span>
              <span>Hand: {currentPlayer.hand.length}</span>
              <span>Discard: {currentPlayer.discard.length}</span>
            </div>
          </div>

          <div className="hand-area">
            <h4>Your Hand</h4>
            <Hand cards={currentPlayer.hand} />
          </div>
        </div>
      </div>

      <footer className="game-footer">
        <div className="phase-controls">
          <button>← Previous Phase</button>
          <button>Next Phase →</button>
          <button>End Turn</button>
        </div>
      </footer>
    </div>
  );
}
