import { AnyCard } from '../../../core/cards/types';
import CardVisual from '../Card/CardVisual';
import './Hand.css';

interface HandProps {
  cards: AnyCard[];
}

export default function Hand({ cards }: HandProps) {
  return (
    <div className="hand">
      {cards.length === 0 ? (
        <div className="hand-empty">Your hand is empty</div>
      ) : (
        <div className="hand-cards">
          {cards.map((card, index) => (
            <div key={`${card.id}-${index}`} className="hand-card">
              <CardVisual card={card} size="medium" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
