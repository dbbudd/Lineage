# Khan: the bundled tube (Willis Tower) — the outer wall's close columns act as one stiff tube against the wind
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    base = y + h + 0.5
    u = 2.6                                                                 # one tube's width
    x0 = x + w * 0.48
    tops = [12, 21, 25, 21, 16]                                             # stepped heights of the bundles
    lean = lambda yy: 0.9 * ((base - yy) / 25) ** 2                         # small bend, not racking
    for k, ht in enumerate(tops):
        xl = x0 + k * u; yt = base - ht
        for xx in (xl, xl + u):
            g.path([[xx + lean(yy), yy] for yy in np.linspace(base, yt, 20)], g.lw * 1.3, g.ink)
        g.path([[xl + lean(yt), yt], [xl + u + lean(yt), yt]], g.lw * 1.3, g.ink)
        for c in (0.33, 0.66):                                              # closely spaced columns
            g.path([[xl + c * u + lean(yy), yy] for yy in np.linspace(base, yt, 12)], 0.16, g.ink, opacity=0.6)
        for yy in np.arange(base - 1.6, yt, -1.6):                          # spandrel beams
            g.path([[xl + lean(yy), yy], [xl + u + lean(yy), yy]], 0.14, g.ink, opacity=0.45)
    g.path([[x0 - 2, base], [x0 + 5 * u + 2, base]], g.lw * 1.2, g.ink)
    for k, yy in enumerate([base - 21, base - 16.5, base - 12]):              # wind
        g.arrow([x + 3.0 + k * 0.6, yy], [x0 - 1.4 - k * 0.4 + lean(yy), yy], g.lw * 1.3, g.col)
    return [x0 - 2, base]
