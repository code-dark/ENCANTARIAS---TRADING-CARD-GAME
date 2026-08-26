import { getCurrentPlayer, PHASE_ORDER } from '../../core/game/gameState';
import { OPPONENT_IDS } from '../../core/setup/verticalSlice';
import { useOpponent } from '../hooks/useOpponent';
import { getCard } from '../../core/cards/cardRegistry';
import { useGameStore } from '../../store/gameStore';
import PhaseIndicator from '../components/HUD/PhaseIndicator';
import Board from '../components/Board/Board';
import Hand from '../components/Hand/Hand';
import { JourneyPanel, RivalJourneys } from '../components/HUD/JourneyPanel';
import MatchEnd from '../components/HUD/MatchEnd';
import './GameScreen.css';

export default function GameScreen() {
  const { gameState, dispatch, lastError, check } = useGameStore();
  useOpponent(OPPONENT_IDS);

  if (!gameState) return null;

  const player = getCurrentPlayer(gameState);
  // The board follows whoever is playing, so the opponent's turn can be
  // watched rather than merely waited out.
  const opponentPlaying = OPPONENT_IDS.includes(player.id) && !gameState.isEnded;
  const isLastPhase = gameState.phase === PHASE_ORDER[PHASE_ORDER.length - 1];

  const drawAction = { type: 'DrawCard' as const, playerId: player.id };
  const drawVerdict = check(drawAction);

  const exploreAction = { type: 'Explore' as const, playerId: player.id };
  const exploreVerdict = check(exploreAction);

  return (
    <div className="game-screen">
      {gameState.isEnded && <MatchEnd state={gameState} />}

      <header className="game-header">
        <h1>ENCANTARIAS</h1>
        <div className="turn-info">
          Turno {gameState.turn} · <strong>{player.name}</strong>
          {opponentPlaying && <span className="thinking">está jogando…</span>}
        </div>
        <PhaseIndicator phase={gameState.phase} />
      </header>

      {gameState.pendingDiscovery && (
        <section className="transmission" role="dialog" aria-label="Memória encontrada">
          <div className="transmission-head">
            {gameState.pendingDiscovery.roll > 0 && (
              <span className="die">{gameState.pendingDiscovery.roll}</span>
            )}
            <div>
              <h3>
                {gameState.pendingDiscovery.mode === 'escolha'
                  ? 'O lugar oferece mais de um relato'
                  : gameState.pendingDiscovery.options.length > 1
                    ? `${gameState.pendingDiscovery.options.length} relatos vieram à tona`
                    : 'Algo veio à tona'}
              </h3>
              <p>
                {gameState.pendingDiscovery.mode === 'escolha'
                  ? 'Escolha um relato e leia-o em voz alta. O outro fica no mundo.'
                  : 'Leia cada relato em voz alta. Uma Memória só é computada depois de transmitida.'}
              </p>
            </div>
          </div>

          <div className="transmission-options">
            {gameState.pendingDiscovery.options.map((option) => {
              const def = getCard(option.cardId);
              return (
                <article key={option.instanceId} className="transmission-card">
                  <h4>{def.name}</h4>
                  {def.description && <p className="fact">{def.description}</p>}
                  {def.flavor && <p className="fact-flavor">{def.flavor}</p>}
                  <button
                    className="primary"
                    onClick={() =>
                      dispatch({
                        type: 'TransmitMemory',
                        playerId: gameState.pendingDiscovery!.playerId,
                        memoryInstanceId: option.instanceId,
                      })
                    }
                  >
                    Li em voz alta — transmitir
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

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

          {gameState.phase === 'Memoria' && (
            <button
              className="primary"
              disabled={!drawVerdict.valid}
              title={drawVerdict.reason}
              onClick={() => dispatch(drawAction)}
            >
              Comprar carta
            </button>
          )}

          {gameState.phase === 'Acao' && (
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

          <h4>Jornada</h4>
          <JourneyPanel player={player} />

          <h4>Outras Jornadas</h4>
          <RivalJourneys players={gameState.players} activeId={player.id} />

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

        <button
          className="primary"
          disabled={opponentPlaying}
          title={opponentPlaying ? 'Espere o oponente terminar o turno.' : undefined}
          onClick={() => dispatch({ type: 'PassPhase', playerId: player.id })}
        >
          {isLastPhase ? 'Encerrar turno →' : 'Avançar fase →'}
        </button>
      </footer>
    </div>
  );
}
