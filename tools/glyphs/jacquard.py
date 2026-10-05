# Jacquard: a chain of punched cards; each hole lifts one thread, each card weaves one row of the cloth
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    rows = [[1,0,1,1,0,1], [0,1,1,0,1,1], [1,1,0,1,1,0], [1,0,1,0,1,0]]
    cw, ch = w * 0.40, 2.7
    cx0 = x + 2.5
    for k, row in enumerate(rows):                                          # the card chain, stepping down
        cy = y + 0.8 + k * (ch + 0.9)
        g.rect(cx0, cy, cw, ch, g.lw * 1.2, g.ink, fill=g.soft, rx=0.4)
        for j, on in enumerate(row):
            if on: g.dot([cx0 + cw * (0.12 + 0.152 * j), cy + ch / 2], 0.5, g.ink)
        if k: g.path([[cx0 + 1.0, cy - 0.9], [cx0 + 1.0, cy]], 0.2, g.ink); g.path([[cx0 + cw - 1.0, cy - 0.9], [cx0 + cw - 1.0, cy]], 0.2, g.ink)
    # the cloth: each card = one row, a hole = thread lifted (filled)
    ox, s = x + w * 0.62, 1.75
    oy = y + 0.8 + (ch - s) / 2
    for k, row in enumerate(rows):
        yy = y + 0.8 + k * (ch + 0.9) + (ch - s) / 2
        for j, on in enumerate(row):
            g.rect(ox + j * s, yy, s, s, 0.16, g.ink, fill=g.col if on else "none", opacity=0.9 if on else 0.5)
    g.arrow([cx0 + cw + 0.6, y + 7.4], [ox - 0.8, y + 7.4], g.lw * 1.3, g.col)
    return [cx0, y + 0.8 + 3 * (ch + 0.9) + ch]
