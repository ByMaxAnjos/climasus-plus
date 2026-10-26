# climasus+ Studio · Guia prático

Guia prático sobre clima, saúde e Amazônia para gestores públicos, acadêmicos e
comunidade. O livro é escrito em Quarto (`.qmd`) e publicado em HTML, PDF e DOCX.

## Prévia rápida

```bash
cd book
quarto preview          # abre a prévia com recarga automática
quarto render           # gera o HTML em _book/

# tudo de uma vez: HTML -> PDF -> DOCX
bash scripts/build-all.sh

# ou por etapa
bash scripts/build-pdf.sh                 # PDF desenhado (Chrome + pdfunite)
python3 scripts/build-docx.py             # DOCX editável
```

Saídas em `_book/`:

- `climasus-studio-guia-pratico.pdf` — versão para impressão, com capa e aberturas de parte;
- `climasus-studio-guia-pratico.docx` — versão editável em Word;
- `index.html` — versão web navegável.

O `format.pdf` do Quarto (XeLaTeX) permanece como fallback de texto; o PDF
desenhado é gerado a partir de `print-cover.html` + `print-body.html`, para
preservar capa, tipografia, cores e aberturas de parte.

## Identidade visual

A direção de arte parte do encontro entre floresta, água e saúde — o mesmo
território do ecossistema climaSUS, do Centro de Clima de Saúde de Rondônia, da
Fiocruz Rondônia e do INCT-CONEXAO.

| Elemento | Escolha |
|---|---|
| Capa (imagem) | **Fraunces** (600, itálico 400) |
| Texto | **Petrona** (400–700, itálico) |
| Interface e rótulos | **Archivo** (400–700) |
| Código e parâmetros | **IBM Plex Mono** (400/500) |
| Tinta | `#0B2420` |
| Rio | `#0E7C6B` |
| Água | `#2DD4BF` |
| Terra | `#D99A2B` |
| Papel | `#F7F4EC` |

A capa vertical é gerada a partir de `_design/capa.html` (abra no navegador e capture em 1600 × 2400).

Motivos: contorno topográfico (`images/illustrations/contorno.svg`), linha de
rio (`rio-divider.svg`), folha (`folha.svg`) e o pipeline desenhado como rio
(`pipeline-rio.svg`). As aberturas de parte usam fotografias do acervo Fiocruz
Imagens em preto e branco, com tratamento duotônico em tinta, água e terra.

## Estrutura

```
book/
├── _quarto.yml              # configuração do livro (HTML + PDF)
├── index.qmd                # capa editorial + apresentação + mapa do guia
├── part-1-fundamentos.qmd   # aberturas de parte (design full-bleed)
├── part-2-pipeline.qmd
├── part-3-gestor.qmd
├── part-4-pesquisador.qmd
├── part-5-casos.qmd
├── 00-clima-saude.qmd ...   # capítulos
├── colofao.qmd              # ficha técnica, créditos, licença
├── theme/
│   ├── guide.scss           # fonte do design system (editar aqui)
│   ├── guide.css            # CSS compilado (gerado; não editar à mão)
│   ├── guide.js             # progresso de leitura, classes de página, acessibilidade
│   ├── head.html            # metadados, preloads, script
│   ├── before-body.html     # skip link
│   ├── pdf-header.tex       # ajustes LaTeX do PDF fallback
│   ├── reference.docx       # estilos do DOCX (gerado)
│   └── fonts/               # Fraunces (capa), Petrona, Archivo e IBM Plex Mono (woff2)
├── _design/capa.html        # fonte da capa vertical (1600 × 2400)
├── scripts/
│   ├── build-print.py       # gera print-cover.html e print-body.html
│   ├── build-pdf.sh         # imprime capa/corpo e junta o PDF
│   ├── build-docx.py        # gera o DOCX a partir do HTML de impressão
│   ├── make-reference-docx.py
│   └── build-all.sh         # HTML + PDF + DOCX
├── images/
│   ├── brand/               # logos + capa-guia.jpg
│   ├── photos/              # fotografias Fiocruz Imagens (ver CREDITS.md)
│   ├── part-openers/        # aberturas em página inteira usadas no DOCX
│   ├── illustrations/       # SVGs autorais do guia
│   ├── screenshots/         # capturas do Studio
│   └── *.svg                # diagramas das etapas e dos casos
└── _editorial/              # roteiro-mestre interno (não entra no build)
```

## Como editar e renderizar

### 1. Texto e capítulos

Edite o `.qmd` correspondente em `book/` (um capítulo = um arquivo). Para prévia
com recarga automática:

```bash
cd book
quarto preview
```

Para gerar a versão web:

```bash
quarto render --to html
```

### 2. Design, cores e tipografia

O Quarto carrega `theme/guide.css`, não o SCSS. Edite `theme/guide.scss` e
recompile antes de renderizar:

```bash
npx --yes sass theme/guide.scss theme/guide.css --style=compressed --no-source-map
quarto render
```

Os caminhos de fonte e de imagem no CSS são relativos a `_book/theme/guide.css`:
`fonts/*.woff2` e `../images/...`. Se mover arquivos, ajuste os `url(...)`.

### 3. Fotografias

