import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Upload, Download, BarChart3, FileSpreadsheet } from 'lucide-react';
import type { ProcessRecord, FilterState } from '../types/processTypes';
import { EMPTY_FILTERS } from '../types/processTypes';
import {
  parseCSV,
  applyFilters,
  rankMunicipiosByGargalo,
  groupBy,
  crossTabSetorSituacao,
  getUniqueValues,
  exportFilteredCSV,
  exportRankingCSV,
} from '../utils/processDataEngine';
import { KpiCards } from './dashboard/KpiCards';
import { FilterBar } from './dashboard/FilterBar';
import { MunicipioRanking } from './dashboard/MunicipioRanking';
import { TecnicoRanking } from './dashboard/TecnicoRanking';
import { SituacaoChart } from './dashboard/SituacaoChart';
import { SetorChart } from './dashboard/SetorChart';
import { CrossTable } from './dashboard/CrossTable';
import { DataTable } from './dashboard/DataTable';
import { IgnoreStatusSelector } from './dashboard/ConcludedSelector';

interface ProcessDashboardProps {}

/**
 * Decode an ArrayBuffer to string with automatic encoding detection.
 * Strategy:
 *   1. Check for UTF-8 BOM (EF BB BF) → use UTF-8
 *   2. Otherwise try UTF-8 and check for replacement chars or mojibake patterns
 *   3. If issues detected → fallback to windows-1252 (standard for Brazilian Excel CSVs)
 */
function decodeFileBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Check for UTF-8 BOM
  const hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;

  if (hasUtf8Bom) {
    return new TextDecoder('utf-8').decode(buffer);
  }

  // Try UTF-8 decode
  const utf8 = new TextDecoder('utf-8').decode(buffer);

  // Check for replacement character (U+FFFD) — obvious sign of wrong encoding
  if (utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(buffer);
  }

  // Check for common mojibake patterns (Windows-1252 misread as UTF-8)
  // When Windows-1252 bytes are decoded as UTF-8, accented chars become multi-byte sequences
  // e.g. "ã" (0xE3 in Win-1252) → "ã" in UTF-8 (C3 A3)
  // But "Situação" in Win-1252 becomes "Situação" when misread as UTF-8
  const mojibakePatterns = /Ã[£¡¢¤¥§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿À-ÿ]/;
  if (mojibakePatterns.test(utf8)) {
    return new TextDecoder('windows-1252').decode(buffer);
  }

  // Check if file has high bytes (0x80-0xFF) that could be Win-1252
  // If those bytes successfully decoded as valid UTF-8 multi-byte sequences,
  // the text is likely genuine UTF-8. But if the file has isolated high bytes
  // (not part of valid multi-byte sequences), it was lucky escape — try Win-1252
  let hasHighBytes = false;
  for (let i = 0; i < Math.min(bytes.length, 10000); i++) {
    if (bytes[i] >= 0x80) {
      hasHighBytes = true;
      break;
    }
  }

  if (hasHighBytes) {
    // Heuristic: decode both ways, count Portuguese accented characters
    const win1252 = new TextDecoder('windows-1252').decode(buffer);
    const ptCharsUtf8 = (utf8.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
    const ptCharsWin = (win1252.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;

    // If windows-1252 produces significantly more valid Portuguese characters, use it
    if (ptCharsWin > ptCharsUtf8 * 1.5) {
      return win1252;
    }
  }

  return utf8;
}

export const ProcessDashboard: React.FC<ProcessDashboardProps> = () => {
  const [rawData, setRawData] = useState<ProcessRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  // "Ignorar Status" — statuses to exclude from bottleneck analysis
  const [ignoredSituacoes, setIgnoredSituacoes] = useState<Set<string>>(new Set(['Processo deferido']));
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply filters
  const filteredData = useMemo(() => applyFilters(rawData, filters), [rawData, filters]);

  // Available filter values (from raw data)
  const availableValues = useMemo(() => ({
    municipios: getUniqueValues(rawData, 'municipio'),
    setores: getUniqueValues(rawData, 'setor'),
    situacoes: getUniqueValues(rawData, 'situacao'),
    tiposProcesso: getUniqueValues(rawData, 'tipoProcesso'),
    tecnicos: getUniqueValues(rawData, 'tecnicoResponsavel'),
  }), [rawData]);

  // Aggregated data (from filtered)
  const ranking = useMemo(
    () => rankMunicipiosByGargalo(filteredData, ignoredSituacoes),
    [filteredData, ignoredSituacoes]
  );

  // Base records exluding "ignored/concluded" statuses (used for bottleneck-focused charts)
  const pendingData = useMemo(() => filteredData.filter(r => !ignoredSituacoes.has(r.situacao)), [filteredData, ignoredSituacoes]);

  const situacaoData = useMemo(() => groupBy(pendingData, 'situacao'), [pendingData]);
  const setorData = useMemo(() => groupBy(pendingData, 'setor'), [pendingData]);
  const crossData = useMemo(() => crossTabSetorSituacao(pendingData), [pendingData]);

  // KPI totals
  const kpiTotals = useMemo(() => {
    const total = filteredData.length;
    const ignorados = filteredData.filter(r => ignoredSituacoes.has(r.situacao)).length;
    return { total, ignorados, pendentes: total - ignorados };
  }, [filteredData, ignoredSituacoes]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const text = decodeFileBuffer(buffer);
        const records = parseCSV(text);
        if (records.length === 0) {
          alert('Nenhum registro encontrado. Verifique se o CSV está separado por ponto e vírgula (;).');
          setIsLoading(false);
          return;
        }
        setRawData(records);
        setFilters({ ...EMPTY_FILTERS });
      } catch (error) {
        alert('Erro ao processar o arquivo CSV.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleExportFiltered = useCallback(() => {
    const csv = exportFilteredCSV(filteredData);
    downloadString(csv, `processos_filtrados_${Date.now()}.csv`);
  }, [filteredData]);

  const handleExportRanking = useCallback(() => {
    const csv = exportRankingCSV(ranking);
    downloadString(csv, `ranking_municipios_${Date.now()}.csv`);
  }, [ranking]);

  const handleSelectMunicipio = useCallback((municipio: string) => {
    if (!municipio) {
      setFilters(f => ({ ...f, municipios: [] }));
    } else {
      setFilters(f => ({ ...f, municipios: [municipio] }));
    }
  }, []);

  if (rawData.length === 0) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-content">
          <div className="dashboard-empty-icon">
            <BarChart3 size={64} strokeWidth={1} />
          </div>
          <h2>Análise de Processos</h2>
          <p>Importe um arquivo CSV para começar a análise de gargalos</p>
          <p className="text-muted" style={{ fontSize: '0.75rem', maxWidth: 400 }}>
            O arquivo deve estar separado por ponto e vírgula (;) e conter as colunas:
            Processo, Setor, Nome do interessado, CPF/CNPJ, Telefone(s), Técnico responsável,
            Tipo de processo, Situação, Município, Bairro, Área assentamento?, Nome assentamento
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '1rem', padding: '0.75rem 2rem', fontSize: '1rem' }}>
            <Upload size={18} /> Importar CSV
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-content">
          <div className="dashboard-loading-spinner" />
          <h2>Processando dados...</h2>
          <p>Analisando {fileName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top bar */}
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <FileSpreadsheet size={18} />
          <span className="dashboard-filename">{fileName}</span>
          <span className="dashboard-record-count">{rawData.length.toLocaleString('pt-BR')} registros</span>
        </div>
        <div className="dashboard-topbar-right">
          <IgnoreStatusSelector
            allSituacoes={availableValues.situacoes}
            ignoredSituacoes={ignoredSituacoes}
            onChange={setIgnoredSituacoes}
          />
          <input
            type="file"
            accept=".csv,.txt"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Novo CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportFiltered} title="Exportar dados filtrados">
            <Download size={14} /> Exportar Filtrados
          </button>
          <button className="btn btn-secondary" onClick={handleExportRanking} title="Exportar ranking de municípios">
            <Download size={14} /> Exportar Ranking
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        availableValues={availableValues}
        totalRecords={rawData.length}
        filteredRecords={filteredData.length}
      />

      {/* Dashboard content */}
      <div className="dashboard-scroll">
        {/* KPI Cards */}
        <KpiCards
          total={kpiTotals.total}
          deferidos={kpiTotals.ignorados}
          naoDeferidos={kpiTotals.pendentes}
        />

        {/* Rankings side by side */}
        <div className="dashboard-charts-row">
          <MunicipioRanking
            ranking={ranking}
            onSelectMunicipio={handleSelectMunicipio}
            selectedMunicipio={filters.municipios.length === 1 ? filters.municipios[0] : null}
          />
          <TecnicoRanking
            data={filteredData}
            concludedSituacoes={ignoredSituacoes}
          />
        </div>

        {/* Charts side by side */}
        <div className="dashboard-charts-row">
          <SituacaoChart data={situacaoData} />
          <SetorChart
            data={setorData}
            onSelectSetor={(setor) => setFilters(f => ({ ...f, setores: [setor] }))}
          />
        </div>

        {/* Cross table */}
        <CrossTable rows={crossData.rows} situacoes={crossData.situacoes} />

        {/* Detailed table */}
        <DataTable data={pendingData} />
      </div>
    </div>
  );
};

function downloadString(content: string, fileName: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
