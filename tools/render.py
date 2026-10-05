"""render.py — draw a variable-width single line (and optional shadow layers) as SVG."""
import numpy as np

def _f(v): return f"{v:.2f}"

def weighted_line(pts, widths, base, color, q=0.04, xf=lambda p: p):
    """One visual line, split into short runs of similar width (round caps hide the joins)."""
    P = xf(np.asarray(pts, float)); Wd = np.asarray(widths) * base
    out, i, n = [], 0, len(P)
    while i < n - 1:
        wq = round(Wd[i] / (base*q)) * base*q
        j = i + 1
        while j < n - 1 and abs(Wd[j] - wq) < base*q*0.75 and j - i < 60:
            j += 1
        seg = P[i:j+1]
        d = "M" + " L".join(f"{_f(x)},{_f(y)}" for x, y in seg)
        out.append(f'<path d="{d}" stroke-width="{max(wq, base*0.12):.3f}"/>')
        i = j
    return (f'<g fill="none" stroke="{color}" stroke-linecap="round" stroke-linejoin="round">'
            + "".join(out) + "</g>")

def smooth_poly(poly, iters=2):
    p = np.asarray(poly, float)
    for _ in range(iters):            # Chaikin corner cutting -> soft, cut-paper edges
        q = 0.75*p + 0.25*np.roll(p, -1, 0); r = 0.25*p + 0.75*np.roll(p, -1, 0)
        p = np.empty((2*len(q), 2)); p[0::2] = q; p[1::2] = r
    return p

def wash(polys, color, opacity, xf=lambda p: p, offset=(0, 0)):
    """Flat tone shapes behind the line, slightly off-register like a riso print (Alewya / Matisse cut-outs)."""
    out = []
    for poly in polys:
        p = xf(smooth_poly(poly)) + np.array(offset)
        out.append("M" + " L".join(f"{_f(x)},{_f(y)}" for x, y in p) + "Z")
    return f'<path d="{"".join(out)}" fill="{color}" opacity="{opacity}" fill-rule="nonzero"/>'
