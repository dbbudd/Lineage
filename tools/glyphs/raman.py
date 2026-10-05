# Raman: laser light scatters off a vibrating molecule; a faint shifted colour builds a spectrum fingerprint that ML reads
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    M = np.array([x + w * 0.38, y + h * 0.20])
    L0 = np.array([x + 3.0, M[1] + 1.5])
    t = np.linspace(0, 1, 120)                                         # incoming laser wave
    a, b = M - [1.3, 0], M + [1.3, 0]
    inc = np.column_stack([L0[0] + (a[0] - 1.0 - L0[0]) * t, L0[1] + (M[1] - L0[1]) * t + 0.6 * np.sin(t * 2 * math.pi * 5)])
    g.path(inc, g.lw * 1.0, color=g.ink)
    zz = [a + [0.6 + k * 0.26, (0.45 if k % 2 else -0.45) if 0 < k < 6 else 0] for k in range(7)]   # molecule on a spring
    g.path(zz, g.lw * 0.8, color=g.ink)
    g.dot(a, 0.8, color=g.ink); g.dot(b, 0.8, color=g.ink)
    for ang, col, k in [(-0.45, g.ink, 5), (0.30, g.col, 3.2)]:        # scattered: same colour, and a shifted one
        d = np.array([math.cos(ang), math.sin(ang)]); n = np.array([-d[1], d[0]])
        L = 6.0
        wave = [b + d * (0.9 + L * q) + n * 0.5 * math.sin(q * 2 * math.pi * k) for q in np.linspace(0, 1, 100)]
        g.path(wave, g.lw * (1.0 if col == g.ink else 1.3), color=col, opacity=0.55 if col == g.ink else 1)
    # the spectrum: huge Rayleigh line, small Stokes peaks = the fingerprint
    ox, oy, W = x + w * 0.50, y + h * 0.94, w * 0.49
    xs = np.linspace(0, 1, 400)
    peaks = [(0.06, 1.0, 0.012), (0.42, 0.32, 0.02), (0.60, 0.48, 0.018), (0.86, 0.24, 0.03)]
    sp = sum(hh / (1 + ((xs - c) / ww) ** 2) for c, hh, ww in peaks)
    H = h * 0.40
    sel = xs > 0.25
    g.path(np.column_stack([ox + xs[~sel] * W, oy - np.minimum(sp[~sel], 1.0) * H]), g.lw * 1.0, color=g.ink)
    g.path(np.column_stack([ox + xs[sel] * W, oy - sp[sel] * H]), g.lw * 1.5)
    g.path([[ox, oy], [ox + W, oy]], g.lw * 0.6, color=g.ink, opacity=0.6)
    return L0
