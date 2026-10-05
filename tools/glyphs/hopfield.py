# Hopfield: memories are valleys in an energy landscape; a noisy state rolls downhill until a memory is recalled
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    x0, x1 = x + 1.5, x + w - 1.0; base = y + h - 0.5
    u = np.linspace(0, 1, 300)
    E = 0.78 - 0.30 * np.exp(-((u - 0.18) / 0.08) ** 2) + 0.05 * np.exp(-((u - 0.40) / 0.07) ** 2) \
        - 0.62 * np.exp(-((u - 0.68) / 0.11) ** 2) + 0.10 * u
    land = np.column_stack([x0 + u * (x1 - x0), base - E * h * 0.62])
    g.path(land, g.lw * 1.3, color=g.ink)
    imin = int(np.argmax(land[:, 1]))                                  # the deep valley = a stored memory
    ish = int(np.argmax(land[:120, 1]))                                # a shallow, spurious valley
    g.dot(land[ish] + [0, -0.9], 0.45, color=g.ink, opacity=0.6)
    istart = 118
    ball0 = land[istart] + [0, -1.0]
    g.circle(ball0, 0.9, g.lw * 0.8, color=g.ink, opacity=0.55)
    seg = land[istart:imin + 1] + [0, -2.0]
    g.arrow(seg[3], seg[-12], g.lw * 1.4)
    g.dot(land[imin] + [0, -1.0], 1.0)
    # the recalled memory: a crisp ±1 pattern above the valley
    cx = land[imin][0]; top = y + 0.6; n = 5; c = 1.25
    pat = ["..#..", ".###.", "#####", ".###.", "..#.."]
    for i in range(n):
        for j in range(n):
            on = pat[i][j] == "#"
            g.rect(cx - n * c / 2 + j * c, top + i * c, c * 0.84, c * 0.84, 0.18, color=g.ink, fill=g.ink if on else "none", opacity=0.85 if on else 0.35)
    return land[0]
