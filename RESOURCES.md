# climasus+ para minicurso — Resources

## Knowledge

- [CONTEXT.md](../CONTEXT.md)
  Glossário oficial do produto (Função, Passo, Nó, Pipeline, Motor, Etapa, Modelo, Tutorial...).
  Use for: fixar a terminologia correta antes de qualquer explicação ao público.
- [ADR 0001 — O Motor R é invisível](../docs/adr/0001-motor-r-invisivel.md)
  Registra por que a UI nunca menciona "R" e trata o executor como "Motor". Use for: responder
  "isso roda R?"/"preciso programar?" sem quebrar a promessa de valor do produto.
- [README.md](../README.md)
  Pitch de uma frase do produto + como baixar o beta. Use for: abertura do minicurso, slide de
  instalação.
- [src/catalog/functions.json](../src/catalog/functions.json)
  Catálogo completo das 87 Funções `sus_*`, com `stage` (preparacao/integracao/modelagem/rap),
  título, descrição e parâmetros. Use for: escolher quais Funções demonstrar em cada Etapa.
- [src/pipelines/templates.ts](../src/pipelines/templates.ts)
  Modelos prontos, incluindo 4 casos completos (`ec-01-respiratorio-pediatrico`,
  `ec-02-dengue-clima`, `ec-03-cardio-idosos-calor`, `ec-04-hospitalizacoes-frio`). Use for:
  exercícios guiados — cada caso já é um pipeline fim-a-fim que o público pode carregar e rodar.
- [climasus4r (GitHub)](https://github.com/ByMaxAnjos/climasus4r)
  Pacote R por trás do Motor. Use for: dúvidas avançadas de um Passo específico (não citar R ao
  público — só para preparo do próprio Max).

## Wisdom (Communities)

_Sem gaps de conteúdo, mas nenhuma comunidade externa foi levantada ainda — Max é autor da
ferramenta, então "wisdom" aqui provavelmente vem do feedback dos próprios participantes do
minicurso, não de um fórum. Revisitar se surgir necessidade de trocar com outros
instrutores/pesquisadores de DATASUS+clima._

## Gaps

- Nenhum material de "como o público reage" ainda — a primeira turma do minicurso vai gerar isso.
  Depois de cada oferta, vale registrar em `learning-records/` o que confundiu o público, para
  ajustar as próximas lições.
