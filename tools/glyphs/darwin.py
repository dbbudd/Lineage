# Darwin: the branching tree of descent; one lineage carried forward by selection (genetic algorithm)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    root = np.array([x + 3.0, y + h * 0.62])
    segs = []
    def grow(p, ang, L, d, best):
        if d == 0: segs.append((p, None, best)); return
        for k, s in enumerate((-1, 1)):
            a = ang + s * (0.55 - 0.06 * (4 - d))
            q = p + L * np.array([math.cos(a), math.sin(a)])
            b = best and ((d % 2 == 0) == (k == 0))
            segs.append((p, q, b)); grow(q, a * 0.55, L * 0.78, d - 1, b)
    grow(root, 0.0, 7.0, 4, True)
    for p, q, b in segs:
        if q is None: continue
        mid = (p + q) / 2 + np.array([0, 0]); pts = [p, [mid[0], q[1] * 0.0 + p[1] * 0.0 + q[1]], q]
        g.path([p, [p[0] + (q[0] - p[0]) * 0.35, q[1]], q], g.lw * (1.5 if b else 0.8), color=g.col if b else g.ink, opacity=1 if b else 0.75)
    for p, q, b in segs:
        if q is None:
            if b: g.dot(p, 0.75)
            else: g.circle(p, 0.42, g.lw * 0.7, color=g.ink, opacity=0.7)
    return root
