# Kilby: a sliver of germanium carrying transistor, resistor, capacitor joined by flying gold wires → steady sine
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    sx, sy, sw, sh = x + 2.0, y + h * 0.36, w * 0.55, h * 0.30
    g.rect(sx, sy, sw, sh, g.lw * 1.5, g.ink, fill=g.soft)                 # the slab
    comps = [(0.18, "t"), (0.50, "r"), (0.82, "c")]
    pads = []
    for u, kind in comps:
        cx, cy = sx + sw * u, sy + sh * 0.5
        if kind == "t":
            g.circle([cx, cy], 1.4, g.lw, g.ink); g.dot([cx, cy], 0.45, g.ink)
        elif kind == "r":
            zz = [[cx - 2 + i * 0.5, cy + (0.7 if i % 2 else -0.7) * (0 < i < 8)] for i in range(9)]
            g.path(zz, g.lw, g.ink)
        else:
            g.path([[cx - 0.5, cy - 1.3], [cx - 0.5, cy + 1.3]], g.lw * 1.4, g.ink); g.path([[cx + 0.5, cy - 1.3], [cx + 0.5, cy + 1.3]], g.lw * 1.4, g.ink)
        pads.append(np.array([cx, sy + 0.6]))
    for a, b in zip(pads[:-1], pads[1:]):                                   # flying wires
        u = np.linspace(0, 1, 40)[:, None]; m = (a + b) / 2 - [0, 4.5]
        g.path((1 - u) ** 2 * a + 2 * (1 - u) * u * m + u ** 2 * b, g.lw * 0.9, g.ink)
        g.dot(a, 0.35, g.ink); g.dot(b, 0.35, g.ink)
    # out comes a steady sine (the oscilloscope trace)
    ox = sx + sw + 0.4; oy = y + h * 0.30
    g.rect(ox + 0.6, y + 0.5, x + w - ox - 1.0, h * 0.55, g.lw * 0.7, g.ink, rx=1.0, opacity=0.6)
    t = np.linspace(0, 1, 160)
    g.path([[ox + 1.4 + (x + w - ox - 2.6) * v, oy - 2.6 * math.sin(v * 4 * math.pi)] for v in t], g.lw * 1.5, g.col)
    return [sx, sy + sh]
