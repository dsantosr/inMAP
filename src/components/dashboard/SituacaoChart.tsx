import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AggregatedItem } from '../../types/processTypes';

interface SituacaoChartProps {
  data: AggregatedItem[];
  topN?: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export const SituacaoChart: React.FC<SituacaoChartProps> = ({ data, topN = 15 }) => {
  const chartData = data.slice(0, topN).map(item => ({
    ...item,
    displayName: item.name.length > 30 ? item.name.slice(0, 28) + '…' : item.name,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const total = data.reduce((s, d) => s + d.value, 0);
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{item.name}</p>
        <p className="chart-tooltip-value">{item.value.toLocaleString('pt-BR')} processos ({pct}%)</p>
      </div>
    );
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Processos por Situação (Top {topN})</h3>
      </div>
      <div className="chart-container" style={{ height: Math.max(300, chartData.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="displayName"
              width={200}
              tick={{ fill: '#c9d1d9', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
