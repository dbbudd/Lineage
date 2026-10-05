"""
card_v2.py — "the line carries on" print card (Tesla prototype).
Portrait line -> connector warming to the suit colour -> phasor halo -> perspective wave
-> RoPE word vectors receding to a vanishing point. QR links to the live, remixable page.
"""
import json, math, io, base64
from pathlib import Path
import numpy as np, cairosvg, qrcode, qrcode.image.svg
from xml.sax.saxutils import escape
import cards as K
# use the redrawn suit symbols shared with the website
_PIPS = json.load(open(Path(__file__).resolve().parent.parent / "data" / "pips.json"))
K.pip_path = lambda suit: _PIPS[suit]

URL = "https://claude.ai/artifact/LLVLaMxZsSsyfu7TvxsVZA"
GRAPHITE = "#4A4843"; PAPER = "#F1EDE4"
W, H, B = K.W, K.H, K.BLEED
card = {"suit": "Engineering", "rank": "K", "name": "Nikola Tesla", "field": "Electrical Engineering", "years": "1856–1943"}
VOLT = K.SUITS[card["suit"]]["color"]
WORDS = ["", "", ""]   # print keeps the arrows only; the words live on the web page
THETA, PH = 0.62, 0.95          # frozen moment of the animation

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)])
def mix(a, b, k): v = hexrgb(a) + (hexrgb(b) - hexrgb(a)) * k; return "#%02x%02x%02x" % tuple(int(round(x)) for x in v)
def poly(pts): return "M" + " L".join(f"{x:.3f},{y:.3f}" for x, y in pts)

import linegen, render as R
cfgT = json.load(open("portraits.json"))["tesla"]; cfgT["hatch"] = True; cfgT["end_top"] = True
linegen.portrait_path(cfgT); LN = linegen.portrait_path.line
# reverse so the line FINISHES at the crown of the head and flows straight into the halo
# (end_top routing already starts bottom-left and ends at the crown, so no reversal)
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
INKLINE = mix(VOLT, GRAPHITE, 0.18)

# ---- the border: one wavy line around the card that peels off into the start of the portrait ----
def rounded_rect(x0, y0, x1, y1, r, step=0.05):
    pts = []
    corners = [((x1 - r, y0 + r), -math.pi/2, 0), ((x1 - r, y1 - r), 0, math.pi/2),
               ((x0 + r, y1 - r), math.pi/2, math.pi), ((x0 + r, y0 + r), math.pi, 1.5*math.pi)]
    edges = [((x0 + r, y0), (x1 - r, y0)), ((x1, y0 + r), (x1, y1 - r)), ((x1 - r, y1), (x0 + r, y1)), ((x0, y1 - r), (x0, y0 + r))]
    for (a, b), (c, t0, t1) in zip(edges, corners):
        n = max(2, int(math.hypot(b[0]-a[0], b[1]-a[1]) / step))
        pts += [(a[0] + (b[0]-a[0]) * i/n, a[1] + (b[1]-a[1]) * i/n) for i in range(n)]
        m = max(2, int(r * (t1 - t0) / step))
        pts += [(c[0] + r*math.cos(t0 + (t1-t0)*i/m), c[1] + r*math.sin(t0 + (t1-t0)*i/m)) for i in range(m)]
    return np.array(pts)

