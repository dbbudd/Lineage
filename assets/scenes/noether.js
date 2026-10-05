// Emmy Noether — a puck in a bowl: rotational symmetry ↔ conserved angular momentum (and time symmetry ↔ energy)
// → equivariant networks (rotate the input, the output turns with it)
Lineage.scene({
  params: [
    { id: "sym", label: "Round bowl (rotational symmetry)", type: "toggle", value: true },
    { id: "asym", label: "Oval-ness when symmetry is off", type: "range", min: 0.05, max: 0.7, step: 0.01, value: 0.35, fmt: v => Math.round(v * 100) + "%" },
    { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "Flick puck", run(S) { S.st.reset(0.62, 0.1, -0.15, 1.05); } }],
  init(S) {
    const st = S.st;
    st.reset = (x, y, vx, vy) => {
      Object.assign(st, { x, y, vx, vy, hist: [], trail: [], acc: 0, simT: 0, lastFt: null, sAcc: 0 });
      st.L0 = x * vy - y * vx; st.E0 = st.energy();
    };
    st.a = () => (S.p.sym ? 0 : S.p.asym);
    st.energy = () => { const a = st.a(), w2 = st.w * st.w; return 0.5 * (st.vx * st.vx + st.vy * st.vy) + 0.5 * w2 * ((1 - a) * st.x * st.x + (1 + a) * st.y * st.y); };
    st.w = 1.9;
    st.reset(0.8, 0, 0, 0.95);
  },
  reset(S) { S.st.reset(0.8, 0, 0, 0.95); },
  onParam(S, id) { if (id === "sym" || id === "asym") { const st = S.st; st.L0 = st.x * st.vy - st.y * st.vx; st.E0 = st.energy(); st.hist = []; } },
  layout(S) {
    const b = S.box, st = S.st, wide = b.w / b.h > 1.15;
    st.wide = wide;
    if (!wide) {
      st.R = Math.min(b.w * 0.26, b.h * 0.25);
      st.c = [b.x + b.w * 0.3, b.y + b.h * 0.29];
      st.eq = { x: b.x + b.w * 0.6, y: b.y + b.h * 0.12, w: b.w * 0.4, h: b.h * 0.34 };
      st.pl = { x: b.x + b.w * 0.06, y: b.y + b.h * 0.64, w: b.w * 0.92, h: b.h * 0.3 };
    } else {
      st.R = Math.min(b.w * 0.21, b.h * 0.31);
      st.c = [b.x + b.w * 0.23, b.y + b.h * 0.36];
      st.eq = { x: b.x + b.w * 0.5, y: b.y + b.h * 0.6, w: b.w * 0.5, h: b.h * 0.4 };
      st.pl = { x: b.x + b.w * 0.53, y: b.y + b.h * 0.06, w: b.w * 0.45, h: b.h * 0.44 };
    }
  },
  entry(S) { const { c, R } = S.st; return [c[0] - R * 1.12, c[1]]; },
  pointer(S, type, px, py) {
    if (type !== "down") return;
    const st = S.st, dx = (px - st.c[0]) / st.R, dy = (py - st.c[1]) / st.R, r = Math.hypot(dx, dy);
    if (r < 0.08 || r > 1.05) return;
    const sp = st.w * r * 0.8; st.reset(dx, dy, -dy / r * sp, dx / r * sp);
  },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, R = st.R, [cx, cy] = st.c, a = st.a();
    const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    // ---- integrate (leapfrog, energy-faithful) ----
    if (st.lastFt == null) st.lastFt = ft;
    let T = Math.min(0.25, ft - st.lastFt); st.lastFt = ft;
    const h = 1 / 240, w2 = st.w * st.w;
    st.acc += T;
    while (st.acc >= h) {
      st.acc -= h;
      st.vx -= 0.5 * h * w2 * (1 - a) * st.x; st.vy -= 0.5 * h * w2 * (1 + a) * st.y;
      st.x += h * st.vx; st.y += h * st.vy;
      st.vx -= 0.5 * h * w2 * (1 - a) * st.x; st.vy -= 0.5 * h * w2 * (1 + a) * st.y;
      st.simT += h; st.sAcc += h;
      if (st.sAcc >= 1 / 30) {
        st.sAcc = 0;
        st.trail.push([st.x, st.y]); if (st.trail.length > 75) st.trail.shift();
        st.hist.push([st.x * st.vy - st.y * st.vx, st.energy()]); if (st.hist.length > 300) st.hist.shift();
      }
    }
    const L = st.x * st.vy - st.y * st.vx, E = st.energy();
    const P = (x, y) => [cx + x * R, cy + y * R];
    // ---- beat 1: the bowl and the puck ----
    const ax = 1 / Math.sqrt(1 - a), ay = 1 / Math.sqrt(1 + a), sc = 1 / Math.max(ax, ay);
    for (let j = 1; j <= 4; j++) {
      const f = (j / 4) * 1.08 * sc, pts = [];
      for (let i = 0; i <= 72; i++) { const t = (i / 72) * Math.PI * 2; pts.push(P(f * ax * Math.cos(t), f * ay * Math.sin(t))); }
      S.line(pts.slice(0, Math.max(2, Math.round(pts.length * k1))), { color: C.ink, w: j === 4 ? iw * 0.8 : iw * 0.35, alpha: j === 4 ? 0.9 : 0.4 });
    }
    S.dot(cx, cy, iw * 0.6, C.ink, k1);
    S.text(S.p.sym ? "round bowl: same after any turn" : "oval bowl: turning changes it", cx, cy + R * 1.08 * sc * ay + fs * 1.3, { size: fs * 0.8, color: C.soft, alpha: k1 });
    // swept sectors: equal time slices from the centre
    if (k2 > 0 && st.trail.length > 2) {
      const tr = st.trail, step = 6;
      for (let i = tr.length - 1, n = 0; i - step >= 0; i -= step, n++) {
        const pts = [[cx, cy]]; for (let j = i - step; j <= i; j++) pts.push(P(tr[j][0], tr[j][1]));
        S.line(pts, { close: true, fill: S.mix(C.accent, C.paper, n % 2 ? 0.82 : 0.7), w: 0, alpha: k2 * (1 - n / 14) });
      }
    }
    if (st.trail.length > 1) S.line(st.trail.map(p => P(p[0], p[1])), { color: C.accent, w: iw * 0.6, alpha: 0.55 * k1 });
    const pp = P(st.x, st.y);
    if (k2 > 0) S.line([[cx, cy], pp], { color: C.accent, w: iw * 0.5, alpha: k2 });
    S.arrow(pp[0], pp[1], pp[0] + st.vx * R * 0.32, pp[1] + st.vy * R * 0.32, { color: C.ink, w: iw * 0.6, alpha: k1 });
    S.circle(pp[0], pp[1], iw * 1.7, { color: C.ink, w: iw * 0.7, fill: C.paper });
    // ---- beat 2: the conserved quantities over time ----
    const pl = st.pl;
    if (k2 > 0) {
      const H = st.hist, x0 = pl.x, x1 = pl.x + pl.w, n = 300;
      const yL = pl.y + pl.h * 0.36, yE = pl.y + pl.h * 0.86, ampL = pl.h * 0.11, ampE = pl.h * 0.06;
      S.line([[x0, yL], [x1, yL]], { color: C.soft, w: iw * 0.3, alpha: k2, dash: [3, 4] });
      S.line([[x0, yE], [x1, yE]], { color: C.soft, w: iw * 0.3, alpha: k2, dash: [3, 4] });
      const lp = [], ep = [], L0 = Math.abs(st.L0) > 1e-3 ? st.L0 : 1;
      for (let i = 0; i < H.length; i++) {
        const x = x1 - ((H.length - 1 - i) / n) * pl.w;
        lp.push([x, yL - Math.max(-2.2, Math.min(1.2, H[i][0] / L0 - 1)) * ampL]);
        ep.push([x, yE - Math.max(-1.5, Math.min(1.5, H[i][1] / st.E0 - 1)) * ampE]);
      }
      const amp = ampL * 1.3;
      const ln = Math.max(2, Math.round(lp.length * k2));
      S.line(lp.slice(-ln), { color: C.accent, w: iw * 0.85 });
      S.line(ep.slice(-ln), { color: C.ink, w: iw * 0.6 });
      S.text(st.wide ? "L" : "angular momentum L", x0, yL - amp - fs * 0.35, { size: fs * 0.85, align: "left", color: C.accent, alpha: k2 });
      S.text(st.wide ? "E" : "energy E", x0, yE - ampE * 1.5 - fs * 0.3, { size: fs * 0.85, align: "left", color: C.ink, alpha: k2 });
      S.text("L = " + L.toFixed(3), x1, yL - amp - fs * 0.35, { size: fs * 0.8, align: "right", mono: true, italic: false, color: C.accent, alpha: k2 });
      S.text("E = " + E.toFixed(3), x1, yE - ampE * 1.5 - fs * 0.3, { size: fs * 0.8, align: "right", mono: true, italic: false, color: C.ink, alpha: k2 });
      S.text("time →", x1, yE + fs * 1.1, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
    }
    // ---- beat 3: equivariant network ----
    const eq = st.eq;
    if (k3 > 0) {
      const phi = ft * 0.6, rr = Math.min(eq.w * 0.12, eq.h * 0.22);
      const mx = eq.x + eq.w * 0.13, my = eq.y + eq.h * 0.42, ox = eq.x + eq.w * 0.86;
      const atoms = [[0, 0], [0.9, 0.35], [-0.55, 0.8]], rot = (p, t) => [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)];
      const A = atoms.map(p => { const q = rot(p, phi); return [mx + q[0] * rr * 0.8, my + q[1] * rr * 0.8]; });
      S.line([A[1], A[0], A[2]], { color: C.ink, w: iw * 0.6, alpha: k3 });
      A.forEach((p, i) => S.circle(p[0], p[1], rr * (i ? 0.2 : 0.28), { color: C.ink, w: iw * 0.55, fill: C.paper, alpha: k3 }));
      // network box
      const nx = eq.x + eq.w * 0.38, nw = eq.w * 0.24, nh = rr * 1.5;
      S.arrow(mx + rr * 1.15, my, nx - 4, my, { color: C.soft, w: iw * 0.45, alpha: k3 });
      S.rect(nx, my - nh / 2, nw, nh, { color: C.accent, w: iw * 0.6, alpha: k3 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S.dot(nx + nw * (0.25 + 0.25 * i), my - nh * 0.3 + nh * 0.3 * j, iw * 0.45, C.accent, k3 * 0.8);
      S.arrow(nx + nw + 4, my, ox - rr * 1.15, my, { color: C.soft, w: iw * 0.45, alpha: k3 });
      const f = rot([1, -0.25], phi);
      S.circle(ox, my, rr, { color: C.soft, w: iw * 0.3, alpha: k3, dash: [3, 4] });
      S.arrow(ox, my, ox + f[0] * rr, my + f[1] * rr, { color: C.accent, w: iw * 0.9, alpha: k3 });
      S.text("molecule", mx, my + rr * 1.25 + fs * 0.9, { size: fs * 0.8, color: C.ink, alpha: k3 });
      S.text("force", ox, my + rr * 1.25 + fs * 0.9, { size: fs * 0.8, color: C.accent, alpha: k3 });
      S.text("equivariant net", nx + nw / 2, my - nh / 2 - fs * 0.5, { size: fs * 0.8, color: C.accent, alpha: k3 });
      S.text(st.wide ? "turn it in, it turns out" : "turn the input, the answer turns with it", eq.x + eq.w / 2, my + rr * 1.25 + fs * 2.3, { size: fs * 0.8, color: C.soft, alpha: k3 });
    }
    const dL = st.hist.length ? Math.max(...st.hist.map(h => Math.abs(h[0] / (st.L0 || 1) - 1))) : 0;
    return S.p.sym
      ? `round bowl · L = ${L.toFixed(3)} (varies ±${(dL * 100).toFixed(2)}%) · E = ${E.toFixed(3)} · both conserved`
      : `oval bowl (${Math.round(a * 100)}%) · L = ${L.toFixed(3)}, swings ±${Math.round(dL * 100)}% · E = ${E.toFixed(3)} still conserved`;
  },
  code(S) {
    const a = S.p.sym ? 0 : S.p.asym;
    return `${S.c("# Noether: symmetry → conserved quantity")}
a = ${S.v(a.toFixed(2))}        ${S.c(a ? "# oval bowl: no rotational symmetry" : "# round bowl: same after any rotation")}
def force(x, y):
    return -(1 - a) * x, -(1 + a) * y

for step in range(steps):
    fx, fy = force(x, y)
    vx += fx * dt;  vy += fy * dt
    x  += vx * dt;  y  += vy * dt
    L = x * vy - y * vx       ${S.c(a ? "# wanders: symmetry broken" : "# constant: rotation symmetry")}
    E = (vx**2 + vy**2) / 2 + V(x, y)  ${S.c("# constant: laws same at every time")}`;
  },
});
