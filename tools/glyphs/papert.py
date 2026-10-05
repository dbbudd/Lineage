# Papert: the Logo turtle drawing a five-point star — forward, turn, repeat; the turns add to two whole turns
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([x + w * 0.56, y + h * 0.48]); R = h * 0.44
    V = [c + R * np.array([math.cos(-math.pi / 2 + k * 4 * math.pi / 5), math.sin(-math.pi / 2 + k * 4 * math.pi / 5)]) for k in range(5)]
    g.path(V, g.lw * 1.5, g.ink, close=True)
    for p in V: g.dot(p, 0.45, g.ink)
    # the turtle at the top point, turning onto the next edge
    p = V[0]; d_in = V[0] - V[4]; d_in /= np.linalg.norm(d_in); d = V[1] - V[0]; d /= np.linalg.norm(d)
    a0, a1 = math.atan2(d_in[1], d_in[0]), math.atan2(d[1], d[0])
    if a1 < a0: a1 += 2 * math.pi
    arc = [p + 3.0 * np.array([math.cos(a), math.sin(a)]) for a in np.linspace(a0, a1, 50)]
    g.path(arc, g.lw * 1.1, dash="0.9 0.6")
    hp = V[0] + d * 4.2; n = np.array([-d[1], d[0]])
    g.path([hp + d * 2.0, hp - d * 1.0 + n * 1.5, hp - d * 1.0 - n * 1.5], g.lw * 0.8, g.col, close=True, fill=g.col)
    return V[4]
