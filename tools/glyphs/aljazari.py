# al-Jazari: the peg drum — pegs on a turning drum lift a lever and the drummer strikes; move the pegs, change the tune
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    dx, dy, dw, dh = x + w - 19.0, y + h * 0.30, 12.0, h * 0.32     # drum seen from the side
    ey = dh / 2
    g.path([[dx, dy], [dx + dw, dy]], g.lw * 1.3, g.ink); g.path([[dx, dy + dh], [dx + dw, dy + dh]], g.lw * 1.3, g.ink)
    for ex, op in ((dx, 1), (dx + dw, 1)):
        e = [[ex + 1.4 * math.cos(a), dy + ey + ey * math.sin(a)] for a in np.linspace(-math.pi / 2, math.pi / 2 if ex > dx else 1.5 * math.pi, 50)]
        g.path(e, g.lw * 1.3, g.ink)
    g.path([[dx - 3.0, dy + ey], [dx + dw + 3.0, dy + ey]], g.lw * 0.8, g.ink, opacity=0.6)   # axle
    pegs = [(0.12, 0.25), (0.30, 0.70), (0.42, 0.20), (0.58, 0.55), (0.72, 0.30), (0.88, 0.75), (0.20, 0.50), (0.66, 0.85)]
    for u, v in pegs:
        g.dot([dx + dw * u, dy + dh * v], 0.5, g.col)
    # one peg at the top edge lifts a lever; the drummer's arm falls and strikes
    p = np.array([dx + dw * 0.58, dy]); g.dot(p, 0.6, g.col)
    piv = np.array([dx + dw * 0.58 + 5.0, dy - 3.0])
    g.path([p + [0, -0.4], piv + [-0.2, 0.1]], g.lw * 1.3, g.ink); g.dot(piv, 0.5, g.ink)
    tip = piv + [-1.0, -5.0]
    g.path([piv, tip], g.lw * 1.3, g.ink); g.circle(tip, 0.9, g.lw * 1.2, g.ink, fill=g.soft)
    dr = np.array([tip[0] + 4.0, y + h * 0.12])                            # the drum being struck
    g.rect(tip[0] + 1.4, tip[1] - 2.2, 3.6, 2.4, g.lw, g.ink, fill=g.soft)
    g.arrow(tip + [-2.6, 2.8], tip + [-1.2, 0.8], g.lw * 1.2, g.col)
    return [dx - 1.4, dy + dh]
