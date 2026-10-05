// Fazlur Rahman Khan — the framed tube: a tall building in wind, conventional rigid frame vs perimeter tube;
// Willis (Sears) Tower bundled tubes; computer analysis → generative design trying many structures
Lineage.scene({
  params: [
    { id: "H", label: "Building height", type: "range", min: 100, max: 500, step: 10, value: 300, fmt: v => v + " m · " + Math.round(v / 3.9) + " storeys" },
    { id: "V", label: "Wind speed", type: "range", min: 10, max: 60, step: 1, value: 40, fmt: v => v + " m/s · " + Math.round(v * 3.6) + " km/h" },
    { id: "tube", label: "Use Khan's framed tube", type: "toggle", value: true },
    { id: "speed", label: "Gust speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  // simple cantilever model: shear racking (∝ H²) + bending (∝ H⁴); illustrative stiffnesses for a 50 m wide building
  SYS: {
    frame: { GA: 2e9, EI: 1.2e14, name: "rigid frame" },
    tube: { GA: 1.2e10, EI: 2.2e14, name: "framed tube" },
    xtube: { GA: 3.5e10, EI: 2.6e14, name: "braced tube" },
    bundle: { GA: 2.4e10, EI: 4.2e14, name: "bundled tube" },
  },
  sway(sys, H, V) { const w = 0.613 * V * V * 50 * 1.3, s = this.SYS[sys]; return { shear: (w * H * H) / (2 * s.GA), bend: (w * H ** 4) / (8 * s.EI), w }; },
  layout(S) {
    const { box, narrow } = S, st = S.st, lab = Math.max(12, S.fs * 0.82);
    st.gy = box.y + box.h * (narrow ? 0.9 : 0.88);                 // ground
    st.topMax = box.y + lab * 3.6;
    st.bw = Math.min(box.w * 0.11, box.h * 0.12);                  // drawn width of the building
    st.bx = box.x + box.w * (narrow ? 0.14 : 0.16);                // left edge of the building
    st.rx = box.x + box.w * (narrow ? 0.5 : 0.56);                 // right column for insets
    st.rw = box.x + box.w - st.rx;
  },
  entry(S) { return [S.box.x + S.box.w * 0.02, S.st.gy]; },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, box = S.box, lab = Math.max(12, fs * 0.82);
    const kA = S.ease(k / 0.35), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const H = S.p.H, V = S.p.V, sys = S.p.tube ? "tube" : "frame", alt = S.p.tube ? "frame" : "tube";
    const hpx = (st.gy - st.topMax) * (H / 500), top = st.gy - hpx, bw = st.bw, bx = st.bx;
    const sw = this.sway(sys, H, V), sa = this.sway(alt, H, V), d = sw.shear + sw.bend, da = sa.shear + sa.bend;
    const dFrame = Math.max(d, da), ex = (bw * 0.9) / Math.max(dFrame, 0.05); // exaggeration: frame lean ≈ 0.9 building widths
    const gust = 0.86 + 0.1 * Math.sin(ft * 1.7) + 0.04 * Math.sin(ft * 4.3);
    const shape = (s, z) => s.shear * (2 * z - z * z) + (s.bend * (z ** 4 - 4 * z ** 3 + 6 * z * z)) / 3; // z = height fraction
    const u = (s, z) => shape(s, z) * ex * gust * kB;
    // ground
    S.line([[box.x + box.w * 0.02, st.gy], [st.rx - box.w * 0.04, st.gy]], { w: iw * 0.6, color: C.ink, alpha: kA });
    // wind arrows: pressure grows with height
    const nA = 6;
    for (let i = 0; i < nA; i++) {
      const z = (i + 0.6) / nA; if (z > kA) continue;
      const y = st.gy - z * hpx, L = bw * (0.35 + 0.9 * (V / 60) ** 2) * Math.pow(z, 0.2);
      const x1 = bx + u(sw, z) - iw * 2;
      S.arrow(x1 - L, y, x1, y, { w: iw * 0.55, color: C.soft, alpha: kA });
    }
    S.text(`wind ${V} m/s`, box.x + box.w * 0.02, st.gy + lab * 1.4, { size: lab, color: C.soft, alpha: kA, align: "left" });
    // the building: columns as deflected polylines, floors every few storeys
    const storeys = Math.round(H / 3.9), every = Math.max(1, Math.round(storeys / 26)), N = 22;
    const ncol = sys === "tube" ? 15 : 5, hTop = kA; // grows from the ground up
    const col = sys === "tube" ? C.ink : C.ink;
    for (let c = 0; c < ncol; c++) {
      const x0 = bx + (bw * c) / (ncol - 1), pts = [];
      for (let j = 0; j <= N; j++) { const z = (j / N) * hTop; pts.push([x0 + u(sw, z), st.gy - z * hpx]); }
      const edge = c === 0 || c === ncol - 1;
      S.line(pts, { w: edge ? iw * 0.8 : iw * (sys === "tube" ? 0.32 : 0.5), color: col });
    }
    for (let f = every; f <= storeys; f += every) {
      const z = f / storeys; if (z > hTop) break;
      const y = st.gy - z * hpx, o = u(sw, z);
      // rigid frame: the floors stay level but rack sideways; draw slight joint "kinks" by tilting short beam stubs
      S.line([[bx + o, y], [bx + bw + o, y]], { w: iw * (sys === "tube" ? 0.28 : 0.4), color: C.ink, alpha: 0.85 });
    }
    // the other system's deflected outline, ghosted, for comparison
    if (kB > 0) {
      const g = [];
      for (let j = 0; j <= N; j++) { const z = j / N; g.push([bx + bw + u(sa, z), st.gy - z * hpx]); }
      S.line(g, { w: iw * 0.5, color: C.soft, dash: [iw * 1.2, iw * 1.4], alpha: 0.9 * kB });
      const tx = S.narrow ? box.x + box.w * 0.02 : bx, y1 = top - lab * 2.1, y2 = top - lab * 0.75;
      S.text(S.narrow ? `${this.SYS[sys].name}: ${d.toFixed(2)} m` : `${this.SYS[sys].name} sways ${d.toFixed(2)} m`, tx, y1, { size: lab * 1.05, color: S.p.tube ? C.accent : C.ink, align: "left", weight: 500, alpha: kB });
      S.line([[tx, y2 - lab * 0.3], [tx + lab * 1.4, y2 - lab * 0.3]], { w: iw * 0.5, color: C.soft, dash: [iw * 1.2, iw * 1.2], alpha: kB });
      S.text(`${this.SYS[alt].name}: ${da.toFixed(2)} m`, tx + lab * 1.8, y2, { size: lab, color: C.soft, align: "left", alpha: kB });
      S.text(`sway drawn ×${Math.round(ex / (hpx / H))}`, S.narrow ? box.x + box.w * 0.02 : st.rx - box.w * 0.04, st.gy + lab * (S.narrow ? 2.7 : 1.4), { size: lab * 0.8, color: C.soft, align: S.narrow ? "left" : "right", alpha: kB, italic: false, mono: true });
    }
    // Willis (Sears) Tower: nine square tubes bundled; plan view
    if (kB > 0) {
      const ps = Math.min(st.rw * 0.36, box.h * (S.narrow ? 0.2 : 0.2)), px = st.rx + st.rw * 0.04, py = box.y + lab * 0.6, c3 = ps / 3;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S.rect(px + i * c3, py + j * c3, c3, c3, { w: iw * 0.55, color: C.ink, alpha: kB });
      S.rect(px, py, ps, ps, { w: iw * 0.9, color: C.ink, alpha: kB });
      // perimeter columns as tick dots on each tube wall
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * ps; [[px + t, py], [px + t, py + ps], [px, py + t], [px + ps, py + t]].forEach(q => S.dot(q[0], q[1], iw * 0.45, C.ink, kB)); }
      const tx = px + ps + st.rw * 0.06;
      S.text("Willis (Sears)", tx, py + lab * 0.9, { size: lab, align: "left", alpha: kB, weight: 500 });
      S.text("Tower, 1973", tx, py + lab * 2.1, { size: lab, align: "left", alpha: kB, weight: 500 });
      S.text("nine tubes", tx, py + lab * 3.5, { size: lab * 0.92, align: "left", color: C.soft, alpha: kB });
      S.text("bundled, 442 m", tx, py + lab * 4.6, { size: lab * 0.92, align: "left", color: C.soft, alpha: kB });
      st.planBottom = py + ps;
    }
    // AI beat: generative design: software analyses many candidate structures and keeps the stiffest
    let best = "";
    if (kC > 0) {
      const cands = ["frame", "tube", "xtube", "bundle"], n = cands.length;
      const y0 = (st.planBottom || box.y + box.h * 0.35) + lab * 2.6, cw = st.rw / n, ch = Math.min(st.gy - y0 - lab * 1.6, box.h * 0.42);
      const sc = cands.map(c => { const s = this.sway(c, H, V); return s.shear + s.bend; });
      const bi = sc.indexOf(Math.min(...sc)); best = this.SYS[cands[bi]].name;
      S.text(S.narrow ? "generative design" : "generative design: try many, keep the stiffest", st.rx + st.rw / 2, y0 - lab * 0.6, { size: lab, color: C.accent, alpha: kC, weight: 500 });
      cands.forEach((c, i) => {
        const a = S.ease(kC * n - i * 0.7); if (a <= 0) return;
        const w = cw * 0.42, x = st.rx + i * cw + (cw - w) / 2, yb = y0 + ch, yt = y0 + lab * 0.6, hi = i === bi, colr = hi ? C.accent : C.ink;
        const ox = Math.min(w * 0.9, (sc[i] / Math.max(...sc)) * w * 0.9) * (0.9 + 0.1 * Math.sin(ft * 1.7));
        const P = (fx, fz) => [x + fx * w + ox * fz * fz, yb - fz * (yb - yt)];
        const box4 = c === "bundle" ? [P(0, 0), P(1, 0), P(1, 0.55), P(2 / 3, 0.55), P(2 / 3, 0.8), P(1 / 3, 0.8), P(1 / 3, 1), P(0, 1), P(0, 0.55)] : [...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(q => P(1, q / 8)), ...[8, 7, 6, 5, 4, 3, 2, 1, 0].map(q => P(0, q / 8))];
        S.line(box4, { close: true, w: iw * (hi ? 0.75 : 0.5), color: colr, alpha: a });
        if (c === "frame") for (let f = 1; f < 6; f++) S.line([P(0, f / 6), P(1, f / 6)], { w: iw * 0.3, color: colr, alpha: a });
        if (c === "tube") for (let f = 1; f < 6; f++) S.line([P(f / 6, 0), P(f / 6, 1)], { w: iw * 0.3, color: colr, alpha: a });
        if (c === "bundle") { S.line([P(1 / 3, 0), P(1 / 3, 0.8)], { w: iw * 0.35, color: colr, alpha: a }); S.line([P(2 / 3, 0), P(2 / 3, 0.55)], { w: iw * 0.35, color: colr, alpha: a }); }
        if (c === "xtube") for (let f = 0; f < 3; f++) { S.line([P(0, f / 3), P(1, (f + 1) / 3)], { w: iw * 0.35, color: colr, alpha: a }); S.line([P(1, f / 3), P(0, (f + 1) / 3)], { w: iw * 0.35, color: colr, alpha: a }); }
        S.text(sc[i].toFixed(2) + (S.narrow ? "" : " m"), x + w / 2, yb + lab * 1.25, { size: lab * 0.85, color: colr, alpha: a, italic: false, mono: true, weight: hi ? 500 : 400 });
      });
    }
    return `${H} m tall, wind ${V} m/s · ${this.SYS[sys].name} sways ${d.toFixed(2)} m (1/${Math.round(H / d)} of its height) · ${this.SYS[alt].name} ${da.toFixed(2)} m` + (best ? ` · stiffest: ${best}` : "");
  },
  code(S) {
    const H = S.p.H, V = S.p.V, f = this.sway("frame", H, V), t = this.sway("tube", H, V);
    return `${S.c("# how far does the top of a tall building sway?")}
H, V = ${S.v(H)}, ${S.v(V)}                 ${S.c("# metres, wind m/s")}
w = 0.613 * V**2 * width * 1.3    ${S.c("# wind load: " + (f.w / 1000).toFixed(1) + " kN per metre")}

def sway(GA, EI):
    racking = w * H**2 / (2 * GA)     ${S.c("# frames shear sideways")}
    bending = w * H**4 / (8 * EI)     ${S.c("# whole tower bends")}
    return racking + bending

sway(frame)   ${S.c("# " + (f.shear + f.bend).toFixed(2) + " m")}
sway(tube)    ${S.c("# " + (t.shear + t.bend).toFixed(2) + " m: the outer wall works as one")}`;
  },
});
