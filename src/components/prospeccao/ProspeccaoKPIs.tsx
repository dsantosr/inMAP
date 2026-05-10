import React from 'react';
import type { MunicipioData } from '../../types/prospeccao';

interface ProspeccaoKPIsProps {
  municipios: MunicipioData[];
}

export const ProspeccaoKPIs: React.FC<ProspeccaoKPIsProps> = ({ municipios }) => {
  const total = municipios.length;
  const comFavelas = municipios.filter((m) => m.populacaoFavelas !== null && m.populacaoFavelas > 0).length;
  const semReurb = municipios.filter((m) => m.statusReurb === 'sem_reurb').length;
  const travados = municipios.filter((m) => m.statusReurb === 'em_andamento').length;
  const populacaoTotalFavelas = municipios.reduce((acc, m) => acc + (m.populacaoFavelas ?? 0), 0);

  const kpis = [
    {
      label: 'Com Dados de Favelas',
      value: comFavelas.toLocaleString('pt-BR'),
      icon: '🏘️',
      color: '#3b82f6',
      sub: `Censo 2022 · ${Math.round((comFavelas / total) * 100)}% do total`,
    },
    {
      label: 'Pessoas em Favelas',
      value: populacaoTotalFavelas > 1000
        ? `${(populacaoTotalFavelas / 1000).toFixed(1)}k`
        : populacaoTotalFavelas.toLocaleString('pt-BR'),
      icon: '👥',
      color: '#f97316',
      sub: 'população vulnerável mapeada',
    },
    {
      label: 'Sem REURB',
      value: semReurb.toLocaleString('pt-BR'),
      icon: '⬜',
      color: 'var(--text-secondary)',
      sub: 'municípios sem processo ativo',
    },
    {
      label: 'REURB em Análise',
      value: travados.toLocaleString('pt-BR'),
      icon: '🟣',
      color: '#a855f7',
      sub: 'cadastros no SICARF sem títulos emitidos',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '0.75rem',
      marginBottom: '1rem',
    }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          <div style={{ fontSize: '1.1rem' }}>{kpi.icon}</div>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: kpi.color,
            lineHeight: 1,
          }}>
            {kpi.value}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {kpi.label}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  );
};
