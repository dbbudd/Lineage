# Babbage: Difference Engine — three columns of figure wheels, each adding into its neighbour (f += Δ¹, Δ¹ += Δ²)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    n, cw, rx, ry = 4, w / 3.3, 2.7, 0.9
    xs = [x + w * 0.2 + i * cw for i in range(3)]
    for i, cx in enumerate(xs):
        top, bot = y + 2.0, y + h - 5.5
        g.path([[cx, top - 1.2], [cx, bot + 1.6]], g.lw * 1.1, g.ink)      # axle
        for k in range(n):
            cy = top + k * (bot - top) / (n - 1)
            e = [[cx + rx * math.cos(a), cy + ry * math.sin(a)] for a in np.linspace(0, 2 * math.pi, 60)]
            g.path(e, g.lw * 1.1, g.ink, fill=g.soft, close=True)
            for m in range(5):                                              # digit ticks on the rim
                a = math.pi * (0.15 + 0.7 * m / 4)
                p = [cx + rx * math.cos(a), cy + ry * math.sin(a)]
                g.path([p, [p[0], p[1] + 0.9]], 0.16, g.ink, opacity=0.7)
    ym = y + h * 0.45
    for i in (2, 1):                                                        # add arrows: right column into the left one
        g.arrow([xs[i] - rx - 0.3, ym - 1.5], [xs[i - 1] + rx + 0.6, ym - 1.5], g.lw * 1.3, g.col)
    # the crank
    c = np.array([xs[2] + rx + 1.6, y + h - 4.0]); g.circle(c, 1.4, g.lw, g.ink); g.dot(c + [1.0, -1.0], 0.45, g.ink)
    return [xs[0] - rx - 0.3, y + h - 5.5]
