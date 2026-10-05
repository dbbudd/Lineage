# Lovelace: Note G on punched cards — a card of holes, a loop that repeats the operations → generated output (originate?)
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    cx0, cy0, cw, ch = x + 2.0, y + h * 0.40, w * 0.52, h * 0.46
    g.path([(cx0, cy0), (cx0 + cw - 2, cy0), (cx0 + cw, cy0 + 2), (cx0 + cw, cy0 + ch), (cx0, cy0 + ch)], g.lw * 1.5, g.ink, close=True)
    rng = np.random.RandomState(1843)
    for j in range(3):
        for i in range(6):
            c = (cx0 + 1.6 + i * (cw - 3.2) / 5, cy0 + 2.3 + j * (ch - 4.6) / 2)
            if rng.rand() < 0.55: g.dot(c, 0.62, g.ink)
            else: g.circle(c, 0.55, g.lw * 0.6, g.ink, opacity=0.6)
    # the loop: operations repeated (a cycle arrow above the card)
    lc = np.array([cx0 + cw * 0.5, cy0 - 3.6]); R = 3.0
    a = np.linspace(math.pi * 0.95, math.pi * 2.35, 80)
    arc = [lc + R * np.array([math.cos(t), math.sin(t) * 0.75]) for t in a]
    g.path(arc, g.lw * 1.3, g.ink)
    g.arrow(arc[-4], arc[-1], g.lw * 1.3, g.ink, head=1.3)
    # AI step: from the card to a burst of generated output
    s = np.array([cx0 + cw + 1.0, cy0 + ch * 0.5]); e = np.array([x + w * 0.80, cy0 + ch * 0.5])
    g.arrow(s, e, g.lw * 1.4)
    c = e + np.array([3.2, 0])
    for k in range(8):
        t = k * math.pi / 4
        g.path([c + 1.0 * np.array([math.cos(t), math.sin(t)]), c + 2.3 * np.array([math.cos(t), math.sin(t)])], g.lw * 1.2)
    g.dot(c, 0.6)
    return (cx0, cy0 + ch)
