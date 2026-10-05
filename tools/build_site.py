#!/usr/bin/env python3
"""
build_site.py — generate the Lineage static site from data/*.json (no dependencies).

    python3 tools/build_site.py                 # writes index.html + cards/<slug>/index.html
    BASE_URL=https://example.org/ python3 tools/build_site.py

BASE_URL is the public address the QR codes point to (default: GitHub Pages for this repo).
Every card page lives at  BASE_URL + "cards/<slug>/".
"""
import json, os, math, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BASE_URL = os.environ.get("BASE_URL", "https://dbbudd.github.io/Lineage/")
SUITS = ["Science", "Technology", "Engineering", "Mathematics"]
RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"]
COL = {"Science": "#1F6F78", "Technology": "#3D4FA1", "Engineering": "#B8492A", "Mathematics": "#8E6517", "Joker": "#3F3D39"}
BLURB = {
    "Science": "The people who asked how nature works and proved it, from light and gravity to neurons and genes.",
    "Technology": "The people who taught machines to compute, communicate and, eventually, to learn.",
    "Engineering": "The people who built the engines, chips and networks that everything else runs on.",
    "Mathematics": "The people who found the patterns underneath: algorithms, probability, symmetry and proof.",
    "Joker": "Brilliant, influential and divisive. Wild cards play by their own rules.",
}
LIVE = {"tesla": "../../live/tesla.html"}
STAR = "M5 1.2 L6.1 3.9 L9 4.1 L6.8 6 L7.5 8.8 L5 7.3 L2.5 8.8 L3.2 6 L1 4.1 L3.9 3.9 Z"

PIPS = json.loads((DATA / "pips.json").read_text())
LINES = json.loads((DATA / "portraits_lines.json").read_text())
DECK = []
for f in ["science", "technology", "engineering", "mathematics", "jokers"]:
    DECK += json.loads((DATA / f"{f}.json").read_text())
for c in DECK:   # per-card live text (story steps, thesis, hint) may live in data/live/<slug>.json
    lp = DATA / "live" / f'{c["slug"]}.json'
    if lp.exists(): c["live"] = json.loads(lp.read_text())
BY = {c["slug"]: c for c in DECK}

e = lambda s: html.escape(str(s or ""), quote=True)
def in_suit(s): return sorted([c for c in DECK if c["suit"] == s], key=lambda c: RANKS.index(c["rank"]) if c["rank"] in RANKS else 0)
def rank_label(c): return "★" if c["rank"] == "Joker" else c["rank"]
def rank_name(c): return "Joker" if c["rank"] == "Joker" else f'{c["rank"]} of {c["suit"]}'
def initials(n):
    w = [x for x in n.replace("Sir ", "").split() if x[:1].isupper()]
    return "".join(x[0] for x in w[:2])
def pip(suit, size=14, sw=1.1):
    d = STAR if suit == "Joker" else PIPS[suit]
    return f'<svg class="pip" width="{size}" height="{size}" viewBox="0 0 10 10" aria-hidden="true"><path d="{d}" stroke-width="{sw}"/></svg>'

def line_d(slug, x0=0, y0=0, s=1, prec=3):
    p = LINES[slug]["p"]
    return "M" + " ".join(f"{x0 + p[i]*s:.{prec}f},{y0 + p[i+1]*s:.{prec}f}" for i in range(0, len(p), 2))

