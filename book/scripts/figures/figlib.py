# -*- coding: utf-8 -*-
"""
Sistema visual das figuras do guia climasus+ Studio.

Gramática comum: papel, tinta de floresta, teal de água, ocre de terra.
Tipografia editorial (serifa para títulos, sans para texto, mono para código).
Todas as figuras são SVG autônomo — sem fontes externas, sem foreignObject —
para renderizar igual no HTML, no PDF e no DOCX.
"""

from html import escape

# ── Paleta (espelha book/theme/guide.scss) ──────────────────────────────────
INK = "#0b2420"
INK2 = "#163b34"
MUTED = "#5b6b64"
LINE = "#d8ded6"
PAPER = "#f7f4ec"
PAPER2 = "#efeade"
PAPER3 = "#e6e0d2"
WHITE = "#ffffff"
TEAL = "#0e7c6b"
TEAL_D = "#0b5d52"
TEAL_XD = "#083f38"
AQUA = "#2dd4bf"
AQUA_L = "#a7f3e4"
FOREST = "#1f7a4d"
FOREST_L = "#dcefe3"
OCHRE = "#b7791f"
OCHRE_L = "#f6e3b4"
CLAY = "#b4472f"
CLAY_L = "#f7e2db"

# ── Tipografia ──────────────────────────────────────────────────────────────
SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
MONO = "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"


# ── Primitivas de texto ─────────────────────────────────────────────────────
def text(x, y, s, size=15, fill=MUTED, weight=400, anchor="start",
         family=SANS, spacing=None, opacity=None, style=None, extra=""):
    a = [f'x="{x}"', f'y="{y}"', f'font-size="{size}"', f'fill="{fill}"',
         f'font-weight="{weight}"', f'font-family="{family}"']
    if anchor != "start":
        a.append(f'text-anchor="{anchor}"')
    if spacing:
        a.append(f'letter-spacing="{spacing}"')
    if opacity is not None:
        a.append(f'opacity="{opacity}"')
    if style:
        a.append(f'font-style="{style}"')
    if extra:
        a.append(extra)
    return f'<text {" ".join(a)}>{escape(str(s))}</text>'


def lines(x, y, items, size=15, fill=MUTED, weight=400, anchor="start",
          family=SANS, lh=None, spacing=None, opacity=None):
    lh = lh or round(size * 1.42, 1)
    out = []
    for i, s in enumerate(items):
        out.append(text(x, round(y + i * lh, 1), s, size=size, fill=fill,
                        weight=weight, anchor=anchor, family=family,
                        spacing=spacing, opacity=opacity))
    return "".join(out)


def eyebrow(x, y, s, color=TEAL, size=11.5, anchor="start"):
    return text(x, y, s.upper(), size=size, fill=color, weight=700,
                anchor=anchor, spacing=2.4)


def section_label(x, y, s, color=MUTED, size=11, rule_to=None, rule_color=None):
    out = text(x, y, s.upper(), size=size, fill=color, weight=700, spacing=1.9)
    if rule_to:
        out += (f'<path d="M{x + 10 + len(s) * size * 0.70:.1f},{y - 4} '
                f'H{rule_to}" stroke="{rule_color or LINE}" stroke-width="1"/>')
    return out


# ── Formas ──────────────────────────────────────────────────────────────────
def rect(x, y, w, h, r=14, fill=WHITE, stroke=None, sw=1.4, shadow=True,
         opacity=None, extra=""):
    a = [f'x="{x}"', f'y="{y}"', f'width="{w}"', f'height="{h}"',
         f'rx="{r}"', f'fill="{fill}"']
    if stroke:
        a += [f'stroke="{stroke}"', f'stroke-width="{sw}"']
    if shadow:
        a.append('filter="url(#sh)"')
    if opacity is not None:
        a.append(f'opacity="{opacity}"')
    if extra:
        a.append(extra)
    return f'<rect {" ".join(a)}/>'


