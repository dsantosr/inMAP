# inMAP — Mapeamento Interno de Processos

Plataforma web em React para **visualização de fluxogramas swimlane** e **análise de dados via dashboard interativo**, projetada para mapeamento e diagnóstico de processos organizacionais.

Construída inteiramente no client-side, a aplicação dispensa backend — todo o processamento (parsing, agregações e visualizações) ocorre no navegador, garantindo privacidade total dos dados importados.

## Módulos

### 📊 Fluxogramas Swimlane

Renderização dinâmica de fluxogramas a partir de arquivos JSON estruturados.

- **Auto-Layout** — Posicionamento automático com ordenação cronológica e topológica, mapeado por raias de responsabilidade.
- **Roteamento Vetorial** — Conexões em SVG (curvas de Bézier) com desvio automático de sobreposição.
- **Identidade Visual por Dados** — Cores e categorias geradas a partir do arquivo `organogram.json`.
- **Interatividade** — Expand/collapse de detalhes, zoom interativo e sticky headers nas raias.
- **Exportação** — Captura do fluxograma renderizado em `.png`.

### 📋 Dashboard de Análise de Processos

Importação de arquivos `.csv` (semicolon-separated) para geração de insights visuais e identificação de gargalos.

- **KPI Cards** — Indicadores em tempo real: total de processos, pendentes, ignorados e percentual de gargalo.
- **Ranking de Municípios** — Ordenação por volume absoluto ou percentual, com drill-down por situação e setor. Busca e paginação integradas.
- **Ranking de Técnicos** — Distribuição de carga por responsável, identificando acúmulos.
- **Gráficos Interativos** — Barras horizontais (distribuição por situação) e donut chart (distribuição por setor), via Recharts.
- **Tabela Cruzada (Heatmap)** — Cruzamento setor × situação com intensidade de cor proporcional ao volume.
- **Tabela Detalhada** — Dados brutos com busca textual, ordenação por coluna e paginação.
- **Filtros Multi-Select** — Dropdowns com busca integrada para campos de alta cardinalidade (200+ opções).
- **Seletor de Status Ignorados** — Definição flexível de quais situações excluir da análise de gargalos.
- **Detecção de Encoding** — Suporte automático a UTF-8 e Windows-1252 (heurísticas de BOM e mojibake).
- **Exportação CSV** — Dados filtrados e ranking exportáveis com BOM UTF-8.

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Gráficos | Recharts (composable charts) |
| SVG Engine | DOM SVG paramétrico (Bézier curves) |
| Estilização | CSS vanilla (glassmorphism, dark mode) |
| Ícones | Lucide React |
| Exportação | html-to-image (PNG) + Blob API (CSV) |

## Arquitetura

```
src/
├── components/
│   ├── Sidebar.tsx                 # Navegação entre módulos
│   ├── SwimlaneViewer.tsx          # Renderização de fluxogramas
│   ├── ActionEditor.tsx            # Editor de ações do fluxograma
│   ├── ProcessDashboard.tsx        # Orquestrador do dashboard
│   └── dashboard/
│       ├── KpiCards.tsx            # Cards de indicadores
│       ├── MunicipioRanking.tsx    # Ranking com sort toggle
│       ├── TecnicoRanking.tsx      # Ranking de responsáveis
│       ├── SituacaoChart.tsx       # Gráfico de barras (Recharts)
│       ├── SetorChart.tsx          # Donut chart (Recharts)
│       ├── CrossTable.tsx          # Heatmap setor × situação
│       ├── FilterBar.tsx           # Filtros multi-select
│       ├── DataTable.tsx           # Tabela paginada
│       └── ConcludedSelector.tsx   # Seletor de status ignorados
├── utils/
│   └── processDataEngine.ts        # Parser CSV + aggregation engine
├── types/
│   ├── flowchart.ts                # Tipos do fluxograma
│   └── processTypes.ts             # Tipos do dashboard
└── App.tsx                         # Roteamento de módulos
```

### Decisões Técnicas

- **Zero backend** — Processamento client-side de ~40k registros em <200ms via `Map<K,V>` single-pass aggregations.
- **Encoding detection** — Heurística de 3 passes: BOM check → replacement char scan → Portuguese character count comparison.
- **Memoização reativa** — `useMemo` em cascata para recomputar apenas os dados afetados por mudanças de filtro.
- **Paginação virtual** — Tabelas renderizam max 50 linhas por página, independente do volume de dados.

## Execução

```bash
npm install
npm run dev
```

## Documentação

- [Padrão JSON para Fluxogramas](./DOCUMENTACAO_JSON.md)
