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
    otherKey: 'pctVotosCarlos' as keyof ScoreWeights,
    label: 'Pop. em Favelas',
    description: 'Tamanho da comunidade urbana vulnerável (Censo 2022)',
    icon: '🏘️',
  },
  {
    key: 'pctVotosCarlos' as keyof ScoreWeights,
    otherKey: 'populacaoFavelas' as keyof ScoreWeights,
    label: 'Apoio Político',
    description: '% de votos ao gestor estadual (eleições)',
    icon: '🗳️',
  },
];

const STEPS = [0, 25, 50, 75, 100];

export const ScoreControls: React.FC<ScoreControlsProps> = ({ weights, onChange }) => {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  /** Ao clicar num step, fixa o critério e balanceia o outro para 100 − step */
  const handleStep = (key: keyof ScoreWeights, otherKey: keyof ScoreWeights, step: number) => {
    onChange({ ...weights, [key]: step, [otherKey]: 100 - step });
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
      {/* Cabeçalho */}
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

      {/* Critérios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {CRITERIA.map(({ key, otherKey, label, description, icon }) => {
          const value = weights[key];
          const pct = totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0;
          return (
            <div key={key}>
              {/* Label + percentual efetivo */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
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

              {/* Botões discretos: 0 / 25 / 50 / 75 / 100 */}
              <div style={{ display: 'flex', gap: '0.25rem' }} title={description}>
                {STEPS.map((step) => {
                  const isActive = value === step;
                  return (
                    <button
                      key={step}
                      onClick={() => handleStep(key, otherKey, step)}
                      style={{
                        flex: 1,
                        padding: '0.22rem 0',
                        fontSize: '0.6rem',
                        fontWeight: isActive ? 700 : 400,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        border: isActive
                          ? '1px solid var(--accent-color)'
                          : '1px solid var(--border-color)',
                        background: isActive
                          ? 'rgba(253,189,19,0.18)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--accent-color)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {step}%
                    </button>
                  );
                })}
              </div>

              {/* Descrição */}
              <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
