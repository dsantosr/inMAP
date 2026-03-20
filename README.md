# inMAP

**Plataforma imersiva em React para visualização e mapeamento topológico de Fluxogramas de Raia (Swimlanes), gerada nativamente a partir de repositórios estruturados em JSON.**

Projetado sob medida para o mapeamento de processos administrativos e mapeamento de jornadas. O inMAP constrói a planta gráfica inteira do fluxograma matematicamente no navegador, descartando a necessidade de editores gráficos de desenho manuais.

## 🚀 Principais Funcionalidades

- **Renderização Topológica (Auto-Layout):** O próprio sistema lê quem está conectado a quem e organiza as prioridades no tempo (da esquerda para a direita) automaticamente nas respectivas raias.
- **Roteamento Inteligente de Setas (SVG Bézier):** Setas interativas projetadas via matemática, que traçam a jornada do fluxo desviando do texto e adaptando-se a mudanças de tela (Ziguezague e Cascata).
- **Estilização Dinâmica por Organograma:** Lê a tabela hierárquica do JSON (Presidência, Coordenações, etc.) e distribui as "Cabeças de Raia" perfeitamente com cores padronizadas corporativas.
- **Micro-interações (QoL):** 
  - Funcionalidade de Detalhamento *Expand/Collapse* embutido nas caixas.
  - Câmera Livre com *Controle de Zoom (In/Out)* para navegar em macrorredes complexas.
  - Painéis laterais e "Cabeçalhos Congelados" (Sticky Headers) com blur de fundo.
- **Motor de Exportação:** Conversão de alta profundidade (1-Click) para extração de cartões em .PNG respeitando as propriedades gráficas.

## 📦 Tecnologias Utilizadas

- **[React.js v19](https://react.dev/) / [Vite](https://vitejs.dev/).**
- **TypeScript:** Para garantir contratos rígidos nas chamadas da estrutura JSON (Raias, Atores e Interfaces).
- **SVG Engine:** Curvas nativas geradas via manipulação do `getBoundingClientRect` do DOM.
- **Lucide Icons:** Biblioteca open-source ultraleve de ícones minimalistas.

## ⚙️ Setup

O projeto já está autoconfigurado via Vite. Para rodá-lo em sua máquina ou ambiente interno:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Pronto! O projeto estará rodando magicamente e pronto para importar e analisar seus `.json`. Para modificar a aparência corporativa das linhas, edite o arquivo `public/organogram.json`. Para aprender a escrever novos fluxos, leia a nossa [Documentação JSON](./DOCUMENTACAO_JSON.md).
