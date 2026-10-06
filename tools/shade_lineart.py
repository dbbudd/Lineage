#!/usr/bin/env python3
"""
shade_lineart.py — give a flat line-drawing reference light and shadow, so the portrait
generator can vary stroke weight, hatch and wash as it does for photographs.

    python3 shade_lineart.py src/newton_ref.jpg src/newton_tone.png [--light -0.7 -0.55] [--seed x,y,tone ...]

Each closed region of the drawing is inflated into a soft 'pillow' (sqrt of its distance transform),
added to a pillow of the whole figure, lit with Lambert shading from the given direction, and darkened
where lines crowd together (occlusion). --seed x,y,tone sets the base tone (0 black .. 1 white) of the
region containing pixel (x, y): e.g. darker hair or a coat.
Use the result with  "tone_src": "src/<slug>_tone.png"  in portraits.json (lineart mode).
"""
import sys, argparse
import numpy as np, cv2

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--light", nargs=2, type=float, default=[-0.7, -0.55])
ap.add_argument("--seed", action="append", default=[])
ap.add_argument("--ink", type=int, default=150)
ap.add_argument("--gap", type=int, default=31)
ap.add_argument("--occl", type=float, default=0.3)
a = ap.parse_args()

img = cv2.imread(a.src, cv2.IMREAD_GRAYSCALE); h, w = img.shape
ink = (img < a.ink).astype(np.uint8)
inkd = cv2.dilate(ink, np.ones((5, 5), np.uint8))
n, lab = cv2.connectedComponents(1 - inkd, connectivity=4)
# background = paper around the figure; label it with gaps closed hard so open curls still count as figure
big = cv2.dilate(ink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (a.gap, a.gap)))
nb, lb = cv2.connectedComponents(1 - big, connectivity=4)
edge = set(np.unique(np.concatenate([lb[0], lb[:, 0], lb[:, -1]]))) - {0}
bg = cv2.dilate(np.isin(lb, list(edge)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (a.gap, a.gap)))
bg = (bg & (1 - ink)).astype(np.uint8)
fig = (1 - bg).astype(np.uint8)
fig = cv2.morphologyEx(fig, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))

# pillows: whole figure + each region
def pillow(mask):
    d = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    return np.sqrt(d)
H = 0.5 * pillow(fig) / (np.sqrt(max(h, w)) * 0.25)
reg = np.zeros((h, w), np.float32)
for i in range(1, n):
    m = (lab == i)
    if bg[m].mean() > 0.5 or m.sum() < 60: continue
    p = pillow(m.astype(np.uint8)); reg += p / (p.max() + 1e-6)
H = H + 0.9 * reg
H = cv2.GaussianBlur(H.astype(np.float32), (0, 0), 7)
gy, gx = np.gradient(H * 40)
nz = 1.0 / np.sqrt(gx ** 2 + gy ** 2 + 1)
L = np.array([a.light[0], a.light[1], 0.55]); L = L / np.linalg.norm(L)
lam = np.clip((-gx * L[0] - gy * L[1] + L[2]) * nz, 0, 1)

base = np.full((h, w), 0.92, np.float32)
for s in a.seed:
    x, y, t = s.split(","); i = lab[int(y), int(x)]
    if i > 0: base[lab == i] = float(t)
base = cv2.GaussianBlur(base, (0, 0), 2)
occl = cv2.GaussianBlur(ink.astype(np.float32), (0, 0), max(h, w) * 0.012)
occl = occl / (occl.max() + 1e-6)
# cast shadow: the figure darkens what lies just below-right of it, away from the light
sh = np.roll(np.roll(cv2.GaussianBlur(fig.astype(np.float32), (0, 0), 14), int(-a.light[1] * 18), 0), int(-a.light[0] * 18), 1)
lit = np.clip(lam / L[2], 0, 1)                       # 1 = facing the viewer or the light, 0 = turned away
tone = base * (0.3 + 0.7 * lit ** 1.6) - a.occl * occl
tone = np.where(fig > 0, tone, 1.0 - 0.0 * sh)
tone = np.clip(tone, 0, 1)
cv2.imwrite(a.out, (tone * 255).astype(np.uint8))
print("wrote", a.out, "regions", n)
