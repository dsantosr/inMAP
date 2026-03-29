import type { ProcessRecord, FilterState, MunicipioGargalo, AggregatedItem } from '../types/processTypes';

/**
 * Parse a semicolon-separated CSV string into ProcessRecord[].
 * Handles quoted fields and trims whitespace.
 */
export function parseCSV(text: string): ProcessRecord[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Skip header row
  const records: ProcessRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    if (fields.length < 12) continue;

    records.push({
      processo: fields[0].trim(),
      setor: fields[1].trim(),
      nomeInteressado: fields[2].trim(),
      cpfCnpj: fields[3].trim(),
      telefones: fields[4].trim(),
      tecnicoResponsavel: fields[5].trim(),
      tipoProcesso: fields[6].trim(),
      situacao: fields[7].trim(),
      municipio: fields[8].trim(),
      bairro: fields[9].trim(),
      areaAssentamento: fields[10].trim(),
      nomeAssentamento: fields[11].trim(),
    });
  }
  return records;
}

/**
 * Parse a single CSV line respecting quoted fields with semicolons inside.
 */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Apply combined filters to the dataset.
 */
export function applyFilters(data: ProcessRecord[], filters: FilterState): ProcessRecord[] {
  const municipioSet = filters.municipios.length > 0 ? new Set(filters.municipios) : null;
  const setorSet = filters.setores.length > 0 ? new Set(filters.setores) : null;
  const situacaoSet = filters.situacoes.length > 0 ? new Set(filters.situacoes) : null;
  const tipoSet = filters.tiposProcesso.length > 0 ? new Set(filters.tiposProcesso) : null;
  const tecnicoSet = filters.tecnicos.length > 0 ? new Set(filters.tecnicos) : null;

  return data.filter(record => {
    if (municipioSet && !municipioSet.has(record.municipio)) return false;
    if (setorSet && !setorSet.has(record.setor)) return false;
    if (situacaoSet && !situacaoSet.has(record.situacao)) return false;
    if (tipoSet && !tipoSet.has(record.tipoProcesso)) return false;
    if (tecnicoSet && !tecnicoSet.has(record.tecnicoResponsavel)) return false;
    if (filters.areaAssentamento !== null && record.areaAssentamento !== filters.areaAssentamento) return false;
    return true;
  });
}

/**
 * Rank municipalities by bottleneck (non-concluded processes), descending.
 * concludedSituacoes defines which situations count as "concluded".
 */
export function rankMunicipiosByGargalo(
  data: ProcessRecord[],
  concludedSituacoes: Set<string> = new Set(['Processo deferido'])
): MunicipioGargalo[] {
  const byMunicipio = new Map<string, ProcessRecord[]>();

  for (const record of data) {
    const key = record.municipio || '(vazio)';
    const arr = byMunicipio.get(key);
    if (arr) arr.push(record);
    else byMunicipio.set(key, [record]);
  }

  const result: MunicipioGargalo[] = [];

  for (const [municipio, records] of byMunicipio) {
    const total = records.length;
    const deferidos = records.filter(r => concludedSituacoes.has(r.situacao)).length;
    const naoDeferidos = total - deferidos;

    // Top situações (non-concluded only)
    const situacaoMap = new Map<string, number>();
    const setorMap = new Map<string, number>();
    for (const r of records) {
      if (!concludedSituacoes.has(r.situacao)) {
        situacaoMap.set(r.situacao, (situacaoMap.get(r.situacao) || 0) + 1);
      }
      setorMap.set(r.setor, (setorMap.get(r.setor) || 0) + 1);
    }

    const topSituacoes = [...situacaoMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const topSetores = [...setorMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    result.push({
      municipio,
      totalProcessos: total,
      processosDeferidos: deferidos,
      processosNaoDeferidos: naoDeferidos,
      percentualGargalo: total > 0 ? (naoDeferidos / total) * 100 : 0,
      topSituacoes,
      topSetores,
    });
  }

  return result.sort((a, b) => b.processosNaoDeferidos - a.processosNaoDeferidos);
}

/**
 * Group and count by a given field.
 */
export function groupBy(data: ProcessRecord[], field: keyof ProcessRecord): AggregatedItem[] {
  const map = new Map<string, number>();
  for (const record of data) {
    const key = record[field] || '(vazio)';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Cross-tabulation: setor × situacao.
 * Returns matrix data suitable for a heatmap.
 */
export function crossTabSetorSituacao(
  data: ProcessRecord[],
  topNSituacoes: number = 10
): { rows: Record<string, string | number>[]; situacoes: string[] } {
  // Get top N situacoes
  const situacaoTotals = groupBy(data, 'situacao').slice(0, topNSituacoes);
  const topSituacaoNames = situacaoTotals.map(s => s.name);
  const topSituacaoSet = new Set(topSituacaoNames);

  // Get all setores
  const setorSet = new Set<string>();
  const matrix = new Map<string, Map<string, number>>();

  for (const record of data) {
    const setor = record.setor || '(vazio)';
    const situacao = record.situacao || '(vazio)';
    if (!topSituacaoSet.has(situacao)) continue;

    setorSet.add(setor);
    if (!matrix.has(setor)) matrix.set(setor, new Map());
    const row = matrix.get(setor)!;
    row.set(situacao, (row.get(situacao) || 0) + 1);
  }

  const rows: Record<string, string | number>[] = [];
  // Sort setores by total count descending
  const setorTotals = [...setorSet].map(setor => {
    const row = matrix.get(setor)!;
    let total = 0;
    for (const v of row.values()) total += v;
    return { setor, total };
  }).sort((a, b) => b.total - a.total);

  for (const { setor } of setorTotals) {
    const row: Record<string, string | number> = { setor };
    const data = matrix.get(setor)!;
    for (const sit of topSituacaoNames) {
      row[sit] = data.get(sit) || 0;
    }
    rows.push(row);
  }

  return { rows, situacoes: topSituacaoNames };
}

/**
 * Get unique values for a field (for filter dropdowns).
 */
export function getUniqueValues(data: ProcessRecord[], field: keyof ProcessRecord): string[] {
  const set = new Set<string>();
  for (const record of data) {
    const val = record[field]?.trim();
    if (val) set.add(val);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Export filtered data as CSV string.
 */
export function exportFilteredCSV(data: ProcessRecord[]): string {
  const headers = [
    'Processo', 'Setor', 'Nome do interessado', 'CPF/CNPJ do interessado',
    'Telefone(s)', 'Técnico responsável', 'Tipo de processo', 'Situação',
    'Município', 'Bairro', 'Área assentamento?', 'Nome assentamento'
  ];

  const rows = data.map(r => [
    r.processo, r.setor, r.nomeInteressado, r.cpfCnpj,
    r.telefones, r.tecnicoResponsavel, r.tipoProcesso, r.situacao,
    r.municipio, r.bairro, r.areaAssentamento, r.nomeAssentamento
  ].map(field => {
    if (field.includes(';') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }).join(';'));

  return [headers.join(';'), ...rows].join('\n');
}

/**
 * Export ranking data as CSV.
 */
export function exportRankingCSV(ranking: MunicipioGargalo[]): string {
  const headers = ['Posição', 'Município', 'Total Processos', 'Deferidos', 'Não Deferidos', '% Gargalo'];
  const rows = ranking.map((r, i) => [
    i + 1,
    r.municipio,
    r.totalProcessos,
    r.processosDeferidos,
    r.processosNaoDeferidos,
    r.percentualGargalo.toFixed(1) + '%'
  ].join(';'));
  return [headers.join(';'), ...rows].join('\n');
}
