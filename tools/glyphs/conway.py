# Conway: λ design rules — a layout on a grid of λ (gate across diffusion, metal wires); the same design shrinks to any process
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = 1.1                                                                 # λ
    gx, gy, n, m = x + 4.0, y + 0.5, 11, 13
    for i in range(n + 1):
        for j in range(m + 1):
            g.dot([gx + j * L, gy + i * L], 0.13, g.ink, opacity=0.55)
    def lay(ox, oy, k, wt, col_d, col_p, col_m):
        P = lambda a, b: [ox + a * L * k, oy + b * L * k]
        g.rect(*P(2, 4), 9 * L * k, 3 * L * k, wt, g.ink, fill=g.soft)                     # diffusion
        for a in (4, 8):                                                                    # two poly gates, 2λ
            g.rect(*P(a, 1), 2 * L * k, 9 * L * k, wt, col_p, fill="none")
        g.rect(*P(0, 8.5), 13 * L * k, 2 * L * k, wt, col_m)                               # metal wire 3λ… 
        g.rect(*P(0, 0.5), 13 * L * k, 2 * L * k, wt, col_m)
        for a, b in ((2.7, 9.0), (10.3, 9.0), (6.5, 1.0)):
            g.rect(*P(a, b), 1 * L * k, 1 * L * k, wt, g.ink, fill=g.ink)                  # contacts
    lay(gx, gy, 1.0, g.lw * 1.3, None, g.col, g.ink)
    # the same rules, a smaller λ: the design shrinks with the factory
    sx, sy = gx + 13 * L + 1.6, gy + 3.0
    g.arrow([sx - 1.0, sy + 2.9], [sx + 0.7, sy + 2.9], g.lw * 1.1, g.col, head=0.9)
    lay(sx + 1.0, sy + 0.5, 0.42, g.lw * 0.8, None, g.col, g.ink)
    return [gx, gy + 11 * L]
