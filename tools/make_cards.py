#!/usr/bin/env python3
"""
make_cards.py — the finished card face for every card, one continuous line:
braided border → portrait (suit ink, weighted) → connector → a simple, text-free drawing of the idea.

    python3 tools/make_cards.py [slug ...]

Writes  assets/cards/<slug>.svg   (trimmed 63×88 mm, used by the website grid and card pages)
and     print/cards/<slug>.pdf    (with 3 mm bleed, for the printer)
Each card's idea drawing lives in tools/glyphs/<slug>.py  (see tools/GLYPH_BRIEF.md).
"""
import json, math, os, sys, importlib.util
from pathlib import Path
from xml.sax.saxutils import escape
import numpy as np

HERE = Path(__file__).resolve().parent; ROOT = HERE.parent; DATA = ROOT / "data"
sys.path.insert(0, str(HERE))
import render as R

BASE_URL = os.environ.get("BASE_URL", "https://dbbudd.github.io/Lineage/")
TW, TH, B = 63.0, 88.0, 3.0
W, H = TW + 2 * B, TH + 2 * B
PAPER, GRAPHITE = "#FBF8F2", "#3F3D39"
COL = {"Science": "#1F6F78", "Technology": "#3D4FA1", "Engineering": "#B8492A", "Mathematics": "#8E6517", "Joker": "#3F3D39"}
SERIF, SANS, MONO = "Newsreader, Lora, Georgia, serif", "Inter, Helvetica, sans-serif", "IBM Plex Mono, monospace"
STAR = "M5 1.2 L6.1 3.9 L9 4.1 L6.8 6 L7.5 8.8 L5 7.3 L2.5 8.8 L3.2 6 L1 4.1 L3.9 3.9 Z"
PIPS = json.loads((DATA / "pips.json").read_text())

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)])
def mix(a, b, k): v = hexrgb(a) + (hexrgb(b) - hexrgb(a)) * k; return "#%02x%02x%02x" % tuple(int(round(x)) for x in v)
def poly(pts): return "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts)

