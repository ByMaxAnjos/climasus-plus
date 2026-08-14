# Roteiro-mestre — "ClimaSUS+ Studio: da mudança climática ao cuidado em saúde"

> Documento de orientação para os agentes que vão escrever os 4 capítulos-piloto
> (arquivos `.qmd` do Quarto book, em português). Não é o conteúdo dos capítulos —
> é o plano que os orienta. Denso, estruturado, para consumo por agente, não por humano.

## Regras fixas que se aplicam a TODOS os capítulos (não repetir, apenas obedecer)

- **Vocabulário travado** (CONTEXT.md): Função, Passo, Nó, Pipeline, Etapa, Motor,
  Resultado, Artefato, Parâmetro, Inspetor, Modelo, Tutorial, Biblioteca, Executar,
  Projeto, Centro de Pipelines. Nunca trocar por sinônimo ("bloco", "engine", "output",
  "template", "workflow" etc. são proibidos — ver coluna `_Avoid_` de cada termo).
- **R é invisível** (ADR 0001): nunca escrever "R", ".R", "engine", "script", "Motor R",
  "servidor" olhando para o leitor. O componente que executa o Pipeline chama-se só
  "Motor". Se a pergunta "isso roda R?" aparecer em algum quiz/callout, a resposta correta
  reforça que o leitor não precisa saber — nunca explica R.
- **Público do book é mais amplo que o MISSION.md original**: gestores públicos,
  acadêmicos e comunidade em geral — não apenas pesquisadores. Cada capítulo abaixo
  define o público principal e como isso muda o tom (jargão técnico permitido ou não,
  quanto de contexto epidemiológico assumir, exemplos do cotidiano vs. exemplos técnicos).
- **Tom/estilo de referência**: `lessons/0001-o-que-e-climasus.html` — didático, kicker
  no topo, `<h2>` para seções grandes, blocos de callout (`tip`, `ask`), listas de
  definição (`<dl class="term">`) para vocabulário novo, bloco de quiz colapsável no
  final com 2-3 perguntas de múltipla escolha e feedback textual (sem lógica JS
  complexa — no Quarto isso vira um `callout-note collapse="true"` com pergunta e
  resposta comentada, não input de rádio interativo).
- **Formato de arquivo**: Quarto `.qmd`, um capítulo = um arquivo, seções com `##`/`###`.
  Cada capítulo deve citar suas fontes primárias (CONTEXT.md, ADR 0001) quando
  vocabulário/regra estiver em jogo, do mesmo jeito que a Lição 1 faz.
- **Números reais do catálogo** (`src/catalog/functions.json`, confirmado por contagem):
  Preparação = 15 Funções, Integração = 28 Funções, Análise & Modelagem = 32 Funções,
  RAP = 12 Funções. Total 87 Funções. Usar esses números exatos quando o capítulo
  precisar dizer "a Etapa X tem N Funções" — não arredondar, não inventar.
- **Casos/Modelos de catálogo disponíveis** (`src/pipelines/templates.ts`, categoria
  `caso`): `ec-01-respiratorio-pediatrico`, `ec-02-dengue-clima`,
  `ec-03-cardio-idosos-calor`, `ec-04-hospitalizacoes-frio`. Categoria `tematico`:
  `tematico-ondas-calor`, `tematico-ondas-frio`, `tematico-indices-bioclimaticos`.
  Categoria `clima`: `clima-inmet`, `clima-normais`, `grid-chirps`, `grid-era5`,
  `grid-poluicao-pm25`, `grid-queimadas`, `clima-aggregate-exposicao`. Categoria
  `pipeline` (básicos): `pipeline-importacao-saude`, `pipeline-preparacao-basica`,
  `pipeline-qualidade-visualizacao`.

---

## Capítulo 0 — `00-clima-saude.qmd`

### 1. Título final
**"Por que isso importa: clima, saúde e o que os dados escondem"**
(alternativa se precisar de algo mais curto: "Clima e saúde: a conexão que os dados revelam")

