# Noether: a puck in a round bowl — rotational symmetry, so its looping path keeps the same angular momentum → equivariant nets
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([max(x + 15.5, 48.5), y + h / 2]); R = 10.0
    g.circle(c, R, g.lw * 1.3, g.ink); g.circle(c, R * 0.55, 0.2, g.ink, opacity=0.5); g.dot(c, 0.4, g.ink, opacity=0.6)
    t = np.linspace(0, 2 * math.pi * 3.0, 900)          # precessing ellipse → rosette
    a, b, pr = 7.6, 3.2, 0.28
    px = a * np.cos(t); py = b * np.sin(t); ph = pr * t
    P = np.column_stack([c[0] + px * np.cos(ph) - py * np.sin(ph), c[1] + px * np.sin(ph) + py * np.cos(ph)])
    g.path(P, g.lw * 1.1, g.col, opacity=0.85)
    g.dot(P[-1], 0.85, g.ink)
    aa = np.linspace(-0.35, 1.05, 40); RR = R + 1.6            # turn the bowl: nothing changes
    arc = np.column_stack([c[0] + RR * np.cos(aa), c[1] + RR * np.sin(aa)])
    g.path(arc[:-2], g.lw * 1.4, g.col); g.arrow(arc[-4], arc[-1], g.lw * 1.4, g.col)
    a0 = math.radians(200)
    return c + R * np.array([math.cos(a0), math.sin(a0)])
