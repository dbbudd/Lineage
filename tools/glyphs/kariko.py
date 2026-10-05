# Karikó: a ribosome reads mRNA codon by codon (with Ψ in place of U) and strings beads into a protein
def glyph(g):
    np, math = g.np, g.math
    x, y, w, h = g.box
    my = y + h * 0.78; x0, x1 = x + 0.5, x + w - 0.5
    u = np.linspace(x0, x1, 300)
    strand = np.column_stack([u, my + 0.5 * np.sin((u - x0) * 1.3)])
    g.path(strand, g.lw * 1.1, color=g.ink)
    for xx in np.arange(x0 + 1.0, x1, 2.4):                            # codon ticks
        g.path([[xx, my - 0.9], [xx, my + 1.1]], g.lw * 0.6, color=g.ink, opacity=0.6)
    R = np.array([x + w * 0.44, my - 1.0])                            # ribosome: small + large subunit
    th = np.linspace(0, 2 * math.pi, 80)
    g.path(np.column_stack([R[0] + 3.4 * np.cos(th), R[1] + 1.6 + 1.5 * np.sin(th)]), g.lw * 1.0, color=g.ink, fill=g.soft, close=True)
    g.path(np.column_stack([R[0] + 4.4 * np.cos(th), R[1] - 2.6 + 2.8 * np.sin(th)]), g.lw * 1.0, color=g.ink, fill=g.soft, close=True)
    # the protein chain emerging as beads
    beads = [R + [0.6, -5.0]]
    for k in range(7):
        a = -1.1 + 0.55 * math.sin(k * 1.3)
        beads.append(beads[-1] + 1.7 * np.array([math.cos(a), math.sin(a)]))
    g.path(beads, g.lw * 0.9)
    for b in beads[1:]: g.dot(b, 0.62)
    # Ψ — the modified letter that slips past the immune sensors
    P = np.array([x + 4.0, y + h * 0.28]); s = 4.6
    t = np.linspace(math.pi, 2 * math.pi, 30)
    g.path(np.column_stack([P[0] + s * 0.36 * np.cos(t), P[1] - s * 0.5 - s * 0.45 * np.sin(t)]), g.lw * 1.2, color=g.ink)
    g.path([[P[0], P[1] - s * 0.62], [P[0], P[1] + s * 0.42]], g.lw * 1.2, color=g.ink)
    g.arrow([P[0], P[1] + s * 0.55 + 0.3], [P[0] + 0.0, my - 1.4], g.lw * 0.8, g.ink, opacity=0.7)
    return [x0, my]
