# Tesla: rotating field (halo) → phasor arm → AC wave receding in perspective → rotary word vectors (RoPE)
def glyph(g):
    np, math = g.np, g.math
    c, r = g.head, g.r
    x, y, w, h = g.box
    vp = np.array([x + w, y + 2.0])
    d = (vp - c) / np.linalg.norm(vp - c); n = np.array([-d[1], d[0]])
    S = c + d * r * 1.18
    K = 3.2; scr = lambda u: (1 - 1 / (1 + K * u)) / (1 - 1 / (1 + K)); sc = lambda u: 1 / (1 + K * u)
    base = lambda u: S + (vp - S) * scr(u)
    PH = 0.95
    g.circle(c, r, g.lw * 0.85)                                     # the rotating field
    for k in range(3):
        a = PH + k * 2 * math.pi / 3
        g.path([c, c + 0.82 * r * np.array([math.cos(a), math.sin(a)])], 0.14, opacity=0.3)
    tip = c + r * (math.cos(PH) * d + math.sin(PH) * n)
    g.path([c, tip], g.lw * 1.2); g.dot(tip, 0.55)
    du = 0.92 / 3.4; th = 0.62                                      # three words, θ per word (as on the web page)
    kw = (th + 2 * math.pi * round((4.5 * 2 * math.pi * du - th) / (2 * math.pi))) / du
    wave = [base(v) + n * r * sc(v) * math.sin(PH - kw * v) for v in np.linspace(0, 1, 400)]
    g.path(wave, g.lw * 1.1, opacity=0.55); g.dot(vp, 0.5)
    for m in range(3):                                              # each arrow = the wave's phasor at its depth
        v = (m + 0.6) * du; b = base(v); ln = r * sc(v); ang = PH - kw * v
        g.arrow(b, b + ln * (math.cos(ang) * d + math.sin(ang) * n), g.lw * (1.6 if m != 1 else 1.3), g.col if m != 1 else g.ink)
    a0 = math.atan2(-d[1], -d[0]) + 0.9
    return c + r * np.array([math.cos(a0), math.sin(a0)])           # the portrait's line arrives on the halo's rim
