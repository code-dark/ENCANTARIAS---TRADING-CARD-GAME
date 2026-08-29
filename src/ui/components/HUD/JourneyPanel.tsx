import { Player } from '../../../core/game/gameState';
import { evaluateJourney } from '../../../core/mechanics/journey';
import './JourneyPanel.css';

/**
 * The Jornada, shown as it will be verified.
 *
 * What is on screen is the same reading the system runs at the end of the turn,
 * so a player never has to guess whether something counted. The counts move as
 * the table moves — including downwards, when what an objective asked for is
 * spent.
 */
export function JourneyPanel({ player }: { player: Player }) {
  const status = evaluateJourney(player);
  if (!status) return null;

  return (
    <div className={`journey ${status.completed ? 'journey-complete' : ''}`}>
      <h5>{status.journey.name}</h5>
      <p className="journey-desc">{status.journey.description}</p>

      <ul className="journey-objectives">
        {status.objectives.map((o) => (
          <li key={o.objective.id} className={o.met ? 'met' : ''}>
            <span className="mark" aria-hidden="true">{o.met ? '◆' : '◇'}</span>
            <span className="objective-text">{o.objective.description}</span>
            <span className="objective-count">
              {Math.min(o.current, o.needed)}/{o.needed}
            </span>
          </li>
        ))}
      </ul>

      <p className="journey-note">
        {status.completed
          ? 'Todos os requisitos cumpridos. A Jornada se conclui no fim do turno.'
          : 'Verificada automaticamente ao fim de cada turno.'}
      </p>
    </div>
  );
}

/** One line per rival: enough to feel the race, not enough to play their turn. */
export function RivalJourneys({ players, activeId }: { players: Player[]; activeId: string }) {
  const rivals = players.filter((p) => p.id !== activeId);
  if (!rivals.length) return null;

  return (
    <ul className="rival-journeys">
      {rivals.map((p) => {
        const status = evaluateJourney(p);
        if (!status) return null;
        const met = status.objectives.filter((o) => o.met).length;

        return (
          <li key={p.id}>
            <span className="rival-name">{p.name}</span>
            <span className="rival-journey">{status.journey.name}</span>
            <span className="objective-count">{met}/{status.objectives.length}</span>
          </li>
        );
      })}
    </ul>
  );
}
