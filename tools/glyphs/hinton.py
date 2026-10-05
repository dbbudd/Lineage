# Hinton: a small 2-3-1 network; the error flows backwards (accent arrow) to adjust every weight
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    P = lambda u, v: np.array([x + u * w, y + v * h])
    L0 = [P(0.18, 0.24), P(0.18, 0.56)]
    L1 = [P(0.48, 0.10), P(0.48, 0.40), P(0.48, 0.70)]
    L2 = [P(0.80, 0.40)]
    ws = [1.4, 0.6, 1.0, 0.8, 1.6, 0.5]
    k = 0
    for a in L0:
        for b in L1:
            g.path([a, b], g.lw * ws[k], g.ink, opacity=0.8); k += 1
    for i, a in enumerate(L1):
        g.path([a, L2[0]], g.lw * (1.5 - 0.4 * i), g.ink, opacity=0.8)
    for p in L0 + L1: g.circle(p, 1.1, g.lw * 1.3, g.ink, fill="#FBF7F0")
    g.circle(L2[0], 1.3, g.lw * 1.4, g.ink, fill="#FBF7F0")
    # error at the output, sent backwards
    g.dot(P(0.96, 0.40), 0.6)
    g.path([L2[0] + np.array([1.4, 0]), P(0.96, 0.40)], g.lw, g.col)
    c = (P(0.18, 0.92) + P(0.80, 0.92)) / 2
    t = np.linspace(0, 1, 60)
    arc = [P(0.86, 0.58) * (1 - s) ** 2 + 2 * s * (1 - s) * (c + np.array([0, 2.0])) + P(0.12, 0.74) * s ** 2 for s in t]
    g.path(arc[:-3], g.lw * 1.5)
    g.arrow(arc[-6], arc[-1], g.lw * 1.5, head=1.4)
    return L0[1] - np.array([1.1, 0])
