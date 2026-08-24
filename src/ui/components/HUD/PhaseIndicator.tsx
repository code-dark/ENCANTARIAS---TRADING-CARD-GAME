import { GamePhase, PHASE_ORDER } from '../../../core/game/gameState';
import './PhaseIndicator.css';

interface PhaseIndicatorProps {
  phase: GamePhase;
}

const PHASE_ICONS: Record<GamePhase, string> = {
  Despertar: '✦',
  Memoria: '◈',
  Travessia: '→',
  Manifestacao: '∴',
  Acao: '⚡',
  Acontecimento: '⌁',
  Encerramento: '✧',
};

const PHASE_NAMES: Record<GamePhase, string> = {
  Despertar: 'Despertar',
  Memoria: 'Memória',
  Travessia: 'Travessia',
  Manifestacao: 'Manifestação',
  Acao: 'Ação',
  Acontecimento: 'Acontecimento',
  Encerramento: 'Encerramento',
};

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
        <span className="phase-icon">{PHASE_ICONS[phase]}</span>
        <div className="phase-text">
          <div className="phase-name">{PHASE_NAMES[phase]}</div>
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
