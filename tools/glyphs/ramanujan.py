# Ramanujan: his 1/π series — each term about eight more digits — a spiral closing in on π
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([max(x + 15.0, 48.0), y + h / 2 + 0.5])
    t = np.linspace(0, 1, 600); th = 2 * math.pi * 3.2 * t
    rr = 8.6 * np.exp(-3.0 * t) + 3.4
    P = np.column_stack([c[0] + rr * np.cos(th + 1.9), c[1] + rr * np.sin(th + 1.9)])
    g.path(P, g.lw * 1.2, g.col)
    for k in range(6):                                  # one dot per term, each far closer
        i = int(len(t) * (k / 6) ** 0.8); g.dot(P[i], 0.65 - k * 0.05, g.ink)
    # π (≥ 3 mm), drawn as strokes
    s = 4.2; p = c - [s / 2, s / 2]
    g.path([p + [-0.3, 0.55], p + [0.3, 0.1], p + [s, 0.0], p + [s + 0.4, -0.25]], g.lw * 1.9, g.ink)
    g.path([p + [s * 0.32, 0.1], p + [s * 0.3, s * 0.6], p + [s * 0.12, s]], g.lw * 1.9, g.ink)
    g.path([p + [s * 0.72, 0.1], p + [s * 0.7, s * 0.85], p + [s * 0.82, s * 1.02], p + [s * 1.0, s * 0.9]], g.lw * 1.9, g.ink)
    return P[0]