1. Coloque a nova imagem em `images/photos/` (JPEG, até ~2200 px no lado maior).
2. Atualize o `src`, o texto alternativo e a legenda no `.qmd` do capítulo ou da
   abertura de parte.
3. Atualize o crédito em `colofao.qmd` e a tabela em `images/photos/CREDITS.md`.
4. Rode `bash scripts/build-all.sh`.

Se a foto for de uma **abertura de parte**, o DOCX usa uma arte de página
inteira em `images/part-openers/part-X.jpg`. Regenere essa arte a partir da
página HTML correspondente (viewpoint 794 × 1123, com a foto no topo e o texto
abaixo) antes de rodar `build-docx.py`.

### 4. Capa

A capa vertical é `images/brand/capa-guia.jpg`, gerada a partir de
`_design/capa.html` em 1600 × 2400. Depois de editar o HTML, capture a página
nesse tamanho e salve o JPG; em seguida rode `bash scripts/build-all.sh`.

### 5. PDF e DOCX

```bash
cd book
bash scripts/build-pdf.sh      # PDF desenhado, 69 páginas
python3 scripts/build-docx.py  # DOCX editável, 71 páginas
```

O `build-pdf.sh` usa Chrome headless e `pdfunite` (ou `pypdf`) e não depende de
LaTeX. O `format.pdf` do Quarto/XeLaTeX continua como fallback de texto.

### Páginas especiais

- **Capa (`index.qmd`)**: o bloco `.hero` é HTML bruto em fence `{=html}` para
  não ser interpretado como Markdown. Os links usam `.html`, porque o fence não
  passa pelo rewriter do Quarto.
- **Aberturas de parte**: cada `part-*.qmd` é uma página inteira com
  `.part-opener`. O `guide.js` adiciona `part-page` ao `<body>` e esconde o
  título automático. A variante `.no-photo` (Parte II) usa o gráfico do rio.
- **Colofão**: `colofao.qmd` é um capítulo final, não um apêndice, para evitar
  o rótulo "Appendix A".

## Conteúdo e verificação

O texto foi auditado contra o catálogo em 22/10/2026 e atualizado em 25/10/2026:

- 79 funções: 15 Preparação, 32 Integração, 32 Análise & Modelagem.
- Integração documenta `sus_census_join`, `sus_census_select`,
  `sus_spatial_join` e `sus_grid_plot`.
- `sus_data_import` exige `month` para SIH, CNES e SIA.
- `sus_climate_inmet` usa `parallel = FALSE` por padrão.
- `sus_data_plot_aggregate_ts` usa `plot_type = "epidemic"` por padrão.
- Os quatro Modelos de caso foram atualizados: dengue com **graus-dia (GDD, base 11 °C)**,
  respiratório pediátrico **semanal** com umidade, hospitalizações de frio em **Porto
  Alegre** (série única) e cardiovascular com **baseline fixo** e nota sobre MMT.
- As capturas de tela dos pipelines de dengue, respiratório, frio, cardio, integração,
  preparação e modelagem foram regeradas a partir do app.

Itens verificados por leitura do catálogo e do código do motor; não substituem
teste de execução em cada sistema operacional. As capturas de tela dos pipelines são de
outubro de 2026 e serão atualizadas quando a interface ou os Modelos mudarem.

## Fotografias

As imagens de `images/photos/` vêm do **Fiocruz Imagens** e são usadas em
contexto educativo e não comercial, com atribuição. A licença de cada uma é
**by-nc**. Consulte `images/photos/CREDITS.md` para autoria, data, cobertura e
URL de origem, e os [termos do Fiocruz Imagens](https://www.fiocruzimagens.fiocruz.br/s/fiocruzimagens/page/licencas)
antes de reutilizar.

## Leitura dos Resultados

O Capítulo 5 apresenta um roteiro para conferir dados, tabelas, estatísticas, curvas e
incerteza. Os Capítulos 7 a 10 incluem **resultados reais de um snapshot executado em
26/10/2026**, com fonte, recorte, N, checksum, figuras e scripts de reprodução. Eles
descrevem aquele snapshot — não são previsões nem achados generalizáveis para outros
territórios ou períodos.

Os resultados foram gerados pelos scripts em `book/scripts/` e gravados em
`book/data/`, `book/tables/results/`, `book/images/results/` e `book/results/`. Para
reproduzir, rode `Rscript book/scripts/run-all.R` (ou o script de cada caso). O build do
Quarto é estático: ele inclui os artefatos, não executa os pipelines.

Quando atualizar o snapshot, registre a data da execução, fontes, recorte, Parâmetros,
checksum e Artefatos usados; atualize tabela, figura e interpretação em conjunto. Se
algum exemplo continuar didático, preserve o aviso de que ele é simulado.

## Acessibilidade

- Contraste alto entre texto e fundo; foco visível.
- `skip link`, `alt` descritivo em todas as imagens e legendas com crédito.
- Navegação por teclado; `prefers-reduced-motion` respeitado.
- No mobile, a barra lateral vira menu e as tabelas rolam horizontalmente.

## Publicação

O guia acompanha o repositório
[climasus-plus](https://github.com/ByMaxAnjos/climasus-plus). Para publicar,
rode `quarto render` e publique `_book/` (GitHub Pages, Netlify ou servidor
institucional). O PDF e o DOCX podem ser anexados à página de releases do Studio.
