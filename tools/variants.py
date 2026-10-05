import json, numpy as np, cairosvg, cv2, linegen as L, render as R
C = json.load(open('portraits.json'))['tesla']
INK, VOLT, PAPER = "#4A4843", "#C2502C", "#F1EDE4"
def get(hatch):
    c = dict(C); c['hatch'] = hatch
    L.portrait_path(c); return L.portrait_path.line
plain, hatched = get(False), get(True)
w, h = plain['size']; base = 2.4
def svg(body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="{PAPER}"/>{body}</svg>'
V = {
 "A uniform": svg(R.weighted_line(plain['pts'], np.ones(len(plain['pts']))*0.75, base, INK)),
 "B weight": svg(R.weighted_line(plain['pts'], plain['widths'], base, INK)),
 "C weight+hatch": svg(R.weighted_line(hatched['pts'], hatched['widths'], base, INK)),
 "D +wash": svg(R.wash(hatched['wash'], INK, 0.11, offset=(7, 5)) + R.weighted_line(hatched['pts'], hatched['widths'], base, INK)),
}
ims = []
for k, s in V.items():
    cairosvg.svg2png(bytestring=s.encode(), write_to='out/tmp.png', output_width=600)
    im = cv2.imread('out/tmp.png'); cv2.putText(im, k, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (60,60,60), 2); ims.append(im)
cv2.imwrite('out/variants.png', np.hstack(ims))
json.dump({k: {"pts": v['pts'].round(1).tolist(), "w": v['widths'].round(3).tolist(), "k": v['kinds'].astype(int).tolist(),
               "wash": [p.round(1).tolist() for p in v['wash']]} for k, v in [("plain", plain), ("hatched", hatched)]}, open('out/tesla_line_v3.json', 'w'))
