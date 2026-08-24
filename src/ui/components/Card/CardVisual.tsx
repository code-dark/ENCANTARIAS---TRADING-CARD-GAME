import { AnyCard, CardInstance } from '../../../core/cards/types';
import './CardVisual.css';

interface CardVisualProps {
  /** The immutable card data. */
  definition: AnyCard;
  /** The copy in play, when this card is on the table or in a hand. */
  instance?: CardInstance;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  /** Rendered dimmed with a reason the player can read on hover. */
  disabledReason?: string;
  onClick?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  Territory: 'Território',
  Legend: 'Lenda',
  Character: 'Personagem',
  Memory: 'Memória',
  Event: 'Acontecimento',
  Artifact: 'Objeto',
};

export default function CardVisual({
  definition,
  instance,
  size = 'medium',
  selected = false,
  disabledReason,
  onClick,
}: CardVisualProps) {
  const state = instance?.memoryState ?? definition.memoryState;
  const classes = [
    'card-visual',
    `card-${size}`,
    `card-type-${definition.type}`,
    selected ? 'selected' : '',
    disabledReason ? 'disabled' : '',
    instance?.exhausted ? 'exhausted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      title={disabledReason ?? definition.description ?? definition.name}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="card-header">
        <span className="card-type">{TYPE_LABEL[definition.type] ?? definition.type}</span>
        {definition.cost !== undefined && <span className="card-cost">{definition.cost}</span>}
      </div>

      <div className="card-title">{definition.name}</div>

      {definition.affinities?.length > 0 && (
        <div className="card-affinities">
          {definition.affinities.map((aff) => (
            <span key={aff} className="affinity-badge">{aff}</span>
          ))}
        </div>
      )}

      {state && <div className="card-state">{state}</div>}

      {definition.description && (
        <p className="description">{definition.description}</p>
      )}

      {instance?.exhausted && <div className="card-flag">Exausta</div>}
    </div>
  );
}
