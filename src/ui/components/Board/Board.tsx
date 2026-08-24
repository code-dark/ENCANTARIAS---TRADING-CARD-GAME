import { GameState, getCurrentPlayer } from '../../../core/game/gameState';
import CardVisual from '../Card/CardVisual';
import './Board.css';

interface BoardProps {
  gameState: GameState;
}

export default function Board({ gameState }: BoardProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const territory = currentPlayer.activeTerritory;

  if (!territory) {
    return <div className="board">No active territory</div>;
  }

  return (
    <div className="board">
      <div className="board-center">
        <div className="territory-card-wrapper">
          <CardVisual card={territory} />
          <div className="territory-label">Active Territory</div>
        </div>

        <div className="territory-details">
          <h3>{territory.name}</h3>
          <p className="territory-category">{territory.category}</p>

          {territory.affinities && territory.affinities.length > 0 && (
            <div className="affinities">
              <label>Affinities:</label>
              <div className="affinity-list">
                {territory.affinities.map((aff) => (
                  <span key={aff} className="affinity-tag">
                    {aff}
                  </span>
                ))}
              </div>
            </div>
          )}

          {territory.permanentEffect && (
            <div className="effect-box">
              <strong>Permanent Effect:</strong>
              <p>{territory.permanentEffect.description}</p>
            </div>
          )}

          {territory.placeAction && (
            <div className="action-box">
              <strong>{territory.placeAction.name}</strong>
              {territory.placeAction.description && (
                <p>{territory.placeAction.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="linked-cards">
        <h4>Linked Cards</h4>
        {currentPlayer.linkedCards.size > 0 ? (
          <div className="linked-cards-grid">
            {Array.from(currentPlayer.linkedCards.values()).map((cards) =>
              cards.map((card) => (
                <div key={card.id} className="linked-card">
                  <CardVisual card={card} size="small" />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="no-linked">No linked cards</div>
        )}
      </div>
    </div>
  );
}
