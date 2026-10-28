# -*- coding: utf-8 -*-
"""Gera as figuras SVG do guia climasus+ Studio."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from figlib import *  # noqa


# ══════════════════════════════════════════════════════════════════════════
# 1 · pipeline-flow — Etapa Preparação
# ══════════════════════════════════════════════════════════════════════════
def fig_pipeline():
    W, H = 1200, 800
    b = header(
        W,
        "Etapa 02 · Preparação",
        "Sete Passos entre o dado bruto e a série analisável",
        "Cada Passo documenta uma decisão: fonte, codificação, recorte, unidade de tempo e qualidade.",
        accent=TEAL,
    )
    b += section_label(48, 168, "O caminho no Studio · 15 Funções disponíveis",
                       rule_to=1152, rule_color=LINE)

    rail_y = 236
    xs = [100 + i * 166.67 for i in range(7)]
    b += f'<path d="M76,{rail_y} H1124" stroke="{INK}" stroke-width="1.4" opacity="0.14"/>'
    for i in range(6):
        mx = (xs[i] + xs[i + 1]) / 2
        b += path(f"M{mx-3.5},{rail_y-4} l4,4 l-4,4", color=MUTED, w=1.6,
                  opacity=0.55)

    steps = [
        ("1", "Importar", "SIM · SINAN · SIH", ic_download),
        ("2", "Corrigir", "encoding", ic_type),
        ("3", "Padronizar", "nomes e tipos", ic_sliders),
        ("4", "Filtrar CID", "grupo de doença", ic_filter),
        ("5", "Criar variáveis", "idade e calendário", ic_plus),
        ("6", "Filtrar perfil", "idade · território", ic_people),
        ("7", "Agregar", "semana epidemiológica", ic_calendar),
    ]
    for i, (n, title, sub, icon) in enumerate(steps):
        cx = xs[i]
        if i == 6:
            b += circle(cx, rail_y, 38, fill=TEAL, opacity=0.10)
        b += circle(cx, rail_y, 30, fill=WHITE, stroke=TEAL, sw=1.8, shadow=True)
        b += icon(cx - 12, rail_y - 12, 24, TEAL)
        b += badge(cx + 22, rail_y - 22, n, color=TEAL, r=11, size=12)
        b += text(cx, 300, title, size=15.5, fill=INK, weight=700,
                  anchor="middle")
        b += text(cx, 320, sub, size=12.5, fill=MUTED, anchor="middle")

    y0, hh = 358, 236

    b += rect(48, y0, 300, hh, r=15, fill=WHITE, stroke=LINE)
    b += section_label(70, y0 + 32, "Entrada", color=MUTED)
    b += ic_db(310, y0 + 18, 18, MUTED)
    dot_x, dot_y = 76, y0 + 58
    for r in range(6):
        for c in range(9):
            col = TEAL if (r * 9 + c) % 11 == 0 else INK
            op = 0.6 if col == TEAL else 0.14
            b += circle(dot_x + c * 20.5, dot_y + r * 18, 2.7,
                        fill=col, opacity=op)
    b += text(70, y0 + 182, "registros individuais", size=15.5, fill=INK,
              weight=700)
    b += lines(70, y0 + 204, ["um registro por óbito ou internação;",
                              "o dado ainda não é uma série."],
               size=12.8, fill=MUTED, lh=17)

    mx, mw = 372, 456
    b += rect(mx, y0, mw, hh, r=15, fill=WHITE, stroke=LINE)
    b += section_label(mx + 22, y0 + 32, "Decisões que mudam a pergunta",
                       color=MUTED)
    rows = [
        ("Recorte", "CID-10, idade e território", "disease_group"),
        ("Escala", "dia, semana ou mês", "time_unit"),
        ("Completude", "semana sem caso entra como zero", "complete_dates"),
    ]
    for i, (t, d, par) in enumerate(rows):
        ry = y0 + 52 + i * 58
        b += f'<path d="M{mx+22},{ry} H{mx+mw-22}" stroke="{LINE}" stroke-width="1"/>'
        b += badge(mx + 36, ry + 26, str(i + 1), color=TEAL, r=10.5, size=11)
        b += text(mx + 56, ry + 22, t, size=14, fill=INK, weight=700)
        b += text(mx + 56, ry + 40, d, size=12.5, fill=MUTED)
        pw = 24 + len(par) * 6.4
        b += rect(mx + mw - 22 - pw, ry + 14, pw, 21, r=10.5, fill=PAPER2,
                  stroke="none", shadow=False)
        b += text(mx + mw - 22 - pw / 2, ry + 28.5, par, size=10.5, fill=TEAL_D,
                  family=MONO, anchor="middle", weight=600)

    rx, rw = 852, 300
    b += rect(rx, y0, rw, hh, r=15, fill=WHITE, stroke=LINE)
    b += section_label(rx + 22, y0 + 32, "Saída", color=MUTED)
    b += ic_table(rx + rw - 40, y0 + 18, 18, MUTED)
    tx, ty = rx + 22, y0 + 50
    cols = [(0, "semana"), (92, "município"), (196, "casos")]
    b += rect(tx, ty, 256, 26, r=6, fill=PAPER2, shadow=False)
    for cx0, name in cols:
        b += text(tx + 10 + cx0, ty + 17, name, size=10.5, fill=MUTED,
                  weight=700, family=MONO)
    data = [("SE 12", "Manaus", "41"), ("SE 13", "Manaus", "38"),
            ("SE 14", "Manaus", "52")]
    for i, (a, bb, c) in enumerate(data):
        ry = ty + 26 + i * 24
        b += f'<path d="M{tx},{ry} H{tx+256}" stroke="{LINE}" stroke-width="1"/>'
        b += text(tx + 10, ry + 16, a, size=11.5, fill=INK, family=MONO)
        b += text(tx + 102, ry + 16, bb, size=11.5, fill=INK2)
        b += text(tx + 206, ry + 16, c, size=11.5, fill=INK, family=MONO,
                  weight=600)
    b += text(rx + 22, y0 + 176, "série pronta para integrar", size=15.5,
              fill=INK, weight=700)
    b += ic_check(rx + 22, y0 + 190, 14, FOREST)
    b += text(rx + 42, y0 + 202, "datas completas verificadas", size=11.8,
              fill=MUTED)
    b += ic_check(rx + 22, y0 + 210, 14, FOREST)
    b += text(rx + 42, y0 + 222, "duplicidade e encoding tratados", size=11.8,
              fill=MUTED)

    b += footer(
        W, H,
        "Leitura científica",
        ["A Preparação reduz erro de codificação e explicita o recorte epidemiológico antes de qualquer cruzamento.",
         "O relatório de qualidade é o que permite afirmar, depois, o que a série representa — e o que ela não cobre."],
    )
    write("pipeline-flow.svg", scene(
        W, H, b,
        "Pipeline de Preparação: da importação ao relatório de qualidade",
        "Sete Passos encadeados: importar dados do DATASUS, corrigir encoding, padronizar nomes e tipos, filtrar por CID-10, criar variáveis, filtrar perfil demográfico e agregar em série semanal, com verificação de qualidade."))


# ══════════════════════════════════════════════════════════════════════════
# 2 · integracao-flow — Etapa Integração
# ══════════════════════════════════════════════════════════════════════════
def fig_integracao():
    W, H = 1200, 900
    b = header(
        W,
        "Etapa 03 · Integração",
        "Três séries, uma linha do tempo comum",
        "A pergunta causal só existe quando saúde, clima e território dividem unidade temporal, chave espacial e defasagem explícita.",
        accent=FOREST,
    )

    iy, ih, iw = 152, 172, 352
    cards = [
        ("A", "Saúde", "série preparada · contagens", "sus_data_aggregate", TEAL),
        ("B", "Clima", "estação INMET ou grade", "sus_climate_inmet", OCHRE),
        ("C", "Território", "renda, saneamento, vulnerabilidade", "sus_census_join", FOREST),
    ]
    for i, (letter, name, desc, fn, color) in enumerate(cards):
        x = 48 + i * 376
        b += rect(x, iy, iw, ih, r=15, fill=WHITE, stroke=LINE)
        b += accent_bar(x, iy, iw, 4, 15, color)
        b += badge(x + 26, iy + 32, letter, color=color, r=13, size=13)
        b += text(x + 50, iy + 38, name, size=18, fill=INK, weight=700)
        b += text(x + 22, iy + 62, desc, size=12.5, fill=MUTED)
        b += text(x + 22, iy + ih - 16, fn, size=10.5, fill=color,
                  family=MONO, weight=600)

        gx, gy = x + 22, iy + 78
        if i == 0:
            heights = [10, 16, 12, 24, 20, 30, 26, 38, 32, 44, 40, 50, 46, 56]
            for j, hgt in enumerate(heights):
                col = TEAL if j < 11 else TEAL_D
                b += rect(gx + j * 21.5, gy + (58 - hgt), 13, hgt, r=3,
                          fill=col, opacity=0.35 + 0.045 * j, shadow=False)
            b += path(f"M{gx-2},{gy+58} H{gx+294}", color=LINE, w=1.2)
        elif i == 1:
            pts = [(0, 44), (22, 40), (44, 46), (66, 30), (88, 34), (110, 20),
                   (132, 26), (154, 12), (176, 18), (198, 8), (220, 16),
                   (242, 28), (264, 24), (286, 36)]
            b += f'<path d="M{gx},{gy+56} H{gx+290} V{gy}" fill="{OCHRE}" opacity="0.05"/>'
            b += poly([(gx + px, gy + py) for px, py in pts], color=OCHRE, w=2.2)
            b += path(f"M{gx},{gy+30} H{gx+290}", color=CLAY, w=1.3, dash="4 4",
                      opacity=0.8)
            b += text(gx + 2, gy + 24, "limiar", size=9.5, fill=CLAY,
                      family=MONO)
            b += circle(gx + 176, gy + 12, 3.4, fill=CLAY)
        else:
            bars = [(0.78, "renda"), (0.55, "saneamento"), (0.36, "habitação")]
            for j, (v, lab) in enumerate(bars):
                by = gy + 6 + j * 18
                b += text(gx, by + 10, lab, size=10, fill=MUTED)
                b += rect(gx + 74, by + 1, 190, 9, r=4.5, fill=PAPER3,
                          shadow=False)
                b += rect(gx + 74, by + 1, 190 * v, 9, r=4.5, fill=FOREST,
                          opacity=0.55 + 0.15 * j, shadow=False)
            b += text(gx + 270, gy + 28, "IVS", size=10, fill=FOREST,
                      family=MONO, weight=700)

    b += path("M224,324 C224,344 300,340 300,352", color=INK, w=1.8, opacity=0.4)
    b += path("M600,324 V350", color=INK, w=1.8, opacity=0.4)
    b += path("M976,324 C976,344 900,340 900,352", color=INK, w=1.8, opacity=0.4)

    ay, ah = 356, 214
    b += rect(48, ay, 1104, ah, r=15, fill=WHITE, stroke=LINE)
    b += accent_bar(48, ay, 1104, 4, 15, INK)
    b += section_label(70, ay + 30, "Alinhamento · o que precisa coincidir",
                       color=INK)
    b += text(1130, ay + 30, "antes de qualquer modelo", size=11, fill=MUTED,
              anchor="end", style="italic")

    b += text(70, ay + 56, "1 · Tempo", size=13, fill=INK, weight=700)
    sq, gap = 44, 9
    tx0, ty0 = 70, ay + 74
    temps = [0.25, 0.35, 0.30, 0.55, 0.70, 0.85, 0.95, 0.80]
    for j, t in enumerate(temps):
        x = tx0 + j * (sq + gap)
        b += rect(x, ty0, sq, 34, r=6, fill=OCHRE, opacity=0.13 + 0.62 * t,
                  shadow=False)
        b += text(x + sq / 2, ty0 + 21, f"{24+t*8:.0f}°", size=10.5,
                  fill=WHITE if t > 0.55 else INK2, anchor="middle",
                  family=MONO)
        b += text(x + sq / 2, ty0 + 50, f"SE {7+j}", size=9, fill=MUTED,
                  anchor="middle", family=MONO)
    bx1 = tx0 + 3 * (sq + gap) - 3
    bx2 = tx0 + 8 * (sq + gap) - gap + 3
    b += path(f"M{bx1},{ty0+66} V{ty0+74} H{bx2} V{ty0+66}", color=TEAL, w=1.6)
    b += text((bx1 + bx2) / 2, ty0 + 92, "janela de defasagem · 0 a L",
              size=11.5, fill=TEAL, anchor="middle", weight=600)

    b += f'<path d="M620,{ay+40} V{ay+190}" stroke="{LINE}" stroke-width="1.2"/>'
    b += text(648, ay + 56, "2 · Espaço", size=13, fill=INK, weight=700)
    poly_pts = [(654, ay + 84), (716, ay + 70), (762, ay + 88), (754, ay + 140),
                (700, ay + 158), (652, ay + 132)]
    b += (f'<polygon points="{" ".join(f"{x},{y}" for x, y in poly_pts)}" '
          f'fill="{FOREST}" opacity="0.08" stroke="{FOREST}" stroke-width="1.4"/>')
    b += circle(710, ay + 115, 4.5, fill=FOREST)
    stations = [(668, ay + 96), (744, ay + 104), (700, ay + 146)]
    for sx, sy in stations:
        b += path(f"M{sx},{sy} L710,{ay+115}", color=MUTED, w=1, dash="2 3",
                  opacity=0.7)
        b += ic_pin(sx - 6, sy - 16, 13, CLAY)
    b += text(782, ay + 92, "município", size=11, fill=INK, weight=700)
    b += text(782, ay + 108, "código IBGE de 7 dígitos", size=10.5, fill=MUTED,
              family=MONO)
    b += text(782, ay + 132, "clima pela estação", size=11, fill=INK2)
    b += text(782, ay + 148, "mais próxima", size=11, fill=INK2)
    b += text(782, ay + 170, "distância registrada", size=10.5, fill=CLAY,
              family=MONO)

    b += text(70, ay + ah - 16,
              "Sem essa correspondência, o cruzamento produz pares que nunca existiram no território.",
              size=11.5, fill=MUTED, style="italic")

    oy, oh = 596, 132
    b += rect(48, oy, 1104, oh, r=15, fill=WHITE, stroke=LINE)
    b += text(70, oy + 32, "Série integrada", size=16.5, fill=INK, weight=700)
    b += text(70, oy + 52, "saúde + exposição + território na mesma linha",
              size=12, fill=MUTED)
    b += text(70, oy + 92, "1 linha =", size=10.5, fill=MUTED, family=MONO)
    b += text(70, oy + 108, "1 município × 1 tempo", size=10.5, fill=TEAL,
              family=MONO, weight=600)

    cols = [("data", 90), ("município", 130), ("casos", 70), ("temp", 70),
            ("lag 1", 70), ("lag 2", 70), ("lag L", 70), ("IVS", 60)]
    gx, gy = 336, oy + 30
    total = sum(w for _, w in cols) + 8 * (len(cols) - 1)
    b += rect(gx - 10, gy - 8, total + 20, 92, r=8, fill=PAPER, stroke=LINE,
              shadow=False)
    cx = gx
    for name, cw in cols:
        b += rect(cx, gy, cw, 24, r=4, fill=PAPER2, shadow=False)
        b += text(cx + 7, gy + 16, name, size=10.5, fill=MUTED, weight=700,
                  family=MONO)
        cx += cw + 8
    rows_tbl = [
        ["2019-04-01", "Manaus", "41", "31,4", "29,8", "28,1", "27,4", "0,62"],
        ["2019-04-08", "Manaus", "38", "30,1", "31,4", "29,8", "28,1", "0,62"],
    ]
    for row, vals in enumerate(rows_tbl):
        ry = gy + 30 + row * 26
        if row:
            b += f'<path d="M{gx},{ry-4} H{gx+total}" stroke="{LINE}" stroke-width="1"/>'
        cx = gx
        for (name, cw), v in zip(cols, vals):
            b += text(cx + 7, ry + 14, v, size=10.5,
                      fill=TEAL_D if name.startswith("lag") else INK2,
                      family=MONO)
            cx += cw + 8

    b += footer(
        W, H,
        "Leitura científica",
        ["Alinhar é decidir: qual unidade de tempo, qual chave territorial e quantos dias de defasagem entram no modelo.",
         "O padrão que aparece depois do cruzamento ainda é hipótese; a Etapa Análise & Modelagem é que testa robustez e incerteza."],
        accent=AQUA,
    )
    write("integracao-flow.svg", scene(
        W, H, b,
        "Pipeline de Integração: saúde, clima e território em uma linha do tempo comum",
        "Três entradas — série de saúde preparada, clima de estação INMET ou grade e indicadores territoriais — convergem em um alinhamento temporal e espacial que produz uma tabela integrada, com colunas de defasagem explícitas."))


# ══════════════════════════════════════════════════════════════════════════
# 3 · modelagem-flow — Etapa Análise & Modelagem
# ══════════════════════════════════════════════════════════════════════════
def fig_modelagem():
    W, H = 1200, 890
    b = header(
        W,
        "Etapa 04 · Análise & Modelagem",
        "Do padrão visual à evidência: o que o DLNM acrescenta",
        "O modelo separa sazonalidade, tendência e dia da semana para estimar o risco que sobra atribuível ao clima.",
        accent=OCHRE,
    )

    cy, ch, cw = 154, 296, 260
    xs = [48, 329.3, 610.7, 892]
    colors = [TEAL, OCHRE, CLAY, TEAL_D]
    titles = ["Entrada", "DLNM", "Impacto", "Decisão"]
    descs = ["série integrada", "exposição × defasagem", "fração atribuível",
             "o que volta para a gestão"]
    chips = ["sus_data_read", "sus_mod_dlnm", "sus_mod_af", "sus_mod_burden"]

    for i, x in enumerate(xs):
        b += rect(x, cy, cw, ch, r=15, fill=WHITE, stroke=LINE)
        b += accent_bar(x, cy, cw, 4, 15, colors[i])
        b += badge(x + 24, cy + 32, str(i + 1), color=colors[i], r=12,
                   size=12.5)
        b += text(x + 46, cy + 38, titles[i], size=18, fill=INK, weight=700)
        b += text(x + 22, cy + 62, descs[i], size=12.3, fill=MUTED)
        b += text(x + 22, cy + ch - 16, chips[i], size=10.3, fill=colors[i],
                  family=MONO, weight=600)

        gx, gy = x + 24, cy + 84
        if i == 0:
            layers = [("saúde", TEAL), ("clima", OCHRE), ("território", FOREST)]
            for j, (lab, col) in enumerate(layers):
                ly = gy + j * 30
                b += rect(gx, ly, 96, 22, r=6, fill=col, opacity=0.12,
                          stroke="none", shadow=False)
                b += rect(gx, ly, 4, 22, r=2, fill=col, shadow=False)
                b += text(gx + 14, ly + 15, lab, size=10.5, fill=INK2,
                          weight=600)
            b += path(f"M{gx+104},{gy+30} H{gx+126}", color=MUTED, w=1.6)
            b += path(f"M{gx+126},{gy-8} V{gy+96}", color=MUTED, w=1.6)
            tx, ty = gx + 132, gy - 6
            for r in range(5):
                for c in range(3):
                    col = PAPER2 if r == 0 else WHITE
                    b += rect(tx + c * 26, ty + r * 18, 24, 16, r=3, fill=col,
                              stroke=LINE, sw=0.8, shadow=False)
            b += text(tx + 4, ty + 12, "t", size=9, fill=MUTED, family=MONO)
            b += text(tx + 30, ty + 12, "y", size=9, fill=MUTED, family=MONO)
            b += text(tx + 56, ty + 12, "x", size=9, fill=MUTED, family=MONO)
            b += text(gx, gy + 126, "1 linha por tempo × território",
                      size=10.5, fill=MUTED, style="italic")

        elif i == 1:
            gx, gy = x + 24, cy + 106
            nx, ny = 9, 6
            cwid, chgt = 20, 14
            for r in range(ny):
                for c in range(nx):
                    heat = max(0, (c - (nx - 1) * 0.72) / (nx * 0.28))
                    cold = max(0, (nx * 0.20 - c) / (nx * 0.20)) * (0.35 + r / ny)
                    v = min(1, heat * (1 - r / (ny * 0.8)) + cold * 0.7 + 0.06)
                    b += rect(gx + c * (cwid + 1.6), gy + r * (chgt + 1.6),
                              cwid, chgt, r=2.5,
                              fill=OCHRE, opacity=round(0.07 + 0.80 * v, 2),
                              shadow=False)
            b += text(gx, gy - 8, "defasagem ↓", size=9, fill=MUTED,
                      family=MONO)
            ybase = gy + ny * (chgt + 1.6)
            b += text(gx, ybase + 14, "frio", size=9, fill=MUTED, family=MONO)
            b += text(gx + nx * (cwid + 1.6), ybase + 14,
                      "calor", size=9, fill=MUTED, family=MONO, anchor="end")
            b += text(gx + nx * (cwid + 1.6) / 2, ybase + 14, "exposição →",
                      size=9, fill=MUTED, family=MONO, anchor="middle")
            for k in range(8):
                b += rect(gx + k * 8, ybase + 26, 8, 7, r=1.5, fill=OCHRE,
                          opacity=round(0.10 + k * 0.11, 2), shadow=False)
            b += text(gx + 68, ybase + 33, "risco relativo", size=9,
                      fill=MUTED)

        elif i == 2:
            b += text(gx, gy + 6, "casos observados", size=10.5, fill=MUTED)
            b += rect(gx, gy + 16, 210, 30, r=7, fill=PAPER3, shadow=False)
            b += rect(gx, gy + 16, 210 * 0.31, 30, r=7, fill=CLAY, shadow=False)
            b += text(gx + 8, gy + 36, "atribuível", size=10, fill=WHITE,
                      weight=700)
            b += text(gx + 210 - 8, gy + 36, "referência", size=10,
                      fill=INK2, anchor="end")
            b += text(gx, gy + 74, "AF", size=11, fill=CLAY, weight=700,
                      family=MONO)
            b += text(gx + 30, gy + 74, "fração acima da referência",
                      size=10.5, fill=MUTED)
            b += text(gx, gy + 100, "número atribuível", size=10.5, fill=MUTED)
            b += text(gx, gy + 122, "AF × total", size=12, fill=CLAY,
                      family=MONO, weight=600)
            b += text(gx, gy + 150, "sempre com intervalo de confiança",
                      size=10.5, fill=MUTED, style="italic")

        else:
            cxc, cyc = gx + 62, gy + 56
            r = 40
            circ = 2 * 3.14159 * r
            b += circle(cxc, cyc, r, fill=WHITE, stroke=PAPER3, sw=11)
            b += (f'<circle cx="{cxc}" cy="{cyc}" r="{r}" fill="none" '
                  f'stroke="{CLAY}" stroke-width="11" stroke-linecap="round" '
                  f'stroke-dasharray="{circ*0.31:.1f} {circ:.1f}" '
                  f'transform="rotate(-90 {cxc} {cyc})"/>')
            b += text(cxc, cyc + 2, "AF", size=16, fill=CLAY, weight=700,
                      anchor="middle", family=SERIF)
            b += text(cxc, cyc + 20, "proporção", size=9, fill=MUTED,
                      anchor="middle")
            b += text(gx + 122, gy + 40, "% e casos", size=12, fill=INK,
                      weight=700)
            b += text(gx + 122, gy + 58, "atribuíveis", size=12, fill=INK,
                      weight=700)
            b += text(gx + 122, gy + 78, "ao clima", size=12, fill=INK,
                      weight=700)
            b += text(gx, gy + 132, "→ plano de contingência", size=10.5,
                      fill=TEAL_D, family=MONO)
            b += text(gx, gy + 150, "por grupo e território", size=10.5,
                      fill=MUTED, style="italic")

    fy = 474
    b += rect(48, fy, 1104, 58, r=12, fill=INK, shadow=True)
    b += text(70, fy + 24, "MODELO", size=10, fill=AQUA, weight=700,
              spacing=2.2)
    b += text(70, fy + 44, "log E[Y(t)] = α + β·f(x, lag) + s(tempo) + γ·dia da semana",
              size=15, fill="#eaf3ee", family=MONO)
    b += text(1130, fy + 34, "DLNM", size=11, fill=AQUA, anchor="end",
              family=MONO)

    py, ph = 556, 150
    b += rect(48, py, 540, ph, r=15, fill=WHITE, stroke=LINE)
    b += section_label(70, py + 30, "O que o modelo precisa controlar", color=FOREST)
    ctrl = [("Sazonalidade", "harmônicos anuais"),
            ("Tendência", "tempo de longa duração"),
            ("Dia da semana", "padrão semanal de atendimento")]
    for j, (t, d) in enumerate(ctrl):
        ry = py + 48 + j * 32
        b += ic_check(70, ry, 14, FOREST)
        b += text(90, ry + 12, t, size=12.3, fill=INK, weight=700)
        b += text(226, ry + 12, d, size=12, fill=MUTED)

    b += rect(612, py, 540, ph, r=15, fill=WHITE, stroke=LINE)
    b += section_label(634, py + 30, "O que ele não prova", color=CLAY)
    limits = [("Confundimento não medido", "poluição, acesso, renda"),
              ("Causalidade automática", "o desenho precisa sustentar"),
              ("Qualidade do dado", "subnotificação não desaparece")]
    for j, (t, d) in enumerate(limits):
        ry = py + 48 + j * 32
        b += ic_warn(634, ry, 14, CLAY)
        b += text(654, ry + 12, t, size=12.3, fill=INK, weight=700)
        b += text(880, ry + 12, d, size=12, fill=MUTED)

    b += footer(
        W, H,
        "Leitura científica",
        ["Um gráfico integrado levanta hipótese; o modelo estima a incerteza e quantifica o impacto.",
         "A fração atribuível depende do limiar e da referência escolhidos — os dois precisam estar documentados."],
        accent=OCHRE_L, label_color=OCHRE_L,
    )
    write("modelagem-flow.svg", scene(
        W, H, b,
        "Pipeline de Análise e Modelagem: da série integrada à fração atribuível",
        "Quatro etapas: entrada da tabela integrada, ajuste do DLNM com superfície de exposição e defasagem, cálculo da fração e do número atribuível e tradução em decisão de gestão; abaixo, o que o modelo controla e o que ele não prova.",
        accent=OCHRE))


# ══════════════════════════════════════════════════════════════════════════
# 4 · rap-flow — Reprodutibilidade
# ══════════════════════════════════════════════════════════════════════════
def fig_rap():
    W, H = 1200, 840
    b = header(
        W,
        "RAP · Reprodutibilidade, automação e publicação",
        "Do Pipeline validado ao artefato auditável",
        "Salvar, exportar e documentar são atos distintos — juntos, tornam a análise reexecutável por outra pessoa.",
        accent=TEAL_D,
    )

    y0, hh = 160, 330

    b += rect(48, y0, 280, hh, r=15, fill=WHITE, stroke=LINE)
    b += accent_bar(48, y0, 280, 4, 15, TEAL)
    b += badge(74, y0 + 34, "1", color=TEAL, r=12, size=12.5)
    b += text(96, y0 + 40, "Pipeline validado", size=17, fill=INK, weight=700)
    b += text(70, y0 + 62, "Passos + Parâmetros + Resultados", size=11.8,
              fill=MUTED)

    nodes = [(92, y0 + 96, 56, 34), (168, y0 + 84, 62, 34),
             (178, y0 + 140, 62, 34), (256, y0 + 128, 58, 34)]
    for nx, ny, nw, nh in nodes:
        b += rect(nx, ny, nw, nh, r=8, fill=PAPER, stroke=TEAL, sw=1.2,
                  shadow=False)
    b += path(f"M148,{y0+113} H162", color=TEAL, w=1.4)
    b += path(f"M199,{y0+118} V{ y0+134}", color=TEAL, w=1.4)
    b += path(f"M240,{y0+157} H250", color=TEAL, w=1.4)
    for i, (nx, ny, nw, nh) in enumerate(nodes):
        b += text(nx + nw / 2, ny + 21, f"Passo {i+1}", size=9.5, fill=INK2,
                  anchor="middle", weight=600)

    checks = [("ordem e dependências", True), ("parâmetros registrados", True),
              ("resultados revisados", True)]
    for j, (t, ok) in enumerate(checks):
        ry = y0 + 202 + j * 30
        b += ic_check(70, ry, 14, FOREST)
        b += text(90, ry + 12, t, size=12, fill=INK2)

    b += rect(70, y0 + 292, 236, 26, r=13, fill=FOREST, opacity=0.10,
              shadow=False)
    b += ic_check(82, y0 + 296, 14, FOREST)
    b += text(102, y0 + 310, "pronto para exportar", size=11, fill=FOREST,
              weight=700, family=MONO)

    ex, ew = 360, 330
    b += rect(ex, y0, ew, hh, r=15, fill=WHITE, stroke=LINE)
    b += accent_bar(ex, y0, ew, 4, 15, OCHRE)
    b += badge(ex + 26, y0 + 34, "2", color=OCHRE, r=12, size=12.5)
    b += text(ex + 48, y0 + 40, "Exportar", size=17, fill=INK, weight=700)
    b += text(ex + 22, y0 + 62, "sus_rap_export · artefato autocontido",
              size=10.8, fill=OCHRE, family=MONO, weight=600)

    arts = [
        ("Projeto", "pipeline.climasus.json", "nós, ordem e parâmetros", ic_code, TEAL),
        ("Código", "pipeline.R", "equivalente executável", ic_term, OCHRE),
        ("Resultados", "CSV · PNG · SVG", "tabelas, gráficos e mapas", ic_table, CLAY),
    ]
    for j, (t, fname, d, icon, col) in enumerate(arts):
        ry = y0 + 82 + j * 76
        b += rect(ex + 20, ry, ew - 40, 64, r=10, fill=PAPER, stroke=LINE,
                  sw=1, shadow=False)
        b += rect(ex + 20, ry, 4, 64, r=2, fill=col, shadow=False)
        b += icon(ex + 36, ry + 14, 20, col)
        b += text(ex + 66, ry + 22, t, size=13, fill=INK, weight=700)
        b += text(ex + 66, ry + 40, d, size=10.5, fill=MUTED)
        b += text(ex + 66, ry + 56, fname, size=9.5, fill=col, family=MONO,
                  weight=600)

    ux, uw = 722, 430
    b += rect(ux, y0, uw, hh, r=15, fill=WHITE, stroke=LINE)
    b += accent_bar(ux, y0, uw, 4, 15, TEAL_D)
    b += badge(ux + 26, y0 + 34, "3", color=TEAL_D, r=12, size=12.5)
    b += text(ux + 48, y0 + 40, "Usar, automatizar, compartilhar", size=17,
              fill=INK, weight=700)
    b += text(ux + 22, y0 + 62, "o mesmo artefato sustenta três rotinas",
              size=11.8, fill=MUTED)

    uses = [
        ("A", "Reexecutar", "reproduzir ou atualizar Resultados", ic_repeat, TEAL,
         "sus_rap_read · sus_rap_run · sus_rap_update"),
        ("B", "Automatizar", "cache, paralelismo e reexecução seletiva", ic_gear, OCHRE,
         "sus_rap_targets · sus_rap_make"),
        ("C", "Compartilhar", "receita YAML ou projeto estruturado", ic_share, FOREST,
         "sus_rap_recipe · sus_rap_template"),
    ]
    for j, (letter, t, d, icon, col, fn) in enumerate(uses):
        ry = y0 + 74 + j * 84
        b += rect(ux + 20, ry, uw - 40, 78, r=10, fill=PAPER, stroke=LINE,
                  sw=1, shadow=False)
        b += rect(ux + 20, ry, 4, 78, r=2, fill=col, shadow=False)
        b += icon(ux + 36, ry + 12, 21, col)
        b += text(ux + 68, ry + 28, t, size=13.5, fill=INK, weight=700)
        b += text(ux + 68, ry + 47, d, size=10.8, fill=MUTED)
        b += text(ux + 32, ry + 67, fn, size=10, fill=col, family=MONO,
                  weight=600)

    b += path(f"M336,{y0+165} H352", color=MUTED, w=2, head=True, opacity=0.75)
    b += path(f"M690,{y0+165} H702", color=MUTED, w=1.6, opacity=0.7)
    b += path(f"M702,{y0+113} V{y0+281}", color=MUTED, w=1.6, opacity=0.45)
    for j in range(3):
        yy = y0 + 113 + j * 84
        b += path(f"M702,{yy} H716", color=MUTED, w=1.6, head=True, opacity=0.7)

    by, bh = 520, 132
    b += rect(48, by, 1104, bh, r=15, fill=INK, shadow=True)
    b += text(70, by + 28, "CADEIA DE CUSTÓDIA", size=10.5, fill=AQUA,
              weight=700, spacing=2.2)
    b += text(70, by + 48, "cada elo precisa de dono, versão e data",
              size=11.5, fill="#b9cdc4")

    chain = [("Dados", "fonte e extração"), ("Parâmetros", "escolhas"),
             ("Código", "versão executável"), ("Resultado", "tabela e figura"),
             ("Relatório", "leitura e limites")]
    for j, (t, d) in enumerate(chain):
        cx = 92 + j * 224
        b += circle(cx, by + 86, 5, fill=AQUA if j < 4 else OCHRE)
        if j < 4:
            b += path(f"M{cx+9},{by+86} H{cx+214}", color=AQUA, w=1.2,
                      opacity=0.35)
        b += text(cx, by + 108, t, size=12, fill=WHITE, weight=700)
        b += text(cx, by + 124, d, size=9.5, fill="#9fb6ac")

    b += footer(
        W, H,
        "Leitura científica",
        ["Reprodutibilidade não é o mesmo que arquivo salvo: é outra pessoa conseguir refazer o caminho e chegar ao mesmo lugar.",
         "Dados externos mudam, caminhos deixam de existir e métodos exigem revisão — por isso a documentação acompanha o artefato."],
        accent=AQUA,
    )
    write("rap-flow.svg", scene(
        W, H, b,
        "RAP: do Pipeline validado ao artefato reprodutível",
        "Um Pipeline validado é exportado como projeto, código e resultados; o mesmo artefato permite reexecutar, automatizar e compartilhar a análise, dentro de uma cadeia de custódia que vai dos dados ao relatório.",
        accent=TEAL_D))


# ══════════════════════════════════════════════════════════════════════════
# 5 · node-anatomy — Anatomia de um Nó
# ══════════════════════════════════════════════════════════════════════════
def fig_node():
    W, H = 1200, 940
    b = header(
        W,
        "Fundamentos · vocabulário do Studio",
        "Anatomia de um Nó: onde a Função vira Passo",
        "Um único cartão na tela carrega quatro informações: o que faz, com quais Parâmetros, como executa e o que produz.",
        accent=TEAL,
    )
    b += section_label(48, 158, "Da Biblioteca ao Pipeline", rule_to=1152,
                       rule_color=LINE)

    lx, ly, lw, lh = 48, 184, 240, 416
    b += rect(lx, ly, lw, lh, r=15, fill=WHITE, stroke=LINE)
    b += text(lx + 20, ly + 30, "Biblioteca", size=15.5, fill=INK, weight=700)
    b += text(lx + 20, ly + 48, "Preparação · 15 Funções", size=10.5,
              fill=MUTED, family=MONO)
    b += rect(lx + 20, ly + 62, lw - 40, 26, r=8, fill=PAPER, stroke=LINE,
              sw=1, shadow=False)
    b += text(lx + 32, ly + 79, "buscar função…", size=10, fill=MUTED,
              style="italic")

    funcs = [
        ("Importar dados do DATASUS", ic_download),
        ("Corrigir acentuação", ic_type),
        ("Padronizar nomes", ic_sliders),
        ("Filtrar por CID-10", ic_filter),
        ("Agregar série temporal", ic_calendar),
    ]
    for j, (name, icon) in enumerate(funcs):
        ry = ly + 98 + j * 42
        sel = j == 3
        if sel:
            b += rect(lx + 12, ry - 2, lw - 24, 38, r=9, fill=TEAL,
                      opacity=0.10, shadow=False)
            b += rect(lx + 12, ry - 2, 3, 38, r=1.5, fill=TEAL, shadow=False)
        b += icon(lx + 24, ry + 6, 16, TEAL if sel else MUTED)
        b += text(lx + 48, ry + 18, name, size=10.4,
                  fill=INK if sel else INK2, weight=700 if sel else 400)
        if sel:
            b += path(f"M{lw+lx-34},{ry+13} h8 m-3,-3 l3,3 l-3,3", color=TEAL,
                      w=1.6)

    b += text(lx + 20, ly + 330, "Função = o tipo da operação;", size=11,
              fill=MUTED)
    b += text(lx + 20, ly + 347, "existe uma vez no catálogo.", size=11,
              fill=MUTED)
    b += text(lx + 20, ly + 380, "Passo = esta Função com", size=11, fill=INK2,
              weight=700)
    b += text(lx + 20, ly + 397, "Parâmetros preenchidos.", size=11, fill=INK2,
              weight=700)

    b += path(f"M{lw+lx+2},300 H306", color=TEAL, w=2.2, head=True)

    nx, ny, nw, nh = 312, 184, 346, 416
    b += rect(nx + 4, ny + 6, nw, nh, r=16, fill=TEAL, opacity=0.06,
              shadow=False)
    b += rect(nx, ny, nw, nh, r=16, fill=WHITE, stroke=LINE, sw=1.6)
    b += accent_bar(nx, ny, nw, 6, 16, TEAL)

    b += circle(nx + 34, ny + 46, 17, fill=TEAL, opacity=0.12)
    b += ic_filter(nx + 25, ny + 37, 18, TEAL)
    b += text(nx + 62, ny + 42, "Filtrar por CID-10", size=15.5, fill=INK,
              weight=700)
    b += text(nx + 62, ny + 60, "grupo de doença · Etapa Preparação", size=10.2,
              fill=MUTED)
    b += text(nx + nw - 22, ny + 30, "⋮", size=17, fill=MUTED,
              anchor="middle")
    b += path(f"M{nx+20},{ny+86} H{nx+nw-20}", color=LINE, w=1.2)

    b += text(nx + 22, ny + 108, "PARÂMETROS", size=9.5, fill=MUTED,
              weight=700, spacing=1.6)
    params = [
        ("CID-10 ou grupo", "Respiratório (cap. J)", False),
        ("match_type", "chapter", False),
        ("dados", "herdado do Passo anterior", True),
    ]
    for j, (k, v, inherited) in enumerate(params):
        ry = ny + 128 + j * 38
        if inherited:
            b += ic_check(nx + 24, ry - 8, 12, FOREST)
            b += text(nx + 40, ry - 1, k, size=9.8, fill=MUTED, family=MONO)
            b += text(nx + 40, ry + 14, v, size=10.8, fill=FOREST, weight=600)
        else:
            b += text(nx + 22, ry, k, size=9.8, fill=MUTED, family=MONO)
            b += text(nx + 22, ry + 15, v, size=10.8, fill=INK2, weight=600)

    b += rect(nx + 20, ny + 252, nw - 40, 34, r=9, fill=TEAL, shadow=False)
    b += text(nx + 40, ny + 274, "▶", size=11, fill=WHITE)
    b += text(nx + 62, ny + 274, "Executar Passo", size=11.5, fill=WHITE,
              weight=700)
    b += text(nx + nw - 38, ny + 274, "⌘⏎", size=9.5, fill=AQUA_L,
              family=MONO, anchor="end")

    b += path(f"M{nx+20},{ny+306} H{nx+nw-20}", color=LINE, w=1.2)
    b += text(nx + 22, ny + 328, "RESULTADO", size=9.5, fill=MUTED,
              weight=700, spacing=1.6)
    b += text(nx + nw - 22, ny + 328, "12.480 linhas · 0,8 s", size=9,
              fill=FOREST, family=MONO, anchor="end")
    ty = ny + 340
    tw = [118, 88, 62]
    for r in range(3):
        for c, cw in enumerate(tw):
            xx = nx + 22 + sum(tw[:c]) + c * 6
            b += rect(xx, ty + r * 20, cw, 18, r=3,
                      fill=PAPER2 if r == 0 else WHITE, stroke=LINE, sw=0.7,
                      shadow=False)
    b += text(nx + 28, ty + 13, "municipio", size=9.8, fill=MUTED, family=MONO)
    b += text(nx + 152, ty + 13, "semana", size=9.8, fill=MUTED, family=MONO)
    b += text(nx + 246, ty + 13, "casos", size=9.8, fill=MUTED, family=MONO)
    b += text(nx + 28, ty + 33, "Manaus", size=9.4, fill=INK2)
    b += text(nx + 152, ty + 33, "SE 14", size=9.4, fill=INK2, family=MONO)
    b += text(nx + 246, ty + 33, "52", size=9.4, fill=INK2, family=MONO)
    b += text(nx + 28, ty + 53, "Belém", size=9.4, fill=INK2)
    b += text(nx + 152, ty + 53, "SE 14", size=9.4, fill=INK2, family=MONO)
    b += text(nx + 246, ty + 53, "37", size=9.4, fill=INK2, family=MONO)

    notes = [
        (ny + 6, ny + 22, "Etapa", "a cor identifica a família de Funções"),
        (ny + 44, ny + 104, "Função em uso", "o título do Nó é a Função escolhida"),
        (ny + 168, ny + 188, "Parâmetros", "obrigatórios, avançados e herdados"),
        (ny + 268, ny + 330, "Execução", "roda o Passo e congela um Resultado"),
        (ny + 352, ny + 414, "Resultado", "prévia que pode virar Artefato"),
    ]
    for j, (ty_node, ty_label, title, desc) in enumerate(notes):
        ex = nx + nw
        b += circle(ex, ty_node, 3.4, fill=TEAL)
        b += path(f"M{ex},{ty_node} H{ex+18} V{ty_label-4} H{ex+32}",
                  color=TEAL, w=1.2, opacity=0.55)
        b += badge(ex + 42, ty_label - 4, str(j + 1), color=TEAL, r=9.5,
                   size=10.5)
        b += text(ex + 60, ty_label, title, size=12.5, fill=INK, weight=700)
        b += text(ex + 60, ty_label + 17, desc, size=11, fill=MUTED)

    vy = 640
    b += section_label(48, vy, "Vocabulário-chave", color=MUTED)
    vocab = [
        ("Função", "operação do catálogo", "tipo", TEAL),
        ("Passo", "Função + Parâmetros", "instância", OCHRE),
        ("Nó", "a forma na tela", "representação", FOREST),
        ("Pipeline", "sequência executável", "grafo", TEAL_D),
    ]
    for j, (t, d, tag, col) in enumerate(vocab):
        vx = 48 + j * 278
        b += rect(vx, vy + 18, 252, 96, r=12, fill=WHITE, stroke=LINE)
        b += rect(vx, vy + 18, 4, 96, r=2, fill=col, shadow=False)
        b += text(vx + 18, vy + 44, t, size=14.5, fill=INK, weight=700)
        b += text(vx + 18, vy + 64, d, size=10.8, fill=MUTED)
        b += text(vx + 18, vy + 92, tag, size=9.2, fill=col, family=MONO,
                  weight=600)
        if j < 3:
            b += path(f"M{vx+258},{vy+66} h10", color=MUTED, w=1.6, head=True,
                      opacity=0.55)

    b += footer(
        W, H,
        "Leitura científica",
        ["A rastreabilidade nasce aqui: cada Nó guarda a Função, os Parâmetros e o Resultado que produziu.",
         "É isso que permite a outra pessoa repetir a análise — ou contestar o número — sem depender de quem montou."],
    )
    write("node-anatomy.svg", scene(
        W, H, b,
        "Anatomia de um Nó: da Função na Biblioteca ao Passo no Pipeline",
        "Diagrama em três colunas: a Biblioteca de Funções, o cartão do Nó com título, Etapa, Parâmetros, botão de execução e prévia de Resultado, e as cinco chamadas que explicam cada parte; abaixo, o vocabulário Função, Passo, Nó e Pipeline.",
        accent=TEAL))


# ══════════════════════════════════════════════════════════════════════════
# 6 · clima-saude-map — exposição, defasagem e vulnerabilidade
# ══════════════════════════════════════════════════════════════════════════
def fig_clima():
    W, H = 1200, 920
    b = header(
        W,
        "Fundamentos · clima e saúde",
        "O efeito chega depois — e não chega igual para todos",
        "Entre a exposição e o desfecho há uma janela biológica; entre pessoas e territórios, camadas de vulnerabilidade que mudam o risco.",
        accent=CLAY,
    )

    # ── cadeia causal ───────────────────────────────────────────────────
    ay, ah = 158, 172
    b += rect(48, ay, 1104, ah, r=15, fill=WHITE, stroke=LINE)
    b += section_label(70, ay + 28, "A cadeia entre o clima e o desfecho",
                       color=MUTED)

    # exposição
    exp = [("Calor", ic_sun, OCHRE), ("Fumaça", ic_smoke, MUTED),
           ("Chuva", ic_rain, TEAL), ("Seca", ic_drought, CLAY)]
    for j, (lab, icon, col) in enumerate(exp):
        ex = 78 + j * 72
        b += circle(ex + 14, ay + 66, 20, fill=col, opacity=0.10)
        b += icon(ex + 2, ay + 54, 24, col)
        b += text(ex + 14, ay + 104, lab, size=10.5, fill=INK2, weight=600,
                  anchor="middle")
    b += text(78, ay + 128, "exposição em t0", size=9.2, fill=CLAY,
              family=MONO, weight=600)

    # janela
    b += path(f"M410,{ay+68} H770", color=CLAY, w=2, dash="2 7",
              head=True, opacity=0.85)
    b += circle(410, ay + 68, 5, fill=CLAY)
    b += text(590, ay + 48, "defasagem · dias a semanas", size=12.5,
              fill=CLAY, weight=700, anchor="middle")
    for k in range(5):
        tx = 440 + k * 72
        b += path(f"M{tx},{ay+62} v12", color=CLAY, w=1.2, opacity=0.45)
        b += text(tx, ay + 94, ["0", "7", "14", "21", "28"][k], size=10,
                  fill=MUTED, anchor="middle", family=MONO)
    b += text(590, ay + 140, "a exposição de hoje pode produzir o caso da semana que vem",
              size=10, fill=MUTED, anchor="middle", style="italic")

    # desfecho
    ox = 830
    b += circle(ox + 28, ay + 64, 24, fill=TEAL, opacity=0.10)
    b += ic_hospital(ox + 14, ay + 50, 28, TEAL_D)
    b += text(ox + 62, ay + 54, "atendimento", size=11, fill=INK2, weight=600)
    b += text(ox + 62, ay + 70, "internação", size=11, fill=INK2, weight=600)
    b += text(ox + 62, ay + 86, "óbito", size=11, fill=INK2, weight=600)
    b += text(ox, ay + 128, "desfecho em t0 + N", size=9.2, fill=TEAL_D,
              family=MONO, weight=600)

    # ── dois painéis científicos ────────────────────────────────────────
    py, ph = 356, 248
    b += rect(48, py, 540, ph, r=15, fill=WHITE, stroke=LINE)
    b += text(70, py + 30, "Assinaturas temporais diferentes", size=14.5,
              fill=INK, weight=700)
    b += text(70, py + 48, "o risco relativo não volta ao mesmo tempo", size=10.5,
              fill=MUTED)

    gx, gy, gw, gh = 104, py + 76, 442, 112
    for rr in [1.0, 1.2, 1.4]:
        yy = gy + gh - (rr - 0.95) / 0.52 * gh
        b += path(f"M{gx},{yy} H{gx+gw}", color=LINE, w=1, dash="2 4")
        b += text(gx - 10, yy + 3.5, f"{rr:.1f}", size=10, fill=MUTED,
                  anchor="end", family=MONO)
    b += text(gx - 10, gy - 8, "RR", size=9, fill=MUTED, family=MONO)

    def Y(rr):
        return gy + gh - (rr - 0.95) / 0.52 * gh

    def X(lag):
        return gx + lag / 60 * gw

    heat = [(0, 1.30), (2, 1.40), (5, 1.33), (9, 1.18), (14, 1.08),
            (21, 1.02), (28, 1.00), (40, 1.00), (60, 1.00)]
    deng = [(0, 1.00), (7, 1.04), (14, 1.10), (28, 1.22), (42, 1.31),
            (52, 1.24), (60, 1.14)]
    b += poly([(X(l), Y(r)) for l, r in deng], color=TEAL, w=2.2, dash="5 4")
    b += poly([(X(l), Y(r)) for l, r in heat], color=CLAY, w=2.4)

    for l in [0, 7, 14, 28, 60]:
        b += path(f"M{X(l)},{gy+gh} v4", color=MUTED, w=1, opacity=0.5)
        b += text(X(l), gy + gh + 15, str(l), size=10, fill=MUTED,
                  anchor="middle", family=MONO)
    b += text(gx + gw, gy + gh + 30, "dias de defasagem", size=9, fill=MUTED,
              anchor="end", family=MONO)

    # legenda
    b += path(f"M{gx+250},{gy-10} h18", color=CLAY, w=2.4)
    b += text(gx + 274, gy - 6, "calor", size=9.5, fill=INK2)
    b += path(f"M{gx+326},{gy-10} h18", color=TEAL, w=2.2, dash="5 4")
    b += text(gx + 350, gy - 6, "dengue", size=9.5, fill=INK2)

    b += text(70, py + ph - 16,
              "Escolher a janela errada pode apagar o efeito — ou inventá-lo.",
              size=10, fill=MUTED, style="italic")

    # painel 2
    px = 612
    b += rect(px, py, 540, ph, r=15, fill=WHITE, stroke=LINE)
    b += text(px + 22, py + 30, "Deslocamento de mortalidade", size=14.5,
              fill=INK, weight=700)
    b += text(px + 22, py + 48, "o efeito colheita esconde parte do impacto",
              size=10.5, fill=MUTED)

    gx2, gy2, gw2, gh2 = px + 56, py + 76, 442, 112
    base = 100

    def Y2(v):
        return gy2 + gh2 - (v - 82) / 56 * gh2

    def X2(d):
        return gx2 + d / 28 * gw2

    obs = [(0, 100), (1, 102), (2, 111), (3, 126), (4, 133), (5, 125),
           (6, 111), (7, 99), (8, 91), (9, 87), (10, 89), (11, 94),
           (12, 97), (14, 99), (18, 101), (22, 100), (28, 100)]
    # área de excesso
    b += (f'<path d="M{X2(1)},{Y2(100)} ' +
          " ".join(f"L{X2(d)},{Y2(v)}" for d, v in obs if 1 <= d <= 6) +
          f' L{X2(6)},{Y2(100)} Z" fill="{CLAY}" opacity="0.16"/>')
    b += (f'<path d="M{X2(7)},{Y2(100)} ' +
          " ".join(f"L{X2(d)},{Y2(v)}" for d, v in obs if 7 <= d <= 12) +
          f' L{X2(12)},{Y2(100)} Z" fill="{TEAL}" opacity="0.14"/>')
    b += path(f"M{gx2},{Y2(base)} H{gx2+gw2}", color=MUTED, w=1.3, dash="5 4")
    b += poly([(X2(d), Y2(v)) for d, v in obs], color=INK, w=2.2)
    b += text(gx2 + gw2 - 4, Y2(base) - 9, "esperado", size=10, fill=MUTED,
              family=MONO, anchor="end")

    b += rect(gx2 + 248, gy2 - 14, 10, 8, r=2, fill=CLAY, opacity=0.55,
              shadow=False)
    b += text(gx2 + 264, gy2 - 7, "excesso", size=9.5, fill=INK2)
    b += rect(gx2 + 318, gy2 - 14, 10, 8, r=2, fill=TEAL, opacity=0.45,
              shadow=False)
    b += text(gx2 + 334, gy2 - 7, "déficit", size=9.5, fill=INK2)

    for d in [0, 7, 14, 21, 28]:
        b += path(f"M{X2(d)},{gy2+gh2} v4", color=MUTED, w=1, opacity=0.5)
        b += text(X2(d), gy2 + gh2 + 15, str(d), size=10, fill=MUTED,
                  anchor="middle", family=MONO)
    b += text(gx2 + gw2, gy2 + gh2 + 30, "dias desde o evento", size=9,
              fill=MUTED, anchor="end", family=MONO)

    b += text(px + 22, py + ph - 16,
              "Somar só o excesso superestima; o total pode parecer estável.",
              size=10, fill=MUTED, style="italic")

    # ── vulnerabilidade ─────────────────────────────────────────────────
    vy = 626
    b += section_label(48, vy, "Quatro camadas que se somam", color=CLAY,
                       rule_to=1152)
    vulns = [
        ("Biológica", "idade, gestação,\ndoença crônica", ic_heart, CLAY),
        ("Social", "renda, trabalho,\nacesso ao serviço", ic_people, OCHRE),
        ("Territorial", "moradia, drenagem,\narborização", ic_map, FOREST),
        ("Institucional", "alerta, capacidade\nde resposta", ic_gear, TEAL_D),
    ]
    for j, (t, d, icon, col) in enumerate(vulns):
        vx = 48 + j * 278
        b += rect(vx, vy + 18, 252, 122, r=12, fill=WHITE, stroke=LINE)
        b += rect(vx, vy + 18, 4, 122, r=2, fill=col, shadow=False)
        b += icon(vx + 20, vy + 34, 20, col)
        b += text(vx + 20, vy + 74, t, size=13.5, fill=INK, weight=700)
        dl = d.split("\n")
        b += lines(vx + 20, vy + 94, dl, size=10.6, fill=MUTED, lh=16)

    b += footer(
        W, H,
        "Leitura científica",
        ["A mesma exposição pode produzir efeitos muito diferentes entre bairros e grupos populacionais.",
         "Ignorar a defasagem subestima o efeito; ignorar a vulnerabilidade esconde quem foi mais atingido."],
        accent=CLAY_L, label_color=CLAY_L,
    )
    write("clima-saude-map.svg", scene(
        W, H, b,
        "Clima e saúde: exposição, defasagem e vulnerabilidade",
        "Uma exposição climática em t0 — calor, fumaça, chuva ou seca — produz desfecho dias ou semanas depois; dois gráficos mostram assinaturas temporais distintas e o deslocamento de mortalidade; quatro camadas de vulnerabilidade modificam o risco.",
        accent=CLAY))




# ══════════════════════════════════════════════════════════════════════════
# 7–10 · arcos de caso — template comum
# ══════════════════════════════════════════════════════════════════════════
def _tag(x, y, w, label, color, size=10.6):
    w = 26 + len(label) * size * 0.60
    out = rect(x, y, w, 26, r=13, fill=PAPER2, stroke="none", shadow=False)
    out += text(x + 13, y + 17.5, label, size=size, fill=color, family=MONO,
                weight=600)
    return out


def _stage_card(x, y, w, h, color, num, title, tags):
    out = rect(x, y, w, h, r=15, fill=WHITE, stroke=LINE)
    out += accent_bar(x, y, w, 4, 15, color)
    out += text(x + 20, y + 26, f"ETAPA 0{num}", size=9.2, fill=color,
                family=MONO, weight=700)
    out += text(x + 20, y + 54, title, size=16.5, fill=INK, weight=700)
    for j, (t, tw) in enumerate(tags):
        out += _tag(x + 20, y + 78 + j * 40, tw, t, color)
    return out


def _ficha(x, y, w, h, rows, accent):
    out = rect(x, y, w, h, r=15, fill=WHITE, stroke=LINE)
    out += accent_bar(x, y, w, 4, 15, accent)
    out += text(x + 22, y + 32, "Ficha do estudo", size=14.5, fill=INK,
                weight=700)
    out += text(x + w - 22, y + 32, "recorte analítico", size=9.5, fill=MUTED,
                anchor="end", style="italic")
    for j, (k, v) in enumerate(rows):
        ry = y + 50 + j * 22
        if j:
            out += f'<path d="M{x+22},{ry-6} H{x+w-22}" stroke="{LINE}" stroke-width="0.9"/>'
        out += text(x + 22, ry + 9, k, size=10.4, fill=MUTED, family=MONO)
        out += text(x + 136, ry + 9, v, size=11.3, fill=INK2)
    return out


def _panel(x, y, w, h, title, sub, accent, tag="esquema"):
    out = rect(x, y, w, h, r=15, fill=WHITE, stroke=LINE)
    out += accent_bar(x, y, w, 4, 15, accent)
    out += text(x + 22, y + 30, title, size=14.5, fill=INK, weight=700)
    out += text(x + 22, y + 48, sub, size=11, fill=MUTED)
    out += text(x + w - 22, y + 26, tag, size=10, fill=MUTED, family=MONO,
                anchor="end")
    return out


def _axes(x, y, w, h, yticks, ylab, xlab, xfmt, accent=MUTED):
    out = ""
    for v, py in yticks:
        out += f'<path d="M{x},{py} H{x+w}" stroke="{LINE}" stroke-width="1" stroke-dasharray="2 4"/>'
        out += text(x - 8, py + 3.5, v, size=10, fill=MUTED, anchor="end",
                    family=MONO)
    out += f'<path d="M{x},{y+h} H{x+w}" stroke="{LINE}" stroke-width="1.2"/>'
    out += text(x - 8, y - 8, ylab, size=10, fill=MUTED, family=MONO)
    out += text(x + w, y + h + 26, xlab, size=10, fill=MUTED, anchor="end",
                family=MONO)
    out += text(x, y + h + 26, xfmt[0], size=10, fill=MUTED, family=MONO)
    out += text(x + w, y + h + 26, xfmt[1], size=10, fill=MUTED,
                anchor="end", family=MONO)
    return out


def case_arc(name, kicker, title, subtitle, accent, stages, ficha, chart_title,
             chart_sub, chart_note, reading, aria):
    W, H = 1200, 810
    b = header(W, kicker, title, subtitle, accent=accent)

    y0, hh, cw = 158, 212, 260
    xs = [48, 329.3, 610.7, 892]
    for i, (stage, tags) in enumerate(stages):
        b += _stage_card(xs[i], y0, cw, hh, accent, i + 1, stage, tags)
        if i < 3:
            mx = xs[i] + cw + 4
            b += path(f"M{mx},{y0+hh/2} h10", color=MUTED, w=1.8, head=True,
                      opacity=0.5)

    py, ph = 392, 240
    b += _panel(48, py, 648, ph, chart_title, chart_sub, accent)
    b += _ficha(720, py, 432, ph, ficha, accent)

    b += footer(W, H, "Leitura científica", reading, accent=AQUA)

    draw = CHARTS[name]
    b += draw("", 48, py, 648, ph)

    write(name + ".svg", scene(W, H, b, title, aria, accent=accent))


# ── ec-01: curva em U ───────────────────────────────────────────────────
def draw_ec01(b, x, y, w, h):
    gx, gy, gw, gh = x + 54, y + 72, 550, 108

    def X(t):
        return gx + (t - 5) / 35 * gw

    def Y(r):
        return gy + gh - (r - 0.90) / 0.72 * gh

    for rr in [1.0, 1.2, 1.4]:
        yy = Y(rr)
        b += path(f"M{gx},{yy} H{gx+gw}", color=LINE, w=1, dash="2 4")
        b += text(gx - 8, yy + 3.5, f"{rr:.1f}", size=10, fill=MUTED,
                  anchor="end", family=MONO)
    b += text(gx - 8, gy - 8, "RR", size=10, fill=MUTED, family=MONO)

    pts = [(5, 1.46), (8, 1.36), (12, 1.22), (16, 1.09), (20, 1.02),
           (24, 0.99), (28, 1.05), (32, 1.17), (36, 1.31), (40, 1.43)]
    b += (f'<path d="M{X(5)},{Y(1.46)} ' +
          " ".join(f"L{X(t)},{Y(r)}" for t, r in pts[1:]) +
          f' L{X(40)},{gy+gh} L{X(5)},{gy+gh} Z" fill="{CLAY}" opacity="0.06"/>')
    b += poly([(X(t), Y(r)) for t, r in pts], color=CLAY, w=2.6)
    b += path(f"M{X(24)},{gy} V{gy+gh}", color=MUTED, w=1.2, dash="4 4")
    b += circle(X(24), Y(0.99), 4, fill=WHITE, stroke=CLAY, sw=2)
    b += text(X(24), gy - 10, "mínimo de mortalidade (MMT)", size=10,
              fill=INK2, anchor="middle", weight=600)

    b += text(gx + 6, gy + gh + 20, "frio", size=9.5, fill=TEAL, weight=700)
    b += text(gx + gw - 6, gy + gh + 20, "calor", size=9.5, fill=CLAY,
              weight=700, anchor="end")
    b += text(gx + gw / 2, gy + gh + 20, "temperatura do ar →", size=10,
              fill=MUTED, anchor="middle", family=MONO)

    b += text(x + 22, y + h - 16, chart_note_ec01, size=10.6, fill=MUTED,
              style="italic")
    return b


chart_note_ec01 = "As duas caudas não são simétricas: o frio e o calor exigem limiares e alertas próprios."


# ── ec-02: acúmulo térmico ──────────────────────────────────────────────
def draw_ec02(b, x, y, w, h):
    gx, gy, gw, gh = x + 54, y + 72, 550, 108

    def X(t):
        return gx + t / 20 * gw

    def Y(v):
        return gy + gh - v / 1000 * gh

    for v in [0, 250, 500, 750, 1000]:
        yy = Y(v)
        b += path(f"M{gx},{yy} H{gx+gw}", color=LINE, w=1, dash="2 4")
        b += text(gx - 8, yy + 3.5, str(v), size=10, fill=MUTED,
                  anchor="end", family=MONO)
    b += text(gx - 8, gy - 8, "GDD", size=10, fill=MUTED, family=MONO)

    # janela de transmissão
    b += rect(X(6), gy, X(14) - X(6), gh, r=0, fill=OCHRE, opacity=0.09,
              shadow=False)
    b += text((X(6) + X(14)) / 2, gy + 12, "janela de transmissão", size=9,
              fill=OCHRE, weight=700, anchor="middle")

    pts = [(0, 0), (1, 12), (2, 40), (3, 80), (4, 135), (5, 205), (6, 290),
           (7, 390), (8, 495), (9, 595), (10, 685), (11, 760), (12, 820),
           (13, 868), (14, 905), (15, 930), (16, 948), (18, 968), (20, 978)]
    b += poly([(X(t), Y(v)) for t, v in pts], color=OCHRE, w=2.6)
    b += path(f"M{gx},{Y(500)} H{gx+gw}", color=CLAY, w=1.2, dash="4 4")
    b += text(gx + 4, Y(500) - 11, "limiar de acúmulo", size=10, fill=CLAY,
              family=MONO)

    b += text(gx, gy + gh + 18, "0", size=10, fill=MUTED, family=MONO)
    b += text(gx + gw / 2, gy + gh + 18, "semanas →", size=10, fill=MUTED,
              anchor="middle", family=MONO)
    b += text(gx + gw, gy + gh + 18, "20", size=10, fill=MUTED,
              anchor="end", family=MONO)
    b += text(x + 22, y + h - 16, chart_note_ec02, size=10.6, fill=MUTED,
              style="italic")
    return b


chart_note_ec02 = "O GDD resume dias de calor útil ao vetor: base 11 °C, com teto térmico."


# ── ec-03: evento agudo e colheita ──────────────────────────────────────
def draw_ec03(b, x, y, w, h):
    gx, gy, gw, gh = x + 54, y + 72, 550, 108

    def X(d):
        return gx + d / 35 * gw

    def Y(v):
        return gy + gh - (v - 85) / 55 * gh

    for v in [90, 100, 110, 120, 130]:
        yy = Y(v)
        b += path(f"M{gx},{yy} H{gx+gw}", color=LINE, w=1, dash="2 4")
        b += text(gx - 8, yy + 3.5, str(v), size=10, fill=MUTED,
                  anchor="end", family=MONO)
    b += text(gx - 8, gy - 8, "óbitos", size=10, fill=MUTED, family=MONO)

    obs = [(0, 100), (4, 99), (7, 101), (9, 103), (10, 108), (11, 118),
           (12, 129), (13, 134), (14, 124), (15, 111), (16, 99), (17, 92),
           (18, 88), (19, 90), (20, 95), (22, 99), (26, 100), (31, 100),
           (35, 100)]

    b += rect(X(10.5), gy, X(15.5) - X(10.5), gh, r=0, fill=CLAY, opacity=0.07,
              shadow=False)
    b += (f'<path d="M{X(10)},{Y(100)} ' +
          " ".join(f"L{X(d)},{Y(v)}" for d, v in obs if 10 <= d <= 16) +
          f' L{X(16)},{Y(100)} Z" fill="{CLAY}" opacity="0.16"/>')
    b += (f'<path d="M{X(16)},{Y(100)} ' +
          " ".join(f"L{X(d)},{Y(v)}" for d, v in obs if 16 <= d <= 22) +
          f' L{X(22)},{Y(100)} Z" fill="{TEAL}" opacity="0.13"/>')

    b += path(f"M{gx},{Y(100)} H{gx+gw}", color=MUTED, w=1.2, dash="4 4")
    b += poly([(X(d), Y(v)) for d, v in obs], color=INK, w=2.4)

    b += text(X(13), gy - 10, "onda de calor", size=9.2, fill=CLAY,
              weight=700, anchor="middle")
    b += text(X(13), Y(138), "pico", size=10, fill=CLAY, anchor="middle",
              weight=700)
    b += text(X(19.5), Y(84), "déficit (colheita)", size=10, fill=TEAL_D,
              anchor="middle", weight=700)

    b += text(gx, gy + gh + 18, "0", size=10, fill=MUTED, family=MONO)
    b += text(gx + gw / 2, gy + gh + 18, "dias desde a exposição →", size=10,
              fill=MUTED, anchor="middle", family=MONO)
    b += text(gx + gw, gy + gh + 18, "35", size=10, fill=MUTED,
              anchor="end", family=MONO)
    b += text(x + 22, y + h - 16, chart_note_ec03, size=10.6, fill=MUTED,
              style="italic")
    return b


chart_note_ec03 = "Sem olhar os dias seguintes, o déficit parece melhora — é o efeito colheita."


# ── ec-04: série interrompida ───────────────────────────────────────────
def draw_ec04(b, x, y, w, h):
    gx, gy, gw, gh = x + 54, y + 72, 550, 108

    def X(t):
        return gx + t / 24 * gw

    def Y(v):
        return gy + gh - (v - 95) / 32 * gh

    for v in [100, 110, 120]:
        yy = Y(v)
        b += path(f"M{gx},{yy} H{gx+gw}", color=LINE, w=1, dash="2 4")
        b += text(gx - 8, yy + 3.5, str(v), size=10, fill=MUTED,
                  anchor="end", family=MONO)
    b += text(gx - 8, gy - 8, "internações", size=10, fill=MUTED,
              family=MONO)

    # evento
    b += rect(X(10.6), gy, X(11.4) - X(10.6), gh, r=0, fill=CLAY, opacity=0.10,
              shadow=False)
    b += path(f"M{X(11)},{gy} V{gy+gh}", color=CLAY, w=1.4, dash="4 3")
    b += text(X(11), gy - 10, "evento de frio", size=9, fill=CLAY,
              weight=700, anchor="middle")

    pre = [(0, 100), (3, 103), (6, 106), (9, 109), (11, 112)]
    post = [(11, 112), (12, 104), (14, 105), (16, 107), (18, 109),
            (20, 111), (22, 113), (24, 116)]
    cf = [(11, 112), (14, 115), (18, 119), (24, 124)]

    b += poly([(X(t), Y(v)) for t, v in cf], color=MUTED, w=1.8, dash="5 4")
    b += poly([(X(t), Y(v)) for t, v in pre], color=INK, w=2.4)
    b += poly([(X(t), Y(v)) for t, v in post], color=TEAL_D, w=2.4)

    # degrau de nível (contrafactual vs observado)
    bx = X(14.6)
    b += path(f"M{bx},{Y(105)} V{Y(115)}", color=CLAY, w=1.4)
    b += path(f"M{bx-4},{Y(105)} H{bx+4}", color=CLAY, w=1.4)
    b += path(f"M{bx-4},{Y(115)} H{bx+4}", color=CLAY, w=1.4)
    b += text(bx + 8, Y(110) + 3, "Δ nível", size=9.8, fill=CLAY,
              family=MONO)
    b += text(X(20), Y(126), "tendência esperada", size=9.8, fill=MUTED,
              family=MONO)
    b += text(X(21), Y(107), "observado", size=9.8, fill=TEAL_D, family=MONO)

    b += text(gx, gy + gh + 18, "0", size=10, fill=MUTED, family=MONO)
    b += text(gx + gw / 2, gy + gh + 18, "semanas →", size=10, fill=MUTED,
              anchor="middle", family=MONO)
    b += text(gx + gw, gy + gh + 18, "24", size=10, fill=MUTED,
              anchor="end", family=MONO)
    b += text(x + 22, y + h - 16, chart_note_ec04, size=10.6, fill=MUTED,
              style="italic")
    return b


chart_note_ec04 = "A linha tracejada é o contrafactual: o que teria acontecido sem o evento."

CHARTS = {
    "arco-ec01": draw_ec01,
    "arco-ec02": draw_ec02,
    "arco-ec03": draw_ec03,
    "arco-ec04": draw_ec04,
}


def fig_cases():
    case_arc(
        "arco-ec01",
        "Caso ec-01 · arco completo",
        "Respiratório pediátrico e temperatura",
        "Do dado bruto do SIM-DO à fração atribuível em crianças menores de 5 anos, no Sudeste, 2015–2019.",
        TEAL,
        [
            ("Preparação", [("SIM-DO", 96), ("CID-10 capítulo J", 150),
                            ("menores de 5 anos", 158)]),
            ("Integração", [("temperatura + umidade", 190),
                            ("estações INMET", 140),
                            ("série semanal", 130)]),
            ("Modelagem", [("DLNM", 70), ("defasagem distribuída", 172),
                           ("sazonalidade controlada", 190)]),
            ("Impacto", [("fração atribuível", 160),
                         ("número atribuível", 160),
                         ("prioridade pediátrica", 178)]),
        ],
        [("Fonte", "SIM-DO"), ("CID-10", "J00–J99"), ("População", "< 5 anos"),
         ("Território", "Sudeste (SP, RJ, MG, ES)"), ("Período", "2015–2019"),
         ("Exposição", "temperatura + umidade"), ("Desenho", "DLNM"),
         ("Saída", "AF + número atribuível")],
        "Por que a curva tem duas caudas",
        "risco relativo ao longo da temperatura, com mínimo de mortalidade (MMT)",
        "",
        ["O recorte pediátrico torna explícita a vulnerabilidade biológica; a série semanal e a umidade reduzem confundimento.",
         "Fumaça e poluição entram como extensão: o desenho básico não as separa da temperatura."],
        "Arco do caso ec-01: preparação no SIM-DO, integração com temperatura e umidade, modelagem DLNM e impacto atribuível em crianças menores de 5 anos. O gráfico mostra a curva em U do risco relativo por temperatura, com mínimo de mortalidade.",
    )

    case_arc(
        "arco-ec02",
        "Caso ec-02 · arco completo",
        "Dengue, graus-dia e chuva",
        "Do SINAN à janela de ação: acúmulo térmico, defasagem vetorial e vigilância antecipada.",
        OCHRE,
        [
            ("Preparação", [("SINAN-DENGUE", 140), ("semana epidemiológica", 190),
                            ("data dos sintomas", 165)]),
            ("Integração", [("GDD · base 11 °C", 160),
                            ("chuva acumulada", 150),
                            ("estações INMET", 140)]),
            ("Modelagem", [("DLNM", 70), ("lag 0–84 dias", 130),
                           ("sazonalidade anual", 165)]),
            ("Gestão", [("janela de ação", 145), ("controle vetorial", 150),
                        ("alerta por município", 175)]),
        ],
        [("Fonte", "SINAN-DENGUE"), ("CID-10", "A90"), ("População", "casos notificados"),
         ("Território", "CE, PE, BA, MA"), ("Período", "2015–2019"),
         ("Exposição", "GDD (base 11 °C) + chuva"), ("Desenho", "DLNM"),
         ("Saída", "risco por semana e alerta")],
        "O acúmulo de calor ao longo do ciclo do vetor",
        "graus-dia de desenvolvimento (GDD) acumulados por semana",
        "",
        ["A unidade semanal preserva a dinâmica do vetor; o GDD alinha a exposição ao ciclo do mosquito.",
         "Saneamento e urbanização ajudam a separar clima de vulnerabilidade territorial."],
        "Arco do caso ec-02: preparação no SINAN-DENGUE por semana epidemiológica, integração com GDD e chuva, modelagem DLNM com defasagem longa e tradução em janela de ação para controle vetorial. O gráfico mostra o acúmulo de graus-dia e a janela de transmissão.",
    )

    case_arc(
        "arco-ec03",
        "Caso ec-03 · arco completo",
        "Idosos, cardiovascular e ondas de calor",
        "Do SIM-DO à carga atribuível: efeito agudo do calor extremo em mortalidade cardiovascular, em São Paulo.",
        CLAY,
        [
            ("Preparação", [("SIM-DO", 96), ("CID-10 capítulo I", 150),
                            ("60 anos ou mais", 148)]),
            ("Integração", [("temperatura INMET", 158),
                            ("ondas de calor", 135),
                            ("São Paulo", 100)]),
            ("Modelagem", [("DLNM", 70), ("defasagem curta", 145),
                           ("sazonalidade controlada", 190)]),
            ("Impacto", [("fração atribuível", 160),
                         ("número atribuível", 160),
                         ("plano de calor", 135)]),
        ],
        [("Fonte", "SIM-DO"), ("CID-10", "capítulo I"), ("População", "60 anos ou mais"),
         ("Território", "São Paulo (SP)"), ("Período", "2010–2019"),
         ("Exposição", "ondas de calor (INMET)"), ("Desenho", "DLNM"),
         ("Saída", "AF + número atribuível")],
        "Um evento agudo, um pico e uma dívida",
        "óbitos diários em torno de uma onda de calor",
        "",
        ["Use uma referência fixa (MMT) e compare metodologias de onda de calor antes de calcular a carga.",
         "Na Amazônia, calor úmido (WBGT ou UTCI) pode ser necessário: temperatura do ar isolada subestima o risco."],
        "Arco do caso ec-03: preparação no SIM-DO para idosos, integração com ondas de calor de São Paulo, modelagem DLNM de efeito agudo e cálculo da carga atribuível. O gráfico mostra o pico de óbitos durante a onda de calor e o déficit posterior por efeito colheita.",
    )

    case_arc(
        "arco-ec04",
        "Caso ec-04 · arco completo",
        "Hospitalizações respiratórias e frio",
        "Um desenho quase-experimental para um evento de frio delimitado em Porto Alegre, 2010–2019.",
        TEAL_D,
        [
            ("Preparação", [("SIH-RD", 96), ("J09–J18", 100),
                            ("Porto Alegre", 135)]),
            ("Integração", [("temperatura INMET", 158),
                            ("ondas de frio no Sul", 168),
                            ("série diária", 120)]),
            ("Modelo ITS", [("nível e tendência", 155),
                            ("data do evento", 140),
                            ("contrafactual", 135)]),
            ("Ação", [("leitos e alertas", 150),
                      ("contingência de frio", 175),
                      ("comunicação de risco", 178)]),
        ],
        [("Fonte", "SIH-RD"), ("CID-10", "J09–J18"), ("População", "internações"),
         ("Território", "Porto Alegre (RS)"), ("Período", "2010–2019"),
         ("Exposição", "ondas de frio (INMET)"), ("Desenho", "ITS"),
         ("Saída", "mudança de nível e tendência")],
        "O que muda depois de um evento delimitado",
        "série observada e contrafactual antes e depois da interrupção",
        "",
        ["ITS responde o que muda em um evento específico; o DLNM descreveria uma curva completa de temperatura-resposta.",
         "A data do evento precisa ser real e definida antes da análise — não escolhida depois de ver o resultado."],
        "Arco do caso ec-04: preparação no SIH-RD para pneumonias e influenza em Porto Alegre, integração com ondas de frio, modelo de série interrompida e tradução em contingência. O gráfico mostra a série observada, a tendência contrafactual e a mudança de nível após o evento.",
    )


if __name__ == "__main__":
    fig_pipeline()
    fig_integracao()
    fig_modelagem()
    fig_rap()
    fig_node()
    fig_clima()
    fig_cases()
