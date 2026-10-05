# Turing: a tape of squares with a read/write head → the tape read as tokens by a small network (universal machine)
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    P = lambda u, v: np.array([x + u * w, y + v * h])
    n, cw = 6, 2.8
    x0, ty = x + 4.5, y + h * 0.30
    marks = [1, 0, 1, 1, 0, 1]
    g.path([(x0 - 1.2, ty), (x0 + n * cw + 0.6, ty)], g.lw * 0.7, g.ink, opacity=0.6)
    g.path([(x0 - 1.2, ty + cw), (x0 + n * cw + 0.6, ty + cw)], g.lw * 0.7, g.ink, opacity=0.6)
    for i in range(n + 1):
        g.path([(x0 + i * cw, ty), (x0 + i * cw, ty + cw)], g.lw * 1.2, g.ink)
    for i, m in enumerate(marks):
        c = (x0 + (i + .5) * cw, ty + cw / 2)
        if m: g.dot(c, 0.62, g.ink)
        else: g.circle(c, 0.62, g.lw * 0.8, g.ink)
    hx = x0 + 2.5 * cw                                    # the head over square 3
    g.path([(hx - 1.6, ty - 4.2), (hx + 1.6, ty - 4.2), (hx + 1.6, ty - 2.2), (hx, ty - 0.6), (hx - 1.6, ty - 2.2)], g.lw * 1.5, g.ink, close=True)
    g.arrow((hx + 2.6, ty - 3.2), (hx + 6.2, ty - 3.2), g.lw * 1.1, g.ink)
    # AI step: the tape fed as tokens into a tiny network
    ex = x0 + n * cw + 1.2
    hid = [P(0.92, 0.36), P(0.92, 0.56), P(0.92, 0.76)]
    out = P(1.0, 0.56)
    src = (ex, ty + cw / 2)
    for p in hid:
        g.path([src, p], g.lw * 0.8); g.path([p, out], g.lw * 0.8)
        g.dot(p, 0.6)
    g.dot(src, 0.5); g.dot(out, 0.75)
    return (x0 - 1.2, ty + cw / 2)
