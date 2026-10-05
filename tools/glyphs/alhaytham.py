# Ibn al-Haytham: a flame's straight rays cross at a pinhole and land upside down on the wall → read as pixels
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    cy = y + h * 0.34
    fx = x + 3.5
    top, bot = np.array([fx, cy - 4.5]), np.array([fx, cy + 3.0])       # the candle: flame tip, base
    flame = [top + [0.0, 0.0], top + [1.1, 1.8], top + [0.6, 3.1], top + [0.0, 3.4], top + [-0.6, 3.1], top + [-1.1, 1.8], top]
    g.path(flame, g.lw * 0.9, color=g.ink, fill=g.soft, close=True)
    g.rect(fx - 0.9, cy - 1.0, 1.8, 4.0, g.lw * 0.9, color=g.ink)
    hx = x + w * 0.42; P = np.array([hx, cy])                          # pinhole wall
    g.path([[hx, y + 0.5], [hx, cy - 0.5]], g.lw * 1.4, color=g.ink)
    g.path([[hx, cy + 0.5], [hx, y + h - 0.5]], g.lw * 1.4, color=g.ink)
    wx = x + w - 6.0
    for s in (top + [0, 1.4], bot):
        d = P - s; e = P + d * (wx - hx) / d[0]
        g.path([s, e], g.lw * 0.9, color=g.col)
    yt = cy + (cy - (top[1] + 1.4)) * (wx - hx) / (hx - fx); yb = cy - (bot[1] - cy) * (wx - hx) / (hx - fx)
    g.path([[wx, y + 0.5], [wx, y + h - 0.5]], g.lw * 0.7, color=g.ink, opacity=0.6)
    n = 5; ch = (yt - yb) / n; cw = ch                                  # the upside-down image, as a pixel column grid
    for i in range(n):
        for j in range(2):
            on = (i, j) in [(0, 0), (1, 0), (1, 1), (2, 1), (3, 0), (4, 0), (4, 1)]
            g.rect(wx + 0.4 + j * cw, yb + i * ch, cw * 0.86, ch * 0.86, g.lw * 0.6, fill=g.col if on else "none", opacity=0.85 if on else 0.6)
    return [fx - 0.9, cy + 2.6]
