# Figuras do guia climasus+ Studio

As dez figuras conceituais do livro são **geradas por código** — não editadas à mão.
Isso garante que tipografia, paleta e espaçamento permaneçam consistentes entre capítulos
e que qualquer ajuste possa ser refeito de forma reprodutível.

## Arquivos

| Arquivo | Capítulo | Conteúdo |
|---|---|---|
| `pipeline-flow.svg` | 02 · Preparação | sete Passos, decisões e verificação de qualidade |
| `integracao-flow.svg` | 03 · Integração | saúde + clima + território, alinhamento e tabela com defasagens |
| `modelagem-flow.svg` | 06 · Análise & Modelagem | DLNM, superfície exposição × defasagem, AF e decisão |
| `rap-flow.svg` | 12 · Parâmetros avançados | exportação, reexecução, automação e custódia |
| `node-anatomy.svg` | 01 · Conhecendo o Studio | anatomia do Nó e vocabulário Função → Passo → Nó → Pipeline |
| `clima-saude-map.svg` | 00 · Clima e saúde | cadeia causal, defasagem, colheita e vulnerabilidade |
| `arco-ec01.svg` … `arco-ec04.svg` | 07–10 · Casos | arco completo + ficha do estudo + assinatura gráfica do desenho |

## Sistema visual

- **Paleta**: papel `#f7f4ec`, tinta `#0b2420`, teal `#0e7c6b`, floresta `#1f7a4d`,
  ocre `#b7791f`, argila `#b4472f` — espelha `book/theme/guide.scss`.
- **Tipografia**: Georgia/serifa para títulos, Helvetica Neue/Arial para texto,
  SF Mono/Menlo para código. Não há dependência de fonte externa: o SVG abre igual
  no HTML, no PDF e no DOCX.
- **Gramática**: cabeçalho editorial, cartões com barra de acento na cor da Etapa,
  rodapé escuro de "leitura científica" e um gráfico-esquema em cada figura de caso.
- **Acessibilidade**: todo SVG tem `role="img"`, `<title>` e `<desc>`; as imagens no
  livro têm `fig-alt` descritivo.

## Como regenerar

```bash
# a partir da raiz do repositório
python3 book/scripts/figures/build_figures.py
```

O script grava diretamente em `book/images/`. Para conferir uma figura:

```bash
rsvg-convert -w 1800 book/images/pipeline-flow.svg -o /tmp/preview.png
```

Depois, reconstrua o livro:

```bash
cd book && quarto render --to html
```

## Convenções científicas

- Gráficos são **esquemas**: o selo `esquema` no canto do painel indica que a forma é
  didática, não um resultado estimado. Nenhum eixo numérico é apresentado como achado.
- A fração atribuível é descrita em relação à **temperatura de mínimo risco (MMT)**,
  coerente com o Capítulo 6.
- As fichas de caso reproduzem apenas recortes explicitados nos capítulos
  (fonte, CID, população, território, período, exposição e desenho).
- As figuras de caso 03 e 04 nomeiam os limites do desenho: efeito colheita e
  necessidade de data de evento definida *a priori*.
