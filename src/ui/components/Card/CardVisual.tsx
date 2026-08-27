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

/**
 * One card, built the way a printed card is: a frame, an art window, a
 * nameplate, a type line and a text box — each its own surface with its own
 * light. The parts are separate elements rather than one flat box because
 * that is what lets the card read as an object at 150px and still hold up
 * when it is enlarged.
 */
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
        <div className="card-face">
          {/* The window is arched, like the doorways the city is made of. */}
          <div className="card-art">
            <CardGlyph type={definition.type} />
          </div>

          <div className="card-plate">
            <h3 className="card-title">{definition.name}</h3>
          </div>

          <div className="card-typeline">
            <span className="card-type">{CARD_TYPE_LABEL[definition.type]}</span>
            {state && <span className="card-state">{MEMORY_STATE_LABEL[state]}</span>}
          </div>

          {definition.affinities?.length > 0 && (
            <div className="card-affinities">
              {definition.affinities.map((aff) => (
                <span key={aff} className="affinity-badge">{AFFINITY_LABEL[aff]}</span>
              ))}
            </div>
          )}

          <div className="card-textbox">
            {definition.description && <p className="description">{definition.description}</p>}
          </div>

          <footer className="card-foot">
            {/* What the card has become. Visible because a transformation
                nobody can see is a rule nobody can learn. */}
            {transformed && (
              <span className="card-transformed">{TRANSFORMATION_LABEL[transformed]}</span>
            )}
            {instance?.exhausted && <span className="card-flag">Exausta</span>}
          </footer>
        </div>

        {/* The cost sits on the frame's edge, half off the card, so it reads
            before anything else — the first question is always "can I?". */}
        {definition.cost !== undefined && (
          <span className="card-cost" title={`Custa ${definition.cost} de Memória`}>
            <span>{definition.cost}</span>
          </span>
        )}
      </div>
    </div>
  );
}
