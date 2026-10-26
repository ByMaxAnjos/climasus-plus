#!/usr/bin/env python3
"""Gera um HTML de página única para impressão em PDF.

Lê as páginas já renderizadas em _book/ e concatena o conteúdo em uma
edição de leitura contínua, com capa, sumário, aberturas de parte e capítulos.
O PDF é produzido a partir deste arquivo por scripts/build-pdf.mjs.
"""
from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / "_book"

ORDER = [
    ("index", "frontmatter"),
    ("part-1-fundamentos", "part"),
    ("00-clima-saude", "chapter"),
    ("01-conhecendo-o-studio", "chapter"),
    ("part-2-pipeline", "part"),
    ("02-etapa-preparacao", "chapter"),
    ("03-etapa-integracao", "chapter"),
    ("part-3-gestor", "part"),
    ("04-modelos-vigilancia", "chapter"),
    ("05-da-evidencia-a-acao", "chapter"),
    ("part-4-pesquisador", "part"),
    ("06-etapa-analise-modelagem", "chapter"),
    ("part-5-casos", "part"),
    ("07-caso-respiratorio-pediatrico", "chapter"),
    ("08-caso-dengue-clima", "chapter"),
    ("09-caso-cardio-idosos-calor", "chapter"),
    ("10-caso-hospitalizacoes-frio", "chapter"),
    ("11-glossario", "chapter"),
    ("12-parametros-avancados", "chapter"),
    ("colofao", "chapter"),
]

