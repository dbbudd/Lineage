# Tu Youyou: sweet wormwood → artemisinin with its fragile peroxide bridge kept intact → AI screens a library of molecules
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    rng = np.random.default_rng(523)
    # a sprig of wormwood: stem with feathery leaflets
    s0 = np.array([x + 3.0, y + h - 3.5]); s1 = np.array([x + 7.0, y + 1.5])
    u = np.linspace(0, 1, 40); stem = s0 + (s1 - s0) * u[:, None] + np.column_stack([1.2 * np.sin(u * math.pi), 0 * u])
    g.path(stem, g.lw * 0.9, color=g.ink)
    for i, t in enumerate(np.linspace(0.15, 0.95, 7)):
        p = stem[int(t * 39)]; s = 1 if i % 2 else -1; L = 2.6 * (1.1 - t * 0.5)
        a = -math.pi / 2 + s * 0.9
        q = p + L * np.array([math.cos(a), math.sin(a)])
        g.path([p, (p + q) / 2 + np.array([0, -0.4]), q], g.lw * 0.7, color=g.ink, opacity=0.8)
    # the molecule: two fused hexagons + the O–O bridge arched over them
    C = np.array([x + w * 0.47, y + h * 0.56]); R = 2.7
    def hexa(c): return [c + R * np.array([math.cos(math.pi / 6 + k * math.pi / 3), math.sin(math.pi / 6 + k * math.pi / 3)]) for k in range(7)]
    c1, c2 = C - [R * 0.866, 0], C + [R * 0.866, 0]
    g.path(hexa(c1), g.lw * 1.0, color=g.ink); g.path(hexa(c2), g.lw * 1.0, color=g.ink)
    a, b = c1 + R * np.array([0, -1]), c2 + R * np.array([0, -1])
    o1, o2 = a + [0.9, -2.6], b + [-0.9, -2.6]
    g.path([a, o1, o2, b], g.lw * 1.6)                                  # the peroxide bridge
    g.dot(o1, 0.6); g.dot(o2, 0.6)
    # the library: scattered molecules, one picked out
    L0 = np.array([x + w * 0.83, y + h * 0.48])
    pts = [L0 + np.array([rng.normal(0, 2.0), rng.normal(0, 2.6)]) for _ in range(16)]
    for p in pts: g.dot(p, 0.38, color=g.ink, opacity=0.45)
    pick = pts[3]
    g.circle(pick, 1.2, g.lw * 1.2); g.dot(pick, 0.5)
    return s0
