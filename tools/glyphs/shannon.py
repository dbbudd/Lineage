# Shannon: noisy symbols → the entropy hump H(p), peaking at one bit → a row of bits → falling cross-entropy loss
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    bx0, bx1, by = x + w * 0.26, x + w * 0.64, y + h * 0.52
    top = y + 1.2
    p = np.linspace(0.001, 0.999, 200)
    H = -(p * np.log2(p) + (1 - p) * np.log2(1 - p))
    g.path([(bx0, by), (bx1 + 1, by)], g.lw * 0.8, g.ink)
    g.path([(bx0, by), (bx0, top - 1)], g.lw * 0.8, g.ink)
    g.path([(bx0 + (bx1 - bx0) * a, by - (by - top) * b) for a, b in zip(p, H)], g.lw * 1.6, g.ink)
    mx = ((bx0 + bx1) / 2, top)
    g.dot(mx, 0.7, g.ink)
    g.path([(bx0, top), mx], 0.2, g.ink, dash="0.6 0.6", opacity=0.6)
    bits = [1, 0, 1, 1, 0, 0, 1, 0]                       # bits under the axis
    for i, b in enumerate(bits):
        c = (bx0 + 1.2 + i * (bx1 - bx0 - 1.2) / 7.4, by + 2.4)
        (g.dot(c, 0.55, g.ink) if b else g.circle(c, 0.55, g.lw * 0.7, g.ink))
    # AI step: cross-entropy loss falling toward the entropy floor
    lx0, lx1 = x + w * 0.72, x + w - 0.3
    t = np.linspace(0, 1, 80)
    floor = y + h * 0.42
    g.path([(lx0, floor), (lx1, floor)], 0.2, g.col, dash="0.7 0.6", opacity=0.7)
    g.path([(lx0 + (lx1 - lx0) * s, floor - (floor - top - 0.5) * math.exp(-4.5 * s)) for s in t], g.lw * 1.6, g.col)
    g.dot((lx1, floor - (floor - top - 0.5) * math.exp(-4.5)), 0.6)
    return (bx0, by)
