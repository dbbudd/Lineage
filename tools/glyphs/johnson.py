# Katherine Johnson: an orbit computed step by step — big Euler steps drift off, the true orbit holds; she checked the numbers
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    E = np.array([max(x + 12.5, 45.5), y + h / 2 + 3.5]); R0 = 5.4
    g.circle(E, 2.6, g.lw * 1.2, g.ink, fill=g.soft)
    g.circle(E, R0, g.lw * 1.6, g.col)                 # the true orbit
    p = np.array([-1.0, 0.0]); v = np.array([0.0, -1.0]); hs = 0.55; pts = [p.copy()]
    for _ in range(12):                                 # Euler's method, big step: spirals outward
        a = -p / np.linalg.norm(p) ** 3; p = p + hs * v; v = v + hs * a; pts.append(p.copy())
    pts = [E + q * R0 for q in pts]
    pts = [q for q in pts if x + 3 < q[0] < x + w - 0.5 and y - 0.5 < q[1] < y + h + 1.5]
    g.path(pts, 0.22, g.ink, dash="0.7 0.5")
    for q in pts[1:]: g.dot(q, 0.42, g.ink)
    cap = E + R0 * np.array([math.cos(-0.6), math.sin(-0.6)])
    g.dot(cap, 0.85, g.col)
    ck = np.array([x + w - 7.0, y + h - 1.0])          # checked by hand
    g.path([ck, ck + [1.1, 1.1], ck + [3.2, -1.6]], g.lw * 1.7, g.col)
    return pts[0]
