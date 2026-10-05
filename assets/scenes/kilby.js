// Jack Kilby — the first integrated circuit (12 Sep 1958): a phase-shift oscillator on one germanium chip → sine wave on the scope → log-scale climb of transistor counts to AI GPUs
Lineage.scene({
  params: [
    { id: "R", label: "R: resistors", type: "range", min: 1, max: 50, step: 0.5, value: 10, fmt: v => v.toFixed(1) + " kΩ" },
    { id: "Cp", label: "C: capacitors", type: "range", min: 10, max: 500, step: 5, value: 50, fmt: v => v.toFixed(0) + " pF" },
    { id: "year", label: "Zoom to year", type: "range", min: 1958, max: 2024, step: 1, value: 2022, fmt: v => String(v) },
  ],
  MS: [
    [1958, 1, "Kilby's chip", 0], [1971, 2300, "Intel 4004", 0], [1978, 29000, "Intel 8086", 0], [1989, 1.2e6, "Intel 486", 0],
    [1993, 3.1e6, "Pentium", 0], [2000, 4.2e7, "Pentium 4", 0], [2006, 2.91e8, "Core 2 Duo", 0], [2010, 3.0e9, "GTX 580 (AlexNet)", 1],
    [2016, 1.53e10, "Nvidia P100", 1], [2020, 5.42e10, "Nvidia A100", 1], [2022, 8.0e10, "Nvidia H100", 1], [2024, 2.08e11, "Nvidia B200", 1],
  ],
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15;
    const chip = side ? { x: b.x + b.w * 0.01, y: b.y + b.h * 0.1, w: b.w * 0.56, h: b.h * 0.1 } : { x: b.x + b.w * 0.02, y: b.y + b.h * 0.1, w: b.w * 0.54, h: b.h * 0.09 };
    const scope = side ? { x: b.x + b.w * 0.65, y: b.y + b.h * 0.05, w: b.w * 0.34, h: b.h * 0.31 } : { x: b.x + b.w * 0.64, y: b.y + b.h * 0.03, w: b.w * 0.34, h: b.h * 0.24 };
    const tl = side ? { x: b.x + b.w * 0.14, y: b.y + b.h * 0.52, w: b.w * 0.82, h: b.h * 0.36 } : { x: b.x + b.w * 0.17, y: b.y + b.h * 0.44, w: b.w * 0.78, h: b.h * 0.46 };
    // component positions along the chip (fractions of chip width)
    Object.assign(S.st, { side, chip, scope, tl });
  },
  entry(S) { const { chip } = S.st; return [chip.x, chip.y + chip.h * 0.5]; },
  freq(S) { return 1 / (2 * Math.PI * Math.sqrt(6) * S.p.R * 1e3 * S.p.Cp * 1e-12); },
  fmtF(f) { return f >= 1e6 ? (f / 1e6).toFixed(2) + " MHz" : f >= 1e3 ? (f / 1e3).toFixed(1) + " kHz" : f.toFixed(0) + " Hz"; },
  fmtN(n) { return n >= 1e9 ? (n / 1e9).toFixed(n >= 1e11 ? 0 : 1) + " billion" : n >= 1e6 ? (n / 1e6).toFixed(1) + " million" : Math.round(n).toLocaleString("en-AU"); },
  countAt(y) {
    const M = this.MS;
    if (y <= M[0][0]) return M[0][1];
    for (let i = 1; i < M.length; i++) if (y <= M[i][0]) { const [y0, n0] = M[i - 1], [y1, n1] = M[i], t = (y - y0) / (y1 - y0); return Math.pow(10, Math.log10(n0) + t * (Math.log10(n1) - Math.log10(n0))); }
    return M[M.length - 1][1];
  },
  draw(S, k, ft) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx;
    const { chip, scope, tl, side } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.6) / 0.4);
    const f = this.freq(S), lf = fs * (side ? 0.78 : 0.85);
    // ---- the germanium chip ----
    const { x, y, w, h } = chip, al = k1;
    const bar = [[x, y + h * 0.1], [x + w * 0.3, y], [x + w * 0.72, y + h * 0.04], [x + w, y + h * 0.12], [x + w * 0.99, y + h * 0.92], [x + w * 0.6, y + h], [x + w * 0.2, y + h * 0.95], [x + w * 0.01, y + h * 0.88]];
    S.line(bar.slice(0, Math.max(2, Math.round(bar.length * k1 + 1))), { w: iw * 0.8, color: C.ink, close: k1 >= 1 });
    // transistor (mesa with emitter and base dots), resistors, capacitor
    const T = [x + w * 0.18, y + h * 0.5], Cc = [x + w * 0.82, y + h * 0.5], Rs = [0.4, 0.52, 0.64].map(t => [x + w * t, y + h * 0.5]);
    if (al > 0.2) {
      const a = Math.min(1, (al - 0.2) / 0.5);
      S.circle(T[0], T[1], h * 0.26, { w: iw * 0.55, color: C.ink, alpha: a });
      S.dot(T[0] - h * 0.1, T[1], iw * 0.6, C.ink, a); S.dot(T[0] + h * 0.1, T[1], iw * 0.6, C.ink, a);
      for (const r of Rs) { const zz = []; for (let i = 0; i <= 6; i++) zz.push([r[0] - h * 0.3 + i * h * 0.1, r[1] + (i % 2 ? -1 : 1) * h * 0.14 * (i > 0 && i < 6 ? 1 : 0)]); S.line(zz, { w: iw * 0.45, color: C.ink, alpha: a }); }
      S.line([[Cc[0] - h * 0.08, Cc[1] - h * 0.25], [Cc[0] - h * 0.08, Cc[1] + h * 0.25]], { w: iw * 0.6, color: C.ink, alpha: a });
      S.line([[Cc[0] + h * 0.08, Cc[1] - h * 0.25], [Cc[0] + h * 0.08, Cc[1] + h * 0.25]], { w: iw * 0.6, color: C.ink, alpha: a });
      // the gold "flying" wires, hand-bonded arcs
      const pts = [T, Rs[0], Rs[1], Rs[2], Cc];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = [pts[i][0] + h * 0.18, pts[i][1] - h * 0.12], p1 = [pts[i + 1][0] - h * 0.18, pts[i + 1][1] - h * 0.12], arc = [];
        for (let j = 0; j <= 16; j++) { const t = j / 16; arc.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - Math.sin(t * Math.PI) * h * (0.9 + 0.25 * (i % 2))]); }
        S.line(arc.slice(0, Math.max(2, Math.round(17 * a))), { w: iw * 0.4, color: C.ink, alpha: a });
      }
      const ly = y + h + lf * 1.2;
      S.text("transistor", T[0], ly, { size: lf, alpha: a });
      S.text("resistors", Rs[1][0], ly, { size: lf, alpha: a });
      S.text("capacitor", Cc[0], ly, { size: lf, alpha: a });
      if (!side) S.text("gold wires", Rs[1][0], y - h * 1.15, { size: lf * 0.9, alpha: a, color: C.soft });
      S.text("one slab of germanium · 12 Sept 1958", x + w * 0.5, ly + lf * 1.35, { size: lf * 0.9, alpha: a, color: C.soft });
    }
    // ---- the oscilloscope ----
    if (k2 > 0) {
      const { x: sx, y: sy, w: sw, h: sh } = scope;
      S.rect(sx, sy, sw, sh, { color: C.ink, w: iw * 0.6, alpha: k2 });
      for (let i = 1; i < 10; i++) S.line([[sx + (sw * i) / 10, sy], [sx + (sw * i) / 10, sy + sh]], { w: 0.8, color: C.soft, alpha: k2 * 0.35 });
      for (let j = 1; j < 6; j++) S.line([[sx, sy + (sh * j) / 6], [sx + sw, sy + (sh * j) / 6]], { w: 0.8, color: C.soft, alpha: k2 * 0.35 });
      const steps = [1, 2, 5]; let div = 1e-9;
      search: for (let e = -9; e < 0; e++) for (const m of steps) { div = m * Math.pow(10, e); if (f * 10 * div >= 2.2) break search; }
      const cyc = f * 10 * div, pts = [], N = 160;
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push([sx + sw * t, sy + sh * 0.5 - sh * 0.36 * Math.sin(2 * Math.PI * (cyc * t - ft * 0.6))]); }
      S.line(pts.slice(0, Math.round(N * k2) + 1), { w: iw * 0.9, color: C.accent });
      const dl = div >= 1e-3 ? (div * 1e3).toFixed(0) + " ms" : div >= 1e-6 ? (div * 1e6).toFixed(0) + " µs" : (div * 1e9).toFixed(0) + " ns";
      S.text(`f = ${this.fmtF(f)}`, sx + sw * 0.5, sy + sh + lf * 1.25, { size: lf * 1.05, color: C.accent, alpha: k2, weight: 500 });
      S.text(`${dl} / division`, sx + sw * 0.5, sy + sh + lf * 2.4, { size: lf * 0.85, color: C.soft, alpha: k2 });
      S.text("oscilloscope", sx + sw * 0.5, sy - lf * 0.5, { size: lf, alpha: k2 });
      // a signal wire from the capacitor end to the scope
      S.line([[x + w, y + h * 0.5], [sx - sw * 0.06, y + h * 0.5], [sx - sw * 0.06, sy + sh * 0.5], [sx, sy + sh * 0.5]], { w: iw * 0.4, color: C.soft, alpha: k2, dash: [iw * 1.5, iw * 1.5] });
    }
    // ---- zoom out: transistors per chip, log scale ----
    let ro = `phase-shift oscillator: f = 1 / (2π√6·RC) = ${this.fmtF(f)}`;
    if (k3 > 0) {
      const { x: tx, y: ty, w: tw, h: th } = tl, M = this.MS, Y0 = 1958, Y1 = 2024, L1 = 11.5;
      const X = yr => tx + (tw * (yr - Y0)) / (Y1 - Y0), Yv = n => ty + th - (th * Math.log10(Math.max(1, n))) / L1;
      S.line([[tx, ty - th * 0.04], [tx, ty + th], [tx + tw * k3, ty + th]], { w: iw * 0.5, color: C.ink, alpha: k3 });
      const yt = [[1, "1"], [1e3, "thousand"], [1e6, "million"], [1e9, "billion"], [1e11, "100 bn"]];
      for (const [n, lab] of yt) {
        S.line([[tx - 4, Yv(n)], [tx + tw, Yv(n)]], { w: 0.8, color: C.soft, alpha: k3 * 0.35 });
        S.text(lab, tx - 8, Yv(n) + lf * 0.3, { size: lf * 0.8, align: "right", color: C.soft, alpha: k3 });
      }
      for (const yr of [1960, 1980, 2000, 2020]) S.text(String(yr), X(yr), ty + th + lf * 1.2, { size: lf * 0.8, color: C.soft, alpha: k3 });
      S.text("transistors on one chip", tx + lf * 0.4, ty - th * 0.04 - lf * 0.2, { size: lf * 0.9, align: "left", alpha: k3 });
      const vis = M.filter(m => X(m[0]) <= tx + tw * k3);
      S.line(vis.map(m => [X(m[0]), Yv(m[1])]), { w: iw * 0.8, color: C.accent, alpha: k3 });
      const labelled = side ? ["Kilby's chip", "Intel 4004", "Nvidia H100"] : ["Kilby's chip", "Intel 4004", "Pentium", "GTX 580 (AlexNet)", "Nvidia H100"];
      for (const m of vis) {
        const px = X(m[0]), py = Yv(m[1]);
        S.dot(px, py, iw * (m[3] ? 1.1 : 0.8), m[3] ? C.accent : C.ink, k3);
        if (labelled.includes(m[2]) && Math.abs(m[0] - S.p.year) > 8) {
          const kil = m[0] === 1958, early = m[0] < 2000;
          const lx = kil ? px + lf * 0.7 : early ? px + lf * 0.6 : px - lf * 0.6, ly = kil ? py - lf * 0.7 : early ? py + lf * 0.95 : py - lf * 0.6;
          S.text(m[2], lx, ly, { size: lf * 0.8, align: kil || early ? "left" : "right", color: m[3] ? C.accent : C.ink, alpha: k3 });
        }
      }
      // a pulse travelling up the curve, and the year cursor
      const pyr = Y0 + ((ft * 4) % (Y1 - Y0)), pn = this.countAt(pyr);
      S.dot(X(pyr), Yv(pn), iw * 0.7, C.accent, k3 * 0.6);
      const yr = S.p.year, n = this.countAt(yr), cx = X(yr), cy = Yv(n);
      S.line([[cx, ty + th], [cx, cy]], { w: iw * 0.4, color: C.accent, dash: [iw * 1.4, iw * 1.4], alpha: k3 });
      S.circle(cx, cy, iw * 2.2, { w: iw * 0.6, alpha: k3 });
      const near = M.reduce((a, m) => (Math.abs(m[0] - yr) < Math.abs(a[0] - yr) ? m : a));
      const name = Math.abs(near[0] - yr) <= 1 ? near[2] : String(yr);
      const late = cx > tx + tw * 0.55, lx = late ? cx - lf * 0.9 : cx + lf * 0.9, la = late ? "right" : "left";
      const ly = late ? Math.min(ty + th - lf * 2.4, cy + th * 0.55) : Math.min(ty + th - lf * 2.4, cy + lf * 1.8);
      S.text(name, lx, ly, { size: lf * 0.95, align: la, color: C.accent, weight: 500, alpha: k3 });
      S.text(this.fmtN(n) + " transistors", lx, ly + lf * 1.1, { size: lf * 0.85, align: la, color: C.accent, alpha: k3 });
      ro = `${this.fmtF(f)} on Kilby's chip · ${yr}: about ${this.fmtN(n)} transistors on one chip`;
    }
    return ro;
  },
  code(S) {
    const f = this.freq(S), n = this.countAt(S.p.year);
    return `${S.c("# a phase-shift oscillator, all on one chip")}
R = ${S.v(S.p.R.toFixed(1))} * 1e3      ${S.c("# ohms")}
C = ${S.v(S.p.Cp.toFixed(0))} * 1e-12    ${S.c("# farads")}
f = 1 / (2 * pi * sqrt(6) * R * C)
${S.c("# = " + this.fmtF(f))}

${S.c("# Moore's law: transistors double about every 2 years")}
year = ${S.v(S.p.year)}
count = 2300 * 2 ** ((year - 1971) / 2)   ${S.c("# from the 4004")}
${S.c("# real chips in " + S.p.year + ": about " + this.fmtN(n))}`;
  },
});
