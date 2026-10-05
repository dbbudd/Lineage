// Marie Curie — radioactive decay: every atom has the same fixed chance of decaying each tick,
// so the count halves every half-life → the decay curve morphs into a training-loss curve (closer to a power law)
Lineage.scene({
  params: [
    { id: "half", label: "Half-life", type: "range", min: 1, max: 8, step: 0.1, value: 3, fmt: v => v.toFixed(1) + " s" },
    { id: "n", label: "Number of atoms", type: "range", min: 100, max: 1600, step: 1, value: 900, fmt: v => String(Math.round(Math.sqrt(v)) ** 2) },
    { id: "speed", label: "Time speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "New sample", run(S) { S.st.restart = true; } }],
  side(S) { return Math.max(10, Math.min(40, Math.round(Math.sqrt(S.p.n)))); },
  start(S) {
    const st = S.st, m = this.side(S);
    st.m = m; st.N = m * m; st.alive = new Uint8Array(st.N).fill(1); st.left = st.N;
    st.t = 0; st.hist = [[0, st.N]]; st.hacc = 0; st.flash = []; st.pause = 0; st.seed = (st.seed || 1898) + 1; st.rnd = S.rng(st.seed);
    this.geom(S);
  },
  init(S) { S.st.mph = 0; this.start(S); },
  reset(S) { this.start(S); },
  onParam(S, id) { if (id === "n" || id === "half") this.start(S); },
  geom(S) {
    const st = S.st; if (!st.G || !st.m) return;
    const { G } = st, m = st.m, cell = G.s / m;
    st.cell = cell; st.pos = new Float32Array(st.N * 2);
    for (let i = 0; i < st.N; i++) { st.pos[2 * i] = G.x + (i % m + 0.5) * cell; st.pos[2 * i + 1] = G.y + (Math.floor(i / m) + 0.5) * cell; }
  },
  layout(S) {
    const { box, narrow } = S, w = box.w, h = box.h;
    let G, Pl, L;
    if (narrow) {
      const s = Math.min(w * 0.52, h * 0.72);
      G = { x: box.x + w * 0.01, y: box.y + h * 0.13, s };
      Pl = { x: box.x + w * 0.65, y: box.y + h * 0.08, w: w * 0.32, h: h * 0.28 };
      L = { x: box.x + w * 0.65, y: box.y + h * 0.66, w: w * 0.32, h: h * 0.22 };
    } else {
      const s = Math.min(w * 0.5, h * 0.66);
      G = { x: box.x + w * 0.04, y: box.y + h * 0.16, s };
      Pl = { x: box.x + w * 0.63, y: box.y + h * 0.14, w: w * 0.34, h: h * 0.3 };
      L = { x: box.x + w * 0.63, y: box.y + h * 0.64, w: w * 0.34, h: h * 0.24 };
    }
    Object.assign(S.st, { G, Pl, L });
    this.geom(S);
  },
  entry(S) { const { G } = S.st; return S.narrow ? [G.x + S.iw, G.y + G.s + S.iw * 2] : [G.x - S.iw * 2, G.y + G.s * 0.5]; },
  draw(S, k, ft, dt) {
    const st = S.st, { G, Pl, L } = st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx, nar = S.narrow;
    const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    const T = S.p.half, sp = S.p.speed ?? 1, step = (dt || 0) * sp;
    if (st.restart) { st.restart = false; this.start(S); }

    // ---- simulate: each surviving atom decays with probability p this tick
    if (k > 0.28 && step > 0) {
      if (st.t > T * 5.2 || st.left < 2) { st.pause += dt; if (st.pause > 1.8) this.start(S); }
      else {
        const p = 1 - Math.pow(0.5, step / T), r = st.rnd;
        for (let i = 0; i < st.N; i++) if (st.alive[i] && r() < p) {
          st.alive[i] = 0; st.left--;
          if (st.flash.length < 80) { const a = r() * 6.283; st.flash.push({ i, a, life: 0.6 }); }
        }
        st.t += step; st.hacc += step;
        if (st.hacc > T / 40) { st.hacc = 0; st.hist.push([st.t, st.left]); }
      }
    }

    // ---- the sample: a grid of atoms
    const m = st.m, cell = st.cell, rr = Math.max(1.2, cell * 0.3), shown = Math.ceil(k1 * m);
    ctx.save();
    ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(0.8, Math.min(iw * 0.45, cell * 0.12)); ctx.beginPath();
    for (let i = 0; i < st.N; i++) if (st.alive[i] && Math.floor(i / m) < shown) { const x = st.pos[2 * i], y = st.pos[2 * i + 1]; ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, 6.283); }
    ctx.stroke();
    ctx.fillStyle = C.soft; ctx.globalAlpha = 0.55; ctx.beginPath();
    for (let i = 0; i < st.N; i++) if (!st.alive[i]) { const x = st.pos[2 * i], y = st.pos[2 * i + 1]; ctx.moveTo(x + rr * 0.35, y); ctx.arc(x, y, rr * 0.35, 0, 6.283); }
    ctx.fill(); ctx.restore();
    // radiation: a short ray from each atom that just decayed
    st.flash = st.flash.filter(f => (f.life -= step) > 0);
    for (const f of st.flash) {
      const x = st.pos[2 * f.i], y = st.pos[2 * f.i + 1], u = 1 - f.life / 0.6, r0 = rr + u * cell * 2.2, r1 = r0 + cell * 1.1;
      S.line([[x + Math.cos(f.a) * r0, y + Math.sin(f.a) * r0], [x + Math.cos(f.a) * r1, y + Math.sin(f.a) * r1]], { w: Math.max(1, iw * 0.55), color: C.accent, alpha: (f.life / 0.6) * k1 });
      S.circle(x, y, rr, { w: Math.max(1, iw * 0.5), color: C.accent, alpha: f.life / 0.6 });
    }
    S.text(nar ? `${st.left} of ${st.N} atoms left` : "a sample of radioactive atoms", G.x + G.s / 2, G.y - fs * 0.8, { size: fs * (nar ? 0.85 : 1), alpha: k1 });
    if (!nar) S.text(`${st.left} of ${st.N} left`, G.x + G.s / 2, G.y + G.s + fs * 1.4, { size: fs * (nar ? 0.85 : 1), color: C.ink, alpha: k1, italic: false, mono: true });

    // ---- the count over time, halving every half-life
    if (k2 > 0) {
      const tm = T * 5, px = t => Pl.x + (t / tm) * Pl.w, py = n => Pl.y + Pl.h - (n / st.N) * Pl.h;
      S.line([[Pl.x, Pl.y - fs * 0.3], [Pl.x, Pl.y + Pl.h], [Pl.x + Pl.w + fs * 0.2, Pl.y + Pl.h]], { w: iw * 0.5, color: C.ink, alpha: k2 });
      const lab = ["½", "¼", "⅛"];
      for (let j = 1; j <= 3; j++) {
        const y = py(st.N / 2 ** j), x = px(T * j);
        S.line([[Pl.x, y], [x, y], [x, Pl.y + Pl.h]], { w: iw * 0.35, color: C.soft, dash: [iw, iw * 1.2], alpha: k2 });
        S.text(lab[j - 1], Pl.x - fs * 0.45, y + fs * 0.3, { size: fs * 0.8, align: "right", color: C.soft, alpha: k2, italic: false });
      }
      for (let j = 1; j <= 5; j++) { const x = px(T * j); S.line([[x, Pl.y + Pl.h], [x, Pl.y + Pl.h + iw * 2]], { w: iw * 0.5, color: C.ink, alpha: k2 }); S.text(String(j), x, Pl.y + Pl.h + fs * 1.15, { size: fs * 0.78, alpha: k2, italic: false }); }
      if (!nar) S.text("half-lives", Pl.x + Pl.w, Pl.y + Pl.h + fs * 2.2, { size: fs * 0.8, align: "right", color: C.soft, alpha: k2 });
      S.text("atoms left", Pl.x - fs * 0.2, Pl.y - fs * 0.7, { size: fs * 0.85, align: "left", alpha: k2 });
      S.line(Array.from({ length: 61 }, (_, i) => [px((tm * i) / 60), py(st.N * Math.pow(0.5, (tm * i) / 60 / T))]), { w: iw * 0.45, color: C.ink, alpha: 0.6 * k2 });
      if (st.hist.length > 1) S.line([...st.hist, [st.t, st.left]].map(([t, n]) => [px(Math.min(t, tm)), py(n)]), { w: iw * 0.9, color: C.accent, alpha: k2 });
      S.dot(px(Math.min(st.t, tm)), py(st.left), iw * 1.1, C.accent, k2);
    }

    // ---- AI: the same falling curve becomes a training-loss curve
    if (k3 > 0) {
      st.mph = (st.mph + (dt || 0) * Math.max(0.5, sp)) % 10;
      const ph = st.mph, s = ph < 2.5 ? 0 : ph < 5 ? S.ease((ph - 2.5) / 2.5) : ph < 7.5 ? 1 : 1 - S.ease((ph - 7.5) / 2.5);
      const ex = x => 0.06 + 0.92 * Math.pow(0.5, x * 5), pw = x => 0.06 + 0.92 * Math.pow(1 + x * 40, -0.55);
      const wob = x => 0.012 * Math.sin(x * 97) * Math.sin(x * 31 + 1) * (1 - x * 0.5);
      const px = x => L.x + x * L.w, py = y => L.y + L.h - y * L.h;
      S.line([[L.x, L.y - fs * 0.3], [L.x, L.y + L.h], [L.x + L.w + fs * 0.2, L.y + L.h]], { w: iw * 0.5, color: C.ink, alpha: k3 });
      const pts = Array.from({ length: 121 }, (_, i) => { const x = i / 120; return [px(x), py((1 - s) * ex(x) + s * (pw(x) + wob(x)))]; });
      S.line(pts, { w: iw * 1.0, color: C.accent, alpha: k3 });
      S.text("training loss", L.x - fs * 0.2, L.y - fs * 0.7, { size: fs * (nar ? 0.85 : 1), align: "left", color: C.accent, weight: 500, alpha: k3 });
      S.text("training steps", L.x + L.w, L.y + L.h + fs * 1.15, { size: fs * 0.8, align: "right", color: C.soft, alpha: k3 });
      const tag = s < 0.5 ? (nar ? "exponential" : "exponential: halves every step") : (nar ? "power law" : "real LLM loss: closer to a power law");
      S.text(tag, L.x + L.w, L.y + L.h * 0.3, { size: fs * (nar ? 0.75 : 0.85), align: "right", color: C.ink, alpha: k3 });
      if (!nar) S.text("falls fast, then flattens", L.x + L.w, L.y + L.h * 0.3 - fs * 1.25, { size: fs * 0.85, align: "right", color: C.soft, alpha: k3 });
    }
    return `half-life ${T.toFixed(1)} s · ${st.left} of ${st.N} atoms left · ${(st.t / T).toFixed(1)} half-lives (expected ${Math.round(st.N * Math.pow(0.5, st.t / T))})`;
  },
  code(S) {
    const T = S.p.half, m = this.side(S), p = 1 - Math.pow(0.5, (1 / 60) / T);
    return `${S.c("# radioactive decay: every atom rolls a die each tick")}
half_life = ${S.v(T.toFixed(1))}                  ${S.c("# seconds")}
dt = 1/60
p  = 1 - 0.5 ** (dt / half_life)  ${S.c(`# = ${p.toFixed(4)} per tick`)}
atoms = [True] * ${S.v(m * m)}

while t < 5 * half_life:
    for i, alive in enumerate(atoms):
        if alive and random() < p:
            atoms[i] = False       ${S.c("# it decays, giving off radiation")}
    t += dt

${S.c("# on average: N(t) = N0 * 0.5 ** (t / half_life)")}`;
  },
});