# ---------------------------------------------------------------- drawing kit handed to each glyph
class G:
    """Everything a glyph needs. Units are millimetres on the card (with bleed: card is 69×94, trim starts at 3)."""
    def __init__(s, box, head, r, col, ink, lw):
        s.box, s.head, s.r, s.col, s.ink, s.lw = box, np.array(head), r, col, ink, lw
        s.soft = mix(col, PAPER, 0.45); s.out = []
        s.mix, s.np, s.math = mix, np, math
    def path(s, pts, w=None, color=None, opacity=1, dash=None, close=False, fill="none"):
        d = poly(pts) + (" Z" if close else "")
        s.out.append(f'<path d="{d}" fill="{fill}" stroke="{color or s.col}" stroke-width="{(w or s.lw):.3f}" '
                     f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"' + (f' stroke-dasharray="{dash}"' if dash else "") + "/>")
    def circle(s, c, r, w=None, color=None, opacity=1, fill="none"):
        s.out.append(f'<circle cx="{c[0]:.3f}" cy="{c[1]:.3f}" r="{r:.3f}" fill="{fill}" stroke="{color or s.col}" stroke-width="{(w or s.lw):.3f}" opacity="{opacity}"/>')
    def dot(s, c, r=0.5, color=None, opacity=1):
        s.out.append(f'<circle cx="{c[0]:.3f}" cy="{c[1]:.3f}" r="{r:.3f}" fill="{color or s.col}" opacity="{opacity}"/>')
    def rect(s, x, y, w, h, sw=None, color=None, fill="none", opacity=1, rx=0):
        s.out.append(f'<rect x="{x:.3f}" y="{y:.3f}" width="{w:.3f}" height="{h:.3f}" rx="{rx}" fill="{fill}" stroke="{color or s.col}" stroke-width="{(sw or s.lw):.3f}" opacity="{opacity}"/>')
    def arrow(s, a, b, w=None, color=None, head=None, opacity=1):
        a, b = np.array(a, float), np.array(b, float); w = w or s.lw * 1.3; color = color or s.col
        s.path([a, b], w, color, opacity)
        ang = math.atan2(*(b - a)[::-1]); hl = head or max(0.9, w * 4.2)
        tri = [b + np.array([math.cos(ang), math.sin(ang)]) * w * 0.5,
               b - hl * np.array([math.cos(ang - .45), math.sin(ang - .45)]), b - hl * np.array([math.cos(ang + .45), math.sin(ang + .45)])]
        s.out.append(f'<path d="{poly(tri)} Z" fill="{color}" opacity="{opacity}"/>')
    def raw(s, svg): s.out.append(svg)

# ---------------------------------------------------------------- border (braid, one line, twice round)
def rounded_rect(x0, y0, x1, y1, r, step=0.02):
    pts = []
    corners = [((x1 - r, y0 + r), -math.pi/2, 0), ((x1 - r, y1 - r), 0, math.pi/2), ((x0 + r, y1 - r), math.pi/2, math.pi), ((x0 + r, y0 + r), math.pi, 1.5*math.pi)]
    edges = [((x0 + r, y0), (x1 - r, y0)), ((x1, y0 + r), (x1, y1 - r)), ((x1 - r, y1), (x0 + r, y1)), ((x0, y1 - r), (x0, y0 + r))]
    for (a, b), (c, t0, t1) in zip(edges, corners):
        n = max(2, int(math.hypot(b[0]-a[0], b[1]-a[1]) / step)); pts += [(a[0] + (b[0]-a[0])*i/n, a[1] + (b[1]-a[1])*i/n) for i in range(n)]
        m = max(2, int(r * (t1 - t0) / step)); pts += [(c[0] + r*math.cos(t0 + (t1-t0)*i/m), c[1] + r*math.sin(t0 + (t1-t0)*i/m)) for i in range(m)]
    return np.array(pts)

def braid(start_pt, inset=1.7, r=2.6, wl=2.6, amp=0.55):
    base = rounded_rect(B + inset, B + inset, W - B - inset, H - B - inset, r)
    dist = np.hypot(*(base - start_pt).T)
    dist[(base[:, 1] > B + 66) | (base[:, 1] < B + 16)] = 1e9          # join on a side edge, clear of indices and name block
    i0 = int(np.argmin(dist)); base = np.vstack([base[i0:], base[:i0], base[i0:i0+1]])
    sa = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(base, axis=0).T))]); L = sa[-1]
    n = round(L / wl) + 0.5
    u = np.linspace(0, 2 * L, int(2 * L / 0.16)); uu = u % L
    bx, by = np.interp(uu, sa, base[:, 0]), np.interp(uu, sa, base[:, 1])
    tg = np.gradient(np.column_stack([bx, by]), axis=0); tg /= np.linalg.norm(tg, axis=1, keepdims=True) + 1e-9
    ease = np.clip(np.minimum(u, 2 * L - u) / 2.5, 0, 1)
    off = 0.55 * ease * np.sin(2 * math.pi * n * u / L) * (amp / 0.55)
    return np.column_stack([bx + tg[:, 1] * off, by - tg[:, 0] * off])

# ---------------------------------------------------------------- text as outlines (cards render identically everywhere)
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
_FONTS = {}
def _font(name):
    if name not in _FONTS:
        f = TTFont(HERE / "fonts" / name); _FONTS[name] = (f, f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm, f["hmtx"])
    return _FONTS[name]
def text_path(txt, font, size, x, y, color, anchor="middle", spacing=0.0, opacity=1, max_w=37.0):
    f, gs, cmap, upm, hmtx = _font(font)
    names = [cmap.get(ord(ch)) or cmap.get(ord("?")) for ch in txt]
    nat = sum(hmtx[n][0] for n in names) * size / upm + spacing * (len(names) - 1)
    if nat > max_w: shrink = max_w / nat; size *= shrink; spacing *= shrink     # fit between the QR code and the index
    k = size / upm
    adv = [hmtx[n][0] * k + spacing for n in names]; total = sum(adv) - spacing
    cx = x - (total / 2 if anchor == "middle" else total if anchor == "end" else 0)
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, cx, y))); cx += a
    return f'<path d="{pen.getCommands()}" fill="{color}" opacity="{opacity}"/>'
