// Gauss — least squares: the line that makes the total area of the error squares smallest → mean squared error, the loss that trains neural networks
(function () {
  const XR = 10, YR = 7.2, N = 12;
  const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
  function makePoints(S) {
    const r = S.rng(1801), sd = S.p.noise, pts = [];
    for (let i = 0; i < N; i++) {
      const x = 0.7 + (i + 0.15 + r() * 0.7) * (8.6 / N);
      const g = Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
      pts.push([x, Math.max(0.2, Math.min(YR - 0.2, 1.1 + 0.52 * x + sd * g))]);
    }
    S.st.pts = pts; fit(S);
  }
  function fit(S) { // Gauss's exact answer
    const p = S.st.pts, n = p.length, mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
    let sxy = 0, sxx = 0; p.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); });
    Object.assign(S.st, { mx, my, sxx: sxx / n, A: sxy / sxx, Cc: my });
  }
  const mse = (S, a, c) => { const st = S.st; let s = 0; st.pts.forEach(([x, y]) => { const r = y - (a * (x - st.mx) + c); s += r * r; }); return s / st.pts.length; };
  function throwLine(S) { const st = S.st, r = S.rng(Math.floor(performance.now()) | 0); st.a = st.A + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5); st.c = st.Cc + (r() < 0.5 ? -1 : 1) * (1.2 + r()); st.hist = []; }

  Lineage.scene({
    params: [
      { id: "noise", label: "Noise in the observations", type: "range", min: 0.1, max: 1.6, step: 0.05, value: 0.8, fmt: v => "σ = " + v.toFixed(2) },
      { id: "squares", label: "Show the error squares", type: "toggle", value: true },
      { id: "speed", label: "Learning speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Throw the line", run(S) { throwLine(S); } }],
    init(S) { makePoints(S); const st = S.st; st.a = -0.25; st.c = st.Cc + 1.8; st.hist = []; st.ht = 0; },
    reset(S) { const st = S.st; st.a = -0.25; st.c = st.Cc + 1.8; st.hist = []; },
    onParam(S, id) { if (id === "noise") { makePoints(S); S.st.hist = []; } },
    layout(S) {
      const { box, narrow, fs } = S;
      const top = fs * (narrow ? 0.9 : 2.6);
      const sc = Math.min((box.w - fs * (narrow ? 1.8 : 2.6)) / XR, box.h * (narrow ? 0.56 : 0.58) / YR);
      const x0 = box.x + fs * (narrow ? 1.0 : 1.4) + Math.max(0, (box.w - fs * 2.6 - sc * XR) * 0.3), y0 = box.y + top + sc * YR;
      const fz = fs * (narrow ? 0.8 : 1), ly = y0 + fs * (narrow ? 1.6 : 2.0) + fz * 2.4;
      const L = { x: x0, y: ly, w: box.w * (narrow ? 0.46 : 0.42), h: Math.max(fs * 2, box.y + box.h - ly - fz * 1.9) };
      const tx = x0 + box.w * (narrow ? 0.52 : 0.5);
      Object.assign(S.st, { sc, x0, y0, L, tx });
    },
    entry(S) { const st = S.st; return [st.x0, st.y0 - st.sc * YR * 0.45]; },
    pointer(S, type, x, y) {
      const st = S.st, X = (x - st.x0) / st.sc, Y = (st.y0 - y) / st.sc;
      if (type === "down") {
        let bi = -1, bd = Math.max(18, S.fs * 1.3);
        st.pts.forEach((p, i) => { const d = Math.hypot(st.x0 + p[0] * st.sc - x, st.y0 - p[1] * st.sc - y); if (d < bd) { bd = d; bi = i; } });
        st.drag = bi;
      } else if (type === "drag" && st.drag >= 0) {
        st.pts[st.drag] = [Math.max(0.1, Math.min(XR - 0.1, X)), Math.max(0.1, Math.min(YR - 0.1, Y))]; fit(S);
      } else if (type === "up") st.drag = -1;
    },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, sc = st.sc, x0 = st.x0, y0 = st.y0;
      const P = (x, y) => [x0 + x * sc, y0 - y * sc];
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.3) / 0.3), k3 = S.ease((k - 0.7) / 0.3);
      // axes
      S.arrow(x0, y0, x0 + XR * sc, y0, { color: C.soft, w: iw * 0.45, alpha: k1, head: fs * 0.5 });
      S.arrow(x0, y0, x0, y0 - YR * sc, { color: C.soft, w: iw * 0.45, alpha: k1, head: fs * 0.5 });
      S.text("time of observation", x0 + XR * sc, y0 + fs * 1.15, { size: fs * 0.8, color: C.soft, align: "right", alpha: k1 });
      S.text("position", x0 + fs * 0.4, y0 - YR * sc + fs * 0.2, { size: fs * 0.8, color: C.soft, align: "left", alpha: k1 });
      if (!nar) S.text("Gauss, 1801: draw the line that makes the squares smallest", x0, y0 - YR * sc - fs * 1.2, { size: fs * 0.95, color: C.ink, align: "left", alpha: k1 });
      // learning: the line walks downhill on the total square area (gradient descent)
      if (k2 > 0.2 && dt > 0) {
        const steps = Math.max(1, Math.round(dt * 60)), sp = S.p.speed ?? 1;
        for (let s = 0; s < steps; s++) {
          let ga = 0, gc = 0; st.pts.forEach(([x, y]) => { const r = y - (st.a * (x - st.mx) + st.c); ga += -2 * r * (x - st.mx); gc += -2 * r; });
          ga /= st.pts.length; gc /= st.pts.length;
          st.a -= 0.006 * sp * ga / Math.max(0.5, st.sxx); st.c -= 0.006 * sp * gc;
        }
        st.ht += dt; if (st.ht > 0.06) { st.ht = 0; st.hist.push(mse(S, st.a, st.c)); if (st.hist.length > 140) st.hist.shift(); }
      }
      const a = st.a, c = st.c, yhat = x => a * (x - st.mx) + c;
      // residual squares, then residual lines
      let area = 0;
      if (k2 > 0) {
        st.pts.forEach(([x, y]) => {
          const r = y - yhat(x), s = Math.abs(r); area += r * r;
          if (S.p.squares) {
            const dir = x + s > XR ? -1 : 1, yl = Math.min(y, yhat(x));
            const p0 = P(x, yl + s), w = s * sc;
            S.rect(dir > 0 ? p0[0] : p0[0] - w, p0[1], w, w, { color: S.mix(C.accent, C.paper, 0.25), w: iw * 0.45, fill: S.mix(C.accent, C.paper, 0.86), alpha: k2 * 0.9 });
          }
          S.line([P(x, y), P(x, yhat(x))], { color: C.accent, w: iw * 0.6, alpha: k2 });
        });
      }
      // Gauss's exact line (dashed) and the learning line
      const clip = (A, Cc) => { let xa = 0, xb = XR; const yy = x => A * (x - st.mx) + Cc;
        if (yy(xa) < 0 || yy(xa) > YR) xa = Math.max(0, Math.min(XR, ((yy(xa) < 0 ? 0 : YR) - Cc) / A + st.mx));
        if (yy(xb) < 0 || yy(xb) > YR) xb = Math.max(0, Math.min(XR, ((yy(xb) < 0 ? 0 : YR) - Cc) / A + st.mx));
        return [P(xa, yy(xa)), P(xb, yy(xb))]; };
      if (k3 > 0) { const ln = clip(st.A, st.Cc); S.line(ln, { color: C.ink, w: iw * 0.5, dash: [iw * 2, iw * 1.8], alpha: k3 * 0.7 }); }
      if (k2 > 0) S.line(clip(a, c), { color: C.ink, w: iw * 1.05, alpha: k2 });
      // observations
      st.pts.forEach(([x, y], i) => { const q = P(x, y), kp = S.ease(k1 * 1.6 - i / N * 0.6);
        S.dot(q[0], q[1], iw * (st.drag === i ? 2.2 : 1.55), C.ink, kp); S.circle(q[0], q[1], iw * 2.5, { color: C.ink, w: iw * 0.35, alpha: kp * 0.5 }); });
      if (k1 > 0.9 && k2 < 0.3) S.text("12 noisy observations", P(XR * 0.5, 0)[0], y0 - fs * 0.7, { size: fs * 0.9, color: C.ink, alpha: 1 - k2 / 0.3 });
      // loss curve: what training a neural network watches
      const L = st.L, best = mse(S, st.A, st.Cc), cur = area / st.pts.length;
      if (k3 > 0) {
        const fz = fs * (nar ? 0.8 : 1);
        S.text("loss = mean of the squares", L.x, L.y - fz * 1.9, { align: "left", size: fz * 1.05, color: C.accent, weight: 600, alpha: k3 });
        S.text(nar ? "falls as the line learns" : "falls as the line learns", L.x, L.y - fz * 0.7, { align: "left", size: fz * 0.88, color: C.ink, alpha: k3 });
        S.line([[L.x, L.y], [L.x, L.y + L.h], [L.x + L.w, L.y + L.h]], { color: C.soft, w: iw * 0.4, alpha: k3 });
        const H = st.hist, top = Math.max(best * 1.5, ...H.slice(0, 1), 0.01);
        if (H.length > 1) S.line(H.map((v, i) => [L.x + (i / 139) * L.w, L.y + L.h - Math.min(1, v / top) * L.h * 0.92]), { color: C.accent, w: iw * 0.9, alpha: k3 });
        const yb = L.y + L.h - Math.min(1, best / top) * L.h * 0.92;
        S.line([[L.x, yb], [L.x + L.w, yb]], { color: C.ink, w: iw * 0.4, dash: [iw * 1.5, iw * 1.5], alpha: k3 * 0.6 });
        S.text(`${f2(cur)}`, L.x + L.w, L.y + L.h + fz * 1.2, { align: "right", size: fz, color: C.accent, weight: 600, italic: false, alpha: k3 });
        S.text("training steps →", L.x, L.y + L.h + fz * 1.2, { align: "left", size: fz * 0.82, color: C.soft, alpha: k3 });
        const ty = L.y - fz * 1.9, tx = st.tx;
        S.text(nar ? "dashed: Gauss's answer" : "dashed: Gauss's exact answer", tx, ty, { align: "left", size: fz * 0.9, color: C.ink, alpha: k3 });
        S.text(nar ? "solid: learned in steps," : "solid: found by stepping downhill,", tx, ty + fz * 1.35, { align: "left", size: fz * 0.9, color: C.ink, alpha: k3 });
        S.text(nar ? "like a neural network" : "as neural networks learn", tx, ty + fz * 2.6, { align: "left", size: fz * 0.9, color: C.accent, weight: 600, alpha: k3 });
      }
      return k2 > 0 ? `total square area ${f2(area)} · mean ${f2(cur)} · Gauss's minimum ${f2(best)} · slope ${f2(a)}` : "12 observations";
    },
    code(S) {
      const st = S.st;
      return `${S.c("# least squares: Gauss 1801, Legendre 1805")}
xs, ys = observations          ${S.c("# 12 points, noise σ = " + S.p.noise.toFixed(2))}
def loss(slope, mid):           ${S.c("# mean area of the squares")}
    return mean((y - (slope*(x - x̄) + mid))**2 for x, y in zip(xs, ys))

${S.c("# Gauss: solve it exactly")}
slope = Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²   ${S.c("# " + f2(st.A))}
mid   = ȳ                             ${S.c("# " + f2(st.Cc))}

${S.c("# a neural network: step downhill instead")}
for step in range(1000):
    slope -= lr * d_loss/d_slope
    mid   -= lr * d_loss/d_mid       ${S.c("# loss " + f2(mse(S, st.A, st.Cc)) + " at the bottom")}`;
    },
  });
})();
