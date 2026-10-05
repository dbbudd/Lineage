# Curie: decay halving every half-life (steps) → a smooth fall that flattens into a training-loss curve
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    ox, oy = x + 4.0, y + h - 2.0; W, Hh = w - 5.0, h - 3.5
    g.path([[ox, oy - Hh], [ox, oy], [ox + W, oy]], g.lw * 0.8, color=g.ink)
    T = W / 5.2                                                         # half-life
    pts = []; n = 1.0
    for k in range(5):
        pts += [[ox + k * T, oy - Hh * n], [ox + (k + 1) * T, oy - Hh * n]]; n /= 2
        g.dot([ox + k * T, oy - Hh * n * 2], 0.42, color=g.ink)
    stair = []
    for i in range(0, len(pts), 2):
        stair += [pts[i], pts[i + 1]]
        if i + 2 < len(pts): stair.append([pts[i + 1][0], pts[i + 2][1]])
    g.path(stair, g.lw * 0.9, color=g.ink, opacity=0.6)
    u = np.linspace(0, W, 200)
    expo = oy - Hh * 0.5 ** (u / T)
    power = oy - Hh * (1 + u / T * 1.6) ** -1.15
    mix = np.clip((u - T * 1.0) / (T * 2.5), 0, 1)
    curve = np.column_stack([ox + u, expo * (1 - mix) + power * mix])
    g.path(curve, g.lw * 1.6)
    g.dot(curve[-1], 0.55)
    return [ox, oy - Hh]