def portrait_svg(slug, sw=0.006, color="#3F3D39"):
    a = LINES[slug]["a"]
    return (f'<svg viewBox="0 0 1 {a}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">'
            f'<path d="{line_d(slug)}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def back_path(w, h, turns=6, n=2400):
    pts = []
    for i in range(n + 1):
        k = i / n; t = k * math.pi * 2 * turns
        A, ph = 1 - 0.42 * k, k * math.pi * 0.9
        pts.append(f"{w/2 + A*math.sin(3*t + ph)*w*0.34:.1f},{h/2 + A*math.sin(5*t)*h*0.33:.1f}")
    return "M" + "L".join(pts)

def back_svg():
    w, h = 630, 880
    dots = "".join(f'<circle cx="{w/2 - 39 + i*26}" cy="{h/2}" r="6" fill="{COL[s]}"/>' for i, s in enumerate(SUITS))
    word = 'fill="#F1EDE4" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="38" text-anchor="middle"'
    return (f'<svg class="cardsvg" viewBox="0 0 {w} {h}" role="img" aria-label="Card back: one continuous line on dark graphite">'
            f'<rect width="{w}" height="{h}" fill="#2D2B28"/>'
            f'<rect x="26" y="26" width="{w-52}" height="{h-52}" rx="20" fill="none" stroke="#F1EDE4" stroke-opacity=".35" stroke-width="1.5"/>'
            f'<path d="{back_path(w, h)}" fill="none" stroke="#F1EDE4" stroke-opacity=".9" stroke-width="1.6" stroke-linejoin="round"/>{dots}'
            f'<text x="{w/2}" y="82" {word}>Lineage</text>'
            f'<text x="{w/2}" y="{h-62}" {word} transform="rotate(180 {w/2} {h-75})">Lineage</text></svg>')
BACK_SVG = back_svg()
def back_img(prefix): return f'<img class="cardsvg" src="{prefix}assets/card-back.svg" alt="Card back: one continuous line on dark graphite">'

def braid_border(w, h, start, inset=20, r=26, wl=26, amp=5.5, step=2.0):
    """Card-face border: one line that goes round twice half a wave out of step (a braid),
    starting and ending at the point nearest the portrait's first stroke."""
    import numpy as np
    x0, y0, x1, y1 = inset, inset, w - inset, h - inset
    base = []
    def seg(a, b): n = max(2, int(math.hypot(b[0]-a[0], b[1]-a[1]) / step)); return [(a[0]+(b[0]-a[0])*i/n, a[1]+(b[1]-a[1])*i/n) for i in range(n)]
    def arc(cx, cy, t0, t1): n = max(2, int(r*abs(t1-t0)/step)); return [(cx+r*math.cos(t0+(t1-t0)*i/n), cy+r*math.sin(t0+(t1-t0)*i/n)) for i in range(n)]
    base += seg((x0+r, y0), (x1-r, y0)) + arc(x1-r, y0+r, -math.pi/2, 0) + seg((x1, y0+r), (x1, y1-r)) + arc(x1-r, y1-r, 0, math.pi/2)
    base += seg((x1-r, y1), (x0+r, y1)) + arc(x0+r, y1-r, math.pi/2, math.pi) + seg((x0, y1-r), (x0, y0+r)) + arc(x0+r, y0+r, math.pi, 1.5*math.pi)
    B = np.array(base)
    dist = np.hypot(*(B - np.array(start)).T)
    dist[(B[:, 1] > 660) | (B[:, 1] < 150)] = 1e9          # join on a side edge, clear of the indices and the name block
    i0 = int(np.argmin(dist)); B = np.vstack([B[i0:], B[:i0], B[i0:i0+1]])
    sa = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(B, axis=0).T))]); L = sa[-1]
    n = round(L / wl) + 0.5
    u = np.linspace(0, 2*L, int(2*L/step)); uu = u % L
    bx, by = np.interp(uu, sa, B[:, 0]), np.interp(uu, sa, B[:, 1])
    tg = np.gradient(np.column_stack([bx, by]), axis=0); tg /= np.linalg.norm(tg, axis=1, keepdims=True) + 1e-9
    ease = np.clip(np.minimum(u, 2*L - u) / 25, 0, 1)
    off = amp * ease * np.sin(2*math.pi*n*u/L)
    P = np.column_stack([bx + tg[:, 1]*off, by - tg[:, 0]*off])
    return "M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in P), (P[-1][0], P[-1][1])

