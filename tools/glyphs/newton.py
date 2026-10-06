# Newton: the apple he points at becomes the cannonball on the mountain — a slow throw falls back,
# a fast one falls all the way round (orbit). Same pull, same update rule as gradient descent with momentum.
def apple_pts(np, math, c, s):
    """Outline of a small apple (y down), dimpled at the top, centred on c with radius s."""
    th = np.linspace(-math.pi / 2, 3 * math.pi / 2, 120)
    r = s * (1 - 0.24 * np.exp(-((th + math.pi / 2) / 0.32) ** 2) - 0.07 * np.exp(-((th - math.pi / 2) / 0.3) ** 2)
             - 0.24 * np.exp(-((th - 3 * math.pi / 2) / 0.32) ** 2))
    return [c + np.array([ri * math.cos(t) * 1.06, ri * math.sin(t)]) for ri, t in zip(r, th)]

def apple(g, c, s, w, color=None):
    np, math = g.np, g.math
    g.path(apple_pts(np, math, c, s), w, color=color, close=True)
    top = c + np.array([0, -s * 0.76])
    g.path([top, top + np.array([s * 0.05, -s * 0.35]), top + np.array([s * 0.2, -s * 0.62])], w * 0.9, color=color)      # stem
    a, b = top + np.array([s * 0.18, -s * 0.3]), top + np.array([s * 1.05, -s * 0.72])
    leaf = [a + (b - a) * t + np.array([0, -1]) * s * 0.28 * math.sin(math.pi * t) for t in np.linspace(0, 1, 16)] + \
           [a + (b - a) * t + np.array([0, 1]) * s * 0.16 * math.sin(math.pi * t) for t in np.linspace(1, 0, 16)]
    g.path(leaf, w * 0.8, color=color, close=True)

def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    C = np.array([x + w * 0.58, y + h * 0.6]); R = 4.0; r0 = R + 3.2          # Earth, mountain-top radius
    g.circle(C, R, g.lw * 1.1, color=g.ink, fill=g.soft, opacity=0.5)
    M = C + np.array([0, -r0])
    g.path([C + R * np.array([-math.sin(0.5), -math.cos(0.5)]), M + [0, 0.15], C + R * np.array([math.sin(0.5), -math.cos(0.5)])], g.lw * 1.0, color=g.ink, fill=g.soft)
    GM = r0
    def shot(v):
        p = M - C; vel = np.array([v, 0.0]); pts = [p.copy()]; dt = 0.01
        for _ in range(4000):
            r = np.linalg.norm(p); vel = vel - GM * p / r ** 3 * dt; p = p + vel * dt; pts.append(p.copy())
            if np.linalg.norm(p) < R: break
        return [C + q for q in pts]
    for v, op in [(0.55, 0.55), (0.8, 0.7)]:                                   # throws that fall back, like the apple
        g.path(shot(v), g.lw * 0.8, color=g.ink, opacity=op, dash="0.9 0.7")
    orbit = [C + r0 * np.array([math.sin(t), -math.cos(t)]) for t in np.linspace(0.32, 2 * math.pi * 0.86, 240)]
    g.path(orbit, g.lw * 1.4)                                                  # the orbit: it never stops falling
    g.arrow(orbit[-6], orbit[-1], g.lw * 1.4)
    apple(g, M + np.array([0, -1.75]), 1.35, g.lw * 1.1, color=g.ink)         # Newton's apple sits on the summit
    return C + r0 * np.array([-math.cos(0.45), math.sin(0.45)])
