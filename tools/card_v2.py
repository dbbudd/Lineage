"""
card_v2.py — "the line carries on" print card (Tesla prototype).
Portrait line -> connector warming to the suit colour -> phasor halo -> perspective wave
-> RoPE word vectors receding to a vanishing point. QR links to the live, remixable page.
"""
import json, math, io, base64
import numpy as np, cairosvg, qrcode, qrcode.image.svg
from xml.sax.saxutils import escape
import cards as K

URL = "https://claude.ai/artifact/LLVLaMxZsSsyfu7TvxsVZA"
GRAPHITE = "#4A4843"; PAPER = "#F1EDE4"
W, H, B = K.W, K.H, K.BLEED
card = {"suit": "Engineering", "rank": "K", "name": "Nikola Tesla", "field": "Electrical Engineering", "years": "1856–1943"}
VOLT = K.SUITS[card["suit"]]["color"]
WORDS = ["position", "is", "just", "a", "rotation"]
THETA, PH = 0.62, 0.95          # frozen moment of the animation

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)])
def mix(a, b, k): v = hexrgb(a) + (hexrgb(b) - hexrgb(a)) * k; return "#%02x%02x%02x" % tuple(int(round(x)) for x in v)
def poly(pts): return "M" + " L".join(f"{x:.3f},{y:.3f}" for x, y in pts)

import linegen, render as R
cfgT = json.load(open("portraits.json"))["tesla"]; cfgT["hatch"] = True
linegen.portrait_path(cfgT); LN = linegen.portrait_path.line
# reverse so the line FINISHES at the crown of the head and flows straight into the halo
for key in ("pts", "widths", "kinds"): LN[key] = LN[key][::-1].copy()
pw, ph = LN["size"]; P = LN["pts"] / pw; asp = ph / pw
# export for the live page: normalised points, widths, kinds (every 2nd point), wash polygons
json.dump({"aspect": asp, "pts": P[::2].round(4).flatten().tolist(), "w": LN["widths"][::2].round(2).tolist(),
           "k": LN["kinds"][::2].astype(int).tolist(),
           "wash": [(R.smooth_poly(p) / pw).round(4).flatten().tolist() for p in LN["wash"]]},
          open("out/tesla_line_live.json", "w"), separators=(",", ":"))

# --- layout (mm) ---------------------------------------------------------------
ax0, ax1, ay0, ay1 = B + 5.0, W - B - 5.0, B + 8.5, B + 70.5
s = (ax1 - ax0) * 0.80                       # portrait width
x0 = ax0 - 1.0; y0 = ay1 - asp * s
pts = np.column_stack([x0 + P[:, 0] * s, y0 + P[:, 1] * s])
c = np.array([x0 + 0.47 * s, y0 + 0.20 * s]); r = 0.20 * s
vp = np.array([ax1 - 0.5, ay0 + 1.5])
d = (vp - c) / np.linalg.norm(vp - c); n = np.array([-d[1], d[0]])
S = c + d * r * 1.18
Kp = 3.2
scr = lambda u: (1 - 1/(1 + Kp*u)) / (1 - 1/(1 + Kp))
sc = lambda u: 1 / (1 + Kp*u)
base = lambda u: S + (vp - S) * scr(u)
lw = 0.30

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">',
       f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
       f'<rect x="{B+2.6}" y="{B+2.6}" width="{K.TRIM_W-5.2}" height="{K.TRIM_H-5.2}" rx="2.2" fill="none" stroke="{VOLT}" stroke-width="0.18" opacity="0.5"/>']

# perspective: faint centre line to the vanishing point (the horizon of "where we're heading")
svg.append(f'<path d="{poly([S, vp])}" stroke="{VOLT}" stroke-width="0.12" opacity="0.35" fill="none"/>')
# halo: rotating field — circle + three phase spokes
svg.append(f'<circle cx="{c[0]:.3f}" cy="{c[1]:.3f}" r="{r:.3f}" fill="none" stroke="{VOLT}" stroke-width="{lw*0.85}"/>')
for k in range(3):
    a = PH + k * 2*math.pi/3
    e = c + 0.82*r*np.array([math.cos(a), math.sin(a)])
    svg.append(f'<path d="{poly([c, e])}" stroke="{VOLT}" stroke-width="0.14" opacity="0.3"/>')

# shadow wash (graphite, slightly off-register) then the weighted single line
xf = lambda q: np.column_stack([x0 + q[:, 0] / pw * s, y0 + q[:, 1] / pw * s])
svg.insert(3, R.wash(LN["wash"], GRAPHITE, 0.10, xf=xf, offset=(0.45, 0.3)))
svg.append(R.weighted_line(pts, LN["widths"], 0.36, GRAPHITE))


# connector: last point of the face -> halo rim, warming from graphite to volt
e = pts[-1]; a0 = math.atan2(-d[1], -d[0]) + 0.9
hs = c + r*np.array([math.cos(a0), math.sin(a0)])
mid = (e + hs)/2; ctrl = mid + (mid - c)*0.35
u = np.linspace(0, 1, 40)[:, None]
conn = (1-u)**2*e + 2*(1-u)*u*ctrl + u**2*hs
for i in range(1, len(conn)):
    svg.append(f'<path d="{poly(conn[i-1:i+1])}" stroke="{mix(GRAPHITE, VOLT, i/len(conn))}" stroke-width="{lw}" stroke-linecap="round"/>')

