# Musk: the booster comes back — a falling arc that must reach zero speed exactly at the droneship (the hoverslam)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    deck = np.array([x + w * 0.70, y + h - 1.6])
    start = np.array([x + 1.5, y + 1.0])
    t = np.linspace(0, 1, 120)
    ctrl = np.array([deck[0] + 2.0, start[1] - 2.0])
    arc = [(1 - v) ** 2 * start + 2 * (1 - v) * v * ctrl + v ** 2 * (deck + [0, -6.6]) for v in t]
    g.path(arc, g.lw * 1.3, g.col, dash="1.0 0.7")                          # the guided stopping curve
    k = 104; p = arc[k]; d = arc[k + 1] - arc[k]; d /= np.linalg.norm(d)          # flipping engine-first
    g.arrow(p - d * 0.2, p + d * 1.4, g.lw * 1.4, g.col)
    # the booster upright on the deck, engine lit
    bx, top, bot = deck[0], deck[1] - 6.4, deck[1] - 1.2
    g.rect(bx - 0.65, top, 1.3, bot - top, g.lw * 1.1, g.ink, fill=g.soft, rx=0.3)
    for s in (-1, 1):
        g.path([[bx + s * 0.65, bot - 1.2], [bx + s * 1.9, deck[1] - 0.15]], g.lw, g.ink)   # landing legs
        g.path([[bx + s * 0.65, top + 0.6], [bx + s * 1.3, top + 0.2]], g.lw, g.ink)          # grid fins
    g.path([[bx - 0.45, bot], [bx, bot + 1.0], [bx + 0.45, bot]], g.lw, g.col, fill=g.col)    # flame
    g.path([[deck[0] - 5.0, deck[1]], [deck[0] + 5.0, deck[1]]], g.lw * 1.6, g.ink)          # droneship
    g.path([[deck[0] - 4.2, deck[1] + 0.9], [deck[0] + 4.2, deck[1] + 0.9]], g.lw * 0.8, g.ink)
    sea = [[x + w * 0.42 + v * (w * 0.56), deck[1] + 1.6 + 0.25 * math.sin(v * 30)] for v in np.linspace(0, 1, 120)]
    g.path(sea, 0.18, g.ink, opacity=0.5)
    return start
