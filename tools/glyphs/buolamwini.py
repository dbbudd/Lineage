# Buolamwini: Gender Shades — error rates by group: three near zero, darker-skinned women far higher → audit every group
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    base = y + h * 0.60
    bw, gap = 3.4, 2.0
    x0 = x + 3.5
    errs = [0.06, 0.14, 0.24, 0.92]
    tones = [0.10, 0.35, 0.10, 0.75]                      # skin-tone swatches under each bar
    g.path([(x0 - 1.5, base), (x0 + 4 * (bw + gap) - gap + 1.5, base)], g.lw, g.ink)
    for i, (e, t) in enumerate(zip(errs, tones)):
        bx = x0 + i * (bw + gap); hh = (h * 0.55) * e
        last = i == 3
        g.rect(bx, base - hh, bw, hh, g.lw * (1.4 if last else 1.0), g.col if last else g.ink,
               fill=g.col if last else "none", opacity=1 if last else 0.85)
        g.circle((bx + bw / 2, base + 2.2), 1.0, 0.18, g.ink, fill=g.mix(g.ink, "#F4E9DA", 1 - t) if t > 0.2 else "#F1E4D2")
    # the audit: a magnifying lens over the tall bar
    c = np.array([x0 + 3 * (bw + gap) + bw + 3.4, base - h * 0.42])
    g.circle(c, 2.6, g.lw * 1.4, g.ink)
    g.path([c + np.array([1.85, 1.85]), c + np.array([4.0, 4.0])], g.lw * 2.4, g.ink)
    return (x0 - 1.5, base)
