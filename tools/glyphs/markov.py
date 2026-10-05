# Markov: Eugene Onegin as a two-state chain (vowel ↔ consonant) generating a sequence → predicting the next token
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); R = x + w - 1.5; T = y + 1.0
    V = np.array([L + 6.5, T + 7.5]); C = np.array([R - 6.5, T + 7.5]); rr = 3.0
    g.circle(V, rr, g.lw * 1.4, g.ink, fill=g.soft, opacity=1); g.circle(C, rr, g.lw * 1.4, g.ink)
    def bez(a, c, b, wd, col, arrow=True):
        u = np.linspace(0, 1, 40)[:, None]; pts = (1 - u) ** 2 * a + 2 * (1 - u) * u * c + u ** 2 * b
        g.path(pts[:-2], wd, col)
        if arrow: g.arrow(pts[-8], pts[-1], max(wd, 0.4), col, head=1.6)
    m = (V + C) / 2
    bez(V + [1.6, -2.6], m + [0, -6.0], C + [-1.6, -2.7], g.lw * 2.2, g.ink)     # vowel → consonant (87%)
    bez(C + [-1.6, 2.6], m + [0, 6.0], V + [1.6, 2.7], g.lw * 1.6, g.ink)        # consonant → vowel (66%)
    def loop(p, side, wd):                             # self loop on the outer side
        a = np.linspace(-0.75, 0.75, 2)
        a0, a1 = (math.pi - 0.7, math.pi + 0.7) if side < 0 else (0.7, -0.7)
        s0 = p + rr * np.array([math.cos(a0), math.sin(a0)]); s1 = p + rr * np.array([math.cos(a1), math.sin(a1)])
        o = p + [side * (rr + 4.0), 0]
        u = np.linspace(0, 1, 40)[:, None]
        c0 = s0 + [side * 5.0, -4.5]; c1 = s1 + [side * 5.0, 4.5]
        pts = (1 - u) ** 3 * s0 + 3 * (1 - u) ** 2 * u * c0 + 3 * (1 - u) * u ** 2 * c1 + u ** 3 * s1
        g.path(pts[:-2], wd, g.ink); g.arrow(pts[-8], pts[-1], max(wd, 0.3), g.ink, head=1.3)
    loop(V, -1, 0.2)                                   # vowel → vowel, rare
    loop(C, 1, g.lw * 1.2)                             # consonant → consonant
    seq = [0, 1, 1, 0, 1, 0, 1, 1, 0]                  # a generated run: filled vowel, open consonant
    yy = T + 18.5; sp = (R - L - 3.0) / len(seq)
    for i, v in enumerate(seq):
        g.circle([L + 1 + i * sp, yy], 0.75, 0.2, g.ink, fill=g.soft if v == 0 else "none")
    nx = L + 1 + len(seq) * sp
    g.arrow([nx - sp + 1.0, yy], [nx - 0.6, yy], g.lw * 1.3, g.col); g.dot([nx + 0.4, yy], 0.85, g.col)
    return (L + 0.2, yy)
