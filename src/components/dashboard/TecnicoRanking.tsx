import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import type { ProcessRecord } from '../../types/processTypes';

interface TecnicoRankingProps {
  data: ProcessRecord[];
  concludedSituacoes: Set<string>;
}

interface TecnicoStats {
  tecnico: string;
  total: number;
  naoConcluidos: number;
  concluidos: number;
  percentualPendente: number;
}

const PAGE_SIZE = 15;

export const TecnicoRanking: React.FC<TecnicoRankingProps> = ({ data, concludedSituacoes }) => {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Calculate stats per technician
  const stats: TecnicoStats[] = (() => {
    const map = new Map<string, { total: number; naoConcluidos: number }>();
    for (const r of data) {
      const key = r.tecnicoResponsavel || '(sem técnico)';
      const entry = map.get(key) || { total: 0, naoConcluidos: 0 };
      entry.total++;
      if (!concludedSituacoes.has(r.situacao)) {
        entry.naoConcluidos++;
      }
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([tecnico, { total, naoConcluidos }]) => ({
        tecnico,
        total,
        naoConcluidos,
        concluidos: total - naoConcluidos,
        percentualPendente: total > 0 ? (naoConcluidos / total) * 100 : 0,
      }))
      .sort((a, b) => b.naoConcluidos - a.naoConcluidos);
  })();

  const filtered = stats.filter(t =>
    t.tecnico.toLowerCase().includes(search.toLowerCase())
  );

  const visible = filtered.slice(0, visibleCount);
  const maxNaoConcluidos = stats.length > 0 ? stats[0].naoConcluidos : 1;

  const getBarColor = (pct: number) => {
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f97316';
    if (pct >= 50) return '#eab308';
    if (pct >= 25) return '#22c55e';
    return '#16a34a';
  };

  return (
    <div className="dashboard-card ranking-card">
      <div className="card-header">
        <h3><Users size={16} /> Acúmulo por Técnico Responsável</h3>
        <div className="ranking-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar técnico..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
          />
        </div>
      </div>
      <div className="ranking-list">
        {visible.map((item) => {
          const globalIndex = stats.indexOf(item);
          const barWidth = maxNaoConcluidos > 0 ? (item.naoConcluidos / maxNaoConcluidos) * 100 : 0;

          return (
            <div key={item.tecnico} className="ranking-item" style={{ cursor: 'default' }}>
              <div className="ranking-position">
                {globalIndex + 1}º
              </div>
              <div className="ranking-info">
                <div className="ranking-name-row">
                  <span className="ranking-name">{item.tecnico}</span>
                  <span className="ranking-counts">
                    <span className="ranking-nao-deferidos">{item.naoConcluidos.toLocaleString('pt-BR')}</span>
                    <span className="ranking-total"> / {item.total.toLocaleString('pt-BR')}</span>
                  </span>
                </div>
                <div className="ranking-bar-container">
                  <div
                    className="ranking-bar"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: getBarColor(item.percentualPendente),
                    }}
                  />
                </div>
                <div className="ranking-meta">
                  <span style={{ color: getBarColor(item.percentualPendente) }}>
                    {item.percentualPendente.toFixed(1)}% pendente
                  </span>
                  <span style={{ color: 'var(--accent-color)', fontSize: '0.7rem' }}>
                    {item.concluidos.toLocaleString('pt-BR')} concluídos
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="ranking-empty">Nenhum técnico encontrado</div>
        )}
      </div>
      {visibleCount < filtered.length && (
        <button
          className="ranking-load-more"
          onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
        >
          Ver mais ({filtered.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );
};
