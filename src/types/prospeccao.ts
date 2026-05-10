export type StatusReurb =
  | 'sem_reurb'
  | 'em_andamento'
  | 'em_andamento_titulos'
  | 'concluido';

export type CategoriaOportunidade =
  | 'alta_prioridade'
  | 'media_alta'
  | 'oportunidade_politica'
  | 'reativacao'
  | 'em_andamento';

export interface MunicipioData {
  nome: string;

  isCapital: boolean;
  capitalRank: number | null; // 0 (menor) → 1 (maior), apenas para capitais

  // Técnico — Censo 2022 (null = sem dados)
  areaFavelas: number | null;
  densidadeFavelas: number | null;
  populacaoFavelas: number | null;

  // Político — Eleições
  qtVotos: number;
  pctVotosCarlos: number;
  pctNulosBrancos: number;

  // SICARF
  qtdCadastros: number | null;
  qtdArquivados: number | null;
  qtdTitulos: number | null;
  statusReurb: StatusReurb;

  // Scores calculados (0–100)
  scoreTotal: number;
  scoreTecnico: number;
  scorePolitico: number;
  scoreSICARF: number;

  // Categoria de oportunidade
  categoria: CategoriaOportunidade;
}

export interface ScoreWeights {
  populacaoFavelas: number;  // 0–100
  pctVotosCarlos: number;    // 0–100
}

export interface ProspeccaoFilters {
  categorias: CategoriaOportunidade[];
  semDadosFavelas: boolean;
  comDadosFavelas: boolean;
  faixaVotosMin: number;
  faixaVotosMax: number;
  search: string;
}

export const CATEGORIA_LABELS: Record<CategoriaOportunidade, string> = {
  alta_prioridade: 'Alta Prioridade',
  media_alta: 'Média-Alta Prioridade',
  oportunidade_politica: 'Oportunidade Política',
  reativacao: 'REURB em Análise',
  em_andamento: 'Em Andamento',
};

export const CATEGORIA_COLORS: Record<CategoriaOportunidade, string> = {
  alta_prioridade: '#ef4444',
  media_alta: '#f97316',
  oportunidade_politica: '#eab308',
  reativacao: '#a855f7',
  em_andamento: '#22c55e',
};

export const STATUS_LABELS: Record<StatusReurb, string> = {
  sem_reurb: 'Sem REURB',
  em_andamento: 'REURB em Análise',
  em_andamento_titulos: 'Em Andamento (c/ títulos)',
  concluido: 'Concluído',
};
