// Albert Einstein — Brownian motion (1905): a grain kicked by unseen molecules, its random walk,
// mean squared displacement growing in a straight line ⟨r²⟩ = 4Dt → diffusion models (noise in, noise out)
Lineage.scene({
  params: [
    { id: "temp", label: "Water temperature", type: "range", min: 1, max: 99, step: 1, value: 20, fmt: v => v.toFixed(0) + " °C" },
    { id: "size", label: "Grain radius", type: "range", min: 0.4, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + " µm" },
    { id: "speed", label: "Time speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  FIELD: 12,       // field of view radius, µm
  TF: 9,           // seconds of lab time per second on screen
  WIN: 8,          // seconds on screen per MSD run
  NW: 260,         // invisible walkers used for the average
  visc(T) { return 2.414e-5 * Math.pow(10, 247.8 / (T - 140)); },          // water, Pa·s (Vogel fit)
  D(S) { const T = S.p.temp + 273.15, a = S.p.size * 1e-6; return (1.380649e-23 * T) / (6 * Math.PI * this.visc(T) * a) * 1e12; }, // µm²/s
  gauss(S) { const r = S.st.rnd; let u = r(); if (u < 1e-9) u = 1e-9; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); },
  init(S) {
    const st = S.st, r = (st.rnd = S.rng(1905));
    st.mol = Array.from({ length: 170 }, () => { const a = r() * 6.283, d = Math.sqrt(r()) * this.FIELD; return [d * Math.cos(a), d * Math.sin(a)]; });
    st.hits = [];
    // a star for the diffusion-model beat, with one fixed noise vector per point
    const N = 64, pts = [], eps = [];
    for (let i = 0; i < N; i++) {
      const f = i / N, j = Math.floor(f * 10), fr = f * 10 - j, rad = q => (q % 2 ? 0.42 : 1);
      const a0 = -Math.PI / 2 + (j * Math.PI) / 5, a1 = -Math.PI / 2 + ((j + 1) * Math.PI) / 5;
      const p0 = [rad(j) * Math.cos(a0), rad(j) * Math.sin(a0)], p1 = [rad(j + 1) * Math.cos(a1), rad(j + 1) * Math.sin(a1)];
      pts.push([p0[0] + (p1[0] - p0[0]) * fr, p0[1] + (p1[1] - p0[1]) * fr]);
      { const c = v => Math.max(-1.9, Math.min(1.9, v)); eps.push([c(this.gauss(S) * 0.62), c(this.gauss(S) * 0.62)]); }
    }
    st.star = pts; st.eps = eps; st.dph = 0;
    this.restart(S);
  },
  restart(S) {
    const st = S.st;
    st.g = [0, 0]; st.trace = [[0, 0]]; st.tacc = 0;
    st.walk = Array.from({ length: this.NW }, () => [0, 0]);
    st.msd = [[0, 0]]; st.t = 0; st.macc = 0;
  },
  reset(S) { this.restart(S); },
  onParam(S, id) { if (id !== "speed") this.restart(S); },
  layout(S) {
    const { box, narrow } = S, w = box.w, h = box.h;
    const Rf = narrow ? Math.min(w * 0.26, h * 0.4) : Math.min(w * 0.29, h * 0.31);
    const F = narrow ? [box.x + w * 0.28, box.y + h * 0.46] : [box.x + w * 0.31, box.y + h * 0.38];
    const M = narrow ? { x: box.x + w * 0.64, y: box.y + h * 0.08, w: w * 0.33, h: h * 0.3 } : { x: box.x + w * 0.67, y: box.y + h * 0.1, w: w * 0.29, h: h * 0.28 };
    const N = narrow ? { x: box.x + w * 0.58, y: box.y + h * 0.6, w: w * 0.42, h: h * 0.36 } : { x: box.x + w * 0.6, y: box.y + h * 0.58, w: w * 0.4, h: h * 0.36 };
    Object.assign(S.st, { Rf, F, M, N });
  },
  entry(S) { const { F, Rf } = S.st; return S.narrow ? [F[0] - Rf * 0.6, F[1] + Rf * 0.8] : [F[0] - Rf, F[1] + Rf * 0.15]; },
  draw(S, k, ft, dt) {
    const st = S.st, { Rf, F, M, N } = st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx, FR = this.FIELD;
    const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    const sp = S.p.speed ?? 1, step = (dt || 0) * sp, D = this.D(S), um = Rf / FR, a = S.p.size;
    const X = p => [F[0] + p[0] * um, F[1] + p[1] * um];

    // ---- the microscope's field of view
    S.circle(F[0], F[1], Rf, { w: iw * 0.9, color: C.ink, a0: Math.PI, a1: Math.PI + k1 * Math.PI * 2 });
    S.circle(F[0], F[1], Rf + iw * 2.2, { w: iw * 0.35, color: C.soft, alpha: k1 * 0.8 });
    // scale bar: 5 µm
    const sb0 = [F[0] + Rf * 0.25, F[1] + Rf * 0.78];
    S.line([sb0, [sb0[0] + 5 * um, sb0[1]]], { w: iw * 0.6, color: C.ink, alpha: k1 });
    S.text("5 µm", sb0[0] + 2.5 * um, sb0[1] - fs * 0.35, { size: fs * 0.72, alpha: k1, italic: false });

    // grain motion: Langevin steps with Einstein's D, in lab time
    const tl = step * this.TF;
    let kick = null;
    if (k > 0.2 && tl > 0) {
      const sd = Math.sqrt(2 * D * tl);
      const dx = this.gauss(S) * sd, dy = this.gauss(S) * sd;
      st.g[0] += dx; st.g[1] += dy;
      const rr = Math.hypot(st.g[0], st.g[1]), lim = FR - a * 1.4;
      if (rr > lim) { st.g[0] *= (2 * lim - rr) / rr; st.g[1] *= (2 * lim - rr) / rr; }
      kick = [dx, dy];
      st.tacc += step;
      if (st.tacc > 0.22) { st.tacc = 0; st.trace.push([st.g[0], st.g[1]]); if (st.trace.length > 48) st.trace.shift(); }
    }
    // molecules: fast, faint, invisible in a real microscope
    const ga = a * 1.6, gpx = Math.max(iw * 2.2, ga * um);
    const ms = Math.sqrt((S.p.temp + 273) / 293) * 0.55, rnd = st.rnd;
    ctx.save(); ctx.beginPath(); ctx.arc(F[0], F[1], Rf - iw * 0.5, 0, Math.PI * 2); ctx.clip();
    for (const m of st.mol) {
      if (step > 0) { m[0] += (rnd() - 0.5) * ms * 2; m[1] += (rnd() - 0.5) * ms * 2; }
      if (m[0] * m[0] + m[1] * m[1] > FR * FR) { m[0] *= -0.96; m[1] *= -0.96; }
      const dx = m[0] - st.g[0], dy = m[1] - st.g[1], d = Math.hypot(dx, dy), gr = gpx / um;
      if (d < gr + 0.25) {
        const f = (gr + 0.3) / (d || 1); m[0] = st.g[0] + dx * f; m[1] = st.g[1] + dy * f;
        if (step > 0 && rnd() < 0.18) st.hits.push({ p: [m[0], m[1]], n: [dx / (d || 1), dy / (d || 1)], life: 0.25 });
      }
      const q = X(m); S.dot(q[0], q[1], Math.max(1.1, iw * 0.42), C.soft, 0.5 * k1);
    }
    // little impact marks where molecules strike the grain
    st.hits = st.hits.filter(h => (h.life -= step) > 0).slice(-14);
    for (const h of st.hits) { const q = X(h.p); S.line([q, [q[0] + h.n[0] * iw * 3.5, q[1] + h.n[1] * iw * 3.5]], { w: iw * 0.6, color: C.ink, alpha: 0.75 * k1 * h.life / 0.25 }); }
    // Perrin-style trace: positions joined by straight lines
    if (k2 > 0 && st.trace.length > 1) S.line([...st.trace.map(X), X(st.g)], { w: iw * 0.7, color: C.accent, alpha: 0.9 * k2 });
    const G = X(st.g);
    S.circle(G[0], G[1], gpx, { w: iw * 0.9, color: C.ink, fill: C.paper });
    S.circle(G[0], G[1], gpx * 0.45, { w: iw * 0.35, color: C.ink, alpha: 0.6 });
    ctx.restore();
    S.text("grain in water", F[0], F[1] - Rf - fs * 0.75, { size: fs * (S.narrow ? 0.85 : 1), alpha: k1 });
    if (!S.narrow) S.text("faint dots: water molecules (enlarged; really far too small to see)", F[0], F[1] + Rf + fs * 1.5, { size: fs * 0.78, color: C.soft, alpha: k1 });

    // ---- mean squared displacement from many grains at once
    let msdNow = 0;
    if (k > 0.2) {
      if (step > 0) {
        const sd = Math.sqrt(2 * D * tl);
        for (const w of st.walk) { w[0] += this.gauss(S) * sd; w[1] += this.gauss(S) * sd; }
        st.t += step; st.macc += step;
        if (st.macc >= this.WIN / 36) {
          st.macc = 0; let s2 = 0; for (const w of st.walk) s2 += w[0] * w[0] + w[1] * w[1];
          st.msd.push([st.t, s2 / st.walk.length]);
        }
        if (st.t > this.WIN + 1.2) { st.walk.forEach(w => { w[0] = 0; w[1] = 0; }); st.msd = [[0, 0]]; st.t = 0; }
      }
      msdNow = st.msd[st.msd.length - 1][1];
    }
    if (k2 > 0) {
      const ymax = 4 * D * this.WIN * this.TF * 1.35;
      const px = t => M.x + (Math.min(t, this.WIN) / this.WIN) * M.w, py = v => M.y + M.h - Math.min(1.08, v / ymax) * M.h;
      S.line([[M.x, M.y - fs * 0.2], [M.x, M.y + M.h], [M.x + M.w + fs * 0.3, M.y + M.h]], { w: iw * 0.5, color: C.ink, alpha: k2 });
      S.line([[px(0), py(0)], [px(this.WIN), py(4 * D * this.WIN * this.TF)]], { w: iw * 0.55, color: C.ink, dash: [iw * 1.4, iw * 1.4], alpha: 0.7 * k2 });
      st.msd.forEach(([t, v]) => S.dot(px(t), py(v), Math.max(1.8, iw * 0.65), C.accent, k2));
      S.text("mean squared distance", M.x - fs * 0.2, M.y - fs * 0.75, { size: fs * (S.narrow ? 0.72 : 0.85), align: "left", alpha: k2 });
      S.text("time", M.x + M.w, M.y + M.h + fs * 1.1, { size: fs * 0.8, align: "right", color: C.soft, alpha: k2 });
      S.text("⟨r²⟩ = 4Dt", px(this.WIN * 0.66), py(4 * D * this.WIN * this.TF * 0.86), { size: fs * (S.narrow ? 0.78 : 0.95), align: "right", italic: false, mono: true, alpha: k2 });
      if (!S.narrow) S.text(`average of ${this.NW} grains`, M.x + M.w, M.y + M.h + fs * 2.2, { size: fs * 0.78, align: "right", color: C.soft, alpha: k2 });
    }

    // ---- diffusion model: dissolve a picture into noise, then learn to walk it back
    let phaseTxt = "";
    if (k3 > 0) {
      st.dph = (st.dph + (dt || 0) * Math.max(0.4, sp) * 0.9) % 8;
      const ph = st.dph;
      let tt, rev = false;
      if (ph < 2.6) tt = ph / 2.6; else if (ph < 3.6) tt = 1; else if (ph < 6.2) { tt = 1 - (ph - 3.6) / 2.6; rev = true; } else tt = 0;
      const ab = Math.cos((tt * Math.PI) / 2) ** 2, sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab);
      const side = Math.min(N.w * 0.78, N.h * 0.92), fx0 = N.x + N.w - side, fy0 = N.y + (N.h - side) * 0.5;
      const cx = fx0 + side / 2, cy = fy0 + side / 2, sc = side * 0.3;
      S.rect(fx0, fy0, side, side, { w: iw * 0.5, color: C.ink, alpha: k3 });
      const pts = st.star.map((p, i) => [cx + (sa * p[0] + sn * st.eps[i][0]) * sc, cy + (sa * p[1] + sn * st.eps[i][1]) * sc]);
      ctx.save(); ctx.beginPath(); ctx.rect(fx0, fy0, side, side); ctx.clip();
      S.line(pts, { w: iw * 0.6, color: C.accent, close: true, alpha: k3 * Math.max(0, 1 - tt * 1.6) });
      pts.forEach(q => S.dot(q[0], q[1], Math.max(1.6, iw * 0.6), C.accent, k3));
      ctx.restore();
      S.text("diffusion model", cx, fy0 - fs * 0.5, { size: fs * (S.narrow ? 0.9 : 1.1), color: C.accent, weight: 500, alpha: k3 });
      phaseTxt = ph < 3.6 && ph > 0.05 ? "add noise, step by step" : ph >= 3.6 && ph < 6.2 ? "learned reverse: remove noise" : tt === 0 ? "a clean picture" : "pure noise";
      S.text(phaseTxt, cx, fy0 + side + fs * (S.narrow ? 1.0 : 1.3), { size: fs * (S.narrow ? 0.75 : 0.9), color: rev ? C.accent : C.ink, alpha: k3 });
      // noise level bar
      const bx = fx0 - fs * 1.2, by0 = fy0 + fs * 0.4, bh = side - fs * 0.4;
      S.line([[bx, by0], [bx, by0 + bh]], { w: iw * 0.35, color: C.soft, alpha: k3 });
      S.dot(bx, by0 + bh * (1 - tt), iw * 1.0, rev ? C.accent : C.ink, k3);
      S.text("noise", bx, by0 - fs * 0.5, { size: fs * 0.72, color: C.soft, alpha: k3 });
    }
    return `${S.p.temp.toFixed(0)} °C · grain ${a.toFixed(2)} µm · D = ${D.toFixed(2)} µm²/s · ⟨r²⟩ ${msdNow.toFixed(0)} µm² after ${(st.t * this.TF).toFixed(0)} s`;
  },
  code(S) {
    const T = S.p.temp + 273.15, eta = this.visc(T), D = this.D(S);
    const row = (pre, val, post, cm) => pre + S.v(val) + post + " ".repeat(Math.max(1, 31 - (pre + val + post).length)) + S.c(cm);
    return `${S.c("# Einstein, 1905: how fast a grain wanders")}
${row("k_B = ", "1.38e-23", "", "# Boltzmann's constant")}
${row("T   = ", T.toFixed(0), "", `# kelvin (${S.p.temp.toFixed(0)} °C)`)}
${row("η   = ", eta.toExponential(2), "", "# viscosity of water at T")}
${row("a   = ", S.p.size.toFixed(2), "e-6", "# grain radius, metres")}
${row("D   = k_B*T / (6*π*η*a)", "", "", `# = ${D.toFixed(3)} µm²/s`)}

for step in range(n):          ${S.c("# each step: many tiny kicks")}
    x += gauss(0, sqrt(2*D*dt))
    y += gauss(0, sqrt(2*D*dt))

${S.c("# mean squared distance grows in a straight line")}
${S.c("# <r²> = 4*D*t")}`;
  },
});