SER_I, SER_B, SANS_R = "NewsreaderItalic.ttf", "NewsreaderSemi.ttf", "Inter.ttf"

def corner_index(rank, suit, color):
    x0, y0 = B + 3.4, B + 3.0
    d = STAR if suit == "Joker" else PIPS[suit]
    lab = "★" if rank == "Joker" else rank
    if lab == "★":
        t = f'<g transform="translate({x0:.2f},{y0+0.6:.2f}) scale(0.5)"><path d="{STAR}" fill="{color}"/></g>'
    else:
        t = text_path(lab, SER_B, 5.4 if len(lab) > 1 else 6.4, x0 + 2.4, y0 + 5.2, color)
    return (t +
            f'<g transform="translate({x0:.2f},{y0+6.6:.2f}) scale(0.48)"><path d="{d}" fill="none" stroke="{color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></g>')

def qr_path(url, x, y, size, color):
    import qrcode
    q = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M); q.add_data(url); q.make()
    m = q.get_matrix(); n = len(m); c = size / n
    d = "".join(f'M{x+i*c:.3f},{y+j*c:.3f}h{c:.3f}v{c:.3f}h-{c:.3f}z' for j, row in enumerate(m) for i, on in enumerate(row) if on)
    return f'<path d="{d}" fill="{color}"/>'

def load_line(slug):
    p = DATA / "lines" / f"{slug}.js"
    if not p.exists(): return None
    return json.loads(p.read_text().split("=", 1)[1].rstrip().rstrip(";"))

def load_glyph(slug):
    p = HERE / "glyphs" / f"{slug}.py"
    if not p.exists(): return None
    spec = importlib.util.spec_from_file_location(f"glyph_{slug}", p); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

