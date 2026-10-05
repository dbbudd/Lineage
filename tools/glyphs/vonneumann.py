# von Neumann: memory (program + data in one store) ⇄ bus ⇄ processor; the narrow bus is the bottleneck AI chips fight
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    mx, my, mw, mh = x + w * 0.56, y + 1.0, w * 0.40, h - 2.5
    rows = 6
    for k in range(rows):                                                   # memory cells
        cy = my + k * mh / rows
        g.rect(mx, cy, mw, mh / rows, g.lw, g.ink, fill=g.soft if k < 2 else "none")
        for j in range(4):
            if (k * 3 + j * 5) % 4 != 0:
                g.dot([mx + mw * (0.18 + 0.21 * j), cy + mh / rows / 2], 0.32, g.ink)
    px, py, pw, ph = x + w * 0.06, y + h * 0.32, w * 0.26, h * 0.40       # processor
    g.rect(px, py, pw, ph, g.lw * 1.5, g.ink, rx=0.6)
    for j in range(4):
        tx = px + pw * (0.2 + 0.2 * j)
        g.path([[tx, py], [tx, py - 1.2]], g.lw * 0.8, g.ink); g.path([[tx, py + ph], [tx, py + ph + 1.2]], g.lw * 0.8, g.ink)
    g.circle([px + pw / 2, py + ph / 2], 1.3, g.lw, g.ink)
    a, b = px + pw, mx
    yc = py + ph / 2                                                        # the bus: a narrow neck
    g.arrow([a + 0.6, yc - 0.9], [b - 0.3, yc - 0.9], g.lw * 1.3, g.col)   # fetch
    g.arrow([b - 0.6, yc + 0.9], [a + 0.3, yc + 0.9], g.lw * 1.3, g.ink)   # results back
    return [px, py + ph * 0.8]
