import { GamePhase, PHASE_ORDER } from '../../../core/game/gameState';
import './PhaseIndicator.css';

interface PhaseIndicatorProps {
  phase: GamePhase;
}

const PHASE_ICONS: Record<GamePhase, string> = {
  Awaken: '✦',
  Memory: '◈',
  Movement: '→',
  Manifestation: '∴',
  Action: '⚡',
  Consequence: '✧',
};

const PHASE_DESCRIPTIONS: Record<GamePhase, string> = {
  Awaken: 'Reactivate cards and effects',
  Memory: 'Draw and manage resources',
  Movement: 'Stay or traverse territory',
  Manifestation: 'Play cards from hand',
  Action: 'Activate abilities and resonances',
  Consequence: 'Resolve effects and triggers',
};

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(phase);

  return (
    <div className="phase-indicator">
      <div className="phase-display">
        <span className="phase-icon">{PHASE_ICONS[phase]}</span>
        <div className="phase-text">
          <div className="phase-name">{phase}</div>
          <div className="phase-description">{PHASE_DESCRIPTIONS[phase]}</div>
        </div>
      </div>

      <div className="phase-progress">
        {PHASE_ORDER.map((p, index) => (
          <div
            key={p}
            className={`phase-dot ${index === currentIndex ? 'active' : ''} ${
              index < currentIndex ? 'completed' : ''
            }`}
            title={p}
          />
        ))}
      </div>
    </div>
  );
}
