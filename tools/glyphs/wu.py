# Wu: spinning cobalt nuclei throw electrons out mostly against the spin; the mirror image disagrees (parity violation)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    mx = x + w * 0.57
    g.path([[mx, y + 0.5], [mx, y + h - 1.0]], g.lw * 0.8, color=g.ink, dash="0.9 0.7", opacity=0.8)   # the mirror
    def nucleus(cx, spin_up, op):
        c = np.array([cx, y + h * 0.26]); r = 2.2
        g.circle(c, r, g.lw * 1.2, color=g.ink, fill=g.soft, opacity=op)
        # spin: a curl around the axis plus an axial arrow
        th = np.linspace(0.25 * math.pi, 1.85 * math.pi, 60)
        if not spin_up: th = th[::-1] + 0.0
        ring = np.column_stack([c[0] + 3.6 * np.cos(th), c[1] - (1 if spin_up else -1) * 0.0 + 1.1 * np.sin(th) - 0.0])
        g.path(ring, g.lw * 1.0, color=g.ink, opacity=op)
        g.arrow(ring[-5], ring[-1], g.lw * 1.0, g.ink, head=1.3, opacity=op)
        for a in (-0.45, 0.0, 0.45):                                   # electrons go DOWN on both sides
            d = np.array([math.sin(a), math.cos(a)])
            g.arrow(c + d * (r + 0.5), c + d * (r + 5.6 - abs(a) * 2), g.lw * 1.3, g.col, opacity=op)
    nucleus(x + w * 0.36, True, 1.0)
    nucleus(x + w * 0.78, False, 0.85)                                  # mirror: spin flips, electrons do not
    return [mx, y + h - 1.0]
