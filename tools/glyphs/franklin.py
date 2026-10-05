# Franklin: Photo 51's X-shaped diffraction pattern → (AlphaFold learned from X-ray data) → a folded protein chain
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([x + w - 8.0, y + 6.8]); R = 5.6
    g.circle(c, R, g.lw * 0.9, g.ink)                                   # the photographic plate
    for k in range(1, 5):                                               # the X: layer lines along two crossing arms
        for sx in (-1, 1):
            for sy in (-1, 1):
                p = c + np.array([sx * 0.85 * k, sy * 1.05 * k])
                g.path([p - [0.55, 0], p + [0.55, 0]], g.lw * 1.4, g.col)
    g.dot(c, 0.55, g.col)
    g.path([c + [-2.4, -R * 0.82], c + [2.4, -R * 0.82]], g.lw * 1.4, g.col, opacity=0.6)   # the strong meridian arcs
    g.path([c + [-2.4, R * 0.82], c + [2.4, R * 0.82]], g.lw * 1.4, g.col, opacity=0.6)
    # arrow down to a protein chain folding into shape
    g.arrow(c + [0, R + 0.8], c + [0, R + 4.0], g.lw * 1.3, g.col)
    f = c + np.array([0, R + 8.2])
    fold = [f + 3.2 * np.array([math.cos(t), math.sin(t)]) * (0.55 + 0.45 * math.cos(3 * t)) for t in np.linspace(0, 2 * math.pi * 0.92, 40)]
    g.path(fold, g.lw * 1.5, g.col)
    for p in fold[::5]: g.dot(p, 0.45, g.col)
    return c + np.array([-R, 0])                                        # the portrait's line arrives at the plate
