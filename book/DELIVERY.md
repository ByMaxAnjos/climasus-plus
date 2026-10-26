# Entrega — guia prático reformatado

**Data:** 22 de outubro de 2026  
**Branch:** `team/guia-pratico`  
**Pasta:** `book/`  
**Prévia:** `book/_book/index.html` (gerada por `quarto render --to html`)  
**PDF:** `book/_book/climasus-studio-guia-pratico.pdf` (69 páginas)  
**DOCX:** `book/_book/climasus-studio-guia-pratico.docx` (71 páginas)

## O que foi feito

- **Revisão de fotos:** a Parte IV trocou a imagem de desmatamento/motosserra
  por uma foto de pesquisa laboratorial com *Aedes aegypti* (Vinícius Marinho |
  Acervo Fiocruz Imagens). A capa e a Parte V passaram a usar a foto do grupo de
  crianças tembés, com as crianças visíveis; a Parte V ganhou layout de foto no
  topo e texto abaixo, e a capa web também foi reorganizada em faixa superior.
- Nova identidade visual: capa vertical, capa web, aberturas de parte, paleta
  amazônica (tinta, rio, água, terra), tipografia Petrona + Archivo + IBM Plex Mono; capa em Fraunces.
- Estrutura editorial em cinco partes com aberturas desenhadas e fallback para PDF.
- Logos institucionais: climasus+ Studio, **INCT-CONEXAO (apoio)**, Fiocruz
  Rondônia, CNPq e UFJF — na capa, na home, no rodapé e no colofão.
- Fotografias do **Fiocruz Imagens** (Acervo João Roberto Ripper) na capa e nas
  aberturas das Partes I, III, IV e V; foto institucional da Fiocruz Rondônia no
  colofão. Créditos e licença by-nc documentados.
- Diagramas SVG antigos recoloridos para a nova paleta; novo diagrama
  “pipeline como rio”; novo divisor de rio e contorno topográfico.
- Tabelas largas com rolagem horizontal; callouts, figuras, quizzes e glossário
  restilizados; barra de progresso de leitura e foco acessível.
- Conteúdo auditado em 22/10/2026: 79 funções (15/32/32); funções de censo e
  vínculo espacial documentadas na Integração; `month` obrigatório em SIH/CNES/SIA;
  `parallel = FALSE` no INMET; `plot_type = "epidemic"` como padrão.
- PDF desenhado com capa em página inteira, sumário, aberturas de parte e
  páginas de leitura (Chrome/Playwright sobre `print-cover.html` + `print-body.html`).
- DOCX editável com capa, aberturas de parte em imagem, tipografia Georgia/Calibri,
  tabelas coloridas, cabeçalho/rodapé e numeração de páginas.

## Como abrir

```bash
cd book
quarto preview          # prévia navegável
quarto render           # gera _book/
```

Ou abra diretamente:

- `book/_book/index.html` — versão web;
- `book/_book/climasus-studio-guia-pratico.pdf` — PDF desenhado;
- `book/_book/climasus-studio-guia-pratico.docx` — Word editável.

Para regerar tudo:

```bash
cd book
bash scripts/build-all.sh
```

Ou por etapa:

```bash
bash scripts/build-pdf.sh      # capa + corpo + merge
python3 scripts/build-docx.py  # Pandoc + reference.docx
```

## Arquivos-chave

- `_quarto.yml` — configuração do livro.
- `theme/guide.scss` — fonte do design system; `theme/guide.css` é compilado.
- `theme/guide.js` — progresso, classes de página, tabelas, acessibilidade.
- `images/brand/capa-guia.jpg` — capa vertical 1600 × 2400.
- `_design/capa.html` — fonte editável da capa vertical.
- `images/photos/CREDITS.md` — autoria, data, cobertura e licença das fotos.
- `colofao.qmd` — ficha técnica, créditos, licença e mudanças desta edição.

## Observação de versionamento

O `.gitignore` do repositório do app ignora `book/` (“personal/internal material
— keep it local only”). Por isso a entrega está no worktree, mas **não foi
commitada**. Para versionar, é preciso decidir entre:

1. abrir uma exceção `!book/` no `.gitignore` do repositório do app;
2. mover o guia para um repositório próprio de documentação;
3. manter o guia como artefato local, fora do app.

O conteúdo está pronto para qualquer um dos caminhos.
