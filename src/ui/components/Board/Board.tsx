import { Player, activeTerritoryOf } from '../../../core/game/gameState';
import { getCard } from '../../../core/cards/cardRegistry';
import { TerritoryCard } from '../../../core/cards/types';
import { traversalCost } from '../../../core/mechanics/traversal';
import { useGameStore } from '../../../store/gameStore';
import CardVisual from '../Card/CardVisual';
import './Board.css';

interface BoardProps {
  player: Player;
  isActivePlayer: boolean;
}

export default function Board({ player, isActivePlayer }: BoardProps) {
  const { dispatch, check } = useGameStore();
  const active = activeTerritoryOf(player);

  if (!active) {
    return <div className="board board-empty">Sem Território ativo</div>;
  }

  const territory = getCard(active.cardId) as TerritoryCard;

  // Manifestations still rooted in the territory the player left behind.
  const here = player.inPlay.filter((c) => c.linkedTo === active.instanceId);
  const elsewhere = player.inPlay.filter((c) => c.linkedTo !== active.instanceId);

  return (
    <div className="board">
      <section className="territory-panel">
        <header>
          <h2>{territory.name}</h2>
          <span className="territory-category">{territory.category}</span>
        </header>

        <div className="affinity-list">
          {territory.affinities.map((aff) => (
            <span key={aff} className="affinity-tag">{aff}</span>
          ))}
        </div>

        {territory.permanentEffect && (
          <p className="effect">{territory.permanentEffect.description}</p>
        )}

        <div className="territory-switcher">
          <h4>Seus Territórios</h4>
          <div className="territory-options">
            {player.territories.map((t) => {
              const def = getCard(t.cardId);
              const isActive = t.instanceId === active.instanceId;
              const action = {
                type: 'Traverse' as const,
                playerId: player.id,
                territoryInstanceId: t.instanceId,
              };
              const verdict = isActivePlayer ? check(action) : { valid: false, reason: undefined };
              const cost = isActive
                ? 0
                : traversalCost(territory, def as TerritoryCard);

              return (
                <button
                  key={t.instanceId}
                  className={isActive ? 'territory-option active' : 'territory-option'}
                  disabled={!verdict.valid}
                  title={
                    verdict.valid
                      ? `Travessia para ${def.name} — custa ${cost} Memória`
                      : verdict.reason
                  }
                  onClick={() => dispatch(action)}
                >
                  {def.name}
                  {!isActive && <span className="travessia-cost">{cost}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="manifestations">
        <h4>Manifestações aqui ({here.length})</h4>
        <div className="card-row">
          {here.length === 0 && <p className="muted">Nada manifestado neste Território.</p>}
          {here.map((c) => {
            const action = {
              type: 'ActivateResonance' as const,
              playerId: player.id,
              instanceId: c.instanceId,
            };
            const verdict = isActivePlayer ? check(action) : { valid: false, reason: undefined };

            return (
              <CardVisual
                key={c.instanceId}
                definition={getCard(c.cardId)}
                instance={c}
                size="small"
                disabledReason={verdict.valid ? undefined : verdict.reason}
                onClick={verdict.valid ? () => dispatch(action) : undefined}
              />
            );
          })}
        </div>

        {elsewhere.length > 0 && (
          <>
            <h4 className="left-behind-title">
              Ficaram para trás ({elsewhere.length})
            </h4>
            <p className="muted">
              Permaneceram enraizadas no Território de origem após a Travessia.
            </p>
            <div className="card-row dimmed">
              {elsewhere.map((c) => (
                <CardVisual
                  key={c.instanceId}
                  definition={getCard(c.cardId)}
                  instance={c}
                  size="small"
                  disabledReason="Ficou no Território anterior."
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
