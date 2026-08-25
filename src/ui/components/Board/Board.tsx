import { Player, activeTerritoryOf } from '../../../core/game/gameState';
import { getCard } from '../../../core/cards/cardRegistry';
import { TerritoryCard } from '../../../core/cards/types';
import { traversalCost } from '../../../core/mechanics/traversal';
import { isStorage, storedIn, capacityOf, openContainers } from '../../../core/mechanics/objects';
import { AFFINITY_LABEL } from '../../../core/i18n/labels';
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

  const containers = player.inPlay.filter(isStorage);
  const containerIds = new Set(containers.map((c) => c.instanceId));
  const inAContainer = (c: { linkedTo?: string }) =>
    !!c.linkedTo && containerIds.has(c.linkedTo);

  const here = player.inPlay.filter((c) => c.linkedTo === active.instanceId);

  // Kept in an object is not the same as left behind by a Travessia: one is a
  // choice to preserve, the other is what the ground would not release.
  const elsewhere = player.inPlay.filter(
    (c) => c.linkedTo !== active.instanceId && !inAContainer(c)
  );

  const spaceLeft = openContainers(player.inPlay);

  return (
    <div className="board">
      <section className="territory-panel">
        <header>
          <h2>{territory.name}</h2>
          <span className="territory-category">{territory.category}</span>
        </header>

        <div className="affinity-list">
          {territory.affinities.map((aff) => (
            <span key={aff} className="affinity-tag">{AFFINITY_LABEL[aff]}</span>
          ))}
        </div>

        {territory.permanentEffect && (
          <p className="effect">{territory.permanentEffect.description}</p>
        )}

        {/* What has happened here. The place keeps it after the turn ends, and
            other cards read it — so it has to be on screen. */}
        {Object.entries(active.counters).filter(([, n]) => n > 0).length > 0 && (
          <div className="territory-marks">
            <h4>O que ficou neste lugar</h4>
            <div className="mark-list">
              {Object.entries(active.counters)
                .filter(([, n]) => n > 0)
                .map(([mark, n]) => (
                  <span key={mark} className="mark">
                    {mark}{n > 1 ? ` ×${n}` : ''}
                  </span>
                ))}
            </div>
          </div>
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

            const isMemory = getCard(c.cardId).type === 'Memory';
            const box = spaceLeft[0];
            const store = box && {
              type: 'StoreMemory' as const,
              playerId: player.id,
              memoryInstanceId: c.instanceId,
              containerInstanceId: box.instanceId,
            };
            const storeVerdict =
              isActivePlayer && store ? check(store) : { valid: false, reason: undefined };

            return (
              <div key={c.instanceId} className="table-card">
                <CardVisual
                  definition={getCard(c.cardId)}
                  instance={c}
                  size="small"
                  disabledReason={verdict.valid ? undefined : verdict.reason}
                  onClick={verdict.valid ? () => dispatch(action) : undefined}
                />
                {isMemory && store && (
                  <button
                    className="tiny"
                    disabled={!storeVerdict.valid}
                    title={
                      storeVerdict.valid
                        ? `Guardar em ${getCard(box.cardId).name} — sai de circulação`
                        : storeVerdict.reason
                    }
                    onClick={() => dispatch(store)}
                  >
                    Guardar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {containers.length > 0 && (
          <div className="containers">
            <h4>Guardado</h4>
            {containers.map((box) => {
              const kept = storedIn(player.inPlay, box.instanceId);
              const def = getCard(box.cardId);

              return (
                <div key={box.instanceId} className="container-slot">
                  <div className="container-head">
                    <strong>{def.name}</strong>
                    <span className="container-count">
                      {kept.length}/{capacityOf(box)}
                    </span>
                  </div>

                  {kept.length === 0 ? (
                    <p className="muted">Vazia.</p>
                  ) : (
                    <div className="card-row">
                      {kept.map((c) => {
                        const retrieve = {
                          type: 'RetrieveMemory' as const,
                          playerId: player.id,
                          memoryInstanceId: c.instanceId,
                        };
                        const verdict = isActivePlayer
                          ? check(retrieve)
                          : { valid: false, reason: undefined };

                        return (
                          <div key={c.instanceId} className="kept-card">
                            <CardVisual
                              definition={getCard(c.cardId)}
                              instance={c}
                              size="small"
                              disabledReason="Fora de circulação enquanto guardada."
                            />
                            <button
                              className="tiny"
                              disabled={!verdict.valid}
                              title={verdict.valid ? 'Devolver à circulação' : verdict.reason}
                              onClick={() => dispatch(retrieve)}
                            >
                              Retirar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
