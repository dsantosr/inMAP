import React from 'react';
import type { ScoreWeights } from '../../types/prospeccao';
import { SlidersHorizontal } from 'lucide-react';

interface ScoreControlsProps {
  weights: ScoreWeights;
  onChange: (weights: ScoreWeights) => void;
}

const CRITERIA = [
  {
    key: 'populacaoFavelas' as keyof ScoreWeights,
    label: 'Pop. em Favelas',
    description: 'Tamanho da comunidade urbana vulnerável (Censo 2022)',
    icon: '🏘️',
  },
  {
    key: 'pctVotosCarlos' as keyof ScoreWeights,
    label: 'Apoio Político',
    description: '% de votos ao gestor estadual (eleições)',
    icon: '🗳️',
  },
];

export const ScoreControls: React.FC<ScoreControlsProps> = ({ weights, onChange }) => {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleChange = (key: keyof ScoreWeights, value: number) => {
    onChange({ ...weights, [key]: value });
  };

  const handleReset = () => {
    onChange({ populacaoFavelas: 50, pctVotosCarlos: 50 });
  };

  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '0.85rem 1rem',
      height: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <SlidersHorizontal size={14} color="var(--accent-color)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Critérios de Priorização
          </span>
        </div>
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.62rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Resetar
        </button>
      </div>

      {/* Legenda de cores */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        marginBottom: '0.85rem',
        padding: '0.5rem 0.6rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '6px',
      }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.1rem' }}>
          Legenda do mapa
        </div>
        {[
          { color: 'rgba(6,182,212,0.95)',  label: 'Ilha do Maranhão — maior pop.' },
          { color: 'rgba(8,50,120,0.65)',   label: 'Ilha do Maranhão — menor pop.' },
          { color: 'rgba(34,197,94,0.8)', label: 'REURB concluído (c/ títulos)' },
          { color: 'rgba(168,85,247,0.8)', label: 'REURB em Análise (sem títulos)' },
          { color: 'rgba(253,189,19,0.95)', label: 'Candidato — alta prioridade' },
          { color: 'rgba(80,20,10,0.6)',    label: 'Candidato — baixa prioridade' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '2px',
              background: color, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.15)',
            }} />
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CRITERIA.map(({ key, label, description, icon }) => {
          const value = weights[key];
          const pct = totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0;
          return (
            <div key={key}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>{label}</span>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--accent-color)',
                  fontWeight: 600,
                  minWidth: '28px',
                  textAlign: 'right',
                }}>
                  {pct}%
                </span>
              </div>
              <div title={description}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => handleChange(key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                {description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