def circle(cx, cy, r, fill=WHITE, stroke=None, sw=1.6, shadow=False,
           opacity=None):
    a = [f'cx="{cx}"', f'cy="{cy}"', f'r="{r}"', f'fill="{fill}"']
    if stroke:
        a += [f'stroke="{stroke}"', f'stroke-width="{sw}"']
    if shadow:
        a.append('filter="url(#sh-sm)"')
    if opacity is not None:
        a.append(f'opacity="{opacity}"')
    return f'<circle {" ".join(a)}/>'


def accent_bar(x, y, w, h=4, r=15, color=TEAL):
    """Barra de acento que segue o raio superior do cartão."""
    d = (f"M{x},{y+r} A{r},{r} 0 0 1 {x+r},{y} "
         f"L{x+w-r},{y} A{r},{r} 0 0 1 {x+w},{y+r} "
         f"L{x+w},{y+h} L{x},{y+h} Z")
    return f'<path d="{d}" fill="{color}"/>'


def badge(cx, cy, n, color=TEAL, r=11.5, size=12.5, fill_text=WHITE):
    return (circle(cx, cy, r, fill=color) +
            text(cx, cy + size * 0.35, n, size=size, fill=fill_text,
                 weight=700, anchor="middle"))


def pill(x, y, label, color=TEAL, size=11.5, padx=10, h=22, fill=None,
         family=MONO, weight=600, bw=1.2):
    w = padx * 2 + len(label) * size * 0.60
    out = rect(x, y, round(w, 1), h, r=h / 2, fill=fill or WHITE,
               stroke=color, sw=bw, shadow=False)
    out += text(round(x + padx, 1), y + h / 2 + size * 0.35, label, size=size,
                fill=color, weight=weight, family=family)
    return out, round(w, 1)


def arrow(x1, y1, x2, y2, color=TEAL, w=2.2, dash=None, head=True,
          opacity=None, marker=None):
    a = [f'd="M{x1},{y1} L{x2},{y2}"', f'stroke="{color}"',
         f'stroke-width="{w}"', 'fill="none"', 'stroke-linecap="round"']
    if dash:
        a.append(f'stroke-dasharray="{dash}"')
    if opacity is not None:
        a.append(f'opacity="{opacity}"')
    if head:
        a.append(f'marker-end="url(#{marker or marker_for(color)})"')
    return f'<path {" ".join(a)}/>'


def path(d, color=TEAL, w=2.2, fill="none", dash=None, head=False,
         opacity=None, cap="round", extra=""):
    a = [f'd="{d}"', f'stroke="{color}"', f'stroke-width="{w}"',
         f'fill="{fill}"', f'stroke-linecap="{cap}"', 'stroke-linejoin="round"']
    if dash:
        a.append(f'stroke-dasharray="{dash}"')
    if opacity is not None:
        a.append(f'opacity="{opacity}"')
    if head:
        a.append(f'marker-end="url(#{marker_for(color)})"')
    if extra:
        a.append(extra)
    return f'<path {" ".join(a)}/>'


def marker_for(color):
    return {
        TEAL: "ar-teal", TEAL_D: "ar-teal", FOREST: "ar-forest",
        OCHRE: "ar-ochre", CLAY: "ar-clay", INK: "ar-ink",
        MUTED: "ar-muted", WHITE: "ar-white", AQUA: "ar-aqua",
    }.get(color, "ar-teal")


def poly(points, color=TEAL, w=2.4, fill="none", dash=None, opacity=None,
         close=False):
    d = "M" + " L".join(f"{x},{y}" for x, y in points)
    if close:
        d += " Z"
    return path(d, color=color, w=w, fill=fill, dash=dash, opacity=opacity)


# ── Ícones (traço 1.8, 24×24 de referência) ─────────────────────────────────
def _g(body, color, sw=1.8):
    return (f'<g fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round">{body}</g>')


def ic_download(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M12 3v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/>'
               '<path d="M4 17.5v2A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
               color) + '</g>')


def ic_type(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M4 6h9"/><path d="M8.5 6v12"/><path d="M15.5 11h4.5"/>'
               '<path d="M18 11v7"/><path d="M12.5 21h7"/>', color) + '</g>')


