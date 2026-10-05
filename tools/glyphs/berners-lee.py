# Berners-Lee: a mesh of linked pages → a crawler following links → the text gathered into a corpus stack
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    P = lambda u, v: np.array([x + u * w, y + v * h])
    pages = [P(0.10, 0.30), P(0.36, 0.14), P(0.30, 0.62), P(0.58, 0.40), P(0.08, 0.82), P(0.56, 0.82)]
    links = [(0, 1), (0, 2), (1, 3), (2, 3), (2, 4), (3, 5), (2, 5), (0, 4)]
    pw, ph = 3.0, 3.8
    for a, b in links:
        g.path([pages[a], pages[b]], g.lw * 0.8, g.ink, opacity=0.75)
    for p in pages:
        g.rect(p[0] - pw / 2, p[1] - ph / 2, pw, ph, g.lw * 1.2, g.ink, fill="#FBF7F0", rx=0.3)
        for k in range(3):
            g.path([(p[0] - pw / 2 + 0.6, p[1] - ph / 2 + 1.0 + k * 0.9), (p[0] + pw / 2 - 0.6 - 0.5 * (k == 2), p[1] - ph / 2 + 1.0 + k * 0.9)], 0.16, g.ink, opacity=0.7)
    # AI step: crawler gathers pages into a corpus
    s = pages[3] + np.array([pw / 2 + 0.6, 0]); st = P(0.90, 0.40)
    g.arrow(s, st - np.array([2.8, 0]), g.lw * 1.4)
    for k in range(4):
        yy = st[1] - 2.4 + k * 1.6
        g.path([(st[0] - 2.0, yy), (st[0] + 2.4, yy)], g.lw * 1.6)
    return pages[4] - np.array([pw / 2, 0])
