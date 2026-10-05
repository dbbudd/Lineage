# Hopper: an English-like statement (word blocks) compiled down to machine code (bits); AI turns English into code
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    wx, wy = x + 3.0, y + 2.6
    widths = [4.6, 2.6, 5.4, 3.2]
    cx = wx
    for i, ww in enumerate(widths):
        g.rect(cx, wy, ww, 2.6, g.lw * 1.2, g.ink, rx=1.0)
        cx += ww + 1.0
    sx = wx + (cx - wx) / 2
    g.arrow((sx, wy + 3.8), (sx, wy + 8.0), g.lw * 1.5)
    bits = [[1,0,1,1,0,0,1,0,1], [0,1,1,0,1,0,0,1,1], [1,1,0,0,1,0,1,1,0]]
    bs = 1.75; bx0 = sx - 9 * bs / 2; by0 = wy + 9.3
    for j, row in enumerate(bits):
        for i, b in enumerate(row):
            px, py = bx0 + i * bs, by0 + j * bs
            if b: g.rect(px + .2, py + .2, bs - .4, bs - .4, 0.14, g.ink, fill=g.ink)
            else: g.rect(px + .25, py + .25, bs - .5, bs - .5, g.lw * 0.6, g.ink, opacity=0.6)
    return (wx, wy + 1.3)