def ic_sliders(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/>'
               '<path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
               color) + '</g>')


def ic_filter(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M3.5 5h17l-6.6 7.6V20l-3.8-2v-5.4z"/>', color) + '</g>')


def ic_plus(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/>'
               '<path d="M12 8.2v7.6"/><path d="M8.2 12h7.6"/>', color) + '</g>')


def ic_people(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3"/>'
               '<path d="M16 5.4a3.1 3.1 0 0 1 0 5.9"/><path d="M17.5 14.9c2 .6 3.2 2.3 3.2 4.6"/>',
               color) + '</g>')


def ic_calendar(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/>'
               '<path d="M3.5 9.6h17"/><path d="M8 3v3.4"/><path d="M16 3v3.4"/>'
               '<path d="M7.5 13.4h3"/><path d="M13.5 13.4h3"/><path d="M7.5 17h3"/>', color) + '</g>')


def ic_table(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/>'
               '<path d="M3.5 9.5h17"/><path d="M9.5 9.5v10"/><path d="M3.5 14.5h17"/>', color) + '</g>')


def ic_db(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/>'
               '<path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>', color) + '</g>')


def ic_term(x, y, s=24, color=TEAL):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<rect x="3" y="4.5" width="18" height="15" rx="2.6"/>'
               '<path d="M7 9.5l3 2.8-3 2.8"/><path d="M12.5 15.2h4.5"/>', color) + '</g>')


def ic_map(x, y, s=24, color=FOREST):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M9 3.5 3.5 5.8v14.7L9 18.2l6 2.3 5.5-2.3V3.5L15 5.8z"/>'
               '<path d="M9 3.5v14.7"/><path d="M15 5.8v14.7"/>', color) + '</g>')


def ic_pin(x, y, s=24, color=CLAY):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/>'
               '<circle cx="12" cy="10" r="2.6"/>', color) + '</g>')


def ic_sun(x, y, s=26, color=OCHRE):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<circle cx="13" cy="13" r="5"/>'
               '<path d="M13 2.5v3"/><path d="M13 20.5v3"/><path d="M2.5 13h3"/><path d="M20.5 13h3"/>'
               '<path d="M5.6 5.6l2.1 2.1"/><path d="M18.3 18.3l2.1 2.1"/>'
               '<path d="M20.4 5.6l-2.1 2.1"/><path d="M7.7 18.3l-2.1 2.1"/>', color) + '</g>')


def ic_smoke(x, y, s=26, color=MUTED):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M6 19c-2.5 0-4-1.7-4-3.8 0-2 1.4-3.5 3.3-3.8C5.8 8 8.4 6 11.4 6c3.2 0 5.8 2.2 6.1 5.1 2.3.2 4 1.9 4 4.1 0 2.2-1.8 3.8-4.1 3.8z"/>'
               '<path d="M8 22.5c1.2-1 2.6-1 3.8 0"/><path d="M14.4 23.2c1-0.8 2.1-0.8 3.1 0"/>', color) + '</g>')


def ic_rain(x, y, s=26, color=TEAL):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M7 16.5c-2.6 0-4.3-1.8-4.3-4 0-2.1 1.5-3.7 3.5-4C7 5.5 9.7 3.5 12.8 3.5c3.4 0 6.1 2.4 6.4 5.5 2.4.2 4.2 2 4.2 4.4 0 2.3-1.9 4.1-4.3 4.1z"/>'
               '<path d="M8 19.5l-1.2 3"/><path d="M13 19.5l-1.2 3"/><path d="M18 19.5l-1.2 3"/>', color) + '</g>')


def ic_heat(x, y, s=26, color=CLAY):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M13 3.5v11.2"/><circle cx="13" cy="18.6" r="3.4"/>'
               '<path d="M13 8.5c0-2 1.6-2.6 1.6-4.4"/><path d="M13 12c0-2 1.6-2.6 1.6-4.4"/>', color) + '</g>')


