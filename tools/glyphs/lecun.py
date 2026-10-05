# LeCun: a 3×3 kernel sliding over an image → feature map → pooled map → a class (convolutional network)
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    def plane(c, s, sh=0.45):                             # a square seen slightly in perspective
        c = np.array(c); d = np.array([s * sh, -s * 0.35])
        return [c, c + (0, s), c + (0, s) + d, c + d]
    A = plane((x + 1.5, y + h * 0.30), 13.0)
    g.path(A, g.lw * 1.3, g.ink, close=True)
    # a handwritten stroke on the input
    t = np.linspace(0, 1, 60)
    stroke = [A[0] + (A[3] - A[0]) * (0.25 + 0.45 * s) + (A[1] - A[0]) * (0.2 + 0.6 * s ** 1.4 + 0.08 * np.sin(s * 6)) for s in t]
    g.path(stroke, g.lw * 2.2, g.ink, opacity=0.55)
    k0 = A[0] + (A[3] - A[0]) * 0.30 + (A[1] - A[0]) * 0.30   # the kernel
    kv, kh = (A[1] - A[0]) * 0.25, (A[3] - A[0]) * 0.25
    K = [k0, k0 + kv, k0 + kv + kh, k0 + kh]
    g.path(K, g.lw * 1.4, g.col, close=True, fill=g.soft)
    for f in (1 / 3, 2 / 3):
        g.path([k0 + kv * f, k0 + kv * f + kh], 0.16, g.col); g.path([k0 + kh * f, k0 + kh * f + kv], 0.16, g.col)
    B = plane((x + w * 0.52, y + h * 0.40), 8.0)
    g.path(B, g.lw * 1.2, g.ink, close=True)
    tgt = B[0] + (B[1] - B[0]) * 0.45 + (B[3] - B[0]) * 0.40
    for p in K: g.path([p, tgt], 0.18, g.col, opacity=0.8)
    g.dot(tgt, 0.5)
    C = plane((x + w * 0.80, y + h * 0.48), 4.4)
    g.path(C, g.lw * 1.1, g.ink, close=True)
    out = np.array([x + w + 0.2, y + h * 0.50])
    g.arrow(C[3] * 0.5 + C[2] * 0.5 + (0.6, 0.6), out, g.lw * 1.1)
    g.dot(out + (0.9, 0), 0.7)
    return A[1]
