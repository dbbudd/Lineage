# Tao: Green–Tao — primes hold evenly spaced runs: 5, 11, 17, 23, 29 hop by 6 along the number line
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); R = x + w - 1.0; yl = y + h - 5.0
    N = 31; sp = (R - L) / (N - 1); X = lambda n: L + (n - 1) * sp
    primes = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31}; run = [5, 11, 17, 23, 29]
    g.path([[L - 0.5, yl], [R + 0.5, yl]], 0.2, g.ink, opacity=0.6)
    for n in range(1, N + 1):
        if n in run: continue
        if n in primes: g.dot([X(n), yl], 0.5, g.ink)
        else: g.path([[X(n), yl - 0.35], [X(n), yl + 0.35]], 0.18, g.ink, opacity=0.6)
    for a, b in zip(run, run[1:]):                     # equal hops
        u = np.linspace(0, math.pi, 40); cx = (X(a) + X(b)) / 2; rx = (X(b) - X(a)) / 2
        g.path(np.column_stack([cx - rx * np.cos(u), yl - 0.6 - 7.5 * np.sin(u)]), g.lw * 1.5, g.col)
    for n in run: g.dot([X(n), yl], 0.85, g.col)
    # the run checked: a tick over the last hop (Lean / AI as co-mathematician)
    ck = np.array([X(29) - 1.2, yl - 11.5])
    g.path([ck, ck + [0.9, 0.9], ck + [2.6, -1.4]], g.lw * 1.5, g.ink)
    ent = np.array([17.0, 23.0]); st = np.array([L - 0.5, yl])
    u = np.linspace(0, 1, 80)[:, None]
    arc = (1 - u) ** 3 * ent + 3 * (1 - u) ** 2 * u * (ent + [1.0, -10.0]) + 3 * (1 - u) * u ** 2 * (st + [-9.0, -9.0]) + u ** 3 * st
    g.path(arc, g.lw, g.ink)
    return ent
