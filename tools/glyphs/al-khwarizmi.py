# al-Khwarizmi: x² + 10x = 39 completed with real squares → the missing corner square is the step that finishes the recipe
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    L = max(x + 5.5, 38.5); T = y + 3.0
    s, b = 9.5, 5.0                                   # side x, half of the ten roots
    g.rect(L, T, s, s, g.lw * 1.4, g.ink)                              # the square x²
    g.rect(L + s, T, b, s, g.lw * 1.1, g.ink, fill=g.soft, opacity=0.45)  # 5 by x
    g.rect(L, T + s, s, b, g.lw * 1.1, g.ink, fill=g.soft, opacity=0.45)  # x by 5
    g.rect(L + s, T + s, b, b, g.lw * 1.4, g.col, fill=g.col, opacity=0.6)  # the 25 that completes the square
    g.rect(L + s, T + s, b, b, g.lw * 1.4, g.col)
    g.path([[L, T + s + b + 1.2], [L + s + b, T + s + b + 1.2]], 0.2, g.ink, opacity=0.6, dash="0.6 0.5")  # side x + 5
    g.arrow([L + s + b + 0.8, T + s + b / 2], [L + s + b + 4.4, T + s + b / 2], g.lw * 1.4, g.col)
    for k in range(3):                                 # the recipe: three steps
        yy = T + 2 + k * 3.6
        g.path([[L + s + b + 5.6, yy], [L + s + b + 5.6 + 2.6 - k * 0.5, yy]], g.lw * 1.3, g.col if k == 2 else g.ink)
        g.dot([L + s + b + 4.6, yy], 0.35, g.ink)
    return (L, T + s * 0.6)
