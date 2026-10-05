# Perlman: spanning tree — bridges elect a root, keep one shortest path each, and block the links that would loop
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    P = lambda u, v: np.array([x + u * w, y + v * h])
    N = [P(0.55, 0.10), P(0.25, 0.42), P(0.82, 0.38), P(0.12, 0.88), P(0.48, 0.70), P(0.88, 0.88)]
    tree = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5)]
    blocked = [(4, 2), (3, 4), (4, 5)]
    for a, b in blocked:
        g.path([N[a], N[b]], g.lw * 0.9, g.ink, opacity=0.5, dash="0.7 0.7")
        m = (N[a] + N[b]) / 2; d = (N[b] - N[a]) / np.linalg.norm(N[b] - N[a]); n = np.array([-d[1], d[0]])
        g.path([m - n * 0.9, m + n * 0.9], g.lw * 1.2, g.ink)                       # blocked port
    for a, b in tree:
        g.path([N[a], N[b]], g.lw * 1.6, g.col)
    for i, p in enumerate(N):
        if i == 0:
            g.circle(p, 1.7, g.lw * 1.4, g.col, fill=g.col)
            g.circle(p, 2.7, g.lw * 0.8, g.col)
        else:
            g.rect(p[0] - 1.3, p[1] - 0.9, 2.6, 1.8, g.lw * 1.2, g.ink, fill=g.soft, rx=0.3)
    return N[3] - [1.3, 0]
