# Mirzakhani: a billiard zigzag in a square unfolds to one straight path; straight lines on a hyperbolic surface (Poincaré disc) → hierarchies embedded in hyperbolic space
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0)
    s = 7.0; sq = np.array([L, y + h - s - 1.5])
    g.rect(sq[0], sq[1], s, s, g.lw * 1.2, g.ink)
    zz = [(0.0, 0.3), (0.42, 1.0), (1.0, 0.45), (0.75, 0.0), (0.0, 0.62)]
    g.path([sq + np.array(p) * s for p in zz], 0.2, g.ink); g.dot(sq + np.array(zz[0]) * s, 0.5, g.ink)
    c = np.array([x + w - 9.8, y + h / 2]); R = 9.3
    g.circle(c, R, g.lw * 1.3, g.ink, fill=g.soft, opacity=0.3)
    def geo(a1, a2, wd, col):                           # geodesic: arc orthogonal to the rim
        m = (a1 + a2) / 2; hh = abs(a2 - a1) / 2
        cc = c + R / math.cos(hh) * np.array([math.cos(m), math.sin(m)]); rr = R * math.tan(hh)
        t0 = math.atan2(*(c + R * np.array([math.cos(a1), math.sin(a1)]) - cc)[::-1])
        t1 = math.atan2(*(c + R * np.array([math.cos(a2), math.sin(a2)]) - cc)[::-1])
        if t1 - t0 > math.pi: t1 -= 2 * math.pi
        if t0 - t1 > math.pi: t1 += 2 * math.pi
        t = np.linspace(t0, t1, 60); g.path(np.column_stack([cc[0] + rr * np.cos(t), cc[1] + rr * np.sin(t)]), wd, col)
    for a1, a2 in [(0.3, 2.2), (2.5, 4.1), (4.4, 6.0)]: geo(a1, a2, 0.2, g.ink)
    # a tree: root at centre, children crowd toward the rim (the AI use)
    nodes = {0: c}
    for i, ang in enumerate([-0.6, 1.5, 3.6]):
        nodes[i + 1] = c + 0.52 * R * np.array([math.cos(ang), math.sin(ang)])
        g.path([c, nodes[i + 1]], g.lw * 1.2, g.col)
        for dd in (-0.38, 0.38):
            q = c + 0.86 * R * np.array([math.cos(ang + dd), math.sin(ang + dd)])
            g.path([nodes[i + 1], q], g.lw, g.col); g.dot(q, 0.42, g.col)
        g.dot(nodes[i + 1], 0.6, g.col)
    g.dot(c, 0.8, g.col)
    a = sq + np.array([s + 0.8, s * 0.35]); b = c + R * np.array([math.cos(2.75), math.sin(2.75)]) - [0.8, 0]
    g.arrow(a, b, 0.2, g.ink)
    return sq + [0, s * 0.5]
