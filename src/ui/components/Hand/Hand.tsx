import { useState } from 'react';
import { CardInstance } from '../../../core/cards/types';
import { getCard } from '../../../core/cards/cardRegistry';
import { useGameStore } from '../../../store/gameStore';
import CardVisual from '../Card/CardVisual';
import './Hand.css';

interface HandProps {
  cards: CardInstance[];
  playerId: string;
}

export default function Hand({ cards, playerId }: HandProps) {
  const { dispatch, select, selectedInstanceId, check } = useGameStore();
  // Cards in hand are small enough to scan but too small to read. Hovering
  // one raises a full-size copy, the way every table game on screen does it,
  // so the rules text never has to be squeezed into 150px to be usable.
  // Held by id, not by instance: a card that leaves the hand — because it was
  // just played — must stop being previewed, and deriving it from the current
  // hand makes that automatic rather than something to remember to clear.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = cards.find((c) => c.instanceId === previewId) ?? null;

  if (cards.length === 0) {
    return <div className="hand-empty">Mão vazia</div>;
  }

  return (
    <div className="hand">
      {preview && (
        <div className="card-preview" aria-hidden="true">
          <CardVisual
            definition={getCard(preview.cardId)}
            instance={preview}
            size="large"
          />
        </div>
      )}

      <div className="hand-cards">
        {cards.map((card) => {
          const action = { type: 'PlayCard' as const, playerId, instanceId: card.instanceId };
          const verdict = check(action);

          return (
            <div
              key={card.instanceId}
              className="hand-slot"
              onMouseEnter={() => setPreviewId(card.instanceId)}
              onMouseLeave={() =>
                setPreviewId((id) => (id === card.instanceId ? null : id))
              }
              onFocus={() => setPreviewId(card.instanceId)}
              onBlur={() => setPreviewId((id) => (id === card.instanceId ? null : id))}
            >
              <CardVisual
                definition={getCard(card.cardId)}
                instance={card}
                selected={selectedInstanceId === card.instanceId}
                disabledReason={verdict.valid ? undefined : verdict.reason}
                onClick={() => {
                  select(card.instanceId);
                  if (verdict.valid) dispatch(action);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