PRINT_CSS = """
@page { size: A4; margin: 16mm 15mm 17mm; }
html, body { background: #F7F4EC !important; }
body { width: auto !important; margin: 0 !important; padding: 0 !important; font-size: 10.2pt; }
#print-cover { width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; background: #0B2420; break-after: page; }
#print-cover img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center; }
.print-toc { break-after: page; }
.print-toc h1 { font-size: 34pt; margin: 0 0 12mm; }
.print-toc .toc-part { margin: 0 0 7mm; }
.print-toc .toc-part-title { font-family: "Petrona", Georgia, serif; font-size: 15pt; color: #0B2420; margin: 0 0 4mm; padding-bottom: 2.5mm; border-bottom: 1px solid #D8DED6; }
.print-toc .toc-part-title span { color: #B7791F; font-family: "Archivo", sans-serif; font-size: 8pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; display: block; margin-bottom: 1.5mm; }
.print-toc ul { list-style: none; margin: 0; padding: 0; }
.print-toc li { font-size: 10.2pt; color: #163B34; margin: 0 0 2.4mm; padding-left: 0; }
.print-toc li .toc-kicker { color: #B7791F; font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-right: 2mm; }
.print-frontmatter { break-after: page; }
.print-part { break-before: page; break-after: page; }
.print-part .part-opener { min-height: 264mm; height: 264mm; grid-template-columns: 1.02fr .98fr !important; border-radius: 3mm; overflow: hidden; }
.print-part .part-photo { min-height: 0 !important; height: 264mm; order: 0 !important; }
.print-part .part-opener.part-opener--group { grid-template-columns: 1fr !important; grid-template-rows: 42% 58%; }
.print-part .part-opener--group .part-photo { height: 100% !important; }
.print-part .part-opener--group .part-photo { order: -1 !important; }
.print-part .part-copy { padding: 18mm 12mm !important; }
.print-part .part-number { font-size: 78pt !important; margin-bottom: 5mm !important; }
.print-part .part-kicker { font-size: 7pt !important; margin-bottom: 3mm !important; }
.print-part .part-opener h1 { font-size: 25pt !important; line-height: 1.04 !important; margin-bottom: 4mm !important; }
.print-part .part-standfirst { font-size: 10pt !important; line-height: 1.45 !important; margin-bottom: 6mm !important; }
.print-part .part-list li { font-size: 7.6pt !important; padding: 2mm 0 !important; }
.print-part .part-list .part-ch { font-size: 6.5pt !important; }
.print-part .part-photo::before { background: linear-gradient(90deg, #0B2420 0%, rgba(11,36,32,.55) 18%, rgba(11,36,32,.02) 60%), linear-gradient(0deg, rgba(11,36,32,.55) 0%, transparent 45%), linear-gradient(180deg, rgba(45,212,191,.18), rgba(185,119,31,.14)) !important; }
.print-chapter { break-before: page; }
.print-chapter .quarto-title-block { margin-bottom: 5mm; }
.print-chapter .quarto-title h1.title { font-size: 23pt !important; line-height: 1.05 !important; margin-bottom: 3mm; }
.print-chapter .quarto-title h1.title::after { width: 22mm; height: 1.2mm; margin-top: 3mm; }
.print-chapter .quarto-title .subtitle { font-size: 6.8pt !important; margin-bottom: 2mm; }
.print-chapter h2 { font-size: 15pt !important; margin-top: 7mm; padding-top: 3mm; }
.print-chapter h3 { font-size: 11pt !important; margin-top: 5mm; }
.print-chapter h4 { font-size: 8pt !important; }
.print-chapter .support h2 { margin-top: 0 !important; padding-top: 0 !important; border-top: none !important; }
.print-chapter p, .print-chapter li { font-size: 9.7pt; line-height: 1.55; }
.print-chapter p { orphans: 3; widows: 3; }
.print-chapter table { font-size: 7.1pt !important; table-layout: fixed; word-break: break-word; }
.print-chapter table code { font-size: 6.6pt !important; white-space: normal; }
.print-chapter th, .print-chapter td { padding: 1.6mm 1.8mm !important; }
.print-chapter .table-scroll { overflow: visible !important; }
.print-chapter pre { font-size: 7.2pt !important; padding: 3mm !important; }
.print-chapter pre code { font-size: 7.2pt !important; }
.print-chapter figure { margin: 5mm 0; break-inside: avoid; }
.print-chapter figure img { max-height: 98mm; width: auto; max-width: 100%; object-fit: contain; }
.print-chapter .callout { break-inside: avoid; margin: 4mm 0; }
.print-chapter .amazonia { break-inside: avoid; }
.print-chapter blockquote { font-size: 10pt !important; }
.print-chapter .nav-page, .print-chapter .page-footer, .print-chapter .quarto-title-meta { display: none !important; }
.print-chapter a[href^="http"]::after { content: none !important; }
.print-chapter .code-copy-button { display: none !important; }
a[href^="http"]::after { content: none !important; }
.print-chapter .pdf-only { display: none !important; }
.print-chapter h1, .print-chapter h2, .print-chapter h3 { break-after: avoid; }
.print-chapter tr { break-inside: avoid; }
.print-chapter thead { display: table-header-group; }
.print-chapter .quarto-figure { break-inside: avoid; }
.print-chapter .column-body { width: 100% !important; }
.print-chapter .quarto-title .subtitle { color: #B7791F !important; }
.print-frontmatter .audience-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 3mm !important; }
.print-frontmatter .audience-card { padding: 4mm !important; }
.print-frontmatter .audience-card p { font-size: 8.4pt !important; }
.print-frontmatter .guide-map { grid-template-columns: 1fr 1fr !important; gap: 3mm !important; }
.print-frontmatter .map-card { padding: 4mm !important; }
.print-frontmatter .map-card h3 { font-size: 11pt !important; }
.print-frontmatter .map-card p { font-size: 8pt !important; }
.print-frontmatter .editorial-intro { grid-template-columns: 1.05fr .95fr !important; gap: 6mm !important; }
.print-frontmatter .editorial-intro figure img { height: 62mm !important; }
.print-frontmatter .editorial-copy p { font-size: 8.8pt !important; line-height: 1.55 !important; }
.print-frontmatter .support { padding: 6mm !important; }
.print-frontmatter .support-logos img { max-height: 10mm !important; }
.print-frontmatter .support-logos .inct { max-height: 15mm !important; }
.print-frontmatter .support-logos a { min-height: 15mm !important; }
.print-frontmatter .section-lede { font-size: 11pt !important; }
"""


def extract_main(path: Path) -> BeautifulSoup:
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "lxml")
    main = soup.find("main", id="quarto-document-content")
    if main is None:
        raise SystemExit(f"main não encontrado em {path}")
    return main