# phasor arm, projection guide, wave
tip = c + r*(math.cos(PH)*d + math.sin(PH)*n)
svg.append(f'<path d="{poly([c, tip])}" stroke="{VOLT}" stroke-width="{lw*1.2}" stroke-linecap="round"/>')
svg.append(f'<circle cx="{tip[0]:.3f}" cy="{tip[1]:.3f}" r="0.55" fill="{VOLT}"/>')
w0 = S + n*r*math.sin(PH)
svg.append(f'<path d="{poly([tip, w0])}" stroke="{VOLT}" stroke-width="0.15" stroke-dasharray="0.6 0.8" opacity="0.6"/>')
uu = np.linspace(0, 1, 500)
wave = [base(v) + n * r * sc(v) * math.sin(PH - v*7*2*math.pi) for v in uu]
svg.append(f'<path d="{poly(wave)}" fill="none" stroke="{VOLT}" stroke-width="{lw*0.9}" opacity="0.5" stroke-linejoin="round"/>')
svg.append(f'<circle cx="{vp[0]:.3f}" cy="{vp[1]:.3f}" r="0.5" fill="{VOLT}"/>')

# RoPE word vectors: word m turned by m·θ, shrinking with depth
M = len(WORDS)
for m, wd in enumerate(WORDS):
    v = (m + 0.6) / (M + 0.4) * 0.92; b = base(v); k = sc(v)
    ang = PH*0.35 + m*THETA; ln = max(2.2, r*1.05*k)
    tipw = b + ln*(math.cos(ang)*d + math.sin(ang)*n)
    hi = m in (1, M-1); col = VOLT if hi else GRAPHITE
    ha = math.atan2(*(tipw - b)[::-1]); hl = max(0.7, 1.4*k)
    head = [tipw, tipw - hl*np.array([math.cos(ha-.45), math.sin(ha-.45)]), tipw - hl*np.array([math.cos(ha+.45), math.sin(ha+.45)])]
    svg.append(f'<path d="{poly([b, tipw])}" stroke="{col}" stroke-width="{lw*(1.15 if hi else 0.85)}" stroke-linecap="round"/>')
    svg.append(f'<path d="{poly(head)} Z" fill="{col}"/>')
    fs = 1.05 + 0.9*k
    lx = min(b[0], ax1 - 0.35*fs*len(wd)); ly = b[1] + r*0.55*k + fs*1.6 if m % 2 == 0 else b[1] - r*0.5*k - fs*0.6
    svg.append(f'<text x="{lx:.2f}" y="{ly:.2f}" font-family="{K.SERIF}" font-style="italic" font-size="{fs:.2f}" fill="{col}" text-anchor="middle">{wd}</text>')

# indices + name block (from the v1 template, in graphite)
svg.append(K.corner_index(card["rank"], card["suit"], VOLT))
svg.append(f'<g transform="rotate(180 {W/2} {H/2})">{K.corner_index(card["rank"], card["suit"], VOLT)}</g>')
cx = W/2
svg += [f'<line x1="{cx-6}" y1="{B+72.4}" x2="{cx+6}" y2="{B+72.4}" stroke="{VOLT}" stroke-width="0.25"/>',
        f'<text x="{cx}" y="{B+77.0}" font-family="{K.SERIF}" font-size="4.3" font-style="italic" fill="{GRAPHITE}" text-anchor="middle">{card["name"]}</text>',
        f'<text x="{cx}" y="{B+80.4}" font-family="{K.SANS}" font-size="1.6" letter-spacing="0.24" fill="{VOLT}" text-anchor="middle">{escape(card["field"].upper())}</text>',
        f'<text x="{cx}" y="{B+83.2}" font-family="{K.SERIF}" font-size="1.9" fill="{GRAPHITE}" opacity="0.7" text-anchor="middle">{card["years"]} · AC  /  phasor  /  RoPE</text>']

# QR to the live page, bottom-left (the empty corner)
qr = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M); qr.add_data(URL); qr.make()
mtx = qr.get_matrix(); nmod = len(mtx); qs = 9.0; q0 = np.array([B + 4.2, B + 73.6]); cell = qs / nmod
rects = "".join(f'M{q0[0]+x*cell:.3f},{q0[1]+y*cell:.3f}h{cell:.3f}v{cell:.3f}h-{cell:.3f}z'
                for y, row in enumerate(mtx) for x, on in enumerate(row) if on)
svg.append(f'<path d="{rects}" fill="{GRAPHITE}"/>')
svg.append('</svg>')

out = "\n".join(svg)
open("out/cards/engineering-K-tesla-v3.svg", "w").write(out)
cairosvg.svg2pdf(bytestring=out.encode(), write_to="out/cards/engineering-K-tesla-v3.pdf")
cairosvg.svg2png(bytestring=out.encode(), write_to="out/cards/engineering-K-tesla-v3.png", output_width=1104)
print("ok", nmod, "modules, cell", round(cell, 3), "mm")