def face_svg(c):
    col, w, h = COL[c["suit"]], 630, 880
    if c["slug"] in LINES:
        a = LINES[c["slug"]]["a"]; s = min(470, 560 / a)
        art = (f'<path d="{line_d(c["slug"], (w - s)/2, 650 - s*a, s, 1)}" fill="none" stroke="{col}" '
               f'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')
    else:
        art = (f'<text x="{w/2}" y="430" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-weight="300" '
               f'font-size="210" fill="{col}" fill-opacity=".22">{e(initials(c["name"]))}</text>'
               f'<text x="{w/2}" y="520" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="17" letter-spacing="3" fill="#7E7A72">PORTRAIT IN PROGRESS</text>')
    d = STAR if c["suit"] == "Joker" else PIPS[c["suit"]]
    idx = (f'<g fill="{col}" stroke="{col}"><text x="58" y="98" font-family="Newsreader, Georgia, serif" font-weight="600" font-size="62" '
           f'text-anchor="middle" stroke="none">{rank_label(c)}</text><g transform="translate(36,112) scale(4.4)">'
           f'<path d="{d}" fill="none" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></g></g>')
    fs = 36 if len(c["name"]) > 18 else 44
    if c["slug"] in LINES:
        p0 = (float(line_d(c["slug"], (w - s)/2, 650 - s*a, s, 1)[1:].split(" ")[0].split(",")[0]),
              float(line_d(c["slug"], (w - s)/2, 650 - s*a, s, 1)[1:].split(" ")[0].split(",")[1]))
    else:
        p0 = (w/2, 430)
    bd, bj = braid_border(w, h, p0)
    tail = f'M{bj[0]:.1f},{bj[1]:.1f} Q{(bj[0]+p0[0])/2:.1f},{(bj[1]+p0[1])/2+12:.1f} {p0[0]:.1f},{p0[1]:.1f}' if c["slug"] in LINES else ""
    frame = (f'<path d="{bd}" fill="none" stroke="{col}" stroke-width="1.8" stroke-linejoin="round"/>'
             + (f'<path d="{tail}" fill="none" stroke="{col}" stroke-width="1.6" stroke-linecap="round"/>' if tail else "")
             + f'<circle cx="{bj[0]:.1f}" cy="{bj[1]:.1f}" r="5" fill="{col}"/>')
    return (f'<svg class="cardsvg" viewBox="0 0 {w} {h}" role="img" aria-label="{e(c["name"])} card face">'
            f'<rect width="{w}" height="{h}" fill="#FBF8F2"/>'
            f'{frame}'
            f'{art}{idx}<g transform="rotate(180 {w/2} {h/2})">{idx}</g>'
            f'<line x1="{w/2-60}" y1="694" x2="{w/2+60}" y2="694" stroke="{col}" stroke-width="2.4"/>'
            f'<text x="{w/2}" y="748" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="{fs}" fill="#3F3D39">{e(c["name"])}</text>'
            f'<text x="{w/2}" y="784" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" letter-spacing="3" fill="{col}">{e(c["field"].upper()[:34])}</text>'
            f'<text x="{w/2}" y="814" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-size="19" fill="#7E7A72">{e(c["years"])}</text></svg>')

def mini(c, prefix):
    label = f'<div><div class="nm">{e(c["name"])}</div><div class="yr">{e(c["years"])}</div></div></a>'
    head = f'<a class="mini c-{c["suit"]}" href="{prefix}cards/{c["slug"]}/" aria-label="{e(c["name"])}, {rank_name(c)}">'
    if (ROOT / "assets" / "cards" / f'{c["slug"]}.svg').exists():
        face = f'<div class="face-s card-img"><img src="{prefix}assets/cards/{c["slug"]}.svg?v={vcard(c["slug"])}" alt="" loading="lazy" decoding="async"></div>'
    else:
        art = portrait_svg(c["slug"], 0.006, COL[c["suit"]]) if c["slug"] in LINES else f'<span class="ini">{e(initials(c["name"]))}</span>'
        ix = f'{rank_label(c)}{pip(c["suit"], 13, 1.45)}'
        face = f'<div class="face-s"><span class="idx">{ix}</span><span class="idx r">{ix}</span><div class="art">{art}</div></div>'
    return head + face + label

def page(title, desc, body, prefix, url, scripts=""):
    nav = "".join(f'<a class="c-{s}" href="{prefix}index.html#{s.lower()}">{pip(s, 14, 1.4)}{s}</a>' for s in SUITS)
    nav += f'<a class="c-Joker" href="{prefix}index.html#wildcards">{pip("Joker", 14, 1.4)}Wild</a><a href="{prefix}index.html#about">About</a>'
    return f"""<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta name="theme-color" content="#F1EDE4">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{prefix}assets/lineage.css?v={ver("assets/lineage.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="mast"><div class="wrap">
  <a class="mark" href="{prefix}index.html"><b>Lineage</b><span>a STEM deck</span></a>
  <nav class="suits" aria-label="Suits">{nav}</nav>
</div></div>
<main class="wrap" id="main">
{body}
</main>
<script src="{prefix}assets/lineage.js"></script>
{scripts}</body>
</html>
"""

