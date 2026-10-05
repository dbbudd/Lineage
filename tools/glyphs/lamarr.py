# Lamarr: frequency hopping — a time × frequency grid, a hop staircase from a shared roll; the jammer hits one hop
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    gx, gy, gw, gh = x + 3.0, y + 0.5, w - 3.5, h - 7.0
    nc, nr = 9, 7
    cw, rh = gw / nc, gh / nr
    for i in range(nr + 1):
        g.path([[gx, gy + i * rh], [gx + gw, gy + i * rh]], 0.14, g.ink, opacity=0.35)
    jam = 2                                                                 # the jammer's band
    g.rect(gx, gy + jam * rh, gw, rh, 0.14, g.ink, fill=g.ink, opacity=0.18)
    seq = [5, 1, 4, 2, 6, 0, 3, 5, 1]
    pts = []
    for j, r in enumerate(seq):
        yy = gy + (r + 0.5) * rh
        pts += [[gx + j * cw, yy], [gx + (j + 1) * cw, yy]]
    g.path(pts, g.lw * 1.4, g.col)
    for j, r in enumerate(seq):
        g.dot([gx + (j + 0.5) * cw, gy + (r + 0.5) * rh], 0.5, g.col)
    # the punched roll that both ends share
    for j, r in enumerate(seq):
        g.dot([gx + (j + 0.5) * cw, gy + gh + 1.4], 0.32, g.ink)
    g.path([[gx, gy + gh + 0.6], [gx + gw, gy + gh + 0.6]], 0.16, g.ink, opacity=0.6)
    g.path([[gx, gy + gh + 2.2], [gx + gw, gy + gh + 2.2]], 0.16, g.ink, opacity=0.6)
    return [gx, gy + (seq[0] + 0.5) * rh]
