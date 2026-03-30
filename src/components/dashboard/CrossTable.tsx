import React from 'react';

interface CrossTableProps {
  rows: Record<string, string | number>[];
  situacoes: string[];
}

export const CrossTable: React.FC<CrossTableProps> = ({ rows, situacoes }) => {
  // Find max value for color intensity
  let maxVal = 0;
  for (const row of rows) {
    for (const sit of situacoes) {
      const v = Number(row[sit]) || 0;
      if (v > maxVal) maxVal = v;
    }
  }

  const getCellColor = (value: number): string => {
    if (value === 0) return 'transparent';
    const intensity = Math.min(value / maxVal, 1);
    // Gradient from dark blue to bright red through orange
    if (intensity < 0.33) {
      return `rgba(59, 130, 246, ${0.15 + intensity * 1.2})`;
    } else if (intensity < 0.66) {
      return `rgba(249, 115, 22, ${0.15 + intensity * 0.8})`;
    } else {
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.7})`;
    }
  };

  if (rows.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Cruzamento Setor × Situação</h3>
        </div>
        <p className="text-muted" style={{ padding: '1rem' }}>Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Cruzamento Setor × Situação (Top 10)</h3>
      </div>
      <div className="cross-table-wrapper">
        <table className="cross-table">
          <thead>
            <tr>
              <th className="cross-table-header-setor">Setor</th>
              {situacoes.map(sit => (
                <th key={sit} className="cross-table-header-sit" title={sit}>
                  {sit.length > 20 ? sit.slice(0, 18) + '…' : sit}
                </th>
              ))}
              <th className="cross-table-header-sit" title="Total" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={String(row.setor)}>
                <td className="cross-table-setor">{String(row.setor)}</td>
                {situacoes.map(sit => {
                  const value = Number(row[sit]) || 0;
                  return (
                    <td
                      key={sit}
                      className="cross-table-cell"
                      style={{ backgroundColor: getCellColor(value) }}
                      title={`${row.setor} × ${sit}: ${value}`}
                    >
                      {value > 0 ? value.toLocaleString('pt-BR') : '—'}
                    </td>
                  );
                })}
                <td className="cross-table-cell" style={{ fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  {situacoes.reduce((acc, sit) => acc + (Number(row[sit]) || 0), 0).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
