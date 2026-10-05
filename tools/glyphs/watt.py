# Watt: centrifugal governor (spindle, flung balls, sleeve) closed by a feedback loop → reward signal (RL)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    cx = x + w * 0.52; top = np.array([cx, y + 1.2]); bot = np.array([cx, y + h - 0.5])
    g.path([top, bot], g.lw * 1.4, g.ink)                                  # spindle
    g.dot(top, 0.5, g.ink)
    sl = np.array([cx, y + h * 0.62])                                       # sleeve
    g.rect(cx - 1.3, sl[1] - 0.9, 2.6, 1.8, g.lw, g.ink, fill=g.soft)
    for s in (-1, 1):
        ang = math.radians(38)
        ball = top + 10.5 * np.array([s * math.sin(ang), math.cos(ang)])
        g.path([top, ball], g.lw * 1.4, g.ink)
        mid = top + 6.0 * np.array([s * math.sin(ang), math.cos(ang)])
        g.path([mid, sl + np.array([s * 1.3, -0.6])], g.lw, g.ink)          # links down to the sleeve
        g.circle(ball, 2.0, g.lw * 1.3, g.ink, fill=g.soft)
    g.path([sl + np.array([1.3, 0]), np.array([x + w - 3.5, sl[1] + 1.5])], g.lw * 1.2, g.ink)   # lever to the valve
    vv = np.array([x + w - 3.5, sl[1] + 1.5]); g.circle(vv, 1.1, g.lw * 1.2, g.ink); g.path([vv - [0.8, 0.8], vv + [0.8, 0.8]], g.lw, g.ink)
    # the feedback loop: measure → compare → correct, round and round
    c = np.array([cx, y + h * 0.47]); R = np.array([w * 0.44, h * 0.47])
    t = np.linspace(math.radians(200), math.radians(500), 140)
    loop = [c + R * np.array([math.cos(a), math.sin(a)]) for a in t]
    g.path(loop[:-6], g.lw * 1.3, g.col, opacity=0.9)
    g.arrow(loop[-8], loop[-1], g.lw * 1.3, g.col)
    return c + R * np.array([math.cos(math.radians(180)), math.sin(math.radians(180))])
