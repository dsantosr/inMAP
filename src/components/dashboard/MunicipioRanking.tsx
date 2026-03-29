import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, MapPin, Hash, Percent } from 'lucide-react';
import type { MunicipioGargalo } from '../../types/processTypes';

interface MunicipioRankingProps {
  ranking: MunicipioGargalo[];
  onSelectMunicipio: (municipio: string) => void;
  selectedMunicipio: string | null;
}

type SortMode = 'absolute' | 'percent';

const PAGE_SIZE = 20;

export const MunicipioRanking: React.FC<MunicipioRankingProps> = ({
  ranking,
  onSelectMunicipio,
  selectedMunicipio,
}) => {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedMunicipio, setExpandedMunicipio] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('absolute');

  const sorted = useMemo(() => {
    if (sortMode === 'absolute') return ranking;
    return [...ranking].sort((a, b) => b.percentualGargalo - a.percentualGargalo);
  }, [ranking, sortMode]);

  const filtered = sorted.filter(m =>
    m.municipio.toLowerCase().includes(search.toLowerCase())
  );

  const visible = filtered.slice(0, visibleCount);

  const maxAbsolute = ranking.length > 0
    ? Math.max(...ranking.map(r => r.processosNaoDeferidos))
    : 1;

  const getBarWidth = (item: MunicipioGargalo) => {
    if (sortMode === 'percent') {
      return item.percentualGargalo;
    }
    return maxAbsolute > 0 ? (item.processosNaoDeferidos / maxAbsolute) * 100 : 0;
  };

  const getBarColor = (percentual: number) => {
    if (percentual >= 90) return '#ef4444';
    if (percentual >= 75) return '#f97316';
    if (percentual >= 50) return '#eab308';
    if (percentual >= 25) return '#22c55e';
    return '#16a34a';
  };

  return (
    <div className="dashboard-card ranking-card">
      <div className="card-header">
        <h3><MapPin size={16} /> Ranking de Municípios por Gargalo</h3>
        <div className="ranking-header-controls">
          <div className="sort-toggle">
            <button
              className={`sort-toggle-btn ${sortMode === 'absolute' ? 'active' : ''}`}
              onClick={() => setSortMode('absolute')}
              title="Ordenar por quantidade absoluta"
            >
              <Hash size={12} /> Qtd
            </button>
            <button
              className={`sort-toggle-btn ${sortMode === 'percent' ? 'active' : ''}`}
              onClick={() => setSortMode('percent')}
              title="Ordenar por percentual de gargalo"
            >
              <Percent size={12} /> %
            </button>
          </div>
          <div className="ranking-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar município..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            />
          </div>
        </div>
      </div>
      <div className="ranking-list">
        {visible.map((item) => {
          const globalIndex = sorted.indexOf(item);
          const isExpanded = expandedMunicipio === item.municipio;
          const isSelected = selectedMunicipio === item.municipio;
          const barWidth = getBarWidth(item);

          return (
            <div key={item.municipio}>
              <div
                className={`ranking-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectMunicipio(isSelected ? '' : item.municipio)}
              >
                <div className="ranking-position">
                  {globalIndex + 1}º
                </div>
                <div className="ranking-info">
                  <div className="ranking-name-row">
                    <span className="ranking-name">{item.municipio}</span>
                    <span className="ranking-counts">
                      <span className="ranking-nao-deferidos">{item.processosNaoDeferidos.toLocaleString('pt-BR')}</span>
                      <span className="ranking-total"> / {item.totalProcessos.toLocaleString('pt-BR')}</span>
                    </span>
                  </div>
                  <div className="ranking-bar-container">
                    <div
                      className="ranking-bar"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: getBarColor(item.percentualGargalo),
                      }}
                    />
                  </div>
                  <div className="ranking-meta">
                    <span style={{ color: getBarColor(item.percentualGargalo) }}>
                      {item.percentualGargalo.toFixed(1)}% gargalo
                    </span>
                    <button
                      className="ranking-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMunicipio(isExpanded ? null : item.municipio);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="ranking-details">
                  <div className="ranking-detail-section">
                    <h4>Top Situações (pendentes)</h4>
                    {item.topSituacoes.map(s => (
                      <div key={s.name} className="ranking-detail-item">
                        <span>{s.name}</span>
                        <span className="ranking-detail-value">{s.value}</span>
                      </div>
                    ))}
                    {item.topSituacoes.length === 0 && <span className="text-muted">Todos ignorados</span>}
                  </div>
                  <div className="ranking-detail-section">
                    <h4>Top Setores</h4>
                    {item.topSetores.map(s => (
                      <div key={s.name} className="ranking-detail-item">
                        <span>{s.name}</span>
                        <span className="ranking-detail-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="ranking-empty">Nenhum município encontrado</div>
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