def border_line(start_pt, inset=1.7, r=2.6, loop=2.0, reach=0.62):
    """One continuous looping line (a prolate trochoid) running round the card, like a pen doodling a frame.
    Loops alternate large/small for an intricate, hand-drawn rhythm; it calms at the join so it closes cleanly."""
    base = rounded_rect(B + inset, B + inset, W - B - inset, H - B - inset, r, step=0.02)
    i0 = int(np.argmin(np.hypot(*(base - start_pt).T)))
    base = np.vstack([base[i0:], base[:i0], base[i0:i0+1]])
    seg = np.hypot(*np.diff(base, axis=0).T); sarc = np.concatenate([[0], np.cumsum(seg)])
    L = sarc[-1]; nl = round(L / loop); lam = L / nl
    u = np.linspace(0, L, int(L / 0.02))
    th = 2 * math.pi * u / lam
    size = reach * (1 + 0.32 * np.cos(th / 2))                      # alternating big and small loops
    ease = np.clip(np.minimum(u, L - u) / 2.5, 0, 1)
    along = np.clip(u - size * ease * np.sin(th), 0, L)
    across = size * ease * np.cos(th)
    bx = np.interp(along, sarc, base[:, 0]); by = np.interp(along, sarc, base[:, 1])
    tg = np.gradient(np.column_stack([np.interp(u, sarc, base[:, 0]), np.interp(u, sarc, base[:, 1])]), axis=0)
    tg /= np.linalg.norm(tg, axis=1, keepdims=True) + 1e-9
    nrm = np.column_stack([tg[:, 1], -tg[:, 0]])
    return np.column_stack([bx, by]) + nrm * across[:, None]

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">',
       f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
import os
STYLE = os.environ.get("BORDER", "braid")
def braid_line(start_pt, inset=1.7, r=2.6, wl=2.6, amp=0.55):
    base = rounded_rect(B + inset, B + inset, W - B - inset, H - B - inset, r, step=0.02)
    i0 = int(np.argmin(np.hypot(*(base - start_pt).T))); base = np.vstack([base[i0:], base[:i0], base[i0:i0+1]])
    seg = np.hypot(*np.diff(base, axis=0).T); sarc = np.concatenate([[0], np.cumsum(seg)]); L = sarc[-1]
    n = round(L / wl) + 0.5                       # half-wave offset means lap 2 mirrors lap 1 -> a braid
    u = np.linspace(0, 2 * L, int(2 * L / 0.02)); uu = u % L
    bx = np.interp(uu, sarc, base[:, 0]); by = np.interp(uu, sarc, base[:, 1])
    tg = np.gradient(np.column_stack([bx, by]), axis=0); tg /= np.linalg.norm(tg, axis=1, keepdims=True) + 1e-9
    nrm = np.column_stack([tg[:, 1], -tg[:, 0]])
    ease = np.clip(np.minimum(u, 2 * L - u) / 2.5, 0, 1)
    return np.column_stack([bx, by]) + nrm * (amp * ease * np.sin(2 * math.pi * n * u / L))[:, None]
B_LINE = braid_line(pts[0]) if STYLE == "braid" else border_line(pts[0])
join = B_LINE[-1]; tail_ctrl = join + (pts[0] - join) * 0.5 + np.array([1.0, 1.0])
uu_ = np.linspace(0, 1, 30)[:, None]
TAIL = (1-uu_)**2 * join + 2*(1-uu_)*uu_ * tail_ctrl + uu_**2 * pts[0]
svg.append(f'<path d="{poly(B_LINE)}" fill="none" stroke="{VOLT}" stroke-width="0.2" stroke-linecap="round" stroke-linejoin="round"/>')
for i in range(1, len(TAIL)):   # the border thins as it dives into the portrait
    svg.append(f'<path d="{poly(TAIL[i-1:i+1])}" stroke="{mix(VOLT, INKLINE, i/len(TAIL))}" stroke-width="{0.2 - 0.04*i/len(TAIL):.3f}" stroke-linecap="round"/>')
svg.append(f'<circle cx="{B_LINE[0][0]:.3f}" cy="{B_LINE[0][1]:.3f}" r="0.6" fill="{VOLT}"/>')
# perspective: faint centre line to the vanishing point (the horizon of "where we're heading")

# halo: rotating field — circle + three phase spokes
svg.append(f'<circle cx="{c[0]:.3f}" cy="{c[1]:.3f}" r="{r:.3f}" fill="none" stroke="{VOLT}" stroke-width="{lw*0.85}"/>')
for k in range(3):
    a = PH + k * 2*math.pi/3
    e = c + 0.82*r*np.array([math.cos(a), math.sin(a)])
    pass

