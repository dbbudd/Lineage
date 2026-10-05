// Demis Hassabis — HP lattice protein folding (a teaching model) → energy falls → contact map → AlphaFold 2
(function () {
  const DEFAULT = "HPHPPHHPHPPHPHHPPHPH";
  const clean = s => { const q = String(s || "").toUpperCase().replace(/[^HP]/g, "").slice(0, 32); return q.length >= 4 ? q : DEFAULT; };
  const key = (x, y) => (x + 64) * 256 + (y + 64);
  function energy(seq, c) {
    const occ = new Map(); c.forEach((p, i) => occ.set(key(p[0], p[1]), i));
    let e = 0;
    for (let i = 0; i < c.length; i++) {
      if (seq[i] !== "H") continue;
      const [x, y] = c[i];
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const j = occ.get(key(x + dx, y + dy));
        if (j != null && Math.abs(j - i) > 1 && seq[j] === "H") e--;
        const j2 = occ.get(key(x - dx, y - dy));
        if (j2 != null && Math.abs(j2 - i) > 1 && seq[j2] === "H") e--;
      }
    }
    return e / 2;
  }
  function contacts(seq, c) {
    const occ = new Map(); c.forEach((p, i) => occ.set(key(p[0], p[1]), i)); const out = [];
    for (let i = 0; i < c.length; i++) {
      if (seq[i] !== "H") continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const j = occ.get(key(c[i][0] + dx, c[i][1] + dy));
        if (j != null && j > i + 1 && seq[j] === "H") out.push([i, j]);
      }
    }
    return out;
  }
  const valid = c => { const s = new Set(); for (const p of c) { const k = key(p[0], p[1]); if (s.has(k)) return false; s.add(k); } return true; };
  const TF = [(x, y) => [-y, x], (x, y) => [-x, -y], (x, y) => [y, -x], (x, y) => [x, -y], (x, y) => [-x, y], (x, y) => [y, x], (x, y) => [-y, -x]];
  function propose(c, r) {
    const N = c.length, n = c.map(p => p.slice());
    if (r() < 0.3) { // pivot: turn or mirror one end of the chain about residue i
      const i = 1 + Math.floor(r() * (N - 2)), f = TF[Math.floor(r() * TF.length)], [px, py] = c[i];
      const tail = r() < 0.5;
      for (let j = tail ? i + 1 : 0; tail ? j < N : j < i; j++) { const q = f(c[j][0] - px, c[j][1] - py); n[j] = [px + q[0], py + q[1]]; }
    } else { // local move: corner flip, or swing an end bead
      const i = Math.floor(r() * N);
      if (i === 0 || i === N - 1) {
        const a = c[i === 0 ? 1 : N - 2], d = [[1, 0], [0, 1], [-1, 0], [0, -1]][Math.floor(r() * 4)];
        n[i] = [a[0] + d[0], a[1] + d[1]];
      } else {
        const a = c[i - 1], b = c[i + 1];
        if (Math.abs(a[0] - b[0]) === 1 && Math.abs(a[1] - b[1]) === 1) n[i] = [a[0] + b[0] - c[i][0], a[1] + b[1] - c[i][1]];
        else return null;
      }
    }
    return valid(n) ? n : null;
  }
  function reset(S) {
    const st = S.st, seq = clean(S.p.seq);
    st.seq = seq; st.conf = [...seq].map((_, i) => [i, 0]);
    st.disp = st.conf.map(p => p.slice()); st.E = 0; st.best = 0; st.hist = [0]; st.acc = 0; st.hacc = 0; st.steps = 0;
    st.cam = null; st.r = S.rng(7);
    st.hc = [...seq].filter(ch => ch === "H").length;
  }
  Lineage.scene({
    params: [
      { id: "seq", label: "Sequence (H = water-fearing, P = water-loving)", type: "text", value: DEFAULT, maxlength: 40 },
      { id: "temp", label: "Temperature", type: "range", min: 0.05, max: 1.5, step: 0.05, value: 0.35, fmt: v => v.toFixed(2) },
      { id: "speed", label: "Folding speed", type: "range", min: 0, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) + "×" },
    ],
    actions: [{ label: "Unfold", run: S => reset(S) }],
    init(S) { reset(S); },
    reset(S) { reset(S); },
    onParam(S, id) { if (id === "seq" && clean(S.p.seq) !== S.st.seq) reset(S); },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const lat = { x: b.x, y: b.y + fs * 1.6, w: b.w * (narrow ? 0.55 : 0.58), h: b.h * (narrow ? 0.72 : 0.7) };
      const rx = b.x + b.w * (narrow ? 0.62 : 0.66), rw = b.x + b.w - rx;
      const eg = { x: rx, y: b.y + fs * 1.6, w: rw, h: b.h * (narrow ? 0.22 : 0.24) };
      const cs = Math.min(rw, b.h - (eg.y + eg.h - b.y) - fs * 4.2);
      const cm = { x: rx + (rw - cs) / 2, y: eg.y + eg.h + fs * 2.6, s: cs };
      Object.assign(S.st, { lat, eg, cm });
    },
    entry(S) { const l = S.st.lat; return [l.x + l.w * 0.04, l.y + l.h * 0.5]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, { lat, eg, cm } = st, N = st.seq.length, seq = st.seq;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      // ---- Monte Carlo folding (Metropolis) ----
      if (k > 0.25 && dt > 0) {
        st.acc += dt * (S.p.speed ?? 1) * 420;
        const T = Math.max(0.05, S.p.temp);
        let n = 0;
        while (st.acc >= 1 && n < 1500) {
          st.acc--; n++; st.steps++;
          const c = propose(st.conf, st.r); if (!c) continue;
          const E = energy(seq, c), dE = E - st.E;
          if (dE <= 0 || st.r() < Math.exp(-dE / T)) { st.conf = c; st.E = E; if (E < st.best) st.best = E; }
        }
        st.hacc += dt * (S.p.speed ?? 1);
        if (st.hacc > 0.12) { st.hacc = 0; st.hist.push(st.E); if (st.hist.length > 160) st.hist.shift(); }
      }
      // smooth display + camera
      const a = dt > 0 ? 1 - Math.exp(-dt * 20) : 1;
      for (let i = 0; i < N; i++) { st.disp[i][0] += (st.conf[i][0] - st.disp[i][0]) * a; st.disp[i][1] += (st.conf[i][1] - st.disp[i][1]) * a; }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of st.disp) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      const tgt = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: Math.min(lat.w / (x1 - x0 + 1.6), lat.h / (y1 - y0 + 1.6), fs * 3.6) };
      if (!st.cam) st.cam = { ...tgt };
      const ca = dt > 0 ? 1 - Math.exp(-dt * 4) : 1;
      for (const q of ["cx", "cy", "s"]) st.cam[q] += (tgt[q] - st.cam[q]) * ca;
      const cam = st.cam, mx = lat.x + lat.w / 2, my = lat.y + lat.h / 2;
      const P = p => [mx + (p[0] - cam.cx) * cam.s, my + (p[1] - cam.cy) * cam.s];
      // lattice guide dots
      const gs = cam.s, gx0 = Math.ceil((lat.x - mx) / gs + cam.cx), gx1 = Math.floor((lat.x + lat.w - mx) / gs + cam.cx);
      const gy0 = Math.ceil((lat.y - my) / gs + cam.cy), gy1 = Math.floor((lat.y + lat.h - my) / gs + cam.cy);
      if ((gx1 - gx0) * (gy1 - gy0) < 900) for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) { const q = P([gx, gy]); S.dot(q[0], q[1], Math.max(1, iw * 0.25), C.soft, 0.45 * k1); }
      S.text(S.narrow ? "HP model · simplified" : "HP lattice model · a teaching simplification", lat.x + lat.w / 2, lat.y - fs * 0.5, { size: fs * 0.85, color: C.soft, alpha: k1 });
      // chain
      const shown = Math.max(1, Math.ceil(k1 * N)), pts = st.disp.slice(0, shown).map(P);
      const br = Math.max(3.2, Math.min(cam.s * 0.24, fs * 0.6));
      S.line(pts, { w: iw * 0.8, color: C.ink });
      // H–H contacts (the energy)
      const con = contacts(seq, st.conf);
      if (k2 > 0) for (const [i, j] of con) if (j < shown) S.line([P(st.disp[i]), P(st.disp[j])], { w: iw * 0.7, color: C.accent, dash: [iw, iw * 1.3], alpha: k2 });
      for (let i = 0; i < shown; i++) {
        const [x, y] = pts[i];
        if (seq[i] === "H") S.dot(x, y, br, C.ink);
        else { S.dot(x, y, br, C.paper); S.circle(x, y, br, { w: iw * 0.5, color: C.ink }); }
      }
      // legend
      const ly = lat.y + lat.h + fs * 1.5, lx = lat.x + fs * 0.4;
      S.dot(lx, ly - fs * 0.3, fs * 0.32, C.ink, k1); S.text("H  water-fearing", lx + fs * 0.6, ly, { size: fs * 0.85, align: "left", alpha: k1 });
      const lx2 = lx + (S.narrow ? 0 : fs * 8.6), ly2 = ly + (S.narrow ? fs * 1.2 : 0);
      S.circle(lx2, ly2 - fs * 0.3, fs * 0.32, { w: iw * 0.45, color: C.ink, alpha: k1 }); S.text("P  water-loving", lx2 + fs * 0.6, ly2, { size: fs * 0.85, align: "left", alpha: k1 });
      if (!S.narrow) S.text("- - -  H–H contact: energy −1", lat.x + fs * 0.4, ly + fs * 1.3, { size: fs * 0.85, align: "left", color: C.accent, alpha: k2 });
      // energy trace
      if (k2 > 0) {
        const lo = Math.min(-2, -Math.ceil(st.hc * 0.75), st.best);
        S.line([[eg.x, eg.y], [eg.x, eg.y + eg.h], [eg.x + eg.w, eg.y + eg.h]], { w: iw * 0.4, color: C.ink, alpha: k2 });
        S.text("energy", eg.x + fs * 0.4, eg.y - fs * 0.45, { size: fs * 0.85, align: "left", alpha: k2 });
        S.text("0", eg.x - fs * 0.3, eg.y + fs * 0.3, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
        S.text(String(lo), eg.x - fs * 0.3, eg.y + eg.h, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
        const yb = eg.y + eg.h * (st.best / lo);
        S.line([[eg.x, yb], [eg.x + eg.w, yb]], { w: iw * 0.3, color: C.soft, dash: [3, 4], alpha: k2 });
        const hp = st.hist.map((e, i) => [eg.x + (i / 159) * eg.w, eg.y + eg.h * (e / lo)]);
        S.line(hp, { w: iw * 0.7, color: C.ink, alpha: k2 });
        if (hp.length) S.dot(hp[hp.length - 1][0], hp[hp.length - 1][1], iw * 0.9, C.ink, k2);
        S.text("time →", eg.x + eg.w, eg.y + eg.h + fs * 1.0, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
      }
      // contact map → AlphaFold
      if (k3 > 0 && cm.s > 40) {
        const c = cm.s / N;
        S.rect(cm.x, cm.y, cm.s, cm.s, { w: iw * 0.4, color: C.ink, alpha: k3 });
        S.text("contact map", cm.x + cm.s / 2, cm.y - fs * 0.45, { size: fs * 0.9, color: C.accent, weight: 500, alpha: k3 });
        for (let i = 0; i < N; i++) if (seq[i] === "H") {
          S.line([[cm.x + (i + 0.5) * c, cm.y], [cm.x + (i + 0.5) * c, cm.y + cm.s]], { w: 0.6, color: C.soft, alpha: 0.35 * k3 });
          S.line([[cm.x, cm.y + (i + 0.5) * c], [cm.x + cm.s, cm.y + (i + 0.5) * c]], { w: 0.6, color: C.soft, alpha: 0.35 * k3 });
        }
        S.line([[cm.x, cm.y], [cm.x + cm.s, cm.y + cm.s]], { w: iw * 0.35, color: C.soft, alpha: k3 });
        for (const [i, j] of con) for (const [u, v] of [[i, j], [j, i]]) S.dot(cm.x + (u + 0.5) * c, cm.y + (v + 0.5) * c, Math.max(2, c * 0.42), C.accent, k3);
        const ty = cm.y + cm.s + fs * 1.25;
        S.text(S.narrow ? "AlphaFold 2 predicts" : "AlphaFold 2 (2020) predicts", cm.x + cm.s / 2, ty, { size: fs * 0.85, color: C.accent, alpha: k3 });
        S.text(S.narrow ? "this, in 3D" : "these distances in real 3D", cm.x + cm.s / 2, ty + fs * 1.05, { size: fs * 0.85, color: C.accent, alpha: k3 });
      }
      return `${N} beads · energy ${st.E} (best ${st.best}) · ${con.length} H–H contact${con.length === 1 ? "" : "s"} · T = ${S.p.temp.toFixed(2)}`;
    },
    code(S) {
      const st = S.st;
      return `${S.c("# HP model: fold to bury the water-fearing H beads")}
seq = "${S.v(st.seq || clean(S.p.seq))}"
T = ${S.v(S.p.temp.toFixed(2))}                ${S.c("# temperature")}

def energy(fold):
    return -count_HH_neighbours(fold)     ${S.c("# not chain-bonded")}

for step in range(steps):
    new = random_move(fold)               ${S.c("# pivot or corner flip")}
    dE = energy(new) - energy(fold)
    if dE <= 0 or random() < exp(-dE / T):
        fold = new                        ${S.c("# accept downhill, sometimes uphill")}`;
    },
  });
})();
