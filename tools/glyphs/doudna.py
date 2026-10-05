# Doudna: a guide reads along the double helix, matches its target and Cas9 cuts both strands
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    cy = y + h * 0.58; x0, x1 = x + 4.5, x + w - 0.5; cut = x + w * 0.56
    u = np.linspace(x0, x1, 300)
    for s in (-1, 1):                                                  # two strands, broken at the cut (staggered)
        yy = cy + s * 2.0 * np.cos((u - x0) / (x1 - x0) * 2 * math.pi * 1.5)
        gap = cut + s * 0.5
        L = u < gap - 0.6; R = u > gap + 0.6
        g.path(np.column_stack([u[L], yy[L]]), g.lw * 1.1, color=g.ink)
        g.path(np.column_stack([u[R], yy[R]]), g.lw * 1.1, color=g.ink)
    for xx in np.arange(x0 + 0.8, x1, 1.3):                            # base-pair rungs
        if abs(xx - cut) < 1.0: continue
        a = 2.0 * math.cos((xx - x0) / (x1 - x0) * 2 * math.pi * 1.5)
        g.path([[xx, cy - a], [xx, cy + a]], 0.18, color=g.ink, opacity=0.55)
    # the guide RNA lying along the target, inside the Cas9 outline
    gx0, gx1 = cut - 9.0, cut - 1.0; gy = y + h * 0.18
    th = np.linspace(0, 2 * math.pi, 100)
    g.path(np.column_stack([(gx0 + gx1) / 2 + 6.3 * np.cos(th), gy + 2.4 + 3.6 * np.sin(th)]), g.lw * 0.7, color=g.ink, opacity=0.55, fill=g.soft)
    g.path([[gx0, gy + 2.0], [gx1, gy + 2.0]], g.lw * 1.5)
    for xx in np.linspace(gx0 + 0.3, gx1 - 0.3, 7):
        g.path([[xx, gy + 2.0], [xx, gy + 3.3]], g.lw * 0.8)
    g.arrow([cut - 0.2, gy + 4.6], [cut, cy - 2.6], g.lw * 1.4)         # the cut
    return [x1, cy + 2.0 * math.cos(2 * math.pi * 1.5)]
