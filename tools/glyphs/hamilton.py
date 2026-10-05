# Hamilton: Apollo's priority scheduler — keep the vital jobs, shed the low ones on overload → a safe landing
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    bx, by, bw = x + 2.0, y + 3.0, w * 0.34
    lens = [1.0, 0.85, 0.7, 0.55, 0.45]
    for i, l in enumerate(lens):
        yy = by + i * 2.6
        if i < 3:
            g.path([(bx, yy), (bx + bw * l, yy)], g.lw * 2.6, g.ink)
        else:                                             # shed: dashed, sliding away
            g.path([(bx + 1.5 * (i - 2), yy + 0.6 * (i - 2)), (bx + 1.5 * (i - 2) + bw * l, yy + 0.6 * (i - 2))], g.lw * 1.3, g.ink, dash="0.8 0.7", opacity=0.6)
    lim = by + 2 * 2.6 + 1.3                              # overload line
    g.path([(bx - 0.8, lim), (bx + bw + 0.8, lim)], 0.2, g.col, opacity=0.8)
    a = np.array([bx + bw + 2.5, by - 1.2])               # alarm triangle
    g.path([a + (0, -1.4), a + (1.4, 1.0), a + (-1.4, 1.0)], g.lw * 1.2, g.col, close=True)
    g.dot(a + (0, 0.35), 0.25)
    # AI step: descent to a safe landing
    gy = y + h * 0.88
    t = np.linspace(0, 1, 100)
    x0, x1 = x + w * 0.52, x + w - 1.5
    traj = [(x0 + (x1 - x0) * s, (y + 2.5) + (gy - 1.2 - y - 2.5) * math.sin(s * math.pi / 2) ** 0.8) for s in t]
    g.path(traj, g.lw * 1.5)
    g.path([(x0 + 3, gy), (x + w + 0.3, gy)], g.lw, g.ink)
    lp = np.array(traj[-1])
    g.path([lp + (-1.2, 1.2), lp + (-0.6, 0), lp + (0.6, 0), lp + (1.2, 1.2)], g.lw * 1.1)
    g.dot(lp + (0, -0.6), 0.6)
    return (bx, by + 4 * 2.6)
