# Manual do Formato JSON (inMAP - Fluxograma Viewer)

Este documento detalha as regras e o formato esperado para os arquivos `.json` que desenham os fluxogramas na aplicação.

## Estrutura Principal
O arquivo deve conter um objeto JSON com o nome do fluxograma e o array de ações.

```json
{
  "name": "Nome do Fluxograma (Ex: Licenciamento)",
  "actions": [
    ... // lista de blocos de ação
  ]
}
```

## Estrutura do Bloco de Ação (`actions`)
Cada objeto dentro do array `actions` representa uma caixa/passo no fluxograma e deve conter:

| Propriedade | Tipo | Descrição |
|---|---|---|
| `id` | **String** | Identificador único da ação (ex: `"A1"`, `"passo-2"`). Usado para conectar as setas. |
| `what` | **String** | Título principal da caixa (O que é feito). |
| `who` | **String** | Ator responsável (Gera a Raia horizontal). Se o nome coincidir com um setor definido no `organogram.json`, herdará cores institucionais; caso contrário, será tratado como ator externo (cinza). |
| `how` | **String** | Descrição do passo. Fica oculta por padrão na tela e aparece ao clicar "Mostrar Detalhes". |
| `reference` | **String** | *(Opcional)* Base normativa, número de artigo ou POP (ex: `"Art. 5º da IN 01/2023"`). |
| `connection` | **Object** | Define o roteamento da seta e o próximo passo do fluxo. |

---

## Tipos de Conexão (`connection.type`)

O objeto `connection` é obrigatório e dita como o sistema traçará as linhas matemáticas no fluxo. Existem **4 tipos de conexão**:

### 1. Conexão Simples (`"simple"`)
A forma mais comum. Uma seta reta cruzará do bloco atual para o bloco de destino estipulado.
```json
"connection": {
  "type": "simple",
  "to": "A2"
}
```

### 2. Decisão Condicional (`"conditional"`)
Gera um losango amarelo de tomada de decisão, bifurcando o fluxo em dois caminhos (Sim/Não).
```json
"connection": {
  "type": "conditional",
  "text": "Todos os documentos estão OK?",
  "positiveTo": "A3", 
  "negativeTo": "A2_1" 
}
```
- A seta gerada pelo `positiveTo` será desenhada na cor **Verde**.
- A seta gerada pelo `negativeTo` será desenhada na cor **Vermelha**.

### 3. Bifurcação Paralela (`"bifurcation"`)
Quando uma ação dispara atividades simultâneas e independentes. Gera setas **azuis**.
```json
"connection": {
  "type": "bifurcation",
  "to": ["A6", "A7"]
}
```

### 4. Fim de Caminho (`"none"`)
Utilizado em blocos finais ou encerramentos, onde o processo não envia o fluxo para lugar nenhum.
```json
"connection": {
  "type": "none"
}
```

---

## Boas Práticas de Preenchimento
- **Ordenação**: O sistema ordena os blocos automaticamente através de um Algoritmo de Topologia (DFS e InDegree), não sendo obrigatório colocar os objetos JSON na ordem exata de execução. Contudo, manter a ordem cronológica no código facilita a manutenção humana.
- **Evite IDs repetidos**: Múltiplas caixas com o mesmo `"id"` causarão um colapso imediato no mapeador de curvas (Bézier SVG).
- **Raias Compartilhadas**: Escreva o nome de `"who"` exatamente igual. Ex: usar `"Procuradoria"` em um e `"Procuradoria Jurídica"` em outro criará duas raias (linhas) diferentes.
