import { GamePhase, PHASE_ORDER } from '../../../core/game/gameState';
import { PHASE_LABEL } from '../../../core/i18n/labels';
import './PhaseIndicator.css';

interface PhaseIndicatorProps {
  phase: GamePhase;
}

/**
 * Where in the turn you are, as a number.
 *
 * It used to be a symbol per phase — ✦ ◈ → ∴ ⚡ — none of which exists in a
 * pixel typeface, so each would have rendered as an empty box. A step count
 * says more anyway: it tells you how far along the turn is, which a glyph
 * never did.
 */

const PHASE_DESCRIPTIONS: Record<GamePhase, string> = {
  Despertar: 'Reative cartas usadas',
  Memoria: 'Compre carta e recupere recursos',
  Travessia: 'Permaneça ou desloque-se',
  Manifestacao: 'Jogue Lenda, Personagem, Memória ou Objeto',
  Acao: 'Ative Território, Ressonância ou escute o lugar',
  Acontecimento: 'Resolva eventos e consequências',
  Encerramento: 'Verifique Ressonâncias e Transformações',
};

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(phase);

  return (
    <div className="phase-indicator">
      <div className="phase-display">
        <span className="phase-step">
          {currentIndex + 1}<small>/{PHASE_ORDER.length}</small>
        </span>
        <div className="phase-text">
          <div className="phase-name">{PHASE_LABEL[phase]}</div>
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
