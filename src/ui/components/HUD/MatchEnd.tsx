import { GameState } from '../../../core/game/gameState';
import { evaluateJourney } from '../../../core/mechanics/journey';
import './JourneyPanel.css';

/**
 * The end of the match, stated as the game states it: someone completed a
 * Jornada, and everyone else was slower. Nobody was removed from the table.
 */
export default function MatchEnd({ state }: { state: GameState }) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  const status = winner ? evaluateJourney(winner) : undefined;

  return (
    <div className="match-end" role="dialog" aria-label="Fim da partida">
      <div className="match-end-card">
        <h2>{winner ? 'Jornada concluída' : 'A partida se encerra'}</h2>

        {winner && status ? (
          <>
            <p className="winner">
              {winner.name} completa <strong>{status.journey.name}</strong>.
            </p>

            <ul className="match-end-objectives">
              {status.objectives.map((o) => (
                <li key={o.objective.id}>◆ {o.objective.description}</li>
              ))}
            </ul>

            <p className="defeat">
              {state.players
                .filter((p) => p.id !== winner.id)
                .map((p) => p.name)
                .join(', ')}{' '}
              não perde por ter sido derrotado, e sim por não ter chegado
              primeiro: a verificação de fim de turno encontrou uma Jornada
              cumprida e a partida terminou ali.
            </p>
          </>
        ) : (
          <p className="defeat">
            O limite de turnos foi alcançado sem que nenhuma Jornada se
            completasse. Ninguém vence: a cidade continua contando o que já
            contava.
          </p>
        )}
      </div>
    </div>
  );
}
