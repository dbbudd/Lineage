# West: three satellites' range arcs meet at one receiver on a lumpy Earth (geoid vs the smooth ellipsoid) — GPS needs the right model
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    c = np.array([x + w * 0.60, y + h * 0.66]); R = 6.0
    a = np.linspace(0, 2 * math.pi, 240)
    g.path([c + R * np.array([math.cos(t), math.sin(t)]) for t in a], 0.2, g.ink, opacity=0.55, dash="0.7 0.5")   # ellipsoid
    lump = lambda t: R + 0.45 * math.sin(4 * t + 0.4) + 0.25 * math.sin(7 * t + 2.0)
    geo = [c + lump(t) * np.array([math.cos(t), math.sin(t)]) for t in a]
    g.path(geo, g.lw * 1.5, g.ink)                                                                   # geoid
    tr = math.radians(-118); rcv = c + lump(tr) * np.array([math.cos(tr), math.sin(tr)])
    for ang in (-158, -96, -38):
        t = math.radians(ang); s = c + 10.6 * np.array([math.cos(t), math.sin(t)])
        d = np.linalg.norm(rcv - s); base = math.atan2(*(rcv - s)[::-1])
        arc = [s + d * np.array([math.cos(base + q), math.sin(base + q)]) for q in np.linspace(-0.32, 0.32, 40)]
        g.path(arc, g.lw * 1.1, g.col, opacity=0.85)
        g.path([s, rcv], 0.14, g.ink, opacity=0.45, dash="0.5 0.5")
        g.rect(s[0] - 0.9, s[1] - 0.55, 1.8, 1.1, g.lw, g.ink, fill=g.soft)
        g.path([s - [2.2, 0], s + [2.2, 0]], g.lw * 1.1, g.ink)
    g.dot(rcv, 0.8, g.col)
    t = math.radians(170); return c + lump(t) * np.array([math.cos(t), math.sin(t)])
