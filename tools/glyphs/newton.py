# Newton: cannon on the mountain — slow shots fall short, faster ones further, the fastest falls all the way round (orbit)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    C = np.array([x + w * 0.56, y + h * 0.56]); R = 4.4; r0 = R + 3.4       # Earth, mountain-top radius
    g.circle(C, R, g.lw * 1.2, color=g.ink, fill=g.soft, opacity=0.6)
    top = C + np.array([0, -R])
    M = C + np.array([0, -r0])
    g.path([C + R * np.array([-math.sin(0.5), -math.cos(0.5)]), M + [0, 0.15], C + R * np.array([math.sin(0.5), -math.cos(0.5)])], g.lw * 1.1, color=g.ink, fill=g.soft)   # mountain
    GM = r0                                                            # circular speed at r0 is 1
    def shot(v):
        p = M - C; vel = np.array([v, 0.0]); pts = [p.copy()]; dt = 0.01
        for _ in range(4000):
            r = np.linalg.norm(p); vel = vel - GM * p / r ** 3 * dt; p = p + vel * dt; pts.append(p.copy())
            if np.linalg.norm(p) < R: break
        return [C + q for q in pts]
    for v, op in [(0.55, 0.6), (0.8, 0.75)]:
        g.path(shot(v), g.lw * 0.9, color=g.ink, opacity=op)
    orbit = [C + r0 * np.array([math.sin(t), -math.cos(t)]) for t in np.linspace(0, 2 * math.pi * 0.9, 240)]
    g.path(orbit, g.lw * 1.5)                                          # the orbit (momentum + pull = descent with momentum)
    g.arrow(orbit[-6], orbit[-1], g.lw * 1.5)
    g.dot(M, 0.65, color=g.ink)
    return C + r0 * np.array([-math.cos(0.5), math.sin(0.5)])
