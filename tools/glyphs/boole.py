# Boole: (A AND B) OR NOT C as a gate circuit → the output lamp; billions of such gates make AI chips
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); T = y + 2.0
    def and_gate(p, s):                                # D shape, p = left-middle
        t = np.linspace(-math.pi / 2, math.pi / 2, 30)
        arc = [p + [s * 0.5 + s * 0.5 * math.cos(a), s * 0.5 * math.sin(a)] for a in t]
        g.path([p + [s * 0.5, s * 0.5], p + [0, s * 0.5], p + [0, -s * 0.5], p + [s * 0.5, -s * 0.5]], g.lw * 1.3, g.ink)
        g.path(arc, g.lw * 1.3, g.ink); return p + [s, 0]
    def or_gate(p, s):
        u = np.linspace(0, 1, 30)
        back = [p + [s * 0.25 * math.sin(math.pi * v), -s * 0.5 + s * v] for v in u]
        top = [p + [s * v, -s * 0.5 + s * 0.5 * v ** 1.6] for v in u]
        bot = [p + [s * v, s * 0.5 - s * 0.5 * v ** 1.6] for v in u]
        for q in (back, top, bot): g.path(q, g.lw * 1.3, g.ink)
        return p + [s, 0]
    def not_gate(p, s):
        g.path([p + [0, -s * 0.45], p + [s * 0.8, 0], p + [0, s * 0.45]], g.lw * 1.3, g.ink, close=True)
        g.circle(p + [s * 0.8 + 0.55, 0], 0.55, g.lw * 1.1, g.ink); return p + [s * 0.8 + 1.1, 0]
    s = 5.0; ia, ib, ic = [L, T + 1.5], [L, T + 5.0], [L, T + 15.5]
    ao = and_gate(np.array([L + 4.5, T + 3.25]), s)
    no = not_gate(np.array([L + 4.5, T + 15.5]), s * 0.8)
    for p, q in [(ia, [L + 4.5, T + 1.5]), (ib, [L + 4.5, T + 5.0]), (ic, [L + 4.5, T + 15.5])]:
        g.path([p, q], g.lw, g.col); g.dot(p, 0.6, g.col)
    op = np.array([L + 13.5, T + 9.4]); oo = or_gate(op, s)
    g.path([ao, [ao[0] + 1.2, ao[1]], [ao[0] + 1.2, op[1] - 1.6], [op[0] + 0.9, op[1] - 1.6]], g.lw, g.col)
    g.path([no, [ao[0] + 1.2, no[1]], [ao[0] + 1.2, op[1] + 1.6], [op[0] + 0.9, op[1] + 1.6]], g.lw, g.col)
    lamp = oo + [3.0, 0]
    g.path([oo, lamp - [1.2, 0]], g.lw * 1.3, g.col)
    g.dot(lamp, 1.2, g.col); g.circle(lamp, 2.0, 0.2, g.col, opacity=0.6)
    return ic
