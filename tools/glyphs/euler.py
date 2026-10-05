# Euler: Königsberg reduced to 4 dots and 7 edges; every dot has odd degree → graph networks learn on such graphs
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); T = y + 1.5; sx, sy = 20.0, 18.0
    P = [np.array([L + (u - 0.24) / 1.0 * sx, T + v * sy]) for u, v in [(0.24, 0.5), (0.74, 0.07), (0.74, 0.93), (1.24, 0.5)]]
    def edge(a, b, bend, col, wd):
        a, b = P[a], P[b]; m = (a + b) / 2; d = b - a; n = np.array([-d[1], d[0]]) / np.linalg.norm(d)
        c = m + n * bend; u = np.linspace(0, 1, 40)[:, None]
        g.path((1 - u) ** 2 * a + 2 * (1 - u) * u * c + u ** 2 * b, wd, col)
    for a, b, bd in [(0, 1, 2.2), (0, 1, -2.2), (0, 2, 2.2), (0, 2, -2.2), (0, 3, 0), (1, 3, 0), (2, 3, 0)]:
        edge(a, b, bd, g.col, g.lw * 1.4)
    for i, p in enumerate(P):
        g.dot(p, 1.05 if i == 0 else 0.8, g.ink)
        g.circle(p, 1.7 if i == 0 else 1.4, 0.2, g.col, opacity=0.6)   # odd degree halo
    return P[0] - np.array([1.4, 0])
