# Hassabis: a protein sequence folding on a lattice — hydrophobic beads packed inside, contacts dashed (AlphaFold)
def glyph(g):
    np = g.np
    x, y, w, h = g.box
    s = 2.9
    o = np.array([x + w * 0.42, y + 3.2])
    walk = [(0,0),(1,0),(2,0),(3,0),(3,1),(2,1),(1,1),(1,2),(2,2),(3,2),(4,2),(4,1),(4,0),(5,0),(5,1),(5,2),(5,3),(4,3),(3,3),(2,3),(1,3),(0,3)]
    H = {1,5,6,8,9,11,15,17,18}
    pts = [o + s * np.array(p, float) for p in walk]
    g.path(pts, g.lw * 1.4, g.ink)
    pos = {p: i for i, p in enumerate(walk)}
    for i, p in enumerate(walk):                          # H–H contacts (non-bonded neighbours)
        if i not in H: continue
        for d in ((1, 0), (0, 1)):
            q = (p[0] + d[0], p[1] + d[1]); j = pos.get(q)
            if j is not None and j in H and abs(i - j) > 1:
                g.path([pts[i], pts[j]], g.lw * 1.1, g.col, dash="0.5 0.5")
    for i, p in enumerate(pts):
        if i in H: g.dot(p, 0.85, g.col)
        else: g.circle(p, 0.75, g.lw * 0.9, g.ink, fill="#FBF7F0")
    # the unfolded sequence feeding in
    seq0 = np.array([x + 1.5, y + 3.2 + 3 * s])
    for k in range(4):
        g.dot(seq0 + np.array([k * 1.9, 0]), 0.45, g.ink, opacity=0.7)
    g.arrow(seq0 + np.array([7.0, 0]), pts[-1] - np.array([1.4, 0]), g.lw * 1.2, g.ink)
    return seq0