def ic_drought(x, y, s=26, color=CLAY):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M2 20.5c2.5 0 3-1.6 5.5-1.6 2.2 0 2.6 1.6 4.8 1.6 2.4 0 2.8-1.6 5.2-1.6 1.8 0 2.4 1 3.5 1.3"/>'
               '<path d="M7 17.4l2.2-3.4 1.6 2.2"/><path d="M12.6 17.4l2-3 1.5 2"/>'
               '<circle cx="18.4" cy="6.4" r="2.6"/>'
               '<path d="M18.4 1.6v1.3"/><path d="M18.4 9.9v1.3"/><path d="M13.6 6.4h1.3"/><path d="M21.9 6.4h1.3"/>', color) + '</g>')


def ic_heart(x, y, s=24, color=CLAY):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M12 20.5S4.2 15.8 4.2 10.3A3.9 3.9 0 0 1 12 8.2a3.9 3.9 0 0 1 7.8 2.1c0 5.5-7.8 10.2-7.8 10.2z"/>', color) + '</g>')


def ic_hospital(x, y, s=26, color=TEAL_D):
    k = s / 26
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M4 22V8.5L13 3l9 5.5V22z"/><path d="M13 8v6"/><path d="M10 11h6"/>'
               '<path d="M9 22v-4h8v4"/>', color) + '</g>')


def ic_check(x, y, s=18, color=FOREST, sw=2.4):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M4 12.5l5 5 11-11"/>', color, sw=sw) + '</g>')


def ic_warn(x, y, s=18, color=CLAY, sw=1.8):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M12 3.6 2.8 20h18.4z"/><path d="M12 9.5v4.6"/>'
               '<circle cx="12" cy="17.2" r="0.5" fill="' + color + '"/>', color, sw=sw) + '</g>')


def ic_code(x, y, s=24, color=TEAL_D):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M8.5 7 3.5 12l5 5"/><path d="M15.5 7l5 5-5 5"/>'
               '<path d="M13.5 4.5l-3 15"/>', color) + '</g>')


def ic_gear(x, y, s=24, color=TEAL_D):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<circle cx="12" cy="12" r="3.2"/>'
               '<path d="M12 2.8v3"/><path d="M12 18.2v3"/><path d="M2.8 12h3"/><path d="M18.2 12h3"/>'
               '<path d="M5.5 5.5l2.1 2.1"/><path d="M16.4 16.4l2.1 2.1"/>'
               '<path d="M18.5 5.5l-2.1 2.1"/><path d="M7.6 16.4l-2.1 2.1"/>', color) + '</g>')


def ic_share(x, y, s=24, color=TEAL_D):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/>'
               '<path d="M8.3 10.8 15.7 7.2"/><path d="M8.3 13.2l7.4 3.6"/>', color) + '</g>')


def ic_eye(x, y, s=24, color=OCHRE):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12z"/>'
               '<circle cx="12" cy="12" r="2.8"/>', color) + '</g>')


def ic_repeat(x, y, s=24, color=TEAL_D):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k})">' +
            _g('<path d="M4 10a8 8 0 0 1 13.4-3.6L20 9"/><path d="M20 4.5V9h-4.5"/>'
               '<path d="M20 14a8 8 0 0 1-13.4 3.6L4 15"/><path d="M4 19.5V15h4.5"/>', color) + '</g>')


# ── Cena ────────────────────────────────────────────────────────────────────
def defs(accent=TEAL):
    return f'''<defs>
  <filter id="sh" x="-25%" y="-25%" width="150%" height="170%">
    <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="{INK}" flood-opacity="0.10"/>
  </filter>
  <filter id="sh-sm" x="-30%" y="-30%" width="160%" height="180%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="{INK}" flood-opacity="0.09"/>
  </filter>
  <pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse">
    <circle cx="1.6" cy="1.6" r="1.05" fill="{INK}" opacity="0.085"/>
  </pattern>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="{accent}" stop-opacity="0.13"/>
    <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="fade-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="{accent}" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
  </linearGradient>
  <marker id="ar-teal" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{TEAL}"/>
  </marker>
  <marker id="ar-forest" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{FOREST}"/>
  </marker>
  <marker id="ar-ochre" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{OCHRE}"/>
  </marker>
  <marker id="ar-clay" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{CLAY}"/>
  </marker>
  <marker id="ar-ink" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{INK}"/>
  </marker>
  <marker id="ar-muted" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{MUTED}"/>
  </marker>
  <marker id="ar-white" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{WHITE}"/>
  </marker>
  <marker id="ar-aqua" markerWidth="10" markerHeight="10" refX="7.6" refY="5" orient="auto">
    <path d="M0,0 L10,5 L0,10 Z" fill="{AQUA}"/>
  </marker>
</defs>'''


