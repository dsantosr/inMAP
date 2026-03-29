import React, { useState, useRef, useEffect } from 'react';
import { Search, X, EyeOff } from 'lucide-react';

interface IgnoreStatusSelectorProps {
  allSituacoes: string[];
  ignoredSituacoes: Set<string>;
  onChange: (situacoes: Set<string>) => void;
}

export const IgnoreStatusSelector: React.FC<IgnoreStatusSelectorProps> = ({
  allSituacoes,
  ignoredSituacoes,
  onChange,
}) => {
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

  const filtered = allSituacoes.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (situacao: string) => {
    const next = new Set(ignoredSituacoes);
    if (next.has(situacao)) {
      next.delete(situacao);
    } else {
      next.add(situacao);
    }
    onChange(next);
  };

  return (
    <div className="concluded-selector" ref={containerRef}>
      <button
        className={`filter-select-trigger ${ignoredSituacoes.size > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Selecione quais situações devem ser ignoradas na análise de gargalos"
      >
        <EyeOff size={12} />
        <span>Ignorar Status</span>
        {ignoredSituacoes.size > 0 && (
          <span className="filter-badge">{ignoredSituacoes.size}</span>
        )}
      </button>

      {isOpen && (
        <div className="filter-dropdown concluded-dropdown">
          <div className="concluded-header">
            <span>Situações a ignorar na análise de gargalos</span>
          </div>
          <div className="filter-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar situação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {ignoredSituacoes.size > 0 && (
            <div className="concluded-chips">
              {[...ignoredSituacoes].map(s => (
                <span key={s} className="concluded-chip">
                  {s}
                  <button onClick={() => toggle(s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="filter-options">
            {filtered.map(situacao => (
              <label key={situacao} className="filter-option">
                <input
                  type="checkbox"
                  checked={ignoredSituacoes.has(situacao)}
                  onChange={() => toggle(situacao)}
                />
                <span>{situacao}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="filter-empty">Nenhuma situação encontrada</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
