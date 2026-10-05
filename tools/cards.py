"""
cards.py — lay out STEM playing cards around the continuous-line portraits.

Card: standard poker 63 x 88 mm, 3 mm bleed (69 x 94 mm artboard), 3 mm safe margin.
Outputs per card: SVG + PDF (bleed included), plus a merged print PDF and a PNG preview sheet.

    python3 cards.py            # uses portraits.json + deck.json
"""
import json, math, os, subprocess
from xml.sax.saxutils import escape
import numpy as np
import cairosvg
from linegen import portrait_path

TRIM_W, TRIM_H, BLEED = 63.0, 88.0, 3.0
W, H = TRIM_W + 2*BLEED, TRIM_H + 2*BLEED
PAPER, INK = "#F5EFE3", "#1D1C1A"
SUITS = {
    "Science":     {"color": "#1F6F78", "label": "SCIENCE"},
    "Technology":  {"color": "#3D4FA1", "label": "TECHNOLOGY"},
    "Engineering": {"color": "#C2502C", "label": "ENGINEERING"},
    "Mathematics": {"color": "#A97A1E", "label": "MATHEMATICS"},
}
SERIF, SANS = "Lora", "Inter"

# ---------------------------------------------------------------- suit pips (each one line, 10x10 box)
def _poly(pts, close=False):
    d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts)
    return d + (" Z" if close else "")

def pip_path(suit):
    if suit == "Science":       # atom: three orbits drawn as one looping line + nucleus
        pts = []
        for k in range(3):
            a = math.radians(60*k)
            for t in np.linspace(0, 2*math.pi, 60):
                x, y = 4.6*math.cos(t), 1.7*math.sin(t)
                pts.append((5 + x*math.cos(a) - y*math.sin(a), 5 + x*math.sin(a) + y*math.cos(a)))
        return _poly(pts) + " M5.9,5 A0.9,0.9 0 1 1 4.1,5 A0.9,0.9 0 1 1 5.9,5"
    if suit == "Technology":    # microchip
        d = "M2.6,2.6 H7.4 V7.4 H2.6 Z M4,4 H6 V6 H4 Z"
        for p in (3.7, 5, 6.3):
            d += f" M{p},2.6 V1 M{p},7.4 V9 M2.6,{p} H1 M7.4,{p} H9"
        return d
    if suit == "Engineering":   # gear
        pts, n = [], 8
        for i in range(n*4):
            ang = 2*math.pi*i/(n*4)
            r = 4.6 if (i % 4) in (1, 2) else 3.5
            pts.append((5 + r*math.cos(ang), 5 + r*math.sin(ang)))
        return _poly(pts, True) + " M6.4,5 A1.4,1.4 0 1 1 3.6,5 A1.4,1.4 0 1 1 6.4,5"
    if suit == "Mathematics":   # lemniscate — infinity in a single unbroken stroke
        pts = []
        for t in np.linspace(0, 2*math.pi, 120):
            s = 1 + math.sin(t)**2
            pts.append((5 + 4.6*math.cos(t)/s, 5 + 4.6*math.sin(t)*math.cos(t)/s))
        return _poly(pts, True)
    raise KeyError(suit)

def pip(suit, x, y, size, color, sw=0.9, rotate=0):
    s = size/10
    return (f'<g transform="translate({x:.2f},{y:.2f}) rotate({rotate}) scale({s:.4f})">'
            f'<path d="{pip_path(suit)}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round"/></g>')

# ---------------------------------------------------------------- face card
def corner_index(rank, suit, color):
    x0, y0 = BLEED + 3.6, BLEED + 3.2
    g = (f'<text x="{x0+2.4:.2f}" y="{y0+5.2:.2f}" font-family="{SERIF}" font-size="6.4" '
         f'font-weight="600" fill="{color}" text-anchor="middle">{rank}</text>')
    g += pip(suit, x0, y0 + 6.6, 4.8, color)
    return g

