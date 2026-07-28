# Mission: climasus+ para minicurso

## Why
Max vai ministrar um minicurso apresentando o climasus+ a pesquisadores e
profissionais de saúde/epidemiologia sem programação avançada. As lições
deste workspace servem dois papéis ao mesmo tempo: aprofundar o domínio do
próprio Max sobre como explicar cada parte do produto, e virar o material
(handouts, roteiro, exercícios) que ele vai efetivamente usar em aula.

## Success looks like
- Max consegue explicar o vocabulário do produto (Função, Passo, Nó, Pipeline,
  Etapa, Motor, Resultado, Artefato) sem recorrer a termos técnicos de R.
- Max tem um roteiro de aula modular: cada lição cobre uma Etapa do pipeline
  (Preparação → Integração → Análise & Modelagem → RAP) com um Modelo/caso
  real do catálogo como exercício guiado.
- Max sabe apontar, para cada Etapa, qual Modelo de caso (`caso ec-01..04`)
  usar como demonstração ao vivo, e consegue prever as perguntas mais comuns
  do público (ex: "isso roda R?", "preciso saber programar?").
- Existe pelo menos um exercício prático por Etapa que o público consegue
  completar sozinho na interface, sem escrever código.

## Constraints
- Formato/duração do minicurso ainda não decidido — lições devem ser
  modulares (uma por Etapa, mais uma introdutória) para remontar a agenda
  depois sem retrabalho.
- Público não programa em R e não deve nem saber que existe R por baixo
  (ver [ADR 0001](../docs/adr/0001-motor-r-invisivel.md)) — toda explicação
  e todo material devem seguir essa regra de linguagem.
- Idioma: português (idioma do produto e do público-alvo).

## Out of scope
- Detalhes de arquitetura de software (Tauri, empacotamento do R, CI/CD) —
  isso é para os desenvolvedores, não para o público do minicurso.
- Funções `sus_*` individuais fora do que aparece nos Modelos/casos usados
  como exercício — não é curso de referência da API do `climasus4r`.
