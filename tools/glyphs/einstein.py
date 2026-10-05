# Einstein: a grain kicked by unseen molecules → its random walk → mean-squared distance grows in a straight line (diffusion)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    rng = np.random.default_rng(1905)
    S = np.array([x + w * 0.36, y + h * 0.48])
    for _ in range(14):                                                # molecules
        a = rng.uniform(0, 2 * math.pi); d = rng.uniform(6.5, 9.5)
        g.dot(S + d * np.array([math.cos(a), math.sin(a) * 0.95]), 0.32, color=g.ink, opacity=0.35)
    steps = rng.normal(0, 1.0, (46, 2)); walk = np.cumsum(np.vstack([[0, 0], steps]), axis=0)
    walk = walk - walk.mean(0); walk = walk / np.abs(walk).max(0) * [5.5, 6.5]; walk = S + walk
    g.path(walk, g.lw * 0.9, color=g.ink)
    g.circle(walk[-1], 1.0, g.lw * 1.1, color=g.ink, fill=g.soft)      # the grain
    g.dot(S, 0.45, color=g.ink)
    ox, oy = x + w * 0.66, y + h * 0.92                                # <r²> vs t
    g.path([[ox, oy - h * 0.62], [ox, oy], [ox + w * 0.36, oy]], g.lw * 0.7, color=g.ink)
    g.arrow([ox, oy], [ox + w * 0.33, oy - h * 0.55], g.lw * 1.5)
    for i in range(1, 6):
        t = i / 6; jit = (rng.random() - 0.5) * 1.2
        g.dot([ox + w * 0.33 * t, oy - h * 0.55 * t + jit], 0.35, color=g.ink, opacity=0.7)
    return walk[0]