def face_card(card, portrait):
    suit = card["suit"]; color = SUITS[suit]["color"]
    d, (pw, ph), _ = portrait
    # portrait box inside the safe area, above the name block
    bx0, bx1 = BLEED + 8.5, BLEED + TRIM_W - 8.5
    by0, by1 = BLEED + 9.0, BLEED + 69.5
    s = min((bx1-bx0)/pw, (by1-by0)/ph)
    tx = (bx0+bx1)/2 - pw*s/2
    ty = by1 - ph*s                                  # sit on the name block
    sw = 0.30 / s                                    # 0.30 mm line weight
    start = d[1:].split("C")[0].split(",")
    sx, sy = float(start[0]), float(start[1])

    cx = W/2
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">',
           f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
           # hairline frame inside the safe area
           f'<rect x="{BLEED+2.6}" y="{BLEED+2.6}" width="{TRIM_W-5.2}" height="{TRIM_H-5.2}" rx="2.2" '
           f'fill="none" stroke="{color}" stroke-width="0.18" opacity="0.55"/>',
           f'<g transform="translate({tx:.3f},{ty:.3f}) scale({s:.5f})">'
           f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw:.3f}" stroke-linecap="round" stroke-linejoin="round"/>'
           # pen-down mark: where the single line begins
           f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{1.0/s:.2f}" fill="{color}"/></g>',
           corner_index(card["rank"], suit, color),
           f'<g transform="rotate(180 {W/2} {H/2})">{corner_index(card["rank"], suit, color)}</g>',
           # name block (kept narrow so it never meets the corner indices)
           f'<line x1="{cx-6}" y1="{BLEED+72.4}" x2="{cx+6}" y2="{BLEED+72.4}" stroke="{color}" stroke-width="0.25"/>',
           f'<text x="{cx}" y="{BLEED+77.0}" font-family="{SERIF}" font-size="{card.get("name_size", 4.3)}" '
           f'font-style="italic" fill="{INK}" text-anchor="middle">{escape(card["name"])}</text>',
           f'<text x="{cx}" y="{BLEED+80.4}" font-family="{SANS}" font-size="1.6" letter-spacing="0.24" '
           f'fill="{color}" text-anchor="middle">{escape(card["field"].upper())}</text>',
           f'<text x="{cx}" y="{BLEED+83.2}" font-family="{SERIF}" font-size="1.9" '
           f'fill="{INK}" opacity="0.7" text-anchor="middle">{card["years"]}</text>',
           '</svg>']
    return "\n".join(out)

# ---------------------------------------------------------------- back (one line: a damped harmonograph)
def back_card():
    t = np.linspace(0, 2*math.pi*7, 6000)
    amp = 0.35 + 0.65*(1 - t/t[-1])
    x = amp*np.sin(3*t + 0.9*t/t[-1]*math.pi)
    y = amp*np.sin(5*t)
    x = W/2 + x*21; y = H/2 + y*30
    d = "M" + " L".join(f"{a:.2f},{b:.2f}" for a, b in zip(x, y))
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">',
           f'<rect width="{W}" height="{H}" fill="{INK}"/>',
           f'<rect x="{BLEED+2.6}" y="{BLEED+2.6}" width="{TRIM_W-5.2}" height="{TRIM_H-5.2}" rx="2.2" '
           f'fill="none" stroke="{PAPER}" stroke-width="0.18" opacity="0.5"/>',
           f'<path d="{d}" fill="none" stroke="{PAPER}" stroke-width="0.16" opacity="0.9"/>']
    # the four suits, one in each corner
    for (suit, (px, py)) in zip(SUITS, [(BLEED+5, BLEED+5), (W-BLEED-10, BLEED+5),
                                       (BLEED+5, H-BLEED-10), (W-BLEED-10, H-BLEED-10)]):
        out.append(pip(suit, px, py, 5, SUITS[suit]["color"], sw=0.8))
    out.append('</svg>')
    return "\n".join(out)

# ---------------------------------------------------------------- build
if __name__ == "__main__":
    P = json.load(open("portraits.json")); deck = json.load(open("deck.json"))
    os.makedirs("out/cards", exist_ok=True)
    pdfs, pngs = [], []
    for card in deck:
        key = card["key"]
        svg = face_card(card, portrait_path(P[key]))
        base = f"out/cards/{card['suit'].lower()}-{card['rank']}-{key}"
        open(base + ".svg", "w").write(svg)
        cairosvg.svg2pdf(bytestring=svg.encode(), write_to=base + ".pdf")
        cairosvg.svg2png(bytestring=svg.encode(), write_to=base + ".png", output_width=828)
        pdfs.append(base + ".pdf"); pngs.append(base + ".png"); print("built", base)
    back = back_card()
    open("out/cards/back.svg", "w").write(back)
    cairosvg.svg2pdf(bytestring=back.encode(), write_to="out/cards/back.pdf")
    cairosvg.svg2png(bytestring=back.encode(), write_to="out/cards/back.png", output_width=828)
    subprocess.run(["pdfunite", *pdfs, "out/cards/back.pdf", "out/STEM-cards-print.pdf"], check=True)
    print("done")
