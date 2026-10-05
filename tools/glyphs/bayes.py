# Bayes: balls rolled on his table, told only left or right of the hidden ball → the belief curve narrows on it
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); R = x + w - 1.0; Wd = R - L
    ty, th = y + h - 7.5, 7.0                          # the table (seen from above)
    g.rect(L, ty, Wd, th, g.lw * 1.3, g.ink, rx=0.8)
    hp = 0.62; hx = L + hp * Wd
    g.path([[hx, ty + 0.4], [hx, ty + th - 0.4]], 0.2, g.ink, dash="0.6 0.5")
    rng = np.random.default_rng(1763)
    for _ in range(9):
        u = rng.uniform(0.05, 0.95); v = rng.uniform(0.25, 0.75)
        g.circle([L + u * Wd, ty + v * th], 0.5, 0.2, g.ink, fill=g.soft if u < hp else "none")
    g.dot([hx, ty + th * 0.5], 0.85, g.ink)
    beta = lambda t, a, b: t ** (a - 1) * (1 - t) ** (b - 1)
    t = np.linspace(0.001, 0.999, 200); base = ty - 1.0; H = 12.5
    for a, b, col, wd, op in [(2.2, 1.7, g.ink, 0.2, 0.55), (13.4, 8.6, g.col, g.lw * 1.6, 1)]:
        v = beta(t, a, b); v = v / v.max()
        g.path(np.column_stack([L + t * Wd, base - v * H * (0.45 if col == g.ink else 1)]), wd, col, opacity=op)
    return (L, ty + th - 1.0)
