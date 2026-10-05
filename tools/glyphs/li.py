# Fei-Fei Li: a WordNet tree whose leaves fill with labelled photos (ImageNet) → challenge error falling, AlexNet's leap
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    P = lambda u, v: np.array([x + u * w, y + v * h])
    root = P(0.30, 0.10)
    mids = [P(0.12, 0.38), P(0.30, 0.38), P(0.48, 0.38)]
    for m in mids: g.path([root, m], g.lw * 1.2, g.ink)
    g.dot(root, 0.7, g.ink)
    ts = 2.2
    for i, m in enumerate(mids):
        g.dot(m, 0.5, g.ink)
        for j in range(3):
            tx, ty = m[0] - ts / 2, m[1] + 1.4 + j * (ts + 0.6)
            g.rect(tx, ty, ts, ts, g.lw * 0.9, g.ink, rx=0.2)
            if (i + j) % 2 == 0:
                g.path([(tx + .3, ty + ts - .4), (tx + ts * .45, ty + ts * .45), (tx + ts - .3, ty + ts - .4)], 0.18, g.ink)
            else:
                g.circle((tx + ts / 2, ty + ts / 2), ts * 0.22, 0.18, g.ink)
    # AI step: top-5 error falls; the 2012 leap
    ax0, ax1, ay0, ay1 = x + w * 0.64, x + w - 0.2, y + 2.0, y + h * 0.88
    g.path([(ax0, ay0), (ax0, ay1), (ax1, ay1)], g.lw * 0.8, g.ink, opacity=0.7)
    xs = np.linspace(ax0 + 1, ax1 - 0.5, 7)
    ys = [0.15, 0.25, 0.55, 0.70, 0.80, 0.86, 0.90]
    pts = [(a, ay0 + (ay1 - ay0) * b) for a, b in zip(xs, ys)]
    g.path(pts, g.lw * 1.6)
    for p in pts: g.dot(p, 0.45)
    g.dot(pts[2], 0.85)
    return (mids[0][0] - ts / 2, mids[0][1] + 1.4 + ts / 2)