import hashlib
def ver(rel):
    """short content hash, appended as ?v= so browsers fetch a fresh copy whenever a file changes"""
    f = ROOT / rel
    return hashlib.md5(f.read_bytes()).hexdigest()[:8] if f.exists() else "0"
def vcard(slug): return ver("assets/cards/" + slug + ".svg")
def vline(slug): return ver("data/lines/" + slug + ".js")
def vscene(slug): return ver("assets/scenes/" + slug + ".js")

def card_img(c, prefix):
    if (ROOT / "assets" / "cards" / f'{c["slug"]}.svg').exists():
        return f'<img class="cardsvg" src="{prefix}assets/cards/{c["slug"]}.svg?v={vcard(c["slug"])}" alt="{e(c["name"])} card face">'
    return face_svg(c)

def flip(c, hint=True, ry=None, prefix=""):
    style = ' style="width:100%"' if ry is not None else ""
    inner = f' style="--ry:{ry}"' if ry is not None else ""
    return (f'<div class="flip" data-flip{style}><button type="button" aria-label="Flip the card">'
            f'<div class="inner"{inner}><div class="face">{card_img(c, prefix)}</div><div class="back-face">{back_img(prefix)}</div></div></button>'
            + ('<div class="flip-hint">Tap to flip</div>' if hint else "") + "</div>")

def build_index():
    t = BY["tesla"]
    suits = "".join(f"""
<section class="suit c-{s}" id="{s.lower()}">
  <div class="suit-head"><div class="t">{pip(s, 34, 1.0)}<h2 style="color:var(--ink)">{s}</h2></div><p>{BLURB[s]}</p></div>
  <div class="grid">{"".join(mini(c, "") for c in in_suit(s))}</div>
</section>""" for s in SUITS)
    tabs = "".join(f'<a class="c-{s}" href="#{s.lower()}">{pip(s, 14, 1.4)}{s}</a>' for s in SUITS)
    tabs += f'<a class="c-Joker" href="#wildcards">{pip("Joker", 14, 1.4)}Wild</a>'
    body = f"""
<section class="hero" id="top">
  <div class="copy">
    <div class="eyebrow">52 cards + 2 wild cards · 4 suits · 1 continuous line each</div>
    <h1>Fifty-two minds.<br><em>One unbroken line.</em></h1>
    <p class="lede">Every card in Lineage is a portrait drawn without lifting the pen. The line leaves the person, becomes their idea, and runs on toward the artificial intelligence we use today.</p>
    <div class="scan"><i aria-hidden="true"></i>Scan the code on any card to land on its page.</div>
    <nav class="suit-tabs" aria-label="Explore the suits">{tabs}</nav>
  </div>
  <div class="hero-back">{back_img("")}</div>
</section>

<section class="reads">
  <div class="eyebrow">How to read a card</div>
  <ol>
    <li><h3>The person</h3><p>A single line traces the portrait. Heavier strokes sit in shadow, hairlines show where the pen travelled.</p></li>
    <li><h3>The idea</h3><p>Without a break, the line becomes their contribution, drawn precisely: a wave, a curve, a graph, a proof.</p></li>
    <li><h3>The line to AI</h3><p>Then it runs to the horizon in the suit's colour, ending at the piece of modern AI that grew from it.</p></li>
  </ol>
</section>

<section class="concept" id="concept">
  <div class="col">
    <div class="eyebrow">The idea behind the deck</div>
    <h2>Nobody builds alone.</h2>
    <p>Today's AI did not appear from nowhere. Large language models run on Turing's universal machine, learn with Leibniz's chain rule and Gauss's least squares, predict the next word the way Markov counted letters in a poem, and run on chips descended from Kilby's integrated circuit.</p>
    <p>Lineage makes that inheritance visible. Each portrait is drawn as one continuous line that flows into the person's idea and then onward, so the whole deck reads like a family tree of thought.</p>
  </div>
  <div class="col">
    <div class="eyebrow">Influences</div>
    <p>The line drawings take their lead from Matisse, Klee, Schiele, Al Hirschfeld, Alewya, Tyler Foust and Shantell Martin. The precise, moving diagrams of ideas owe a debt to 3Blue1Brown. The quiet palette and the invitation to remix come from Rick Rubin's <a href="https://www.thewayofcode.com/" target="_blank" rel="noopener">The Way of Code</a>.</p>
    <p>Ranks run by impact within each suit, from Ace down to 2. Impact is a judgement, not a fact, and that is a good argument to have in class.</p>
  </div>
</section>
{suits}
<section class="suit wild c-Joker" id="wildcards">
  <div class="suit-head"><div class="t">{pip("Joker", 34, 1.0)}<h2>Wild cards</h2></div><p>{BLURB["Joker"]}</p></div>
  <div class="grid">{"".join(mini(c, "") for c in in_suit("Joker"))}</div>
</section>

<section class="about" id="about">
  <div class="col">
    <div class="eyebrow">The back of every card</div>
    <div class="backshow"><div class="bk">{back_img("")}</div>
      <div style="display:grid;gap:12px"><h2>The same line, every time.</h2>
      <p>The back is a single curve that never lifts: a slowly turning Lissajous figure, the shape traced when two waves meet. It reads the same both ways up. The four dots are the suit colours.</p></div></div>
  </div>
  <div class="col">
    <div class="eyebrow">How the portraits are made</div>
    <p>Each portrait starts from a photograph. Code finds the features that matter, keeps fine detail in the face and only bold gestures elsewhere, then routes the pen between strokes along lines it has already drawn, so the drawing is one continuous path.</p>
    <p>Line weight follows the photo's shadows, and zig-zag hatching in the darkest areas is part of the same line. The generator lives in the <code>tools</code> folder of this project.</p>
    <p class="note">Every card page is live: the portrait draws itself, then flows into an interactive drawing of that person's own work that you can remix, with the code beside it. Portraits are generated from public-domain or Creative Commons photographs and are being refined card by card.</p>
  </div>
</section>
<footer class="site"><span>Lineage · a STEM deck for curious students</span><span>Content checked against public sources, October 2026.</span></footer>"""
    (ROOT / "index.html").write_text(page("Lineage · a STEM deck", "52 STEM contributors drawn as single continuous lines that flow from each person, into their idea, and on toward modern AI.", body, "", BASE_URL))

