import Papa from 'papaparse';
import type {
  MunicipioData,
  ScoreWeights,
  StatusReurb,
  CategoriaOportunidade,
} from '../types/prospeccao';

// ─── Municípios excluídos do ranking — Ilha do Maranhão (tratativa especial) ────
// Populações muito superiores ao interior; distorcem o score e requerem abordagem própria
const CAPITAL_NAMES = new Set([
  'sao luis',
  'sao jose de ribamar',
  'paco do lumiar',
  'raposa',
]);

export function isCapitalMunicipio(nome: string): boolean {
  return CAPITAL_NAMES.has(normalizeName(nome));
}

// ─── Normalização de nomes ──────────────────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-'\s]+/g, ' ')
    .trim();
}

// ─── Parse: consolidado_municipios_ma.csv ───────────────────────────────────

export interface ConsolidadoRow {
  nome: string;
  qtVotos: number;
  pctVotosCarlos: number;
  pctNulosBrancos: number;
  areaFavelas: number | null;
  densidadeFavelas: number | null;
  populacaoFavelas: number | null;
}

export function parseConsolidado(csvText: string): ConsolidadoRow[] {
  const result = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  return result.data.map((row) => {
    const parseNum = (v: string | undefined): number | null => {
      if (!v || v.trim() === '') return null;
      const n = parseFloat(v.replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const keys = Object.keys(row);
    const votosKey = keys.find((k) => k.includes('QT_VOTOS'));
    const pctKey = keys.find((k) => k.includes('PCT_VOTOS_CARLOS'));
    const nulosKey = keys.find((k) => k.includes('PCT_VOTOS_NULOS'));
    const areaKey = keys.find((k) => k.includes('rea territorial'));
    const densKey = keys.find((k) => k.includes('ensidade'));
    const popKey = keys.find((k) => k.includes('opula'));

    return {
      nome: row['NM_MUNICIPIO']?.trim() ?? '',
      qtVotos: parseNum(votosKey ? row[votosKey] : undefined) ?? 0,
      pctVotosCarlos: parseNum(pctKey ? row[pctKey] : undefined) ?? 0,
      pctNulosBrancos: parseNum(nulosKey ? row[nulosKey] : undefined) ?? 0,
      areaFavelas: parseNum(areaKey ? row[areaKey] : undefined),
      densidadeFavelas: parseNum(densKey ? row[densKey] : undefined),
      populacaoFavelas: parseNum(popKey ? row[popKey] : undefined),
    };
  }).filter((r) => r.nome !== '');
}

// ─── Parse: Relatorio_SICARF_municipios.csv ──────────────────────────────────

export interface SicarfRow {
  nome: string;
  qtdCadastros: number;
  qtdArquivados: number;
  qtdTitulos: number;
}

export function parseSICARF(csvText: string): SicarfRow[] {
  const result = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  });

  return result.data.map((row) => ({
    nome: row['NOME_MUNICIPIO']?.trim() ?? '',
    qtdCadastros: parseInt(row['QTD_CADASTROS'] ?? '0', 10) || 0,
    qtdArquivados: parseInt(row['QTD_ARQUIVADOS'] ?? '0', 10) || 0,
    qtdTitulos: parseInt(row['QTD_TITULOS'] ?? '0', 10) || 0,
  })).filter((r) => r.nome !== '');
}

// ─── Status REURB ─────────────────────────────────────────────────────────────
//
// sem_reurb            → Não está no SICARF → CANDIDATO ao ranking
// em_andamento         → Está no SICARF, 0 títulos → TRAVADO (vermelho, excluído do rank)
// em_andamento_titulos → Está no SICARF, títulos parciais → considera como concluído
// concluido            → Taxa ≥ 60% de eficácia → CONCLUÍDO (verde, excluído do rank)

function getStatusReurb(
  qtdCadastros: number | null,
  qtdTitulos: number | null
): StatusReurb {
  if (qtdCadastros === null) return 'sem_reurb';
  if (qtdTitulos === null || qtdTitulos === 0) return 'em_andamento'; // travado
  // Tem títulos → concluído independente do percentual
  return 'concluido';
}

// ─── Categoria ────────────────────────────────────────────────────────────────
//
// Hierarquia de cores no mapa:
//   concluido           → verde
//   em_andamento        → vermelho (travado)
//   sem_reurb           → cinza→laranja-amarelado por score (candidatos)

function getCategoria(statusReurb: StatusReurb): CategoriaOportunidade {
  if (statusReurb === 'concluido' || statusReurb === 'em_andamento_titulos') return 'em_andamento';
  if (statusReurb === 'em_andamento') return 'reativacao';
  // sem_reurb → categoria refinada pelo score (será sobrescrita)
  return 'media_alta';
}

// ─── Score (apenas para municípios sem REURB) ─────────────────────────────────