def scene(w, h, body, title, desc, accent=TEAL, dots=True, glow=True):
    bg = f'<rect width="{w}" height="{h}" rx="20" fill="{PAPER}"/>'
    if dots:
        bg += f'<rect width="{w}" height="{h}" rx="20" fill="url(#dots)"/>'
    if glow:
        bg += (f'<circle cx="{w - 90}" cy="60" r="300" fill="url(#glow)"/>'
               f'<circle cx="90" cy="{h + 40}" r="260" fill="url(#glow)"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"
     font-family="{SANS}" role="img" aria-labelledby="ttl dsc">
  <title id="ttl">{escape(title)}</title>
  <desc id="dsc">{escape(desc)}</desc>
  {defs(accent)}
  {bg}
  {body}
</svg>
'''


# ── Blocos compostos ────────────────────────────────────────────────────────
def header(w, kicker, title, subtitle, accent=TEAL, title_size=33,
           subtitle_size=16, x=48, y=52):
    out = eyebrow(x, y, kicker, color=accent)
    out += text(x, y + 40, title, size=title_size, fill=INK, weight=700,
                family=SERIF)
    out += text(x, y + 68, subtitle, size=subtitle_size, fill=MUTED)
    return out


def footer(w, h, label, body_lines, accent=AQUA, x=48, label_color=AQUA,
           size=14.5, hh=104):
    top = h - hh - 30
    out = rect(32, top, w - 64, hh, r=16, fill=INK, shadow=True)
    # fio de acento
    out += rect(32, top, 6, hh, r=3, fill=accent, shadow=False)
    out += text(x, top + 28, label.upper(), size=10.5, fill=label_color,
                weight=700, spacing=2.2)
    out += lines(x, top + 52, body_lines, size=size, fill="#e7f1ec", lh=21)
    return out


def stage_card(x, y, w, h, color, num, title, body, icon=None, title_size=18,
               body_size=13.5, chip=None):
    out = rect(x, y, w, h, r=15, fill=WHITE, stroke=LINE)
    out += rect(x, y, w, 4, r=2, fill=color, shadow=False)
    out += badge(x + 26, y + 32, num, color=color, r=13, size=13)
    out += text(x + 50, y + 38, title, size=title_size, fill=INK, weight=700)
    if body:
        out += lines(x + 22, y + 68, body, size=body_size, fill=MUTED, lh=19)
    if icon:
        out += icon(x + w - 40, y + 20, 22, color)
    if chip:
        out += text(x + 22, y + h - 18, chip, size=11, fill=color,
                    family=MONO, weight=600)
    return out


def note_box(x, y, w, h, title, body, color=OCHRE, icon=ic_warn,
             title_size=14.5, body_size=13.5, fill=None):
    out = rect(x, y, w, h, r=12, fill=fill or OCHRE_L, stroke="none",
               shadow=False)
    out += rect(x, y, 4, h, r=2, fill=color, shadow=False)
    out += icon(x + 16, y + 14, 17, color)
    out += text(x + 40, y + 26, title, size=title_size, fill=color, weight=700)
    out += lines(x + 40, y + 46, body, size=body_size, fill=INK2, lh=19)
    return out


def write(name, svg, base=None):
    import os
    if base is None:
        here = os.path.dirname(os.path.abspath(__file__))
        base = os.path.join(os.path.dirname(os.path.dirname(here)), "images")
    p = os.path.join(base, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"✓ {p}  ({len(svg)/1024:.1f} KB)")
