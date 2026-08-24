import { AnyCard } from '../../../core/cards/types';
import './CardVisual.css';

interface CardVisualProps {
  card: AnyCard;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onClick?: () => void;
}

const CARD_TYPE_COLORS: Record<string, string> = {
  Territory: '#4a6fa5',
  Legend: '#a84e4a',
  Character: '#7a6e4a',
  Memory: '#4a6a7a',
  Event: '#6a4a7a',
  Artifact: '#6a7a4a',
};

export default function CardVisual({
  card,
  size = 'medium',
  selected = false,
  onClick,
}: CardVisualProps) {
  const borderColor = CARD_TYPE_COLORS[card.type] || '#4a6fa5';

  return (
    <div
      className={`card-visual card-${size} card-type-${card.type} ${
        selected ? 'selected' : ''
      }`}
      style={{ '--border-color': borderColor } as any}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-type">{card.type}</div>
        {card.cost !== undefined && <div className="card-cost">{card.cost}</div>}
      </div>

      <div className="card-title">{card.name}</div>

      {card.affinities && card.affinities.length > 0 && (
        <div className="card-affinities">
          {card.affinities.slice(0, 3).map((aff) => (
            <span key={aff} className="affinity-badge">
              {aff.substring(0, 3)}
            </span>
          ))}
        </div>
      )}

      <div className="card-body">
        {card.description && <p className="description">{card.description}</p>}
      </div>

      {card.flavor && <div className="card-flavor">{card.flavor}</div>}

      <div className="card-footer">
        <span className="card-id-short">{card.id.substring(0, 8)}</span>
      </div>
    </div>
  );
}
