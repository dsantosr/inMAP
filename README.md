# inMAP - Fluxograma Viewer

Plataforma em React para visualização e mapeamento de fluxogramas em modelo de raias (*swimlanes*), com renderização gerada dinamicamente a partir de arquivos JSON estruturados.

O inMAP foi idealizado para facilitar o arquivamento e a análise gráfica de processos administrativos organizacionais. A solução constrói o fluxo visual diretamente no navegador, dispensando o uso de ferramentas de design gráfico tradicionais.

## Principais Funcionalidades

- **Posicionamento Automático (Auto-Layout):** Ordenação cronológica e topológica das etapas, mapeadas verticalmente por unidades de responsabilidade (atores/raias).
- **Roteamento Vetorial Inteligente:** Conexões desenhadas matematicamente em SVG (curvas de Bézier) com sistema de desvio de sobreposição.
- **Identidade Visual Guiada por Dados:** Padronização automatizada de cores e de categorias institucionais com a simples leitura do arquivo primário `organogram.json`.
- **Interface e Usabilidade:** 
  - Expansão de detalhes metodológicos *in-loco* (*Expand/Collapse*).
  - Controle de zoom interativo dimensionado na malha gráfica.
  - Fixação em paralaxe das unidades de responsabilidade (*Sticky Headers*).
- **Exportação:** Motor embutido para captura unificada do fluxograma renderizado em `.png`.

## Tecnologias Empregadas

- **React.js 19 / Vite:** Ferramental central para gerenciamento do ciclo de vida dos fluxos dom e build de interface.
- **TypeScript:** Reforço de tipagem estática voltado para garantir a fidedignidade na absorção das entradas JSON.
- **DOM SVG Engine:** Construção paramétrica das redes de conexão.
- **Lucide Icons:** Conjunto de ícones e sinalizadores.

## Instruções de Execução

Requisitos prévios recomendados: Instalação do gerenciador local `npm`.

1. Instale os pacotes e dependências:
   ```bash
   npm install
   ```

2. Inicialize o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

Para customização das regras e cores institucionais do ambiente, modifique os parâmetros declarados no documento `public/organogram.json`. 

Para instruções técnicas sobre a formulação de novos processos ao sistema, consulte a [Documentação Técnica sobre o Padrão JSON](./DOCUMENTACAO_JSON.md).
