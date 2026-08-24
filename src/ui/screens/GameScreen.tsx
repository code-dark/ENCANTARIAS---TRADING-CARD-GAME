import { getCurrentPlayer, PHASE_ORDER } from '../../core/game/gameState';
import { useGameStore } from '../../store/gameStore';
import PhaseIndicator from '../components/HUD/PhaseIndicator';
import Board from '../components/Board/Board';
import Hand from '../components/Hand/Hand';
import './GameScreen.css';

export default function GameScreen() {
  const { gameState, dispatch, lastError, check } = useGameStore();
  if (!gameState) return null;

  const player = getCurrentPlayer(gameState);
  const isLastPhase = gameState.phase === PHASE_ORDER[PHASE_ORDER.length - 1];

  const drawAction = { type: 'DrawCard' as const, playerId: player.id };
  const drawVerdict = check(drawAction);

  const exploreAction = { type: 'Explore' as const, playerId: player.id };
  const exploreVerdict = check(exploreAction);

  return (
    <div className="game-screen">
      <header className="game-header">
        <h1>ENCANTARIAS</h1>
        <div className="turn-info">
          Turno {gameState.turn} · <strong>{player.name}</strong>
        </div>
        <PhaseIndicator phase={gameState.phase} />
      </header>

      <main className="game-main">
        <div className="board-area">
          <Board player={player} isActivePlayer />
        </div>

        <aside className="side-panel">
          <div className="resources">
            <div className="resource">
              <span>Vínculo</span><strong>{player.resources.vinculo}</strong>
            </div>
            <div className="resource">
              <span>Memória</span><strong>{player.resources.memoria}</strong>
            </div>
            <div className="resource">
              <span>Deck</span><strong>{player.deck.length}</strong>
            </div>
          </div>

          <div className="world-pool" title="Memórias que ainda aguardam no mundo, sem dono">
            <span>Memórias no mundo</span>
            <strong>{gameState.memoryPool.length}</strong>
          </div>

          {gameState.phase === 'Memory' && (
            <button
              className="primary"
              disabled={!drawVerdict.valid}
              title={drawVerdict.reason}
              onClick={() => dispatch(drawAction)}
            >
              Comprar carta
            </button>
          )}

          {gameState.phase === 'Action' && (
            <button
              className="primary"
              disabled={!exploreVerdict.valid}
              title={
                exploreVerdict.valid
                  ? 'Um Personagem escuta o Território e recupera uma Memória'
                  : exploreVerdict.reason
              }
              onClick={() => dispatch(exploreAction)}
            >
              Escutar o Território
            </button>
          )}

          <h4>Mão</h4>
          <Hand cards={player.hand} playerId={player.id} />
        </aside>
      </main>

      <footer className="game-footer">
        {lastError && <div className="error-banner" role="alert">{lastError}</div>}

        <div className="log">
          {gameState.log.slice(-4).map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="log-phase">{entry.phase}</span> {entry.message}
            </div>
          ))}
        </div>

        <button className="primary" onClick={() => dispatch({ type: 'PassPhase', playerId: player.id })}>
          {isLastPhase ? 'Encerrar turno →' : 'Avançar fase →'}
        </button>
      </footer>
    </div>
  );
}
