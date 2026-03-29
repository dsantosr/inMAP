import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import type { FilterState } from '../../types/processTypes';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableValues: {
    municipios: string[];
    setores: string[];
    situacoes: string[];
    tiposProcesso: string[];
    tecnicos: string[];
  };
  totalRecords: number;
  filteredRecords: number;
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange([...filtered]);
  const clearAll = () => onChange([]);

  return (
    <div className="filter-select" ref={containerRef}>
      <button
        className={`filter-select-trigger ${selected.length > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}</span>
        {selected.length > 0 && <span className="filter-badge">{selected.length}</span>}
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {isOpen && (
        <div className="filter-dropdown">
          <div className="filter-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="filter-actions">
            <button onClick={selectAll}>Selecionar todos ({filtered.length})</button>
            <button onClick={clearAll}>Limpar</button>
          </div>
          <div className="filter-options">
            {filtered.map(option => (
              <label key={option} className="filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span>{option}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="filter-empty">Nenhum resultado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  availableValues,
  totalRecords,
  filteredRecords,
}) => {
  const hasFilters = filters.municipios.length > 0 ||
    filters.setores.length > 0 ||
    filters.situacoes.length > 0 ||
    filters.tiposProcesso.length > 0 ||
    filters.tecnicos.length > 0 ||
    filters.areaAssentamento !== null;

  const clearAll = () => {
    onFiltersChange({
      municipios: [],
      setores: [],
      situacoes: [],
      tiposProcesso: [],
      tecnicos: [],
      areaAssentamento: null,
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-selects">
        <MultiSelect
          label="Município"
          options={availableValues.municipios}
          selected={filters.municipios}
          onChange={(v) => onFiltersChange({ ...filters, municipios: v })}
        />
        <MultiSelect
          label="Setor"
          options={availableValues.setores}
          selected={filters.setores}
          onChange={(v) => onFiltersChange({ ...filters, setores: v })}
        />
        <MultiSelect
          label="Situação"
          options={availableValues.situacoes}
          selected={filters.situacoes}
          onChange={(v) => onFiltersChange({ ...filters, situacoes: v })}
        />
        <MultiSelect
          label="Tipo de Processo"
          options={availableValues.tiposProcesso}
          selected={filters.tiposProcesso}
          onChange={(v) => onFiltersChange({ ...filters, tiposProcesso: v })}
        />
        <MultiSelect
          label="Técnico"
          options={availableValues.tecnicos}
          selected={filters.tecnicos}
          onChange={(v) => onFiltersChange({ ...filters, tecnicos: v })}
        />
        <div className="filter-select">
          <button
            className={`filter-select-trigger ${filters.areaAssentamento !== null ? 'active' : ''}`}
            onClick={() => {
              const next = filters.areaAssentamento === null ? 'Sim' :
                filters.areaAssentamento === 'Sim' ? 'Não' : null;
              onFiltersChange({ ...filters, areaAssentamento: next });
            }}
          >
            <span>Assentamento: {filters.areaAssentamento ?? 'Todos'}</span>
          </button>
        </div>
      </div>

      <div className="filter-bar-info">
        {hasFilters && (
          <button className="filter-clear-btn" onClick={clearAll}>
            <X size={14} /> Limpar filtros
          </button>
        )}
        <span className="filter-count">
          {filteredRecords === totalRecords
            ? `${totalRecords.toLocaleString('pt-BR')} processos`
            : `${filteredRecords.toLocaleString('pt-BR')} de ${totalRecords.toLocaleString('pt-BR')} processos`
          }
        </span>
      </div>
    </div>
  );
};