def build_card(c):
    lst = in_suit(c["suit"]); i = lst.index(c)
    prev, nxt = (lst[i-1] if i > 0 else None), (lst[i+1] if i < len(lst)-1 else None)
    anchor = "wildcards" if c["suit"] == "Joker" else c["suit"].lower()
    suitname = "Wild cards" if c["suit"] == "Joker" else c["suit"]
    url = f"{BASE_URL}cards/{c['slug']}/"
    srcs = "".join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["title"])}</a></li>' for s in c.get("sources", []))
    pg = lambda x, cls, arrow_first: (f'<a class="{cls}" href="../{x["slug"]}/"><span>{"← " if arrow_first else ""}{"Joker" if x["rank"]=="Joker" else x["rank"]}{"" if arrow_first else " →"}</span><b>{e(x["name"])}</b></a>') if x else "<span></span>"
    has_scene = (ROOT / "assets" / "scenes" / f'{c["slug"]}.js').exists()
    lv = c.get("live", {})
    steps = lv.get("story", [])
    live_html = ""
    if has_scene:
        story = "".join(f'<li><div class="yr">{e(st.get("tag",""))}</div><div><h3>{e(st.get("title",""))}</h3><p>{e(st.get("text",""))}</p></div></li>' for st in steps)
        live_html = f"""
<section class="lv c-{c["suit"]}" data-live aria-label="Animated drawing of {e(c["name"])}'s work">
  <header class="lv-head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="../../index.html">Lineage</a><span>/</span><a href="../../index.html#{anchor}">{suitname}</a><span>/</span><span>{rank_name(c)}</span></nav>
    <h1>{e(c["name"])}</h1>
    <p class="lv-thesis">{e(lv.get("thesis") or c["known_for"] + ".")}</p>
  </header>
  <div class="lv-stage"><canvas width="1120" height="680"></canvas></div>
  <div class="lv-bar"><div class="lv-readout" data-readout aria-live="polite"></div>
    <div class="lv-btns" data-buttons><button type="button" data-pause>Pause</button><button type="button" data-again>Draw again</button></div></div>
  <div class="lv-row">
    <section><h2 class="lv-h">Where the line goes</h2><ol class="lv-story" data-story>{story}</ol></section>
    <section class="lv-bench"><h2 class="lv-h">Remix the line</h2><div class="lv-ctrls" data-controls></div>
      <pre class="lv-code" data-code aria-label="Live code"></pre>
      {f'<p class="lv-hint">{e(lv.get("hint"))}</p>' if lv.get("hint") else ""}</section>
  </div>
</section>"""
    head_html = "" if has_scene else f"""<nav class="crumbs" aria-label="Breadcrumb"><a href="../../index.html">Lineage</a><span>/</span><a href="../../index.html#{anchor}">{suitname}</a><span>/</span><span>{rank_name(c)}</span></nav>
      <h1>{e(c["name"])}</h1>"""
    body = f"""{live_html}
<article class="detail c-{c["suit"]}{' after-live' if has_scene else ''}">
  <div class="hold">{flip(c, True, "0deg", "../../")}</div>
  <div class="story">
    <header>
      {head_html}
      <div class="facts"><span><b>{e(c["years"])}</b></span><span>Born {e(c["born"])}</span><span>{e(c["field"])}</span></div>
    </header>
    <p class="known">{e(c["known_for"])}.</p>
    {f'<p class="wild-tag">{e(c["wild_card"])}</p>' if c.get("wild_card") else ""}
    <section class="sec"><h2>The person</h2><p>{e(c["bio"])}</p></section>
    {f'<section class="sec"><h2>Why they divide opinion</h2><p>{e(c["controversies"])}</p></section>' if c.get("controversies") else ""}
    <section class="sec"><h2>The big idea</h2><p>{e(c["big_idea"])}</p></section>
    <section class="sec ai"><h2>The line to AI</h2><p>{e(c["line_to_ai"])}</p></section>
    <section class="sec oncard"><h2>On the card</h2><p>{e(c["line_becomes"])}</p></section>
    <div class="think"><span class="eyebrow">Think about</span><p>{e(c["think_about"])}</p></div>
    <section class="sec"><h2>Read more</h2><ul class="src">{srcs}</ul></section>
    <div class="linkbox"><span>Card link for the QR code</span><code data-url>{e(url)}</code><button class="pill" type="button" data-copy>Copy</button></div>
    <nav class="pager" aria-label="More in this suit">{pg(prev, "", True)}{pg(nxt, "next", False)}</nav>
  </div>
</article>
<footer class="site"><a href="../../index.html">← All cards</a><span>Lineage · a STEM deck</span></footer>"""
    scripts = ""
    if has_scene:
        if (DATA / "lines" / f'{c["slug"]}.js').exists():
            scripts += f'<script src="../../data/lines/{c["slug"]}.js?v={vline(c["slug"])}"></script>\n'
        scripts += f'<script src="../../assets/live.js"></script>\n<script src="../../assets/scenes/{c["slug"]}.js?v={vscene(c["slug"])}"></script>\n'
    out = ROOT / "cards" / c["slug"]; out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(page(f'{c["name"]} · Lineage', f'{rank_name(c)}: {c["known_for"]}', body, "../../", url, scripts))

def build_live():
    # the old stand-alone Tesla page now lives on the card page itself
    (ROOT / "live").mkdir(exist_ok=True)
    (ROOT / "live" / "tesla.html").write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=../cards/tesla/"><a href="../cards/tesla/">Tesla</a>')

if __name__ == "__main__":
    import sys
    only = sys.argv[1:]
    (ROOT / "assets" / "card-back.svg").write_text(BACK_SVG.replace('<svg class="cardsvg" ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1))
    if only:
        for c in DECK:
            if c["slug"] in only: build_card(c)
        print("built", ", ".join(only))
    else:
        build_index()
        for c in DECK: build_card(c)
        build_live()
        print(f"built index.html, {len(DECK)} card pages  (QR base: {BASE_URL})")