### 2. Público-alvo e tom
Público: **todos** (comunidade em geral é o piso — se uma pessoa sem formação técnica
entende, gestor e acadêmico também entendem; eles só vão ler mais rápido).
Tom: nenhum jargão do Studio ainda (nenhuma menção a Função/Pipeline/Motor — este
capítulo é 100% literacia clima-saúde, o Studio ainda não aparece no texto). Usar
exemplos concretos e cotidianos (calor extremo e atendimento de emergência, chuva forte
e dengue, fumaça de queimada e crise respiratória) antes de qualquer número ou conceito
epidemiológico formal. Gestor público deve terminar o capítulo entendendo por que isso
é pauta de política pública; acadêmico deve reconhecer os conceitos-chave (exposição,
desfecho, defasagem/lag, vulnerabilidade) sem ainda ver a formalização estatística;
comunidade deve sair capaz de explicar a alguém a ideia com uma frase.

### 3. Objetivos de aprendizagem
Ao final o leitor consegue:
- Explicar com um exemplo concreto como uma variável climática (calor, chuva, seca,
  fumaça) pode se transformar em um problema de saúde pública.
- Diferenciar "tempo" (evento pontual, ex. onda de calor de 5 dias) de "clima"
  (padrão de longo prazo) e por que essa diferença importa para saúde.
- Explicar por que o efeito do clima na saúde geralmente aparece com atraso (defasagem)
  e não no mesmo dia do evento climático.
- Identificar pelo menos 2 grupos populacionais mais vulneráveis (ex. idosos, crianças,
  populações de baixa renda/moradia precária) e por que a vulnerabilidade não é só
  biológica, mas também social e territorial.
- Argumentar por que "olhar para os dados juntos" (clima + saúde + território) é
  necessário para agir — e não apenas descrever o problema.

### 4. Estrutura de seções sugerida
- `## A ideia central` — abre com uma cena concreta (ex.: semana de calor extremo,
  aumento de atendimentos cardiovasculares em idosos) sem números do Studio.
- `## Tempo, clima e saúde: três relógios diferentes` — distingue evento agudo
  (onda de calor/frio, enchente) de padrão climático de longo prazo, e como a saúde
  responde a cada um.
