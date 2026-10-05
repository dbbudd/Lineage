// John Hopfield — a 10×10 network of ±1 neurons stores letters with Hebb's rule; from a noisy start, one-at-a-time
// updates roll the energy downhill until a memory is recalled → modern Hopfield networks = transformer attention (2020)
(function () {
  const N = 100, SIDE = 10;
  const ART = {
    H: ["##......##", "##......##", "##......##", "##......##", "##########", "##########", "##......##", "##......##", "##......##", "##......##"].join(""),
    O: ["..######..", ".########.", "##......##", "##......##", "##......##", "##......##", "##......##", "##......##", ".########.", "..######.."].join(""),
    I: ["##########", "##########", "....##....", "....##....", "....##....", "....##....", "....##....", "....##....", "##########", "##########"].join(""),
    L: ["##........", "##........", "##........", "##........", "##........", "##........", "##........", "##........", "##########", "##########"].join(""),
    D: ["#######...", "########..", "##....###.", "##.....##.", "##.....##.", "##.....##.", "##.....##.", "##....###.", "########..", "#######..."].join(""),
    P: ["########..", "#########.", "##.....###", "##......##", "##.....###", "#########.", "########..", "##........", "##........", "##........"].join(""),
    F: ["##########", "##########", "##........", "##........", "########..", "########..", "##........", "##........", "##........", "##........"].join(""),
    E: ["##########", "##########", "##........", "##........", "########..", "########..", "##........", "##........", "##########", "##########"].join(""),
  };
  const ORDER = "HOILDPFE";
  const PATS = ORDER.split("").map(c => ART[c].split("").map(x => (x === "#" ? 1 : -1)));

  function weights(S) {
    const st = S.st, m = Math.round(S.p.pats), W = new Float32Array(N * N);
    for (let p = 0; p < m; p++) { const x = PATS[p]; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) W[i * N + j] += (x[i] * x[j]) / N; }
    st.W = W; st.m = m;
    st.Emem = PATS.slice(0, m).map(x => energy(W, x));
  }
  function energy(W, s) { let E = 0; for (let i = 0; i < N; i++) { let h = 0; for (let j = 0; j < N; j++) h += W[i * N + j] * s[j]; E += s[i] * h; } return -0.5 * E; }
  function field(W, s, i) { let h = 0; for (let j = 0; j < N; j++) h += W[i * N + j] * s[j]; return h; }

  function newRun(S, keepTarget) {
    const st = S.st;
    if (!keepTarget) st.target = (st.target + 1) % st.m;
    if (st.target >= st.m) st.target = 0;
    const r = S.rng(1000 + st.runs++), x = PATS[st.target], nz = S.p.noise / 100;
    st.s = x.map(v => (r() < nz ? -v : v));
    st.start = st.s.slice();
    st.flipsIn = 0; restartTrace(S);
  }
  function restartTrace(S) {
    const st = S.st;
    st.E = energy(st.W, st.s); st.hist = [st.E]; st.step = 0; st.quiet = 0; st.done = false; st.hold = 0; st.order = []; st.last = -1; st.lastFlip = false; st.acc = 0;
  }
  function overlaps(st) { return PATS.slice(0, st.m).map(x => { let o = 0; for (let i = 0; i < N; i++) o += x[i] * st.s[i]; return o / N; }); }

  function stepOnce(S) {
    const st = S.st;
    if (!st.order.length) { const r = S.rng(77 + st.step); st.order = Array.from({ length: N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [st.order[i], st.order[j]] = [st.order[j], st.order[i]]; } }
    const i = st.order.pop(), h = field(st.W, st.s, i), nv = h > 0 ? 1 : h < 0 ? -1 : st.s[i];
    st.last = i; st.lastFlip = nv !== st.s[i];
    if (st.lastFlip) { st.E += -(nv - st.s[i]) * h; st.s[i] = nv; st.quiet = 0; } else st.quiet++;
    st.step++; if (st.hist.length < 900) st.hist.push(st.E);
    if (st.quiet >= N) st.done = true;
  }

  function rrect(S, x, y, w, h, r, o) {
    const ctx = S.ctx; ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } if (o.color) { ctx.strokeStyle = o.color; ctx.lineWidth = o.w; ctx.stroke(); } ctx.restore();
  }

  Lineage.scene({
    params: [
      { id: "noise", label: "Noise in the starting picture", type: "range", min: 0, max: 50, step: 1, value: 25, fmt: v => Math.round(v) + "% flipped" },
      { id: "pats", label: "Memories stored", type: "range", min: 1, max: 8, step: 1, value: 3, fmt: v => `${Math.round(v)}: ${ORDER.slice(0, Math.round(v)).split("").join(" ")}` },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "New noisy start", run(S) { newRun(S); } }],
    init(S) { Object.assign(S.st, { target: -1, runs: 0 }); weights(S); newRun(S); },
    reset(S) { S.st.target = -1; newRun(S); },
    onParam(S, id) {
      if (id === "pats") { weights(S); newRun(S, true); }
      if (id === "noise") newRun(S, true);
    },
    layout(S) {
      const b = S.box, nar = S.narrow, fs = S.fs, st = S.st;
      const g = nar ? Math.min(b.w * 0.5, b.h * 0.6) : Math.min(b.w * 0.48, b.h * 0.56);
      const gx = b.x + (nar ? fs * 0.3 : fs * 0.6), gy = b.y + fs * (nar ? 1.4 : 1.9);
      const px0 = gx + g + fs * (nar ? 1.6 : 2.6), px1 = b.x + b.w - fs * 0.4, py0 = gy + fs * 0.5, py1 = gy + g * (nar ? 0.78 : 0.72);
      const ty = gy + g + fs * (nar ? 2.6 : 3.2);
      Object.assign(st, { g, gx, gy, cs: g / SIDE, px0, px1, py0, py1, ty });
    },
    entry(S) { const st = S.st; return [st.gx - S.iw, st.gy + st.g * 0.5]; },
    pointer(S, type, x, y) {
      const st = S.st, c = Math.floor((x - st.gx) / st.cs), r = Math.floor((y - st.gy) / st.cs);
      if (type === "up") { st.paint = null; return; }
      if (c < 0 || c >= SIDE || r < 0 || r >= SIDE) return;
      const i = r * SIDE + c;
      if (type === "down") { st.paint = -st.s[i]; }
      if ((type === "down" || type === "drag") && st.paint != null && st.s[i] !== st.paint) { st.s[i] = st.paint; st.E = energy(st.W, st.s); restartTrace(S); }
    },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, b = S.box, nar = S.narrow;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      // dynamics: one neuron at a time
      if (k > 0.25 && dt > 0) {
        if (st.done) { st.hold += dt * S.p.speed; if (st.hold > 3.2) newRun(S); }
        else { st.acc += dt * 26 * S.p.speed; while (st.acc >= 1 && !st.done) { st.acc--; stepOnce(S); } }
      }
      const { g, gx, gy, cs } = st;
      // ---- beat 1: the grid of neurons
      S.text("100 neurons, each +1 or −1", gx, gy - fs * 0.55, { size: fs * (nar ? 0.72 : 0.85), align: "left", color: C.soft, alpha: k1 });
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / SIDE), c = i % SIDE, x = gx + c * cs, y = gy + r * cs;
        const show = (r + c) / (2 * SIDE - 2) <= k1 * 1.02; if (!show) continue;
        if (st.s[i] > 0) rrect(S, x + cs * 0.08, y + cs * 0.08, cs * 0.84, cs * 0.84, cs * 0.12, { fill: C.ink });
        else S.dot(x + cs / 2, y + cs / 2, Math.max(1.2, cs * 0.07), C.soft);
      }
      S.rect(gx, gy, g, g, { w: iw * 0.5, color: C.ink, alpha: k1 });
      if (st.last >= 0 && !st.done && k > 0.25) {
        const r = Math.floor(st.last / SIDE), c = st.last % SIDE;
        rrect(S, gx + c * cs - cs * 0.02, gy + r * cs - cs * 0.02, cs * 1.04, cs * 1.04, cs * 0.15, { color: C.accent, w: iw * (st.lastFlip ? 0.9 : 0.5) });
      }
      const ov = overlaps(st);
      let best = 0; ov.forEach((o, i) => { if (Math.abs(o) > Math.abs(ov[best])) best = i; });
      let verdict;
      if (ov[st.target] > 0.98) verdict = `recalled “${ORDER[st.target]}”`;
      else if (ov[best] > 0.98) verdict = `fell into “${ORDER[best]}”`;
      else if (ov[best] < -0.98) verdict = `inverted “${ORDER[best]}”`;
      else verdict = st.done ? `stuck in a spurious mix` : `closest: “${ORDER[best]}” ${Math.round(Math.abs(ov[best]) * 100)}%`;
      const ok = ov[st.target] > 0.98;
      const vt = st.done ? verdict : `settling… ${verdict}`;
      S.text(vt, gx + g / 2, gy + g + fs * 1.25, { size: fs * (nar ? 0.85 : 1.0), color: st.done ? (ok ? C.accent : C.ink) : C.soft, weight: st.done ? 600 : 400, alpha: k1 });
      // ---- beat 2: the energy rolls downhill
      if (k2 > 0) {
        const { px0, px1, py0, py1 } = st, H = st.hist;
        const Emin = Math.min(...st.Emem.slice(0, st.m), ...H) - 2, Emax = Math.max(...H, st.Emem[st.target] + 5) + 2;
        const span = Math.max(1, Emax - Emin), nx = Math.max(220, H.length);
        const X = j => px0 + (px1 - px0) * (j / nx), Y = E => py0 + (py1 - py0) * ((Emax - E) / span);
        S.line([[px0, py0 - fs * 0.2], [px0, py1], [px0 + (px1 - px0) * k2, py1]], { w: iw * 0.45, color: C.ink, alpha: k2 });
        S.text("energy E", px0 - fs * 0.1, py0 - fs * 0.55, { size: fs * 0.8, align: "left", color: C.ink, alpha: k2 });
        S.text("updates →", px1, py1 + fs * 1.05, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
        const em = st.Emem[st.target];
        S.line([[px0, Y(em)], [px1, Y(em)]], { w: iw * 0.4, color: C.accent, dash: [iw * 1.2, iw * 1.2], alpha: k2 * 0.8 });
        S.text(`memory “${ORDER[st.target]}”`, px0 + fs * 0.4, Y(em) + fs * 1.0, { size: fs * 0.72, align: "left", color: C.accent, alpha: k2 });
        const pts = []; const stp = Math.max(1, Math.floor(H.length / 300));
        for (let j = 0; j < H.length; j += stp) pts.push([X(j), Y(H[j])]);
        pts.push([X(H.length - 1), Y(H[H.length - 1])]);
        S.line(pts, { w: iw * 0.9, color: C.ink, alpha: k2 });
        const e = pts[pts.length - 1]; S.dot(e[0], e[1], iw * 1.1, C.accent, k2);
        S.text(`E = ${st.E.toFixed(1)}`, e[0] + (e[0] > (px0 + px1) / 2 ? -fs * 0.3 : fs * 0.4), e[1] - fs * 0.6, { size: fs * 0.8, align: e[0] > (px0 + px1) / 2 ? "right" : "left", color: C.ink, alpha: k2, italic: false });
        if (!nar) S.text("each flip can only lower E", (px0 + px1) / 2, py1 + fs * 2.2, { size: fs * 0.75, color: C.soft, alpha: k2 });
      }
      // ---- beat 3: stored memories as keys; a modern Hopfield network weighs them with softmax = attention
      if (k3 > 0) {
        const ty = st.ty, m = st.m, avail = b.w - (nar ? 0 : fs * 0.6), slot = Math.min(avail / 8, fs * (nar ? 2.6 : 4.2));
        const ts = slot * (nar ? 0.68 : 0.7), pc = ts / SIDE, x0 = b.x + (nar ? 0 : fs * 0.6);
        S.text(nar ? "stored memories · attention weights" : "stored memories, weighed like attention: softmax(β · overlap)", x0, ty - fs * 0.55, { size: fs * (nar ? 0.75 : 0.85), align: "left", color: C.accent, alpha: k3, weight: 600 });
        const beta = 5, lg = ov.map(o => beta * o), mx = Math.max(...lg), ex = lg.map(v => Math.exp(v - mx)), sm = ex.reduce((a, c) => a + c, 0);
        for (let p = 0; p < 8; p++) {
          const x = x0 + p * slot, y = ty + fs * 0.1, on = p < m, a = k3 * (on ? 1 : 0.28);
          const ctx = S.ctx; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = on && p === st.target ? C.accent : C.ink;
          for (let i = 0; i < N; i++) if (PATS[p][i] > 0) ctx.fillRect(x + (i % SIDE) * pc, y + Math.floor(i / SIDE) * pc, pc * 0.92, pc * 0.92);
          ctx.restore();
          S.rect(x - 1, y - 1, ts + 2, ts + 2, { w: iw * 0.25, color: C.soft, alpha: a });
          if (on) {
            const w = ex[p] / sm, bh = slot * (nar ? 0.5 : 0.75), by = y + ts + fs * 0.35;
            S.rect(x, by, ts, bh, { w: iw * 0.25, color: C.soft, alpha: k3 });
            S.rect(x, by + bh * (1 - w), ts, bh * w, { w: 0, fill: C.accent, alpha: k3 });
            S.text(w >= 0.995 ? "1.00" : w.toFixed(2), x + ts / 2, by + bh + fs * 0.85, { size: fs * 0.68, color: C.ink, alpha: k3, italic: false });
          }
        }
        if (!nar) S.text("2020: this softmax look-up is the same maths as attention in transformers", x0, b.y + b.h - fs * 0.1, { size: fs * 0.78, align: "left", color: C.ink, alpha: k3 });
      }
      return `${st.m} memor${st.m === 1 ? "y" : "ies"} stored (capacity ≈ 0.14 × 100 = 14 random patterns; letters overlap, so fewer) · step ${st.step} · E = ${st.E.toFixed(1)} · ${verdict}`;
    },
    code(S) {
      const st = S.st;
      return `${S.c("# Hopfield network (1982): store with Hebb's rule")}
W = sum(outer(x, x) for x in memories) / 100   ${S.c("# " + st.m + " letters")}
fill_diagonal(W, 0)

s = add_noise(memory, ${S.v(Math.round(S.p.noise) + "%")})
while not stable:
    i = random_neuron()
    s[i] = sign(W[i] @ s)       ${S.c("# step " + st.step + (st.last >= 0 ? ": neuron " + st.last : ""))}

E = -0.5 * s @ W @ s            ${S.c("# = " + st.E.toFixed(1) + ", never goes up")}

${S.c("# modern version (2020) = attention")}
s_new = X @ softmax(beta * X.T @ s)`;
    },
  });
})();