# shadow wash (graphite, slightly off-register) then the weighted single line
xf = lambda q: np.column_stack([x0 + q[:, 0] / pw * s, y0 + q[:, 1] / pw * s])
svg.insert(3, R.wash(LN["wash"], VOLT, 0.12, xf=xf, offset=(0.45, 0.3)))
svg.append(R.weighted_line(pts, LN["widths"], 0.36, INKLINE))


# connector: last point of the face -> halo rim, warming from graphite to volt
e = pts[-1]; a0 = math.atan2(-d[1], -d[0]) + 0.9
hs = c + r*np.array([math.cos(a0), math.sin(a0)])
mid = (e + hs)/2; ctrl = mid + (mid - c)*0.35
u = np.linspace(0, 1, 40)[:, None]
conn = (1-u)**2*e + 2*(1-u)*u*ctrl + u**2*hs
for i in range(1, len(conn)):
    svg.append(f'<path d="{poly(conn[i-1:i+1])}" stroke="{mix(INKLINE, VOLT, i/len(conn))}" stroke-width="{lw}" stroke-linecap="round"/>')

# phasor arm, projection guide, wave
tip = c + r*(math.cos(PH)*d + math.sin(PH)*n)
svg.append(f'<path d="{poly([c, tip])}" stroke="{VOLT}" stroke-width="{lw*1.2}" stroke-linecap="round"/>')
svg.append(f'<circle cx="{tip[0]:.3f}" cy="{tip[1]:.3f}" r="0.55" fill="{VOLT}"/>')
w0 = S + n*r*math.sin(PH)

uu = np.linspace(0, 1, 500)
wave = [base(v) + n * r * sc(v) * math.sin(PH - v*4.5*2*math.pi) for v in uu]
svg.append(f'<path d="{poly(wave)}" fill="none" stroke="{VOLT}" stroke-width="{lw*1.1}" opacity="0.55" stroke-linejoin="round"/>')
svg.append(f'<circle cx="{vp[0]:.3f}" cy="{vp[1]:.3f}" r="0.5" fill="{VOLT}"/>')

# RoPE word vectors: word m turned by m·θ, shrinking with depth
M = len(WORDS)
for m, wd in enumerate(WORDS):
    v = (m + 0.6) / (M + 0.4) * 0.92; b = base(v); k = sc(v)
    ang = PH*0.35 + m*THETA; ln = max(3.0, r*1.25*k)
    tipw = b + ln*(math.cos(ang)*d + math.sin(ang)*n)
    hi = m in (1, M-1); col = VOLT if hi else GRAPHITE
    ha = math.atan2(*(tipw - b)[::-1]); hl = max(1.0, 1.8*k)
    head = [tipw, tipw - hl*np.array([math.cos(ha-.45), math.sin(ha-.45)]), tipw - hl*np.array([math.cos(ha+.45), math.sin(ha+.45)])]
    svg.append(f'<path d="{poly([b, tipw])}" stroke="{col}" stroke-width="{lw*(1.6 if hi else 1.3)}" stroke-linecap="round"/>')
    svg.append(f'<path d="{poly(head)} Z" fill="{col}"/>')
    fs = 1.05 + 0.9*k
    lx = min(b[0], ax1 - 0.35*fs*len(wd)); ly = b[1] + r*0.55*k + fs*1.6 if m % 2 == 0 else b[1] - r*0.5*k - fs*0.6


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
open(f"out/cards/engineering-K-tesla-v4{'-braid' if STYLE=='braid' else ''}.svg", "w").write(out)
cairosvg.svg2pdf(bytestring=out.encode(), write_to=f"out/cards/engineering-K-tesla-v4{'-braid' if STYLE=='braid' else ''}.pdf")
cairosvg.svg2png(bytestring=out.encode(), write_to=f"out/cards/engineering-K-tesla-v4{'-braid' if STYLE=='braid' else ''}.png", output_width=1104)
print("ok", nmod, "modules, cell", round(cell, 3), "mm")