# ---------------------------------------------------------------- one card
def card_svg(c, trimmed=True):
    col = COL[c["suit"]]; ink = mix(col, GRAPHITE, 0.18); lw = 0.30
    LN = load_line(c["slug"])
    ax0, ax1, ay1 = B + 5.0, W - B - 5.0, B + 70.5
    asp = LN["aspect"] if LN else 1.25
    big = LN.get("fill", 0.80) if LN else 0.80                     # wide busts can fill the card edge to edge
    s = min((ax1 - ax0) * big, (ay1 - (B + 14)) / asp)
    x0 = ax0 - 1.0 - (ax1 - ax0) * max(0, big - 0.85) * 0.5; y0 = ay1 - asp * s
    head = (x0 + 0.47 * s, y0 + 0.20 * s); r = 0.20 * s
    box = (x0 + s * 0.62, B + 7.5, ax1 + 0.5 - (x0 + s * 0.62), 22.0)       # idea area, top right
    body = []
    if LN:
        P = np.array(LN["pts"]).reshape(-1, 2); pts = np.column_stack([x0 + P[:, 0] * s, y0 + P[:, 1] * s])
        wv = np.array(LN["w"])
        xf = lambda q: np.column_stack([x0 + q[:, 0] * s, y0 + q[:, 1] * s])
        wash = [np.array(a).reshape(-1, 2) for a in LN.get("wash", [])]
        if wash:
            body.append(f'<path d="{"".join(poly(xf(q)) + "Z" for q in wash)}" fill="{col}" opacity="0.12" transform="translate(0.45,0.3)"/>')
        keep = slice(None, None, 2)                     # every other point is plenty at card size
        body.append(R.weighted_line(pts[keep], wv[keep], 0.36, ink))
    else:
        t = np.linspace(0, 1, 120); pts = np.column_stack([x0 + s * (0.15 + 0.6 * t), y0 + asp * s * (0.75 - 0.1 * np.sin(t * 7))])
        body.append(f'<path d="{poly(pts)}" fill="none" stroke="{ink}" stroke-width="{lw}"/>')
    # border flows into the first stroke of the portrait
    BL = braid(pts[0]); join = BL[-1]
    ctrl = join + (pts[0] - join) * 0.5 + np.array([1.0, 1.0]); u = np.linspace(0, 1, 30)[:, None]
    tail = (1-u)**2 * join + 2*(1-u)*u * ctrl + u**2 * pts[0]
    frame = [f'<path d="{poly(BL)}" fill="none" stroke="{col}" stroke-width="0.2" stroke-linecap="round" stroke-linejoin="round"/>']
    frame += [f'<path d="{poly(tail[i-1:i+1])}" stroke="{mix(col, ink, i/len(tail))}" stroke-width="{0.2 - 0.04*i/len(tail):.3f}" stroke-linecap="round"/>' for i in range(1, len(tail))]
    frame.append(f'<circle cx="{BL[0][0]:.3f}" cy="{BL[0][1]:.3f}" r="0.6" fill="{col}"/>')
    # idea drawing
    gm = load_glyph(c["slug"]); idea = []
    if gm:
        g = G(box, head, r, col, ink, lw)
        entry = gm.glyph(g)
        if entry is not None:
            e = pts[-1]; entry = np.array(entry, float)
            mid = (e + entry) / 2; ctl = mid + np.array([0, -abs(entry[0] - e[0]) * 0.18])
            cn = (1-u)**2 * e + 2*(1-u)*u * ctl + u**2 * entry
            idea += [f'<path d="{poly(cn[i-1:i+1])}" stroke="{mix(ink, col, i/len(cn))}" stroke-width="{lw}" stroke-linecap="round"/>' for i in range(1, len(cn))]
        idea += g.out
    cx = W / 2; name = escape(c["name"]); fs = 4.3 if len(c["name"]) <= 16 else (3.7 if len(c["name"]) <= 20 else 3.2)
    years = escape(c["years"]); field = escape(c["field"].upper())
    text = [corner_index(c["rank"], c["suit"], col), f'<g transform="rotate(180 {W/2} {H/2})">{corner_index(c["rank"], c["suit"], col)}</g>',
            f'<line x1="{cx-6}" y1="{B+72.4}" x2="{cx+6}" y2="{B+72.4}" stroke="{col}" stroke-width="0.25"/>',
            text_path(c["name"], SER_I, fs, cx + 2, B + 77.0, GRAPHITE),
            text_path(c["field"].upper(), SANS_R, 1.6 if len(c["field"]) < 30 else 1.35, cx + 2, B + 80.4, col, spacing=0.22),
            text_path(c["years"], SER_I, 1.9, cx + 2, B + 83.2, GRAPHITE, opacity=0.75),
            qr_path(f'{BASE_URL}cards/{c["slug"]}/', B + 4.2, B + 73.6, 9.0, GRAPHITE)]
    vb = f"{B} {B} {TW} {TH}" if trimmed else f"0 0 {W} {H}"
    size = 'width="630" height="880" preserveAspectRatio="xMidYMid meet"' if trimmed else f'width="{W}mm" height="{H}mm"'
    bg = f'<rect x="0" y="0" width="{W}" height="{H}" fill="{PAPER}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" {size} viewBox="{vb}" role="img" aria-label="{name} card">'
            + bg + "".join(body) + "".join(frame) + "".join(idea) + "".join(text) + "</svg>")

if __name__ == "__main__":
    import cairosvg
    deck = []
    for f in ["science", "technology", "engineering", "mathematics", "jokers"]:
        deck += json.loads((DATA / f"{f}.json").read_text())
    only = set(sys.argv[1:]); (ROOT / "assets" / "cards").mkdir(parents=True, exist_ok=True); (ROOT / "print" / "cards").mkdir(parents=True, exist_ok=True)
    for c in deck:
        if only and c["slug"] not in only: continue
        (ROOT / "assets" / "cards" / f'{c["slug"]}.svg').write_text(card_svg(c, True))
        full = card_svg(c, False)
        cairosvg.svg2pdf(bytestring=full.encode(), write_to=str(ROOT / "print" / "cards" / f'{c["slug"]}.pdf'))
        if os.environ.get("PNG"):
            (HERE / "out" / "cards").mkdir(parents=True, exist_ok=True)
            cairosvg.svg2png(bytestring=card_svg(c, True).encode(), write_to=str(HERE / "out" / "cards" / f'{c["slug"]}.png'), output_width=756)
        print("card", c["slug"], "(glyph)" if (HERE / "glyphs" / f'{c["slug"]}.py').exists() else "(no glyph yet)")
