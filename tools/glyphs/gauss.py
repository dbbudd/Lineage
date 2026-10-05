# Gauss: least squares — the line that makes the total area of the error squares smallest (mean squared error)
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    L = max(x + 5.0, 38.0); R = x + w - 1.0; T = y + 1.0; Bt = y + h
    f = lambda X: Bt - 4.0 - (X - L) * 0.62
    g.path([[L, Bt], [R, Bt]], 0.2, g.ink, opacity=0.5); g.path([[L, Bt], [L, T]], 0.2, g.ink, opacity=0.5)
    pts = [(L + 2.5, -2.8), (L + 6.5, 2.4), (L + 10.5, -1.6), (L + 14.5, 3.2), (L + 18.5, -2.4), (L + 21.5, 1.4)]
    for X, e in pts:                                   # error squares hang between point and line
        yl = f(X); yp = yl + e
        side = abs(e); xx = X if e > 0 else X - side
        g.rect(xx, min(yl, yp), side, side, 0.2, g.ink, fill=g.soft, opacity=0.5)
    g.path([[L + 0.5, f(L + 0.5)], [R, f(R)]], g.lw * 1.6, g.col)      # Gauss's line
    for X, e in pts:
        g.dot([X, f(X) + e], 0.6, g.ink)
    return (L, f(L) + 1.5)
