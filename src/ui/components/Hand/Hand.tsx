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

  if (cards.length === 0) {
    return <div className="hand-empty">Mão vazia</div>;
  }

  return (
    <div className="hand-cards">
      {cards.map((card) => {
        const action = { type: 'PlayCard' as const, playerId, instanceId: card.instanceId };
        const verdict = check(action);

        return (
          <CardVisual
            key={card.instanceId}
            definition={getCard(card.cardId)}
            instance={card}
            selected={selectedInstanceId === card.instanceId}
            disabledReason={verdict.valid ? undefined : verdict.reason}
            onClick={() => {
              select(card.instanceId);
              if (verdict.valid) dispatch(action);
            }}
          />
        );
      })}
    </div>
  );
}
