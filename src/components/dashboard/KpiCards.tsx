import React from 'react';
import { TrendingDown, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface KpiCardsProps {
  total: number;
  deferidos: number;
  naoDeferidos: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ total, deferidos, naoDeferidos }) => {
  const percentGargalo = total > 0 ? ((naoDeferidos / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: 'rgba(1, 98, 149, 0.2)', color: 'var(--info-color)' }}>
          <FileText size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Total de Processos</span>
          <span className="kpi-value">{total.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: 'rgba(217, 26, 33, 0.2)', color: 'var(--danger-color)' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Pendentes</span>
          <span className="kpi-value" style={{ color: '#ef4444' }}>{naoDeferidos.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: 'rgba(69, 182, 74, 0.2)', color: 'var(--accent-color)' }}>
          <CheckCircle size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Ignorados</span>
          <span className="kpi-value" style={{ color: 'var(--accent-color)' }}>{deferidos.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ backgroundColor: 'rgba(253, 189, 19, 0.2)', color: 'var(--warning-color)' }}>
          <TrendingDown size={20} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">% Gargalo</span>
          <span className="kpi-value" style={{ color: 'var(--warning-color)' }}>{percentGargalo}%</span>
        </div>
      </div>
    </div>
  );
};
