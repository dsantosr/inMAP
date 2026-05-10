import React from 'react';
import type { MunicipioData } from '../../types/prospeccao';
import { CATEGORIA_LABELS, CATEGORIA_COLORS, STATUS_LABELS } from '../../types/prospeccao';
import { X, MapPin, Users, Vote, ClipboardList } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface MunicipioDetailPanelProps {
  municipio: MunicipioData;
  onClose: () => void;
}

export const MunicipioDetailPanel: React.FC<MunicipioDetailPanelProps> = ({
  municipio: m,
  onClose,
}) => {
  const catColor = CATEGORIA_COLORS[m.categoria];

  const radarData = [
    { subject: 'Score Técnico', value: m.scoreTecnico, fullMark: 100 },
    { subject: 'Apoio Político', value: m.scorePolitico, fullMark: 100 },
    { subject: 'Ausência REURB', value: m.scoreSICARF, fullMark: 100 },
  ];

  const eficacia =
    m.qtdCadastros && m.qtdCadastros > 0
      ? Math.round(((m.qtdTitulos ?? 0) / m.qtdCadastros) * 100)
      : null;

  return (
    <div style={{
      width: '280px',
      minWidth: '280px',
      background: 'var(--panel-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: `${catColor}22`,
        borderBottom: `2px solid ${catColor}`,
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <MapPin size={13} color={catColor} />
            <span style={{ fontSize: '0.65rem', color: catColor, fontWeight: 600 }}>
              {CATEGORIA_LABELS[m.categoria]}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {m.nome}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: catColor,
            color: '#111',
            fontWeight: 700,
            fontSize: '1.1rem',
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {m.scoreTotal}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Radar */}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Perfil de Scores
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--sidebar-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                }}
              />
              <Radar name="Score" dataKey="value" stroke={catColor} fill={catColor} fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dados Políticos */}
        <Section title="Dados Eleitorais" icon={<Vote size={12} />}>
          <Row label="Votos válidos" value={m.qtVotos.toLocaleString('pt-BR')} />
          <Row label="Votos ao gestor" value={`${m.pctVotosCarlos.toFixed(1)}%`} highlight />
          <Row label="Nulos/Brancos" value={`${m.pctNulosBrancos.toFixed(1)}%`} />
        </Section>

        {/* Dados Técnicos */}
        <Section title="Comunidades Urbanas (Censo 2022)" icon={<Users size={12} />}>
          {m.populacaoFavelas != null ? (
            <>
              <Row label="População" value={m.populacaoFavelas.toLocaleString('pt-BR') + ' hab'} highlight />
              <Row label="Área territorial" value={m.areaFavelas != null ? `${m.areaFavelas.toFixed(3)} km²` : '—'} />
              <Row label="Densidade" value={m.densidadeFavelas != null ? `${m.densidadeFavelas.toFixed(0)} hab/km²` : '—'} />
            </>
          ) : (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Sem dados no Censo 2022
            </div>
          )}
        </Section>

        {/* Dados SICARF */}
        <Section title="REURB (SICARF)" icon={<ClipboardList size={12} />}>
          <Row label="Status" value={STATUS_LABELS[m.statusReurb]} highlight />
          {m.qtdCadastros != null ? (
            <>
              <Row label="Cadastros" value={m.qtdCadastros.toLocaleString('pt-BR')} />
              <Row label="Arquivados" value={(m.qtdArquivados ?? 0).toLocaleString('pt-BR')} />
              <Row label="Títulos emitidos" value={(m.qtdTitulos ?? 0).toLocaleString('pt-BR')} />
              {eficacia !== null && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Eficácia: {eficacia}%
                  </div>
                  <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
                    <div style={{
                      height: '100%',
                      width: `${eficacia}%`,
                      background: eficacia >= 60 ? '#22c55e' : eficacia >= 30 ? '#f97316' : '#ef4444',
                      borderRadius: '2px',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Município não cadastrado no SICARF
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.65rem', color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      marginBottom: '0.4rem',
    }}>
      {icon} {title}
    </div>
    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {children}
    </div>
  </div>
);

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: '0.68rem', fontWeight: highlight ? 600 : 400, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
      {value}
    </span>
  </div>
);
