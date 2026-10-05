# Leibniz: binary — the sum 22 + 13 = 100011 as an I Ching hexagram (solid 1, broken 0) → his chain rule run backwards (backprop)
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); T = y + 2.0; bw, gap = 10.0, 3.2
    bits = [1, 0, 0, 0, 1, 1]
    for i, b in enumerate(bits):
        yy = T + i * gap
        if b: g.path([[L, yy], [L + bw, yy]], 1.2, g.ink)
        else:
            g.path([[L, yy], [L + bw * 0.42, yy]], 1.2, g.ink); g.path([[L + bw * 0.58, yy], [L + bw, yy]], 1.2, g.ink)
    # three layers chained; gradient flows back
    X0 = L + bw + 3.2; nodes = [np.array([X0 + k * 3.6, T + 2.5 * gap]) for k in range(3)]
    for a, b in zip(nodes, nodes[1:]): g.path([a, b], g.lw, g.ink)
    for n in nodes: g.circle(n, 0.95, g.lw * 1.1, g.ink, fill="#FBF8F1")
    g.arrow(nodes[2] + [0.6, 3.6], nodes[0] + [-0.2, 3.6], g.lw * 1.5, g.col)
    return (L, T + 5.5 * gap)
