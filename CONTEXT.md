# climasus+ Pipeline Studio

Aplicativo desktop que deixa profissionais de saúde/pesquisa montar e rodar análises do DATASUS visualmente — encadeando funções do pacote R `climasus4r` como um pipeline — **sem precisar saber que existe R por baixo**. A web é a mesma GUI degradada para exportar código quando não há motor local.

## Language

### O pipeline e suas partes

**Função**:
A definição de uma operação `sus_*` do catálogo, exibida na Biblioteca. Imutável, existe uma só de cada. É o *tipo*.
_Avoid_: bloco, ferramenta, comando

**Passo**:
Uma instância de uma Função dentro de um pipeline, com seus argumentos preenchidos. É a *instância*. "Você adiciona uma Função e ela vira um Passo."
_Avoid_: bloco, card, node

**Nó**:
A representação visual de um Passo no grafo (React Flow). Um Passo aparece como exatamente um Nó.
_Avoid_: card, caixa

**Pipeline**:
A sequência ordenada de Passos que o usuário monta e executa. Mantido em inglês nos três idiomas.
_Avoid_: fluxo, grafo, canvas, workflow

**Projeto**:
Um Pipeline serializado em disco (`.climasus.json` — funções e parâmetros). Projeto e Pipeline são a mesma coisa; "Projeto" é o nome do arquivo salvo.
_Avoid_: arquivo, workspace, sessão

### Execução

**Motor**:
O componente que executa o Pipeline e devolve Resultados. É um detalhe interno; a UI nunca revela que ele roda R (jamais "Motor R"). Quando indisponível, a UI degrada para exportar código, mas isso é recurso avançado, não o discurso padrão.
_Avoid_: Motor R, engine (na UI PT/ES), R, servidor

**Resultado**:
A saída de um Passo executado, com um tipo (tabela, gráfico, mapa, texto). É o que aparece no Nó e no painel de resultados. Termo canônico user-facing.
_Avoid_: saída, output

**Artefato**:
O arquivo concreto gerado por um Resultado (PNG, SVG, HTML interativo, CSV/XLSX baixável). Sub-parte técnica de um Resultado — um Resultado-gráfico tem artefatos PNG, SVG e HTML.
_Avoid_: arquivo, download, asset

### Organização

**Etapa**:
Uma das quatro fases didáticas a que uma Função pertence — Preparação, Integração, Análise & Modelagem, RAP. Organiza e colore a Biblioteca. (`StageId` no código: `preparacao`/`integracao`/`modelagem`/`rap`.)
_Avoid_: fase, categoria, grupo, stage (na UI)

**Biblioteca**:
O catálogo das Funções individuais, agrupadas por Etapa. É de onde o usuário tira uma Função para adicioná-la ao Pipeline.
_Avoid_: catálogo, paleta, toolbox

**Modelo**:
Um Pipeline pré-montado que o usuário carrega como ponto de partida editável (no código: "template"). Categorias: pipeline, clima, temático, caso.
_Avoid_: template, exemplo, receita, preset

**Tutorial**:
Uma experiência guiada, conduzida passo a passo com sobreposição e explicações, que ensina construindo um Pipeline. Diferente de Modelo: o Tutorial *conduz*; o Modelo apenas *dá um ponto de partida*.
_Avoid_: guia, walkthrough, tour

**Centro de Pipelines**:
O painel que lista os Modelos disponíveis (e atalhos para Tutoriais).
_Avoid_: galeria, exemplos, templates

### Edição

**Parâmetro**:
Cada entrada configurável de um Passo (ou de uma Função). É o que o Inspetor edita. No código: `args`. Mensagens de erro user-facing devem dizer "parâmetro", nunca "argumento".
_Avoid_: argumento, propriedade, opção

**Inspetor**:
O painel que edita os Parâmetros do Passo (ou Função) selecionado.
_Avoid_: propriedades, config, editor

**Executar**:
A ação de rodar o Pipeline no Motor e produzir Resultados.
_Avoid_: rodar, run, processar

**climasus+**:
O nome do produto (com `+`, minúsculo). "Pipeline Studio" é o descritor do que ele é, não o nome.
_Avoid_: climasus Studio, climasu, Climasus+

