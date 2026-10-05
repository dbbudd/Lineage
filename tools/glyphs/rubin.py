# Rubin (Joker): The Way of Code — a calm field of grass swaying in the wind, one line, reshaped by describing a change
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    cols, rows = 13, 4
    fx, fw = x + 2.0, w - 3.0; fy, fh = y + 1.5, h - 11.0
    gx, gy = fw / (cols - 1), fh / rows; L = gy * 1.25
    pts = []
    for rr in range(rows):
        r = rows - 1 - rr; y0 = fy + (r + 1) * gy
        for j in range(cols):
            c = cols - 1 - j if rr % 2 else j
            u, v = c / cols, r / rows
            xx = fx + c * gx; yy = y0 + math.sin(u * 6.3 + r * 1.7) * gy * 0.16
            a = 0.05 + math.sin(u * 5 + v * 2 + 0.7) * 0.25 + math.sin(u * 2.3 + 1.4) * 0.12
            mid = [xx + math.sin(a * 0.5) * L * 0.5, yy - math.cos(a * 0.5) * L * 0.5]
            tip = [xx + math.sin(a) * L, yy - math.cos(a) * L]
            pts += [[xx, yy], mid, tip, [xx + 0.2, yy]]
    g.path(pts, g.lw * 0.7, g.col)
    return pts[0]
