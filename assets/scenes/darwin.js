// Charles Darwin — natural selection: beetles of heritable colour on bark; birds take the most visible,
// offspring inherit with small mutations; the population drifts to camouflage → a genetic algorithm
Lineage.scene({
  params: [
    { id: "bark", label: "Bark colour", type: "range", min: 0, max: 1, step: 0.01, value: 0.78, fmt: v => (v < 0.33 ? "pale" : v < 0.66 ? "medium" : "dark") + " " + v.toFixed(2) },
    { id: "sel", label: "Selection strength", type: "range", min: 0, max: 1, step: 0.01, value: 0.7, fmt: v => v.toFixed(2) },
    { id: "mut", label: "Mutation size", type: "range", min: 0, max: 0.15, step: 0.005, value: 0.05, fmt: v => v.toFixed(3) },
    { id: "speed", label: "Generation speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "New population", run(S) { S.st.again = true; } }],
  TARGET: "ORIGIN OF SPECIES",
  ABC: "ABCDEFGHIJKLMNOPQRSTUVWXYZ ",
  gauss(r) { let u = r(); if (u < 1e-9) u = 1e-9; return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * r()); },
  start(S) {
    const st = S.st, r = (st.rnd = S.rng((st.seed = (st.seed || 1859) + 1)));
    const n = S.narrow ? 5 : 6, pop = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++)
      pop.push({ u: (i + 0.5 + (r() - 0.5) * 0.55) / n, v: (j + 0.5 + (r() - 0.5) * 0.55) / n, a: (r() - 0.5) * 1.6, c: Math.min(1, Math.max(0, 0.18 + this.gauss(r) * 0.07)), state: 0, fade: 1, eaten: false });
    st.pop = pop; st.n = n; st.gen = 0; st.gt = 0; st.hist = [this.stats(pop)]; st.victims = [];
    this.gaStart(S);
  },
  stats(pop) { const cs = pop.map(b => b.c); return { mean: cs.reduce((a, b) => a + b, 0) / cs.length, cs }; },
  gaStart(S) {
    const st = S.st, r = st.rnd, L = this.TARGET.length, A = this.ABC;
    st.ga = { pop: Array.from({ length: 80 }, () => Array.from({ length: L }, () => A[Math.floor(r() * A.length)]).join("")), gen: 0, acc: 0, hold: 0 };
    this.gaScore(S);
  },
  gaFit(s) { let f = 0; for (let i = 0; i < s.length; i++) if (s[i] === this.TARGET[i]) f++; return f; },
  gaScore(S) { const g = S.st.ga; g.ranked = g.pop.map(s => [s, this.gaFit(s)]).sort((a, b) => b[1] - a[1]); },
  gaStep(S) {
    const g = S.st.ga, r = S.st.rnd, A = this.ABC, L = this.TARGET.length, pm = 0.01 + S.p.mut * 0.4;
    const pick = () => { let best = null; for (let t = 0; t < 3; t++) { const c = g.ranked[Math.floor(r() * g.ranked.length)]; if (!best || c[1] > best[1]) best = c; } return best[0]; };
    const next = [g.ranked[0][0], g.ranked[1][0]];
    while (next.length < g.pop.length) {
      const a = pick(), b = pick(), cut = 1 + Math.floor(r() * (L - 1));
      let child = a.slice(0, cut) + b.slice(cut);
      child = Array.from(child, ch => (r() < pm ? A[Math.floor(r() * A.length)] : ch)).join("");
      next.push(child);
    }
    g.pop = next; g.gen++; this.gaScore(S);
  },
  init(S) { this.start(S); },
  reset(S) { this.start(S); },
  layout(S) {
    const { box, narrow } = S, w = box.w, h = box.h;
    let B, Pl, GA;
    if (narrow) {
      const s = Math.min(w * 0.54, h * 0.74);
      B = { x: box.x + w * 0.01, y: box.y + h * 0.12, s };
      Pl = { x: box.x + w * 0.66, y: box.y + h * 0.09, w: w * 0.31, h: h * 0.28 };
      GA = { x: box.x + w * 0.6, y: box.y + h * 0.6, w: w * 0.4, h: h * 0.36 };
    } else {
      const s = Math.min(w * 0.5, h * 0.64);
      B = { x: box.x + w * 0.04, y: box.y + h * 0.15, s };
      Pl = { x: box.x + w * 0.64, y: box.y + h * 0.14, w: w * 0.33, h: h * 0.28 };
      GA = { x: box.x + w * 0.6, y: box.y + h * 0.6, w: w * 0.4, h: h * 0.32 };
    }
    const old = S.st.n; Object.assign(S.st, { B, Pl, GA });
    if (old && old !== (narrow ? 5 : 6)) this.start(S);
  },
  entry(S) { const { B } = S.st; return S.narrow ? [B.x + S.iw, B.y + B.s + S.iw] : [B.x - S.iw, B.y + B.s * 0.5]; },
  pointer(S, type, x, y) {
    if (type !== "down") return;
    const { B, pop } = S.st; if (x < B.x || x > B.x + B.s || y < B.y || y > B.y + B.s) return;
    let best = null, bd = 1e9;
    for (const b of pop) { if (b.eaten) continue; const d = Math.hypot(B.x + b.u * B.s - x, B.y + b.v * B.s - y); if (d < bd) { bd = d; best = b; } }
    if (best && bd < B.s / S.st.n) { best.eaten = true; best.fade = 1; S.st.byHand = (S.st.byHand || 0) + 1; }
  },
  generation(S) {
    const st = S.st, r = st.rnd, pop = st.pop, bark = S.p.bark, k = Math.round(pop.length * 0.35);
    // birds: the more a beetle stands out, the more likely it is eaten
    const w = pop.map(b => (b.eaten ? 0 : Math.exp(S.p.sel * 9 * Math.abs(b.c - bark))));
    let need = k - pop.filter(b => b.eaten).length;
    while (need-- > 0) {
      const tot = w.reduce((a, b) => a + b, 0); if (tot <= 0) break;
      let x = r() * tot, i = 0; while (i < w.length - 1 && (x -= w[i]) > 0) i++;
      pop[i].eaten = true; pop[i].fade = 1; w[i] = 0;
    }
    st.victims = pop.filter(b => b.eaten);
  },
  breed(S) {
    const st = S.st, r = st.rnd, pop = st.pop, surv = pop.filter(b => !b.eaten);
    if (!surv.length) { this.start(S); return; }
    for (const b of pop) if (b.eaten) {
      const p = surv[Math.floor(r() * surv.length)];
      b.c = Math.min(1, Math.max(0, p.c + this.gauss(r) * S.p.mut)); b.eaten = false; b.fade = 0; b.a = (r() - 0.5) * 1.6;
    }
    st.gen++; st.hist.push(this.stats(pop)); if (st.hist.length > 41) st.hist.shift();
    st.victims = [];
  },
  beetle(S, x, y, sz, ang, col, alpha) {
    const ctx = S.ctx, C = S.C; ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
    ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(0.7, sz * 0.06); ctx.lineCap = "round";
    ctx.beginPath();
    for (const sy of [-1, 1]) for (const t of [-0.35, 0, 0.35]) { ctx.moveTo(t * sz, sy * sz * 0.3); ctx.lineTo(t * sz + sz * 0.18 * (t + 0.1), sy * sz * 0.62); }
    ctx.moveTo(-sz * 0.62, -sz * 0.08); ctx.lineTo(-sz * 0.85, -sz * 0.25); ctx.moveTo(-sz * 0.62, sz * 0.08); ctx.lineTo(-sz * 0.85, sz * 0.25);
    ctx.globalAlpha = alpha * 0.55; ctx.stroke(); ctx.globalAlpha = alpha;
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(sz * 0.05, 0, sz * 0.5, sz * 0.36, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(-sz * 0.52, 0, sz * 0.15, 0, 6.283); ctx.fill();
    ctx.globalAlpha = alpha * 0.35; ctx.beginPath(); ctx.ellipse(sz * 0.05, 0, sz * 0.5, sz * 0.36, 0, 0, 6.283); ctx.moveTo(-sz * 0.3, 0); ctx.lineTo(sz * 0.55, 0); ctx.stroke();
    ctx.restore();
  },
  draw(S, k, ft, dt) {
    const st = S.st, { B, Pl, GA } = st, iw = S.iw, C = S.C, fs = S.fs, nar = S.narrow, ctx = S.ctx;
    const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    if (st.again) { st.again = false; this.start(S); }
    const sp = S.p.speed ?? 1, step = (dt || 0) * sp, TG = 1.05;
    const col = c => S.mix(C.paper, C.ink, 0.05 + c * 0.9);
    // the generation clock: birds strike at 0, offspring arrive at 0.6·TG
    if (k > 0.3 && step > 0) {
      const before = st.gt; st.gt += step;
      if (before < 0.05 && st.gt >= 0.05) this.generation(S);
      if (before < TG * 0.62 && st.gt >= TG * 0.62) this.breed(S);
      if (st.gt >= TG) st.gt = 0;
    }
    for (const b of st.pop) if (!b.eaten) b.fade = Math.min(1, b.fade + step * 2.6);

    // ---- the bark and its beetles
    ctx.save(); ctx.globalAlpha = k1;
    ctx.fillStyle = col(S.p.bark); ctx.beginPath(); ctx.rect(B.x, B.y, B.s, B.s * k1); ctx.fill();
    // bark grain lines
    ctx.strokeStyle = S.mix(C.paper, C.ink, S.p.bark > 0.5 ? Math.max(0, S.p.bark - 0.18) : S.p.bark + 0.15); ctx.lineWidth = Math.max(1, iw * 0.4);
    ctx.beginPath(); for (let i = 1; i < 9; i++) { const x = B.x + (i / 9) * B.s; ctx.moveTo(x, B.y); for (let j = 1; j <= 12; j++) ctx.lineTo(x + Math.sin(i * 3.1 + j * 1.3) * B.s * 0.012, B.y + (j / 12) * B.s * k1); } ctx.stroke();
    ctx.restore();
    S.rect(B.x, B.y, B.s, B.s, { w: iw * 0.6, color: C.ink, alpha: k1 });
    const sz = (B.s / st.n) * 0.62;
    if (k1 > 0.3) for (const b of st.pop) this.beetle(S, B.x + b.u * B.s, B.y + b.v * B.s, sz, b.a, col(b.c), b.fade * Math.min(1, (k1 - 0.3) / 0.5));
    // birds' targets
    if (st.gt < TG * 0.62) for (const b of st.victims) {
      const x = B.x + b.u * B.s, y = B.y + b.v * B.s, a = Math.min(1, st.gt / 0.25);
      S.circle(x, y, sz * 0.75, { w: iw * 0.6, color: C.accent, alpha: a });
      S.line([[x - sz * 0.5, y - sz * 0.5], [x + sz * 0.5, y + sz * 0.5]], { w: iw * 0.6, color: C.accent, alpha: a });
    }
    const m = st.hist[st.hist.length - 1].mean;
    S.text(nar ? `generation ${st.gen}` : `beetles on bark · generation ${st.gen}`, B.x + B.s / 2, B.y - fs * 0.75, { size: fs * (nar ? 0.85 : 1), alpha: k1 });
    if (!nar) S.text("birds take the beetles that stand out; tap one to be the bird", B.x + B.s / 2, B.y + B.s + fs * 1.4, { size: fs * 0.78, color: C.soft, alpha: k1 });

    // ---- mean colour over generations
    if (k2 > 0) {
      const G = 40, px = g => Pl.x + (g / G) * Pl.w, py = c => Pl.y + Pl.h - c * Pl.h;
      S.line([[Pl.x, Pl.y - fs * 0.3], [Pl.x, Pl.y + Pl.h], [Pl.x + Pl.w + fs * 0.2, Pl.y + Pl.h]], { w: iw * 0.5, color: C.ink, alpha: k2 });
      S.line([[Pl.x, py(S.p.bark)], [Pl.x + Pl.w, py(S.p.bark)]], { w: iw * 0.5, color: C.ink, dash: [iw * 1.3, iw * 1.3], alpha: 0.7 * k2 });
      S.text("bark", Pl.x + Pl.w, py(S.p.bark) + (S.p.bark > 0.8 ? fs * 1.1 : -fs * 0.35), { size: fs * 0.78, align: "right", color: C.soft, alpha: k2 });
      const off = Math.max(0, st.gen - G);
      st.hist.forEach((h, i) => { const g = st.gen - (st.hist.length - 1) + i - off; for (let j = 0; j < h.cs.length; j += 2) S.dot(px(g), py(h.cs[j]), Math.max(1, iw * 0.3), C.soft, 0.5 * k2); });
      S.line(st.hist.map((h, i) => [px(st.gen - (st.hist.length - 1) + i - off), py(h.mean)]), { w: iw * 0.9, color: C.accent, alpha: k2 });
      S.text("mean colour", Pl.x - fs * 0.2, Pl.y - fs * 0.7, { size: fs * 0.85, align: "left", alpha: k2 });
      S.text("pale", Pl.x - fs * 0.35, Pl.y + Pl.h, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
      S.text("dark", Pl.x - fs * 0.35, Pl.y + fs * 0.5, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
      S.text("generations", Pl.x + Pl.w, Pl.y + Pl.h + fs * 1.15, { size: fs * 0.78, align: "right", color: C.soft, alpha: k2 });
    }

    // ---- genetic algorithm: the same loop, evolving a solution
    if (k3 > 0) {
      const g = st.ga;
      if (step > 0) {
        if (g.ranked[0][1] === this.TARGET.length) { g.hold += step; if (g.hold > 2.2) this.gaStart(S); }
        else { g.acc += step; if (g.acc > 0.22) { g.acc = 0; this.gaStep(S); } }
      }
      const tfs = fs * (nar ? 0.68 : 0.88), lh = tfs * 1.55;
      S.text("genetic algorithm", GA.x + GA.w * 0.5, GA.y, { size: fs * (nar ? 0.85 : 1.1), color: C.accent, weight: 500, alpha: k3 });
      S.text(`target: "${this.TARGET}"`, GA.x + GA.w * 0.5, GA.y + lh * 1.0, { size: tfs * 0.92, mono: true, italic: false, color: C.soft, alpha: k3 });
      ctx.save(); ctx.font = `${tfs.toFixed(1)}px "IBM Plex Mono", monospace`; const cw = ctx.measureText("M").width; ctx.restore();
      const rows = nar ? 3 : 4, x0 = GA.x + GA.w * 0.5 - (cw * this.TARGET.length) / 2;
      for (let i = 0; i < rows; i++) {
        const [s, f] = g.ranked[i], y = GA.y + lh * (2.3 + i);
        for (let j = 0; j < s.length; j++) {
          const ok = s[j] === this.TARGET[j];
          S.text(s[j] === " " ? "·" : s[j], x0 + cw * (j + 0.5), y, { size: tfs, mono: true, italic: false, color: ok ? C.accent : C.soft, weight: ok ? 500 : 400, alpha: k3, halo: false });
        }
        const bw = (f / this.TARGET.length) * GA.w * 0.9;
        S.line([[GA.x + GA.w * 0.05, y + tfs * 0.42], [GA.x + GA.w * 0.05 + bw, y + tfs * 0.42]], { w: Math.max(1, iw * 0.35), color: C.accent, alpha: 0.5 * k3 });
      }
      S.text(`generation ${g.gen} · best fitness ${g.ranked[0][1]}/${this.TARGET.length}`, GA.x + GA.w * 0.5, GA.y + lh * (2.6 + rows), { size: fs * (nar ? 0.7 : 0.8), color: C.ink, alpha: k3 });
    }
    return `generation ${st.gen} · mean colour ${m.toFixed(2)} vs bark ${S.p.bark.toFixed(2)} · ${Math.round(st.pop.length * 0.35)} eaten each generation`;
  },
  code(S) {
    return `${S.c("# natural selection, one generation")}
bark = ${S.v(S.p.bark.toFixed(2))}                       ${S.c("# 0 = pale, 1 = dark")}
for b in beetles:
    b.risk = exp(${S.v((S.p.sel * 9).toFixed(1))} * abs(b.colour - bark))
eaten = sample(beetles, k=${S.v(Math.round((S.st.pop ? S.st.pop.length : 36) * 0.35))}, weights=risks)  ${S.c("# birds")}
survivors = [b for b in beetles if b not in eaten]

for _ in eaten:                     ${S.c("# refill the population")}
    parent = choice(survivors)
    child = parent.colour + gauss(0, ${S.v(S.p.mut.toFixed(3))})  ${S.c("# inherit + mutate")}
    beetles.append(Beetle(child))

${S.c("# a genetic algorithm swaps the birds for a fitness function")}`;
  },
});
