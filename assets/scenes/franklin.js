// Rosalind Franklin — X-rays through a DNA fibre → helical diffraction (the X of Photo 51) → PDB structures → AlphaFold folding a chain
(function () {
  // Bessel function of the first kind, integer order: J_n(x) = (1/π) ∫ cos(nτ − x sin τ) dτ
  const J = (n, x) => { const N = 48; let s = 0; for (let i = 0; i < N; i++) { const t = ((i + 0.5) / N) * Math.PI; s += Math.cos(n * t - x * Math.sin(t)); } return s / N; };
  const LMAX = 12;

  // target 2-D fold for the AlphaFold beat: a coiled helix, a turn, then a beta hairpin
  function foldTarget(n) {
    const raw = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, th = t * Math.PI * 2 * 3; raw.push([t * 1.1 + 0.24 * Math.cos(th + Math.PI), 0.26 * Math.sin(th)]); }
    let e = raw[raw.length - 1];
    for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 - (i / 8) * Math.PI / 2; raw.push([e[0] + 0.2 * (1 - Math.cos((i / 8) * Math.PI / 2)) + 0.06, e[1] + 0.2 * Math.sin((i / 8) * Math.PI / 2)]); }
    e = raw[raw.length - 1];
    for (let i = 1; i <= 9; i++) raw.push([e[0], e[1] + 0.1 * i]);
    e = raw[raw.length - 1];
    for (let i = 1; i <= 10; i++) { const a = Math.PI - (i / 10) * Math.PI; raw.push([e[0] + 0.14 + 0.14 * Math.cos(a), e[1] + 0.14 * Math.sin(a)]); }
    e = raw[raw.length - 1];
    for (let i = 1; i <= 9; i++) raw.push([e[0], e[1] - 0.1 * i]);
    // resample at equal arc length
    const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const L = cum[cum.length - 1], out = []; let j = 1;
    for (let i = 0; i < n; i++) { const s = (i / (n - 1)) * L; while (j < cum.length - 1 && cum[j] < s) j++; const u = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1); out.push([raw[j - 1][0] + (raw[j][0] - raw[j - 1][0]) * u, raw[j - 1][1] + (raw[j][1] - raw[j - 1][1]) * u]); }
    const turn = []; for (let i = 1; i < n - 1; i++) { const a0 = Math.atan2(out[i][1] - out[i - 1][1], out[i][0] - out[i - 1][0]), a1 = Math.atan2(out[i + 1][1] - out[i][1], out[i + 1][0] - out[i][0]); let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; turn.push(d); }
    return { a0: Math.atan2(out[1][1] - out[0][1], out[1][0] - out[0][0]), turn };
  }

  function computePattern(S) {
    const st = S.st, P = S.p.pitch, R = S.p.radius, off = S.p.offset, fr = st.film;
    const half = fr.r, Kz = half * 0.93 * 34 / 10, rows = [];
    let mx = 0;
    for (let l = 0; l <= LMAX; l++) {
      const zp = (Kz * l) / P; if (zp > half) break;
      const mod = Math.pow(Math.cos(Math.PI * l * off), 2), row = [];
      for (let px = 0; px <= half; px += 1.6) { const rho = px / Kz, x = 2 * Math.PI * R * rho; let I = J(l, x) ** 2 * mod * Math.exp(-Math.pow(rho / 0.16, 4)); if (l === 0) I *= 0.35; row.push([px, I]); if (l > 0 && I > mx) mx = I; }
      rows.push({ l, zp, row });
    }
    // render the film once into an offscreen canvas
    const dpr = Math.min(devicePixelRatio || 1, 2), size = Math.ceil(half * 2 + 8);
    const cv = st.cv || (st.cv = document.createElement("canvas")); cv.width = size * dpr; cv.height = size * dpr;
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, size, size);
    const o = size / 2, sp = (Kz / P), bh = Math.max(1.6, Math.min(sp * 0.3, half * 0.05));
    c.save(); c.beginPath(); c.arc(o, o, half, 0, Math.PI * 2); c.clip(); c.fillStyle = S.C.ink;
    for (const { l, zp, row } of rows) for (const [px, I] of row) {
      const a = Math.pow(Math.min(1, I / (mx || 1)), 0.75); if (a < 0.05) continue;
      c.globalAlpha = a * 0.85;
      for (const sx of px === 0 ? [1] : [1, -1]) for (const sy of l === 0 ? [1] : [1, -1]) { c.beginPath(); c.ellipse(o + sx * px, o + sy * zp, 1.9, bh, 0, 0, Math.PI * 2); c.fill(); }
    }
    // meridional reflections from the base stacking (rise = pitch / 10) at layer line 10
    const zm = (Kz * 10) / P;
    if (zm < half - 3) { c.globalAlpha = 0.95; for (const sy of [1, -1]) { c.beginPath(); c.ellipse(o, o + sy * zm, half * 0.09, bh * 1.2, 0, 0, Math.PI * 2); c.fill(); } }
    c.restore();
    Object.assign(st, { Kz, sp, zm, alpha: Math.atan2(P, 2 * Math.PI * R), missing: Array.from({ length: 9 }, (_, i) => i + 1).filter(l => Math.abs(Math.cos(Math.PI * l * off)) < 0.2) });
  }

  Lineage.scene({
    params: [
      { id: "pitch", label: "Helix pitch (one full turn)", type: "range", min: 20, max: 50, step: 0.5, value: 34, fmt: v => v.toFixed(1) + " Å" },
      { id: "radius", label: "Helix radius", type: "range", min: 6, max: 14, step: 0.1, value: 10, fmt: v => v.toFixed(1) + " Å" },
      { id: "offset", label: "Second strand offset (fraction of a turn)", type: "range", min: 0, max: 0.5, step: 0.005, value: 0.375, fmt: v => v.toFixed(3) },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    layout(S) {
      const b = S.box, st = S.st, nar = S.narrow;
      const topH = b.h * (nar ? 0.66 : 0.64);
      const hx = b.x + b.w * (nar ? 0.2 : 0.2), hw = Math.min(b.w * 0.1, topH * 0.13);
      const filmR = Math.min(b.w * (nar ? 0.27 : 0.27), topH * 0.42);
      const film = { x: b.x + b.w - S.fs * 3.6 - filmR, y: b.y + topH * 0.5 + S.fs * 0.3, r: filmR };
      st.helix = { x: hx, y0: b.y + topH * 0.12, y1: b.y + topH * 0.9, r: hw };
      st.film = film;
      st.src = [b.x + S.iw, b.y + topH * 0.5];
      const by = b.y + topH + (b.h - topH) * (nar ? 0.4 : 0.55);
      st.strip = { y: by, x0: b.x + b.w * 0.02, x1: b.x + b.w * 0.98, h: b.h - topH };
      st.fold = foldTarget(54);
      computePattern(S);
    },
    onParam(S) { computePattern(S); },
    entry(S) { const H = S.st.helix; return S.narrow ? [H.x, H.y1 + S.iw] : S.st.src; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, b = S.box;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const P = S.p.pitch, R = S.p.radius, off = S.p.offset;
      // ---- beat 1: the fibre (a double helix) in the X-ray beam
      const H = st.helix, g = (H.r / 10), Ppx = P * g * 1.0, Rpx = R * g, ph = ft * 0.9;
      const len = (H.y1 - H.y0) * k1, segs = [];
      for (const s of [0, 1]) {
        const pts = [];
        for (let i = 0; i <= 120; i++) { const z = (i / 120) * len, a = (2 * Math.PI * z) / Ppx + ph + s * off * 2 * Math.PI; pts.push([H.x + Rpx * Math.sin(a), H.y0 + z, Math.cos(a)]); }
        segs.push(pts);
      }
      // base pairs, 10 per turn
      for (let z = 0; z <= len; z += Ppx / 10) {
        const a = (2 * Math.PI * z) / Ppx + ph;
        S.line([[H.x + Rpx * Math.sin(a), H.y0 + z], [H.x + Rpx * Math.sin(a + off * 2 * Math.PI), H.y0 + z]], { w: iw * 0.35, color: C.soft, alpha: 0.8 });
      }
      for (const pass of [0, 1]) for (const pts of segs) for (let i = 1; i < pts.length; i++) {
        const front = pts[i][2] > 0; if ((pass === 1) !== front) continue;
        S.line([pts[i - 1], pts[i]], { w: front ? iw * 1.05 : iw * 0.55, color: front ? C.ink : C.soft });
      }
      // incoming X-ray beam
      const src = st.src, beamY = src[1];
      if (k1 > 0) {
        const bx1 = src[0] + (H.x - Rpx * 1.6 - src[0]) * k1;
        S.arrow(src[0], beamY, bx1, beamY, { w: iw * 0.9, color: C.accent });
        S.text("X-rays", (src[0] + bx1) / 2, beamY - fs * 0.6, { size: fs * 0.85, color: C.accent, alpha: k1 });
        S.text("DNA fibre", H.x, H.y0 - fs * 0.5, { size: fs * 0.9, alpha: k1 });
        if (k1 > 0.9) {
          // strand angle: tangent along the front strand where it crosses the axis
          const ka = S.ease((k1 - 0.9) * 10), a = st.alpha;
          let z = ((((-ph) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * Ppx;
          while (z < len * 0.62) z += Ppx; if (z > len * 0.95) z -= Ppx;
          const cy = H.y0 + z, L = Math.max(H.r * 1.5, fs * 1.6);
          S.line([[H.x, cy], [H.x + L * 1.25, cy]], { w: iw * 0.4, color: C.soft, dash: [3, 3], alpha: ka });
          S.line([[H.x - L * 0.5 * Math.cos(a), cy - L * 0.5 * Math.sin(a)], [H.x + L * Math.cos(a), cy + L * Math.sin(a)]], { w: iw * 0.8, color: C.accent, alpha: ka });
          S.text(`${Math.round((a * 180) / Math.PI)}°`, H.x + L * 1.3, cy + fs * 0.9, { size: fs * 0.85, align: "left", color: C.accent, alpha: ka });
        }
      }
      // ---- beat 2: scattered rays fan to the film, the pattern develops
      const F = st.film;
      if (k2 > 0) {
        for (const t of [-0.75, -0.35, 0, 0.35, 0.75]) S.line([[H.x + Rpx, beamY], [F.x - F.r * 0.98, F.y + t * F.r]], { w: iw * 0.3, color: C.soft, alpha: 0.6 * k2, dash: [4, 4] });
        S.circle(F.x, F.y, F.r, { w: iw * 0.5, color: C.ink, alpha: k2 });
        ctx.save(); ctx.globalAlpha = k2; const sz = st.cv.width / Math.min(devicePixelRatio || 1, 2);
        ctx.drawImage(st.cv, F.x - sz / 2, F.y - sz / 2, sz, sz); ctx.restore();
        S.dot(F.x, F.y, Math.max(3, F.r * 0.05), S.C.paper); S.circle(F.x, F.y, Math.max(3, F.r * 0.05), { w: iw * 0.4, color: C.soft });
        S.text("Photo 51 (computed)", F.x, F.y - F.r - fs * 0.45, { size: fs * 0.9, alpha: k2 });
        // the X: arms perpendicular to the strands
        if (k2 > 0.4) {
          const ka = S.ease((k2 - 0.4) / 0.6), a = st.alpha, L = F.r * 0.92 * ka;
          for (const sx of [1, -1]) S.line([[F.x - sx * L * Math.sin(a), F.y - L * Math.cos(a)], [F.x + sx * L * Math.sin(a), F.y + L * Math.cos(a)]], { w: iw * 0.7, color: C.accent, alpha: 0.75, dash: [iw * 2, iw * 1.6] });
          // layer-line spacing bracket
          const sp = st.sp, bx = F.x + F.r * 0.62, y0 = F.y - sp, y1 = F.y - 2 * sp;
          if (sp > fs * 0.55) {
            S.line([[bx, y0], [bx + fs * 0.5, y0]], { w: iw * 0.45, color: C.ink, alpha: ka });
            S.line([[bx, y1], [bx + fs * 0.5, y1]], { w: iw * 0.45, color: C.ink, alpha: ka });
            S.line([[bx + fs * 0.25, y0], [bx + fs * 0.25, y1]], { w: iw * 0.45, color: C.ink, alpha: ka });
          }
          const lx = F.x + F.r * 0.62 + fs * 0.8;
          S.text("1 / pitch", lx, F.y - 1.5 * sp + fs * 0.3, { size: fs * 0.8, align: "left", alpha: ka });
          S.text(`X ⟂ strands, ${Math.round((a * 180) / Math.PI)}°`, F.x, F.y + F.r + fs * 1.15, { size: fs * 0.9, color: C.accent, alpha: ka });
          if (st.zm < F.r - 3) S.text("base step", F.x + F.r * 0.14, F.y - st.zm + fs * 0.3, { size: fs * 0.75, align: "left", color: C.soft, alpha: ka });
        }
      }
      // ---- beat 3: diffraction data → Protein Data Bank → AlphaFold folds a chain
      if (k3 > 0) {
        const T = st.strip, y = T.y, sh = Math.min(T.h * 0.42, fs * 2.6);
        // PDB: a stack of solved-structure cards
        const px = T.x0 + sh * 0.2, cw = sh * 1.15, chh = sh * 1.05;
        for (let i = 3; i >= 0; i--) {
          const ox = px + i * sh * 0.13, oy = y - chh / 2 - i * sh * 0.1;
          S.rect(ox, oy, cw, chh, { w: iw * 0.45, color: i ? C.soft : C.accent, fill: C.paper, alpha: k3 });
          if (!i) { const pts = []; for (let j = 0; j <= 24; j++) { const t = j / 24; pts.push([ox + cw * (0.15 + 0.7 * t), oy + chh * (0.5 + 0.28 * Math.sin(t * 11))]); } S.line(pts, { w: iw * 0.55, color: C.accent, alpha: k3 }); }
        }
        S.text("Protein Data Bank", px + cw * 0.7, y + chh / 2 + fs * 1.05, { size: fs * 0.85, color: C.accent, alpha: k3 });
        if (!S.narrow) S.text("200,000+ structures", px + cw * 0.7, y + chh / 2 + fs * 2.0, { size: fs * 0.75, color: C.soft, alpha: k3 });
        // arrow from film down to PDB
        const ax0 = px + cw + sh * 0.6, ax1 = ax0 + Math.max(fs * 2, (T.x1 - T.x0) * 0.08);
        S.arrow(ax0, y, ax1, y, { w: iw * 0.8, color: C.accent, alpha: k3 });
        S.text("trains", (ax0 + ax1) / 2, y - fs * 0.55, { size: fs * 0.75, color: C.accent, alpha: k3 });
        // AlphaFold: a chain whose turning angles grow from straight to folded
        const fx0 = ax1 + fs * 0.9, fw = T.x1 - fx0, n = st.fold.turn.length + 2;
        const cyc = (ft * 0.14) % 1, fprog = S.ease(Math.min(1, cyc / 0.5)) * (cyc > 0.9 ? 1 - S.ease((cyc - 0.9) / 0.1) : 1);
        const f = fprog * k3;
        let a = st.fold.a0 * f, p = [0, 0];
        const pts = [p];
        for (let i = 0; i < n - 1; i++) { p = [p[0] + Math.cos(a), p[1] + Math.sin(a)]; pts.push(p); if (i < n - 2) a += st.fold.turn[i] * f; }
        let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; for (const q of pts) { mnx = Math.min(mnx, q[0]); mxx = Math.max(mxx, q[0]); mny = Math.min(mny, q[1]); mxy = Math.max(mxy, q[1]); }
        const sc = Math.min(fw * 0.92 / (mxx - mnx || 1), (T.h * (S.narrow ? 0.42 : 0.62)) / (mxy - mny || 1), fw / (n * 0.45));
        const cx = fx0 + fw / 2, cyy = y + fs * (S.narrow ? 0.5 : -0.2);
        const scr = pts.map(q => [cx + (q[0] - (mnx + mxx) / 2) * sc, cyy + (q[1] - (mny + mxy) / 2) * sc]);
        S.line(scr, { w: iw * 1.1, color: C.accent, alpha: k3 });
        scr.forEach((q, i) => S.dot(q[0], q[1], Math.max(2, iw * (i % 5 === 0 ? 0.95 : 0.6)), i % 5 === 0 ? C.accent : C.ink, k3));
        S.text(fprog > 0.95 ? "AlphaFold: folded" : "AlphaFold: sequence → shape", cx, y + T.h * 0.36 + fs * 0.6, { size: fs * 0.85, color: C.accent, alpha: k3 });
      }
      const mis = st.missing.length ? ` · layer line ${st.missing.join(", ")} missing` : "";
      return `pitch ${P.toFixed(1)} Å · radius ${R.toFixed(1)} Å · X half-angle ${Math.round((st.alpha * 180) / Math.PI)}° · line spacing 1/${P.toFixed(0)} Å⁻¹${mis}`;
    },
    code(S) {
      const P = S.p.pitch, R = S.p.radius, off = S.p.offset, a = Math.atan2(P, 2 * Math.PI * R);
      return `${S.c("# diffraction from a helix (Cochran, Crick & Vand, 1952)")}
P, R = ${S.v(P.toFixed(1))}, ${S.v(R.toFixed(1))}      ${S.c("# pitch and radius, in Å")}
offset = ${S.v(off.toFixed(3))}         ${S.c("# second strand, fraction of a turn")}

for l in range(-12, 13):         ${S.c("# layer lines")}
    Z = l / P                    ${S.c("# spacing = 1 / pitch")}
    for rho in radii:
        I[l, rho] = J(l, 2*pi*R*rho)**2 * cos(pi*l*offset)**2

${S.c("# Bessel J_l peaks move out with l, tracing an X")}
x_angle = atan(P / (2*pi*R))     ${S.c("# = " + Math.round((a * 180) / Math.PI) + "°")}`;
    },
  });
})();