def clean_main(main: Tag, kind: str) -> None:
    for tag in main.find_all("script"):
        tag.decompose()
    for selector in [
        ".skip-link",
        ".pdf-only",
        ".quarto-cover-image",
        ".nav-page",
        ".page-footer",
        ".quarto-title-meta",
        ".code-copy-button",
        ".quarto-title-banner",
    ]:
        for tag in main.select(selector):
            tag.decompose()

    if kind in {"frontmatter", "part"}:
        for tag in main.select(".quarto-title-block"):
            tag.decompose()
    if kind == "frontmatter":
        for tag in main.select(".hero"):
            tag.decompose()

    # Links internos não apontam para páginas dentro do PDF; mantém o texto.
    for link in main.find_all("a", href=True):
        href = link.get("href", "")
        if href.endswith(".html") or href.startswith("#"):
            del link["href"]

    # Tabelas largas: envolver para o CSS de impressão controlar a largura.
    for table in main.find_all("table"):
        parent = table.parent
        if isinstance(parent, Tag) and "table-scroll" in (parent.get("class") or []):
            continue
        wrapper = main.find("div", class_="table-scroll")
        new_wrapper = BeautifulSoup('<div class="table-scroll"></div>', "lxml").div
        table.wrap(new_wrapper)


def page_title(path: Path) -> tuple[str, str]:
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "lxml")
    if soup.select_one(".part-opener"):
        h1 = soup.select_one(".part-opener h1")
        kicker = soup.select_one(".part-opener .part-kicker")
    else:
        h1 = soup.select_one(".quarto-title h1.title")
        kicker = soup.select_one(".quarto-title .subtitle")
    title = h1.get_text(" ", strip=True) if h1 else path.stem
    kicker_text = kicker.get_text(" ", strip=True) if kicker else ""
    return title, kicker_text


def build_toc() -> str:
    groups = []
    current = None
    for stem, kind in ORDER:
        path = BOOK / f"{stem}.html"
        if not path.exists():
            continue
        title, kicker = page_title(path)
        if kind == "part":
            current = {"title": title, "kicker": kicker, "items": []}
            groups.append(current)
        elif kind == "chapter" and current is not None:
            current["items"].append({"title": title, "kicker": kicker})
    parts = []
    for group in groups:
        items = "".join(
            f'<li><span class="toc-kicker">{item["kicker"].replace("Capítulo ", "cap. ")}</span>{item["title"]}</li>'
            for item in group["items"]
        )
        parts.append(
            f'<div class="toc-part"><div class="toc-part-title"><span>{group["kicker"]}</span>{group["title"]}</div><ul>{items}</ul></div>'
        )
    return (
        '<section class="print-toc">'
        '<div class="quarto-title"><p class="subtitle">climasus+ Studio · guia prático</p><h1 class="title">Sumário</h1></div>'
        + "".join(parts)
        + "</section>"
    )


def build() -> None:
    index_soup = BeautifulSoup((BOOK / "index.html").read_text(encoding="utf-8"), "lxml")
    styles = []
    for link in index_soup.find_all("link", rel="stylesheet"):
        href = link.get("href")
        if href:
            styles.append(f'<link rel="stylesheet" href="{href}">')

    sections = []
    sections.append(
        '<section id="print-cover"><img src="images/brand/capa-guia.jpg" alt="Capa do guia prático do climasus+ Studio"></section>'
    )
    sections.append(build_toc())

    for stem, kind in ORDER:
        path = BOOK / f"{stem}.html"
        if not path.exists():
            continue
        main = extract_main(path)
        clean_main(main, kind)
        inner = main.decode_contents()
        if kind == "frontmatter":
            sections.append(f'<section class="print-frontmatter">{inner}</section>')
        elif kind == "part":
            sections.append(f'<section class="print-part">{inner}</section>')
        else:
            sections.append(f'<section class="print-chapter">{inner}</section>')

    def document(body: str, extra_css: str = "") -> str:
        return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>climasus+ Studio · Guia prático sobre clima, saúde e Amazônia</title>
<meta name="author" content="Max Anjos · ecossistema climaSUS">
<meta name="description" content="Guia prático do climasus+ Studio: do dado à decisão em clima e saúde, com ênfase na Amazônia.">
{''.join(styles)}
<style>{PRINT_CSS}{extra_css}</style>
</head>
<body>
{body}
</body>
</html>
"""

    full = document("".join(sections))
    (BOOK / "print.html").write_text(full, encoding="utf-8")

    cover = document(sections[0], "@page { size: A4; margin: 0 !important; } #print-cover { margin: 0 !important; }")
    (BOOK / "print-cover.html").write_text(cover, encoding="utf-8")

    body = document("".join(sections[1:]), "@page { size: A4; margin: 16mm 15mm 17mm; }")
    (BOOK / "print-body.html").write_text(body, encoding="utf-8")

    print(f"print.html gerado ({len(full) // 1024} KB, {len(sections)} seções)")
    print("print-cover.html e print-body.html gerados para o PDF")


if __name__ == "__main__":
    build()