export function calcularScore(
  m: { populacaoFavelas: number | null; pctVotosCarlos: number; statusReurb: StatusReurb; isCapital: boolean },
  weights: ScoreWeights,
  maxPop: number
): { scoreTotal: number; scoreTecnico: number; scorePolitico: number; scoreSICARF: number } {
  // Capital e municípios com REURB no SICARF não recebem score
  if (m.isCapital || m.statusReurb !== 'sem_reurb') {
    return { scoreTotal: 0, scoreTecnico: 0, scorePolitico: 0, scoreSICARF: 0 };
  }

  const totalWeight = weights.populacaoFavelas + weights.pctVotosCarlos;

  // Score técnico: população em favelas normalizada (0–100)
  const scoreTecnico = maxPop > 0 && m.populacaoFavelas !== null
    ? Math.min(100, Math.round((m.populacaoFavelas / maxPop) * 100))
    : 0;

  // Score político: % votos favoráveis (direto)
  const scorePolitico = Math.min(100, Math.round(m.pctVotosCarlos));

  if (totalWeight === 0) {
    return { scoreTotal: 0, scoreTecnico, scorePolitico, scoreSICARF: 0 };
  }

  const scoreTotal = Math.round(
    (scoreTecnico * weights.populacaoFavelas + scorePolitico * weights.pctVotosCarlos) / totalWeight
  );

  return { scoreTotal, scoreTecnico, scorePolitico, scoreSICARF: 0 };
}

// ─── Refinamento de categoria por score (apenas candidatos) ──────────────────

function refinarCategoriaPorScore(score: number): CategoriaOportunidade {
  if (score >= 70) return 'alta_prioridade';
  if (score >= 40) return 'media_alta';
  return 'oportunidade_politica';
}

// ─── Merge ────────────────────────────────────────────────────────────────────

export function mergeDatasets(
  consolidado: ConsolidadoRow[],
  sicarf: SicarfRow[],
  weights: ScoreWeights
): MunicipioData[] {
  const sicarfMap = new Map<string, SicarfRow>();
  for (const s of sicarf) sicarfMap.set(normalizeName(s.nome), s);

  // Máximo de pop em favelas: apenas candidatos sem REURB e não-capital
  const popValues = consolidado.map((c) => {
    if (isCapitalMunicipio(c.nome)) return 0;
    const sicarfData = sicarfMap.get(normalizeName(c.nome));
    const status = getStatusReurb(sicarfData?.qtdCadastros ?? null, sicarfData?.qtdTitulos ?? null);
    return status === 'sem_reurb' ? (c.populacaoFavelas ?? 0) : 0;
  });
  const maxPop = Math.max(...popValues, 1);

  const result: MunicipioData[] = consolidado.map((c) => {
    const sicarfData = sicarfMap.get(normalizeName(c.nome));
    const statusReurb = getStatusReurb(
      sicarfData?.qtdCadastros ?? null,
      sicarfData?.qtdTitulos ?? null
    );
    const capital = isCapitalMunicipio(c.nome);

    const base = {
      nome: c.nome,
      isCapital: capital,
      capitalRank: null as number | null,
      areaFavelas: c.areaFavelas,
      densidadeFavelas: c.densidadeFavelas,
      populacaoFavelas: c.populacaoFavelas,
      qtVotos: c.qtVotos,
      pctVotosCarlos: c.pctVotosCarlos,
      pctNulosBrancos: c.pctNulosBrancos,
      qtdCadastros: sicarfData?.qtdCadastros ?? null,
      qtdArquivados: sicarfData?.qtdArquivados ?? null,
      qtdTitulos: sicarfData?.qtdTitulos ?? null,
      statusReurb,
    };

    const scores = calcularScore(base, weights, maxPop);

    const categoria: CategoriaOportunidade =
      capital
        ? 'em_andamento' // categoria neutra para capital
        : statusReurb === 'sem_reurb'
        ? refinarCategoriaPorScore(scores.scoreTotal)
        : getCategoria(statusReurb);

    return { ...base, ...scores, categoria };
  });

  // Atribuir capitalRank (0 = menor pop → 1 = maior pop) entre os municípios da Ilha
  const capitaisArr = result.filter((m) => m.isCapital);
  if (capitaisArr.length > 0) {
    capitaisArr.sort((a, b) => (a.populacaoFavelas ?? 0) - (b.populacaoFavelas ?? 0));
    capitaisArr.forEach((m, i) => {
      m.capitalRank = capitaisArr.length > 1 ? i / (capitaisArr.length - 1) : 1;
    });
  }

  // Candidatos (sem_reurb, não-capital) primeiro por score desc; capital e SICARF por último
  return result.sort((a, b) => {
    if (a.isCapital && !b.isCapital) return 1;
    if (!a.isCapital && b.isCapital) return -1;
    if (a.statusReurb === 'sem_reurb' && b.statusReurb !== 'sem_reurb') return -1;
    if (a.statusReurb !== 'sem_reurb' && b.statusReurb === 'sem_reurb') return 1;
    return b.scoreTotal - a.scoreTotal;
  });
}

export function recalcularScores(
  municipios: MunicipioData[],
  weights: ScoreWeights
): MunicipioData[] {
  const maxPop = Math.max(
    ...municipios
      .filter((m) => m.statusReurb === 'sem_reurb' && !m.isCapital)
      .map((m) => m.populacaoFavelas ?? 0),
    1
  );

  const updated = municipios.map((m) => {
    const scores = calcularScore(m, weights, maxPop);
    const categoria: CategoriaOportunidade =
      m.isCapital
        ? 'em_andamento'
        : m.statusReurb === 'sem_reurb'
        ? refinarCategoriaPorScore(scores.scoreTotal)
        : getCategoria(m.statusReurb);
    return { ...m, ...scores, categoria };
  });

  return updated.sort((a, b) => {
    if (a.isCapital && !b.isCapital) return 1;
    if (!a.isCapital && b.isCapital) return -1;
    if (a.statusReurb === 'sem_reurb' && b.statusReurb !== 'sem_reurb') return -1;
    if (a.statusReurb !== 'sem_reurb' && b.statusReurb === 'sem_reurb') return 1;
    return b.scoreTotal - a.scoreTotal;
  });
}
