import React, { useState, useMemo } from 'react';
import type { MunicipioData, CategoriaOportunidade } from '../../types/prospeccao';
import { CATEGORIA_LABELS, CATEGORIA_COLORS } from '../../types/prospeccao';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface RankingTableProps {
  municipios: MunicipioData[];
  selectedMunicipio: string | null;
  onSelect: (nome: string) => void;
}

type SortKey = 'scoreTotal' | 'pctVotosCarlos' | 'qtVotos' | 'pctNulosBrancos' | 'populacaoFavelas' | 'nome' | 'categoria';
type SortDir = 'asc' | 'desc';

const CATEGORIAS: CategoriaOportunidade[] = [
  'alta_prioridade',
  'media_alta',
  'oportunidade_politica',
  'reativacao',
  'em_andamento',
];

export const RankingTable: React.FC<RankingTableProps> = ({
  municipios,
  selectedMunicipio,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('scoreTotal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedCats, setSelectedCats] = useState<Set<CategoriaOportunidade>>(new Set(CATEGORIAS));
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return municipios
      .filter((m) => {
        if (!selectedCats.has(m.categoria)) return false;
        if (q && !m.nome.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        let va: number | string = 0;
        let vb: number | string = 0;
        if (sortKey === 'nome') { va = a.nome; vb = b.nome; }
        else if (sortKey === 'categoria') { va = a.categoria; vb = b.categoria; }
        else if (sortKey === 'populacaoFavelas') { va = a.populacaoFavelas ?? -1; vb = b.populacaoFavelas ?? -1; }
        else { va = a[sortKey] as number; vb = b[sortKey] as number; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [municipios, search, sortKey, sortDir, selectedCats]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const toggleCat = (cat: CategoriaOportunidade) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={10} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '0.5rem 0.6rem',
    fontSize: '0.62rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-secondary)',
    background: 'var(--panel-bg)',
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filtros */}
      <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--panel-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.35rem 0.6rem',
        }}>
          <Search size={12} color="var(--text-secondary)" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar município..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              flex: 1,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              style={{
                fontSize: '0.6rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: `1px solid ${selectedCats.has(cat) ? CATEGORIA_COLORS[cat] : 'var(--border-color)'}`,
                background: selectedCats.has(cat) ? `${CATEGORIA_COLORS[cat]}22` : 'transparent',
                color: selectedCats.has(cat) ? CATEGORIA_COLORS[cat] : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {CATEGORIA_LABELS[cat]}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
          {filtered.length} município{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }} onClick={() => handleSort('nome')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Município <SortIcon k="nome" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('categoria')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                  Cat. <SortIcon k="categoria" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('scoreTotal')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  Score <SortIcon k="scoreTotal" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('pctVotosCarlos')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  Cand. % <SortIcon k="pctVotosCarlos" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('qtVotos')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  Votos Cand. <SortIcon k="qtVotos" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('pctNulosBrancos')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  Nulos/Brancos <SortIcon k="pctNulosBrancos" />
                </div>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('populacaoFavelas')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  Pop. Fav. <SortIcon k="populacaoFavelas" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((m, i) => {
              const isSelected = m.nome === selectedMunicipio;
              return (
                <tr
                  key={m.nome}
                  onClick={() => onSelect(m.nome)}
                  style={{
                    background: isSelected
                      ? 'rgba(253,189,19,0.12)'
                      : i % 2 === 0
                      ? 'transparent'
                      : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.55rem',
                        color: 'var(--text-secondary)',
                        minWidth: '16px',
                      }}>
                        #{page * PAGE_SIZE + i + 1}
                      </span>
                      {m.nome}
                    </div>
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '0.58rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      background: `${CATEGORIA_COLORS[m.categoria]}22`,
                      color: CATEGORIA_COLORS[m.categoria],
                      border: `1px solid ${CATEGORIA_COLORS[m.categoria]}44`,
                      whiteSpace: 'nowrap',
                    }}>
                      {CATEGORIA_LABELS[m.categoria].split(' ')[0]}
                    </span>
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 600, color: 'var(--accent-color)' }}>
                    {m.scoreTotal}
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {m.pctVotosCarlos.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {m.qtVotos.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {m.pctNulosBrancos.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {m.populacaoFavelas != null
                      ? m.populacaoFavelas.toLocaleString('pt-BR')
                      : <span style={{ color: 'var(--border-color)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                  Nenhum município encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          fontSize: '0.65rem',
          color: 'var(--text-secondary)',
        }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page === 0 ? 0.4 : 1 }}
          >‹</button>
          <span>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >›</button>
        </div>
      )}
    </div>
  );
};
