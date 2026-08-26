import { AnyCard, CardInstance } from '../../../core/cards/types';
import {
  AFFINITY_LABEL, CARD_TYPE_LABEL, MEMORY_STATE_LABEL, TRANSFORMATION_LABEL,
} from '../../../core/i18n/labels';
import CardGlyph from './CardGlyph';
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

export default function CardVisual({
  definition,
  instance,
  size = 'medium',
  selected = false,
  disabledReason,
  onClick,
}: CardVisualProps) {
  const state = instance?.memoryState ?? definition.memoryState;
  const transformed = instance?.transformationState ?? definition.transformationState;
  const playable = !!onClick && !disabledReason;

  const classes = [
    'card-visual',
    `card-${size}`,
    `card-type-${definition.type}`,
    selected ? 'selected' : '',
    disabledReason ? 'disabled' : '',
    playable ? 'playable' : '',
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
      <div className="card-frame">
        <header className="card-header">
          <span className="card-type">{CARD_TYPE_LABEL[definition.type]}</span>
          {definition.cost !== undefined && (
            <span className="card-cost" title={`Custa ${definition.cost} de Memória`}>
              {definition.cost}
            </span>
          )}
        </header>

        <h3 className="card-title">{definition.name}</h3>

        <div className="card-art">
          <CardGlyph type={definition.type} />
        </div>

        {definition.affinities?.length > 0 && (
          <div className="card-affinities">
            {definition.affinities.map((aff) => (
              <span key={aff} className="affinity-badge">{AFFINITY_LABEL[aff]}</span>
            ))}
          </div>
        )}

        <div className="card-text">
          {definition.description && <p className="description">{definition.description}</p>}
        </div>

        <footer className="card-foot">
          {state && <span className="card-state">{MEMORY_STATE_LABEL[state]}</span>}
          {/* What the card has become. Visible because a transformation nobody
              can see is a rule nobody can learn. */}
          {transformed && (
            <span className="card-transformed">{TRANSFORMATION_LABEL[transformed]}</span>
          )}
          {instance?.exhausted && <span className="card-flag">Exausta</span>}
        </footer>
      </div>
    </div>
  );
}
