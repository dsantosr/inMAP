import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AggregatedItem } from '../../types/processTypes';

interface SetorChartProps {
  data: AggregatedItem[];
  onSelectSetor?: (setor: string) => void;
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1',
  '#d946ef', '#f43f5e', '#a3e635', '#38bdf8', '#c084fc',
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export const SetorChart: React.FC<SetorChartProps> = ({ data, onSelectSetor }) => {
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
        <h3>Processos por Setor</h3>
      </div>
      <div className="chart-container" style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onClick={(entry) => onSelectSetor?.(entry.name)}
              style={{ cursor: onSelectSetor ? 'pointer' : 'default' }}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span style={{ color: '#c9d1d9', fontSize: 12 }}>{value}</span>}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
