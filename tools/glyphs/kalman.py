# Kálmán: noisy measurements scattered around a hidden path; the estimate threads them, its uncertainty shrinking
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    rng = np.random.default_rng(7)
    t = np.linspace(0, 1, 200)
    path = lambda v: np.array([x + 1.5 + v * (w - 3.0), y + h * 0.78 - v * h * 0.55 - math.sin(v * math.pi) * h * 0.18])
    g.path([path(v) for v in t], g.lw * 0.8, g.ink, opacity=0.55, dash="0.6 0.6")      # the hidden truth
    N = 7; est = []
    for i in range(N):
        v = (i + 0.5) / N; p = path(v)
        meas = p + rng.normal(0, 1.5, 2)
        g.path([meas - [0.5, 0.5], meas + [0.5, 0.5]], g.lw * 0.9, g.ink); g.path([meas - [0.5, -0.5], meas + [0.5, -0.5]], g.lw * 0.9, g.ink)
        e = p + (meas - p) * 0.25 * (1 - v); est.append(e)
        rx, ry = 2.6 * (1 - 0.75 * v), 1.6 * (1 - 0.7 * v)                  # uncertainty ellipse, shrinking
        ang = -0.55
        el = [e + [rx * math.cos(a) * math.cos(ang) - ry * math.sin(a) * math.sin(ang), rx * math.cos(a) * math.sin(ang) + ry * math.sin(a) * math.cos(ang)] for a in np.linspace(0, 2 * math.pi, 50)]
        g.path(el, g.lw * 0.8, g.col, opacity=0.6, fill=g.soft)
    g.path(est, g.lw * 1.5, g.col)
    for e in est: g.dot(e, 0.45, g.col)
    return path(0)
