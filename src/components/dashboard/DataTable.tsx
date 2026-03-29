import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import type { ProcessRecord } from '../../types/processTypes';

interface DataTableProps {
  data: ProcessRecord[];
}

type SortField = keyof ProcessRecord;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortField; label: string; width?: string }[] = [
  { key: 'processo', label: 'Processo', width: '130px' },
  { key: 'municipio', label: 'Município', width: '150px' },
  { key: 'setor', label: 'Setor', width: '150px' },
  { key: 'tipoProcesso', label: 'Tipo', width: '150px' },
  { key: 'situacao', label: 'Situação', width: '200px' },
  { key: 'tecnicoResponsavel', label: 'Técnico', width: '150px' },
  { key: 'nomeInteressado', label: 'Interessado', width: '180px' },
  { key: 'bairro', label: 'Bairro', width: '130px' },
  { key: 'areaAssentamento', label: 'Assent.?', width: '70px' },
];

const PAGE_SIZE = 50;

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('processo');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(r =>
      r.processo.toLowerCase().includes(q) ||
      r.municipio.toLowerCase().includes(q) ||
      r.setor.toLowerCase().includes(q) ||
      r.situacao.toLowerCase().includes(q) ||
      r.tipoProcesso.toLowerCase().includes(q) ||
      r.tecnicoResponsavel.toLowerCase().includes(q) ||
      r.nomeInteressado.toLowerCase().includes(q) ||
      r.bairro.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a[sortField] || '').toLowerCase();
      const vb = (b[sortField] || '').toLowerCase();
      const cmp = va.localeCompare(vb, 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Tabela Detalhada</h3>
        <div className="table-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar nos dados..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <span className="table-result-count">{sorted.length.toLocaleString('pt-BR')} resultados</span>
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ width: col.width, cursor: 'pointer' }}
                >
                  <div className="th-content">
                    <span>{col.label}</span>
                    <SortIcon field={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={`${row.processo}-${i}`}>
                {COLUMNS.map(col => (
                  <td key={col.key} title={row[col.key]}>
                    {row[col.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="table-empty">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            className="btn btn-secondary"
            disabled={page === 0}
            onClick={() => setPage(0)}
          >
            ««
          </button>
          <button
            className="btn btn-secondary"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ‹ Anterior
          </button>
          <span className="pagination-info">
            Página {page + 1} de {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima ›
          </button>
          <button
            className="btn btn-secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
};
