# Brahmagupta: a cyclic quadrilateral (area √((s−a)(s−b)(s−c)(s−d))) and zero between fortunes and debts → signed weights
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([x + w - 7.5, y + 6.5]); R = 6.2                       # tucked into the top-right corner
    g.circle(c, R, g.lw, g.ink)
    angs = [math.radians(a) for a in (200, 285, 340, 95)]
    Q = [c + R * np.array([math.cos(a), math.sin(a)]) for a in angs]
    g.path(Q, g.lw * 1.4, g.col, close=True, fill=g.soft, opacity=0.45)
    g.path(Q, g.lw * 1.4, g.col, close=True)
    for q in Q: g.dot(q, 0.55, g.ink)
    # number line under it: debts ← 0 → fortunes
    yl = c[1] + R + 4.2; z = np.array([c[0], yl])
    g.path([[c[0] - 8, yl], [c[0] + 8, yl]], g.lw, g.ink)
    for k in range(-4, 5):
        g.path([[c[0] + k * 1.9, yl - 0.5], [c[0] + k * 1.9, yl + 0.5]], 0.18, g.ink)
    g.circle(z, 0.75, g.lw * 1.2, g.ink, fill="#FBF8F1")               # zero, a number in its own right
    g.arrow(z + [1.0, -1.7], z + [6.6, -1.7], g.lw * 1.4, g.col)       # fortune
    g.arrow(z + [-1.0, -1.7], z + [-6.6, -1.7], g.lw * 1.4, g.ink)     # debt
    a = math.radians(200)
    return c + R * np.array([math.cos(a), math.sin(a)])                # the portrait's line arrives on the circle
