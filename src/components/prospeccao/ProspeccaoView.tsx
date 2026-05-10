import React, { useState, useCallback, useMemo } from 'react';
import type { MunicipioData, ScoreWeights } from '../../types/prospeccao';
import { parseConsolidado, parseSICARF, mergeDatasets, recalcularScores } from '../../utils/parseCSV';
import { ProspeccaoKPIs } from './ProspeccaoKPIs';
import { UploadZone } from './UploadZone';
import { ScoreControls } from './ScoreControls';
import { RankingTable } from './RankingTable';
import { MunicipioDetailPanel } from './MunicipioDetailPanel';
import { MapaMunicipal } from './MapaMunicipal';
import { Target } from 'lucide-react';

const DEFAULT_WEIGHTS: ScoreWeights = {
  populacaoFavelas: 50,
  pctVotosCarlos: 50,
};

export const ProspeccaoView: React.FC = () => {
  const [consolidadoText, setConsolidadoText] = useState('');
  const [sicarfText, setSicarfText] = useState('');
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

  const consolidadoRows = useMemo(() => {
    if (!consolidadoText) return [];
    try { return parseConsolidado(consolidadoText); } catch { return []; }
  }, [consolidadoText]);

  const sicarfRows = useMemo(() => {
    if (!sicarfText) return [];
    try { return parseSICARF(sicarfText); } catch { return []; }
  }, [sicarfText]);

  const municipiosBase = useMemo(() => {
    if (!consolidadoText) return [];
    return mergeDatasets(consolidadoRows, sicarfRows, weights);
  }, [consolidadoText, consolidadoRows, sicarfRows, weights]);

  const municipios: MunicipioData[] = useMemo(() => {
    if (municipiosBase.length === 0) return [];
    return recalcularScores(municipiosBase, weights);
  }, [municipiosBase, weights]);

  const handleWeightsChange = useCallback((newWeights: ScoreWeights) => {
    setWeights(newWeights);
    setSelectedMunicipio(null);
  }, []);

  const selectedData = municipios.find((m) => m.nome === selectedMunicipio) ?? null;
  const dataLoaded = municipios.length > 0;

  // Apenas municípios sem REURB e não-capital entram no ranking
  const candidatos = municipios.filter((m) => m.statusReurb === 'sem_reurb' && !m.isCapital);
  const concluidos = municipios.filter((m) => m.statusReurb === 'concluido' || m.statusReurb === 'em_andamento_titulos');
  const travados   = municipios.filter((m) => m.statusReurb === 'em_andamento');

  return (
    // Container externo: scroll vertical, sem corte
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Conteúdo interno com padding e gap */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '0.75rem',
        minHeight: 'min-content',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Target size={18} color="var(--accent-color)" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Prospecção Data-Driven
            </h2>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              Ranqueamento de municípios para priorização do REURB no Maranhão
            </p>
          </div>
        </div>

        {/* ── Upload ── */}
        <UploadZone
          consolidadoLoaded={consolidadoRows.length > 0}
          sicarfLoaded={sicarfRows.length > 0}
          consolidadoCount={consolidadoRows.length}
          sicarfCount={sicarfRows.length}
          onConsolidado={setConsolidadoText}
          onSICARF={setSicarfText}
        />

        {dataLoaded ? (
          <>
            {/* ── KPIs — largura total ── */}
            <ProspeccaoKPIs municipios={municipios} />

            {/* ── Linha do Mapa ── altura fixa de 420px, nunca corta */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              height: '420px',
              flexShrink: 0,
            }}>
              {/* Score Controls */}
              <div style={{ width: '230px', minWidth: '230px', flexShrink: 0 }}>
                <ScoreControls weights={weights} onChange={handleWeightsChange} />
              </div>

              {/* Mapa — ocupa todo o espaço restante */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <MapaMunicipal
                  municipios={municipios}
                  weights={weights}
                  selectedMunicipio={selectedMunicipio}
                  onSelect={setSelectedMunicipio}
                />
              </div>

              {/* Painel de detalhe — abre ao clicar no município */}
              {selectedData && (
                <MunicipioDetailPanel
                  municipio={selectedData}
                  onClose={() => setSelectedMunicipio(null)}
                />
              )}
            </div>

            {/* ── Ranking — largura TOTAL, só candidatos sem REURB ── */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span>Candidatos ao REURB · {candidatos.length} municípios sem processo</span>
                <span style={{ color: '#22c55e' }}>● {concluidos.length} concluídos</span>
                <span style={{ color: '#a855f7' }}>● {travados.length} em análise</span>
              </div>
              <div style={{ height: '460px', display: 'flex', flexDirection: 'column' }}>
                <RankingTable
                  municipios={candidatos}
                  selectedMunicipio={selectedMunicipio}
                  onSelect={setSelectedMunicipio}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            color: 'var(--text-secondary)',
            padding: '4rem 0',
          }}>
            <Target size={40} color="var(--border-color)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                Nenhum dado carregado
              </div>
              <div style={{ fontSize: '0.72rem' }}>
                Faça upload dos dois CSVs acima para visualizar o mapa e o ranking de municípios
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
