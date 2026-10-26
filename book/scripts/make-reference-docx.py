#!/usr/bin/env python3
"""Cria o reference.docx usado pelo Pandoc para a edição Word do guia."""
from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "theme" / "reference.docx"

INK = RGBColor(0x0B, 0x24, 0x20)
TEAL = RGBColor(0x0E, 0x7C, 0x6B)
TEAL_DARK = RGBColor(0x0B, 0x5D, 0x52)
MUTED = RGBColor(0x5B, 0x6B, 0x64)
OCHRE = RGBColor(0xB7, 0x79, 0x1F)
CREAM = RGBColor(0xF7, 0xF4, 0xEC)
CODE_FG = RGBColor(0xE6, 0xF4, 0xEE)

HEAD = "Georgia"
BODY = "Calibri"
MONO = "Consolas"


def set_font(style, name: str, size: float, color: RGBColor, bold: bool | None = None, italic: bool | None = None):
    font = style.font
    font.name = name
    font.size = Pt(size)
    font.color.rgb = color
    if bold is not None:
        font.bold = bold
    if italic is not None:
        font.italic = italic
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), name)


def ensure_style(doc, name: str, kind=WD_STYLE_TYPE.PARAGRAPH):
    styles = doc.styles
    try:
        return styles[name]
    except KeyError:
        return styles.add_style(name, kind)


def shade_paragraph(style, fill: str):
    ppr = style.element.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    ppr.append(shd)


def left_border(style, color: str, sz: int = 18):
    ppr = style.element.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), str(sz))
    left.set(qn("w:space"), "8")
    left.set(qn("w:color"), color)
    pbdr.append(left)
    ppr.append(pbdr)


def main():
    doc = Document()

    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(2.2)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)
    section.header_distance = Cm(1.0)
    section.footer_distance = Cm(1.0)

    normal = doc.styles["Normal"]
    set_font(normal, BODY, 10.5, RGBColor(0x16, 0x3B, 0x34))
    normal.paragraph_format.line_spacing = 1.25
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    body = ensure_style(doc, "Body Text")
    set_font(body, BODY, 10.5, RGBColor(0x16, 0x3B, 0x34))
    body.paragraph_format.line_spacing = 1.25
    body.paragraph_format.space_after = Pt(6)

    first = ensure_style(doc, "First Paragraph")
    set_font(first, BODY, 10.5, RGBColor(0x16, 0x3B, 0x34))
    first.paragraph_format.line_spacing = 1.25
    first.paragraph_format.space_after = Pt(6)

    compact = ensure_style(doc, "Compact")
    set_font(compact, BODY, 9.5, RGBColor(0x16, 0x3B, 0x34))
    compact.paragraph_format.line_spacing = 1.18
    compact.paragraph_format.space_after = Pt(2)

    title = ensure_style(doc, "Title")
    set_font(title, HEAD, 28, INK, bold=True)
    title.paragraph_format.space_after = Pt(8)

    subtitle = ensure_style(doc, "Subtitle")
    set_font(subtitle, HEAD, 14, MUTED, bold=False, italic=True)
    subtitle.paragraph_format.space_after = Pt(6)

    author = ensure_style(doc, "Author")
    set_font(author, BODY, 11, TEAL)
    author.paragraph_format.space_after = Pt(4)

    date = ensure_style(doc, "Date")
    set_font(date, BODY, 9, MUTED)
    date.paragraph_format.space_after = Pt(4)

    h1 = doc.styles["Heading 1"]
    set_font(h1, HEAD, 23, INK, bold=True)
    h1.paragraph_format.space_before = Pt(0)
    h1.paragraph_format.space_after = Pt(6)
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.page_break_before = True

    h2 = doc.styles["Heading 2"]
    set_font(h2, HEAD, 15, TEAL, bold=True)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(5)
    h2.paragraph_format.keep_with_next = True

    h3 = doc.styles["Heading 3"]
    set_font(h3, BODY, 11, TEAL_DARK, bold=True)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(3)
    h3.paragraph_format.keep_with_next = True

    h4 = doc.styles["Heading 4"]
    set_font(h4, BODY, 8.5, OCHRE, bold=True)
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(2)
    h4.paragraph_format.keep_with_next = True

    block = ensure_style(doc, "Block Text")
    set_font(block, HEAD, 11, RGBColor(0x16, 0x3B, 0x34), italic=True)
    block.paragraph_format.left_indent = Cm(0.4)
    block.paragraph_format.space_before = Pt(6)
    block.paragraph_format.space_after = Pt(6)
    left_border(block, "D99A2B")

    code = ensure_style(doc, "Source Code")
    set_font(code, MONO, 8.5, CODE_FG)
    code.paragraph_format.space_before = Pt(6)
    code.paragraph_format.space_after = Pt(6)
    code.paragraph_format.left_indent = Cm(0.2)
    shade_paragraph(code, "0B2420")

    verb = ensure_style(doc, "Verbatim Char", WD_STYLE_TYPE.CHARACTER)
    set_font(verb, MONO, 9, TEAL_DARK)

    caption = ensure_style(doc, "Caption")
    set_font(caption, BODY, 8.5, MUTED, italic=True)
    caption.paragraph_format.space_after = Pt(8)

    table_caption = ensure_style(doc, "Table Caption")
    set_font(table_caption, BODY, 8.5, MUTED, italic=True)
    table_caption.paragraph_format.space_after = Pt(4)

    image_caption = ensure_style(doc, "Image Caption")
    set_font(image_caption, BODY, 8.5, MUTED, italic=True)
    image_caption.paragraph_format.space_after = Pt(8)

    hyperlink = ensure_style(doc, "Hyperlink", WD_STYLE_TYPE.CHARACTER)
    set_font(hyperlink, BODY, 10.5, TEAL_DARK)
    hyperlink.font.underline = True

    # Remove o conteúdo de exemplo; o reference.docx é só um catálogo de estilos.
    for p in list(doc.paragraphs):
        p._element.getparent().remove(p._element)

    doc.save(OUT)
    print(f"reference.docx gerado em {OUT}")


if __name__ == "__main__":
    main()
