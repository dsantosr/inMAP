export interface ProcessRecord {
  processo: string;
  setor: string;
  nomeInteressado: string;
  cpfCnpj: string;
  telefones: string;
  tecnicoResponsavel: string;
  tipoProcesso: string;
  situacao: string;
  municipio: string;
  bairro: string;
  areaAssentamento: string;
  nomeAssentamento: string;
}

export interface FilterState {
  municipios: string[];
  setores: string[];
  situacoes: string[];
  tiposProcesso: string[];
  tecnicos: string[];
  areaAssentamento: string | null; // "Sim", "Não", or null (all)
}

export interface MunicipioGargalo {
  municipio: string;
  totalProcessos: number;
  processosDeferidos: number;
  processosNaoDeferidos: number;
  percentualGargalo: number;
  topSituacoes: { name: string; value: number }[];
  topSetores: { name: string; value: number }[];
}

export interface AggregatedItem {
  name: string;
  value: number;
}

export interface CrossTableCell {
  setor: string;
  [situacao: string]: string | number;
}

export const EMPTY_FILTERS: FilterState = {
  municipios: [],
  setores: [],
  situacoes: [],
  tiposProcesso: [],
  tecnicos: [],
  areaAssentamento: null,
};

export const CSV_HEADERS = [
  'Processo',
  'Setor',
  'Nome do interessado',
  'CPF/CNPJ do interessado',
  'Telefone(s)',
  'Técnico responsável',
  'Tipo de processo',
  'Situação',
  'Município',
  'Bairro',
  'Área assentamento?',
  'Nome assentamento',
] as const;
