# Cajal: a neuron — dendrites gather, the cell body sums, a spike runs one way down the axon (the artificial neuron)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    rng = np.random.default_rng(1906)
    soma = np.array([x + w * 0.36, y + h * 0.48])
    def tree(p, ang, L, d):
        q = p + L * np.array([math.cos(ang), math.sin(ang)])
        bend = (p + q) / 2 + rng.normal(0, 0.25, 2)
        g.path([p, bend, q], g.lw * (0.35 + 0.22 * d), color=g.ink)
        if d > 1:
            for s in (-1, 1): tree(q, ang + s * rng.uniform(0.35, 0.6), L * 0.68, d - 1)
        else:
            g.dot(q, 0.25, color=g.ink)
    for a in (math.pi * 0.78, math.pi * 1.0, math.pi * 1.22, math.pi * 1.5, math.pi * 0.52):
        tree(soma + 1.6 * np.array([math.cos(a), math.sin(a)]), a, 3.4, 3)
    g.circle(soma, 1.8, g.lw * 1.2, color=g.ink, fill=g.soft)
    g.dot(soma, 0.45, color=g.ink)
    ax0 = soma + [1.8, 0.0]; ax1 = np.array([x + w - 4.0, soma[1] + 1.0])
    u = np.linspace(0, 1, 60); axon = ax0 + (ax1 - ax0) * u[:, None] + np.column_stack([0 * u, 0.7 * np.sin(u * math.pi * 1.3)])
    g.path(axon, g.lw * 1.0, color=g.ink)
    for a in (-0.7, 0.0, 0.7):                                          # terminals
        q = ax1 + 2.2 * np.array([math.cos(a), math.sin(a)])
        g.path([ax1, q], g.lw * 0.7, color=g.ink); g.dot(q, 0.4, color=g.ink)
    i0, i1 = 22, 42                                                     # the one-way spike
    g.arrow(axon[i0] + [0, -1.6], axon[i1] + [0, -1.6], g.lw * 1.6)
    return soma + 1.6 * np.array([math.cos(math.pi * 0.78), math.sin(math.pi * 0.78)]) + 3.4 * np.array([math.cos(math.pi * 0.78), math.sin(math.pi * 0.78)])
