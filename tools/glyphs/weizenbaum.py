# Weizenbaum: ELIZA reflecting your words back — a typed line, the same words returned as a question (the ELIZA effect)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    def bubble(x0, y0, bw, bh, tail_left, col, wid):
        r = 1.2
        pts = []
        for cx, cy, a0 in ((x0 + bw - r, y0 + r, -90), (x0 + bw - r, y0 + bh - r, 0), (x0 + r, y0 + bh - r, 90), (x0 + r, y0 + r, 180)):
            pts += [(cx + r * math.cos(math.radians(a0 + k * 15)), cy + r * math.sin(math.radians(a0 + k * 15))) for k in range(7)]
        g.path(pts, wid, col, close=True)
        if tail_left: g.path([(x0 + 2.0, y0 + bh), (x0 + 0.6, y0 + bh + 1.8), (x0 + 3.4, y0 + bh)], wid, col)
        else: g.path([(x0 + bw - 2.0, y0 + bh), (x0 + bw - 0.6, y0 + bh + 1.8), (x0 + bw - 3.4, y0 + bh)], wid, col)
    words = [3.2, 2.0, 4.0]
    ux, uy, bw, bh = x + 1.5, y + 2.0, 14.0, 4.6
    bubble(ux, uy, bw, bh, True, g.ink, g.lw * 1.3)
    cx = ux + 1.6
    for ww in words:
        g.path([(cx, uy + bh / 2), (cx + ww, uy + bh / 2)], g.lw * 2.2, g.ink); cx += ww + 1.0
    # ELIZA's reply: the same words, mirrored, ending in a question
    rx, ry = x + w - bw - 1.0, y + h * 0.56
    bubble(rx, ry, bw, bh, False, g.col, g.lw * 1.3)
    cx = rx + bw - 1.6
    for ww in words:
        g.path([(cx, ry + bh / 2), (cx - ww, ry + bh / 2)], g.lw * 2.2, g.col); cx -= ww + 1.0
    g.dot((rx + 1.6, ry + bh / 2), 0.5)
    # the reflection between them
    t = np.linspace(0, 1, 50)
    a, b, c = np.array([ux + bw + 0.8, uy + bh / 2]), np.array([x + w - 1.5, uy + bh / 2 + 0.5]), np.array([rx + bw - 3.0, ry - 0.8])
    arc = [(1 - s) ** 2 * a + 2 * s * (1 - s) * b + s ** 2 * c for s in t]
    g.path(arc, g.lw * 1.1, g.col, dash="0.8 0.6")
    g.arrow(arc[-5], arc[-1], g.lw * 1.1, head=1.2)
    return (ux, uy + bh / 2)