- `## Por que o efeito demora a aparecer` — introduz a ideia de defasagem (lag) e
  janela de exposição de forma leiga (ex.: "o calor de hoje pode virar internação em
  3 dias"), sem fórmula, só intuição.
- `## Quem sente primeiro e quem sente mais forte` — vulnerabilidade social e
  territorial: por que o mesmo evento climático não afeta todo mundo igual.
- `### Recorte: calor, chuva, ar` — três blocos curtos e paralelos, um por tipo de
  exposição (calor/frio extremos; chuva/enchente/vetores; qualidade do ar/queimadas),
  cada um com 1 exemplo real brasileiro (ex.: dengue após chuvas no Nordeste,
  internações respiratórias após queimadas na Amazônia/Centro-Oeste, óbitos
  cardiovasculares em ondas de calor no Sudeste/Sul).
- `## De observação a ação` — fecha a ponte para o Capítulo 1 sem ainda nomear o
  Studio: "para agir, é preciso conseguir olhar esses dados juntos, de forma
  organizada e repetível — é isso que o resto deste livro ensina."
- `## Verifique se ficou` — bloco de fixação.

### 5. Exemplos/casos do catálogo a usar como fio condutor
Nenhuma Função ainda (o Studio não aparece). Usar os **temas** dos casos ec-01..04
como pano de fundo narrativo sem nomear IDs de catálogo:
- tema de ec-01 (respiratório pediátrico) → recorte "ar" (queimadas/poluição em
  crianças).
- tema de ec-02 (dengue×clima) → recorte "chuva/vetores".
- tema de ec-03 (cardiovascular idosos×calor) → recorte "calor".
- tema de ec-04 (hospitalizações×frio) → recorte "frio" (se o livro quiser 4 recortes
  em vez de 3; do contrário, frio pode virar 1 frase dentro do recorte "calor/frio").
Esses casos serão retomados por nome próprio (ec-01 etc.) só a partir do Capítulo 3/dos
capítulos futuros de estudo de caso completo — aqui é só o tema, sem jargão do Studio.

### 6. Diagrama SVG necessário
**Diagrama 0.1 — "Da exposição climática ao desfecho de saúde, com defasagem"**
Linha do tempo horizontal simples: um ícone de evento climático (ex. termômetro/gota de
chuva) em t0, uma seta curva pontilhada indicando "dias de defasagem", chegando a um
ícone de saúde (cruz/hospital) em t0+N dias. Abaixo da linha do tempo, uma segunda
camada mostra "quem é mais afetado" com 2-3 silhuetas (idoso, criança, comunidade em
área de risco) de tamanho/destaque visual maior para indicar vulnerabilidade
diferencial. Sem qualquer elemento de UI de software — é 100% conceitual/literacia,
pode ser usado em qualquer material sobre clima-saúde, não é uma tela do Studio.

### 7. Bloco de verificação final
Formato: `callout-note collapse="true"` com título "Verifique se ficou", 3 perguntas de
múltipla escolha em texto (não JS), cada uma seguida da resposta correta comentada em
1-2 frases (replicar o padrão do quiz da Lição 1, mas sem `<script>`/radio — só markdown).
Sugestão de perguntas:
1. Por que um caso de dengue pode aparecer semanas depois de uma chuva forte, e não no
   dia seguinte? (testa: defasagem/janela de exposição)
2. Dois bairros recebem a mesma onda de calor. Por que um pode ter muito mais
   atendimentos de emergência que o outro? (testa: vulnerabilidade social/territorial,
   não só exposição bruta)
3. Qual a diferença entre "uma onda de calor de 5 dias" e "o clima está esquentando"?
   (testa: tempo vs. clima)

---

## Capítulo 1 — `01-conhecendo-o-studio.qmd`

### 1. Título final
**"Conhecendo o ClimaSUS+ Studio: como a análise se organiza"**

### 2. Público-alvo e tom
Público: **todos**, mas é o primeiro capítulo em que gestor/comunidade/acadêmico
divergem um pouco em motivação — por isso abrir com "por que existe esse jeito de
organizar" (motivação) antes do modelo mental técnico. Tom mantém a régua da Lição 1
(`lessons/0001-o-que-e-climasus.html`) mas precisa ser mais explicativo que ela, porque
lá o público era só pesquisador/profissional de saúde já com algum contexto técnico.
Aqui, cada termo do modelo mental precisa de uma analogia leiga antes da definição
formal (ex.: Função é como uma "receita" na gaveta; Passo é a receita "em uso", com os
ingredientes escolhidos; Pipeline é o "cardápio do dia" — mas usar analogia só como
ponte, a definição final tem que usar o termo oficial, não a analogia).

### 3. Objetivos de aprendizagem
- Explicar a promessa central do Studio (montar e rodar análises de clima e saúde sem
  precisar programar) e por que essa promessa importa para seu público (gestor:
  autonomia sem depender de um analista para cada pergunta; acadêmico: reprodutibilidade
  e rastreabilidade metodológica; comunidade: entender o que está sendo dito sobre o
  próprio território).
- Nomear e diferenciar corretamente Função, Passo, Nó e Pipeline, na ordem certa
  (Função → Passo → Nó → Pipeline), sem confundir tipo com instância.
- Explicar o que é uma Etapa e para que serve dividir o catálogo em Preparação,
  Integração, Análise & Modelagem e RAP.
- Explicar o que é um Modelo e a diferença entre carregar um Modelo e seguir um
  Tutorial.
- Responder com segurança à pergunta "isso roda R?" do jeito alinhado ao Studio.

### 4. Estrutura de seções sugerida
- `## O problema que o Studio resolve` — motivação, sem ainda nomear os termos técnicos
  do Studio; liga direto ao fecho do Capítulo 0 ("juntar clima+saúde+território de forma
  repetível").
- `## O modelo mental: Função → Passo → Nó → Pipeline` — reaproveitar a estrutura de
  `<dl class="term">` da Lição 1 (4 itens numerados), mas com 1 analogia leiga por termo
  antes da definição oficial.
- `## A Biblioteca e as Etapas` — explica que as Funções ficam agrupadas em 4 Etapas
  (Preparação/Integração/Análise & Modelagem/RAP) e dá o número real de Funções de cada
  uma (15/28/32/12) para dar noção de escala; deixa claro que os Capítulos 2 e 3 deste
  livro vão abrir Preparação e Integração por dentro.
- `## Resultado e Artefato: o que sai de um Passo` — diferencia Resultado (o que aparece
  na tela — tabela/gráfico/mapa/texto) de Artefato (o arquivo concreto: PNG/SVG/HTML/CSV).
- `## Modelo, Tutorial e Centro de Pipelines: três jeitos de começar` — diferencia
  "carregar um Modelo pronto" de "seguir um Tutorial guiado" e onde encontrar os dois.
- `## O Motor por baixo (e por que você não precisa saber)` — explica a existência do
  Motor sem revelar R, reaproveitando quase literalmente o bloco/quote do ADR 0001 e o
  callout de "nunca diga R/engine/script" já validado na Lição 1.
- `## Verifique se ficou`.

### 5. Exemplos/Modelos do catálogo
Usar 1 Modelo simples da categoria `pipeline` como fio condutor visual (sem executar
nada ainda, é só "olha como fica no Pipeline"): `pipeline-importacao-saude` ou
`pipeline-preparacao-basica` — qualquer um dos dois serve, escolher o que tiver a
descrição mais curta/didática no `templates.ts`. Não usar ainda os casos ec-01..04 aqui
(eles pertencem ao arco de exemplo completo, mais para a frente no livro) — este
capítulo é sobre o modelo mental, não sobre um problema de saúde específico.

### 6. Diagrama SVG necessário
**Diagrama 1.1 — "Da Biblioteca ao Pipeline"**
Três colunas lado a lado conectadas por setas: (1) "Biblioteca" — uma pilha/grade de
cartões rotulados apenas com ícone genérico de Função, agrupados por 4 faixas de cor
correspondentes às 4 Etapas; (2) seta "arrastar + preencher parâmetros"; (3) "Pipeline"
— uma sequência horizontal de 3-4 Nós conectados por linhas, cada Nó anotado como
"Passo" com uma bolinha de parâmetro preenchido. Uma legenda de rodapé mapeia cor→Etapa
(Preparação/Integração/Modelagem/RAP). Deve ser reconhecível como uma versão
simplificada e rotulada da UI real do Studio (React Flow), não abstrata demais.

### 7. Bloco de verificação final
Reaproveitar diretamente o padrão de 3 perguntas da Lição 1 (podem ser as mesmas 3
perguntas dela, adaptadas ligeiramente ao público ampliado, já que o conteúdo é o
mesmo modelo mental): (1) resposta correta a "isso roda R?"; (2) o que vira um Nó;
(3) relação Função↔Passo. Adicionar 1 pergunta nova específica deste capítulo:
4. Qual a diferença entre carregar um Modelo e seguir um Tutorial? (testa:
   Modelo dá ponto de partida editável; Tutorial conduz passo a passo).

---

## Capítulo 2 — `02-etapa-preparacao.qmd`

### 1. Título final
**"Etapa Preparação: dados de saúde prontos antes de tudo"**

### 2. Público-alvo e tom
Público principal: **acadêmico e gestor técnico** (quem vai efetivamente montar
Pipelines), com comunidade/gestor não-técnico podendo acompanhar a lógica sem executar.
Marcar claramente no início do capítulo que a partir daqui o livro assume que o leitor
quer *fazer*, não só entender — pode citar que quem só quer entender o panorama pode
pular para o resumo do fim do capítulo. Tom mais operacional que os Capítulos 0-1, mas
cada Função ainda precisa de 1 frase de "por que isso existe" antes do "como usar".

### 3. Objetivos de aprendizagem
- Explicar o papel da Etapa Preparação no pipeline geral (é sempre o primeiro bloco:
  sem dados de saúde limpos e padronizados, nada depois funciona).
- Nomear e explicar a função de pelo menos 6-8 Funções centrais da Preparação:
  `sus_data_import`, `sus_data_clean_encoding`, `sus_data_standardize`,
  `sus_data_filter_cid`, `sus_data_filter_demographics`, `sus_data_create_variables`,
  `sus_data_aggregate`, `sus_data_quality_report` (mínimo — não precisa cobrir as 15).
- Explicar por que existe uma Função de "filtrar por CID" separada de "filtrar por
  demografia" (dois eixos independentes de recorte).
- Montar (ao menos na cabeça / em exercício guiado) uma sequência mínima de Passos que
  vai de "dados brutos importados" a "série temporal agregada e com relatório de
  qualidade", na ordem correta.
- Interpretar, em linhas gerais, o que um relatório de qualidade de dados
  (`sus_data_quality_report`) está dizendo e por que isso importa antes de seguir para
  a Integração.

### 4. Estrutura de seções sugerida
- `## Por que a Preparação vem primeiro` — motivação: dados de saúde brutos do DATASUS
  chegam "sujos" (encoding, nomes de coluna inconsistentes, sem filtro de interesse).
- `## As 15 Funções da Preparação, em 4 grupos` — mapa rápido, agrupando por família
  lógica: (a) importar/ler (`sus_data_import`, `sus_data_read`); (b) limpar/padronizar
  (`sus_data_clean_encoding`, `sus_data_standardize`, `sus_data_ts_quality`); (c) filtrar
  (`sus_data_filter_cid`, `sus_data_filter_demographics`, `sus_data_cid_select`); (d)
  transformar/agregar/exportar (`sus_data_create_variables`, `sus_data_aggregate`,
  `sus_data_export`) + visualização (`sus_data_plot_aggregate_ts`,
  `sus_data_plot_aggregate_map`, `sus_data_plot_demographics`) + qualidade
  (`sus_data_quality_report`).
- `## Exercício guiado: da importação ao relatório de qualidade` — sequência concreta de
  Passos (ver seção 5 abaixo), com print/diagrama do Pipeline resultante.
- `### Passo a passo` — numerado, cada Passo com: Função usada, parâmetro-chave que o
  leitor precisa decidir (ex. qual CID/grupo de doença, qual recorte demográfico, qual
  unidade de tempo), e o que muda no Resultado.
- `## Lendo o relatório de qualidade` — como interpretar `sus_data_quality_report` de
  forma leiga (o que é "bom" vs. "atenção"), sem estatística pesada.
- `## Verifique se ficou`.

### 5. Exemplo/Modelo do catálogo
Fio condutor: o Modelo `pipeline-preparacao-basica` (categoria `pipeline`) como
esqueleto do exercício guiado — é o Modelo adequado para isso no
catálogo. Se o conteúdo do Modelo real for muito raso para o exercício, usar como
inspiração e compor manualmente a sequência com as Funções listadas acima, mas manter a
referência ao Modelo (leitor pode carregá-lo para conferir/comparar). Doença/recorte de
exemplo: reaproveitar o tema de **ec-01 (respiratório pediátrico)** iniciado no
Capítulo 0 — usa `sus_data_filter_cid` com um grupo de causas respiratórias e
`sus_data_filter_demographics` com recorte de faixa etária pediátrica, fechando o arco
narrativo aberto no Capítulo 0.

### 6. Diagrama SVG necessário
**Diagrama 2.1 — "Pipeline de Preparação: da importação ao relatório de qualidade"**
Sequência linear de 5-6 Nós (fiel ao estilo do Diagrama 1.1) representando os Passos do
exercício guiado, na ordem: Importar → Padronizar/Corrigir encoding → Filtrar por
CID → Filtrar por demografia → Criar variáveis/Agregar → Relatório de qualidade. Cada
Nó rotulado com o nome curto da Função (não o `sus_*` técnico, o título amigável) e um
ícone pequeno indicando o tipo de Resultado que produz (tabela/gráfico/texto). Uma
faixa de cor única (a cor da Etapa Preparação) por trás de toda a fileira, reforçando
"isso é tudo uma Etapa".

### 7. Bloco de verificação final
3 perguntas:
1. Por que filtrar por CID e filtrar por demografia são dois Passos separados, e não um
   só? (testa: dois eixos de recorte independentes)
2. O relatório de qualidade aponta um problema no recorte que você escolheu. Isso
   significa que o Pipeline não pode continuar? (testa: relatório é diagnóstico, o
   leitor decide o que fazer — não é um bloqueio automático)
3. Qual Etapa vem depois da Preparação, e por que os dados precisam estar "prontos"
   antes dela? (testa: transição para Integração, ponte para o Capítulo 3)

---

## Capítulo 3 — `03-etapa-integracao.qmd`

### 1. Título final
**"Etapa Integração: clima, saúde e território na mesma análise"**

### 2. Público-alvo e tom
Público principal: **acadêmico e gestor técnico**, mesma régua operacional do
Capítulo 2, mas com mais peso conceitual porque aqui entram decisões metodológicas
reais (qual defasagem usar, qual fonte de clima). Reforçar explicitamente a ponte com
o Capítulo 0: agora o leitor vê, na prática do Studio, os conceitos de defasagem/janela
de exposição que foram apresentados de forma leiga lá.

### 3. Objetivos de aprendizagem
- Explicar o papel da Etapa Integração: juntar os dados de saúde já preparados com
  dados climáticos, ambientais e socioeconômicos, no mesmo espaço/tempo.
- Diferenciar as duas grandes fontes de clima disponíveis no catálogo: estação
  meteorológica (INMET, via `sus_climate_inmet`) vs. dados em grade/satélite
  (`sus_grid_era5`, `sus_grid_chirps`, `sus_grid_pollution_*` etc.) e quando cada uma
  faz mais sentido.
- Explicar, na prática de uma Função real (`sus_climate_aggregate`), o que é
  `temporal_strategy` e reconhecer pelo menos 3 estratégias (`exact`, `moving_window`,
  `discrete_lag`) e quando usar cada uma — retomando o conceito leigo de "defasagem" do
  Capítulo 0 agora como parâmetro concreto.
- Explicar o que a Função de indicadores socioeconômicos (`sus_socio_compute_indicators`)
  agrega de informação de território/censo ao Pipeline, e por que isso é necessário
  para não confundir efeito climático com efeito de vulnerabilidade social.
- Montar (exercício guiado) um Pipeline mínimo que liga saúde preparada + clima + um
  indicador socioeconômico em um único Resultado agregado.

### 4. Estrutura de seções sugerida
- `## Por que juntar clima, saúde e território` — motivação: sem essa junção, dá para
  descrever saúde e descrever clima separadamente, mas não para relacionar os dois.
- `## As 28 Funções da Integração, em 3 grupos` — (a) clima por estação
  (`sus_climate_inmet`, `sus_climate_normals`, `sus_climate_anomaly`,
  `sus_climate_compute_indicators`, `sus_climate_compute_heatwaves`,
  `sus_climate_compute_coldwaves`, `sus_climate_compute_spi`,
  `sus_climate_compute_spei`); (b) clima/ambiente em grade
  (`sus_grid_era5`, `sus_grid_chirps`, `sus_grid_fires`, `sus_grid_pollution_cams`,
  `sus_grid_pollution_ghap`, `sus_grid_pollution_merra2`, `sus_grid_pdsi`,
  `sus_grid_smvi`, `sus_grid_koppen`, `sus_grid_prodes`, `sus_grid_join`); (c)
  território/censo (`sus_socio_compute_indicators`, `sus_socio_list_indicators`) +
  a Função-chave que junta tudo com saúde (`sus_climate_aggregate`).
- `## O coração da Etapa: sus_climate_aggregate` — dedicar uma seção só a esta Função
  (é a mais densa do catálogo em parâmetros): explicar `climate_var`, `time_unit`, e
  com calma `temporal_strategy` retomando a linguagem de defasagem do Capítulo 0.
  Usar tabela comparativa simples: estratégia → pergunta que ela responde → exemplo de
  desfecho de saúde combinado (ex. `exact` para calor×óbito cardiovascular agudo,
  `moving_window` para chuva acumulada×dengue).
- `## Exercício guiado: saúde + clima + território em um só Pipeline` — sequência
  concreta (ver seção 5).
- `## Cuidado: correlação não é o mesmo que causa` — aviso conceitual breve (mais
  relevante para gestor: números de Integração ainda não são "modelo" — isso é Capítulo
  de Análise & Modelagem, fora do piloto, mas vale marcar a fronteira).
- `## Verifique se ficou`.

### 5. Exemplo/Modelo do catálogo
Fio condutor: continuar o arco **ec-02 (dengue×clima)** iniciado no recorte "chuva" do
Capítulo 0 — combina bem com `temporal_strategy = "moving_window"` (chuva acumulada) e
com a Função de território/censo (dengue tem forte componente de vulnerabilidade social
e infraestrutura de saneamento). Modelo de catálogo de apoio:
`clima-aggregate-exposicao` (categoria `clima`) como esqueleto do exercício guiado, com
menção lateral ao caso completo `ec-02-dengue-clima` como "para ver isso munido de um
problema real de ponta a ponta, veja o Modelo ec-02" (sem abrir o caso completo aqui —
isso fica para o módulo de estudos de caso, fora do piloto).

### 6. Diagrama SVG necessário
**Diagrama 3.1 — "Como sus_climate_aggregate junta três mundos"**
Três "trilhos" horizontais empilhados, cada um com um ícone e um rótulo: Saúde
(ícone hospital, rótulo "dados preparados"), Clima (ícone gota/termômetro, rótulo
"estação ou grade"), Território (ícone mapa/casas, rótulo "indicador socioeconômico").
Os três trilhos convergem visualmente (setas) para um único Nó central rotulado
"sus_climate_aggregate" (ou o nome amigável da Função), que se abre à direita em um
Resultado único (ícone tabela/série temporal). Sobre o trilho de Clima, uma pequena
régua de tempo pontilhada ilustrando a janela de defasagem (`moving_window`), retomando
visualmente o Diagrama 0.1 para reforçar a ponte conceitual entre os capítulos.

### 7. Bloco de verificação final
3 perguntas:
1. Você quer estudar o efeito de uma onda de calor de 1 dia sobre óbitos
   cardiovasculares no mesmo dia. Qual `temporal_strategy` faz mais sentido, `exact` ou
   `moving_window`? Por quê? (testa: escolha de estratégia por tipo de exposição)
2. Por que a Etapa Integração inclui uma Função de indicadores socioeconômicos, e não
   só dados de clima? (testa: necessidade de controlar vulnerabilidade social/território,
   ponte com Capítulo 0)
3. Qual a diferença entre clima "por estação" e clima "em grade", e me dê um exemplo
   de quando cada um seria a escolha certa. (testa: INMET/estação vs. satélite/grade)

---

## Roadmap resumido — módulos fora deste piloto (para o índice do livro, "próximos capítulos")

- **Etapa Análise & Modelagem** — as 32 Funções que transformam clima+saúde+território
  integrados em evidência estatística (DLNM, regressão espacial, Bayes espacial,
  scan statistic, case-crossover/ITS, aprendizado de máquina), respondendo "isso é real ou é
  ruído?".
- **Etapa RAP (Reprodutibilidade, Automação, Publicação)** — as 12 Funções que levam um
  Pipeline validado para fora do Studio: exportar e executar código, automatizar com
  `targets`, e montar um scaffold para compartilhar a análise com outra pessoa ou time.
- **Estudo de caso completo — ec-01: respiratório pediátrico × poluição/queimadas** —
  o arco iniciado no recorte "ar" do Capítulo 0, do dado bruto ao resultado
  interpretado, ponta a ponta.
- **Estudo de caso completo — ec-02: dengue × clima** — o arco iniciado no recorte
  "chuva" do Capítulo 0 e retomado na Integração, completo com modelagem e interpretação
  para gestão de vetores.
- **Estudo de caso completo — ec-03: doença cardiovascular em idosos × ondas de calor** —
  o arco do recorte "calor" do Capítulo 0, incluindo definição/detecção de onda de calor
  e desfecho cardiovascular agudo.
- **Estudo de caso completo — ec-04: hospitalizações × frio extremo** — o arco do
  recorte "frio", incluindo ondas de frio e desfechos respiratórios/cardiovasculares em
  populações vulneráveis ao frio (relevante para Sul/Sudeste/altitude).
- **Glossário formal do livro** — versão em prosa contínua do CONTEXT.md, com exemplos
  de uso correto/incorreto de cada termo, para consulta rápida ao longo da leitura (não
  substitui o CONTEXT.md como fonte de autoridade, é uma adaptação didática dele).
