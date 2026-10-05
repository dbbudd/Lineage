// Geoffrey Hinton — backpropagation: a small 2-H-1 network learns to separate points in 2-D while the error flows backwards → the same rule trains every deep network
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  const G = 44;            // decision-boundary grid
  const EPS = 200;         // epochs per second of field time

  function makeData(kind, r) {
    const P = [];
    if (kind === "xor") for (let i = 0; i < 80; i++) { const x = r() * 2 - 1, y = r() * 2 - 1; P.push([(x + Math.sign(x) * 0.12) * 0.82, (y + Math.sign(y) * 0.12) * 0.82, x * y > 0 ? 1 : 0]); }
    if (kind === "circle") for (let i = 0; i < 100; i++) { const c = i % 2, a = r() * 6.283, rad = c ? r() * 0.4 : 0.6 + r() * 0.32; P.push([rad * Math.cos(a), rad * Math.sin(a), c]); }
    if (kind === "spiral") for (let i = 0; i < 120; i++) { const c = i % 2, t = Math.floor(i / 2) / 60, ang = t * 3.2 * Math.PI + c * Math.PI, rad = 0.1 + 0.85 * t; P.push([rad * Math.cos(ang) + (r() - 0.5) * 0.04, rad * Math.sin(ang) + (r() - 0.5) * 0.04, c]); }
    return P;
  }
  function fresh(S) {
    const H = +S.p.hidden, r = S.rng(1986 + H * 13 + S.p.data.length);
    const net = { H, W1: [], b1: new Float64Array(H), W2: new Float64Array(H), b2: 0, v1: [], vb1: new Float64Array(H), v2: new Float64Array(H), vb2: 0,
      g1: [], gb1: new Float64Array(H), g2: new Float64Array(H), h: new Float64Array(H) };
    for (let j = 0; j < H; j++) { net.W1.push([(r() * 2 - 1) * 1.5, (r() * 2 - 1) * 1.5]); net.b1[j] = (r() * 2 - 1) * 0.5; net.W2[j] = (r() * 2 - 1) * 0.5; net.v1.push([0, 0]); net.g1.push([0, 0]); }
    Object.assign(S.st, { net, pts: makeData(S.p.data, S.rng(7)), epoch: 0, loss: [], L: 0.7, acc: 0, tAcc: 0, doneAt: null, grid: new Float32Array((G + 1) * (G + 1)), gradMag: new Float64Array(H), gOut: 0 });
  }
  function forward(net, x, y) { let z = net.b2; for (let j = 0; j < net.H; j++) { net.h[j] = Math.tanh(net.W1[j][0] * x + net.W1[j][1] * y + net.b1[j]); z += net.W2[j] * net.h[j]; } return 1 / (1 + Math.exp(-z)); }
  function epoch(st, lr) {
    const net = st.net, H = net.H, P = st.pts, n = P.length;
    for (let j = 0; j < H; j++) { net.g1[j][0] = net.g1[j][1] = 0; net.gb1[j] = 0; net.g2[j] = 0; }
    let gb2 = 0, L = 0, ok = 0;
    for (const [x, y, c] of P) {
      const p = forward(net, x, y); L -= c ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9); if ((p > 0.5) === !!c) ok++;
      const d = p - c; gb2 += d;                               // error at the output
      for (let j = 0; j < H; j++) {                            // ... sent backwards through each weight
        net.g2[j] += d * net.h[j];
        const dh = d * net.W2[j] * (1 - net.h[j] * net.h[j]);
        net.g1[j][0] += dh * x; net.g1[j][1] += dh * y; net.gb1[j] += dh;
      }
    }
    const m = 0.9;
    for (let j = 0; j < H; j++) {
      net.v2[j] = m * net.v2[j] - lr * net.g2[j] / n; net.W2[j] += net.v2[j];
      for (let i = 0; i < 2; i++) { net.v1[j][i] = m * net.v1[j][i] - lr * net.g1[j][i] / n; net.W1[j][i] += net.v1[j][i]; }
      net.vb1[j] = m * net.vb1[j] - lr * net.gb1[j] / n; net.b1[j] += net.vb1[j];
      st.gradMag[j] = st.gradMag[j] * 0.8 + 0.2 * (Math.abs(net.g2[j]) + Math.abs(net.g1[j][0]) + Math.abs(net.g1[j][1])) / n;
    }
    net.vb2 = m * net.vb2 - lr * gb2 / n; net.b2 += net.vb2;
    st.gOut = st.gOut * 0.8 + 0.2 * Math.abs(gb2) / n;
    st.L = L / n; st.acc = ok / n; st.epoch++;
  }

  Lineage.scene({
    params: [
      { id: "data", label: "Dataset", type: "select", value: "spiral", options: [{ value: "spiral", label: "Two spirals" }, { value: "xor", label: "XOR" }, { value: "circle", label: "Circle" }] },
      { id: "hidden", label: "Hidden units", type: "range", min: 2, max: 16, step: 1, value: 12, fmt: v => String(v) },
      { id: "lr", label: "Learning rate", type: "range", min: 0.02, max: 2, step: 0.01, value: 0.5, fmt: v => v.toFixed(2) },
      { id: "speed", label: "Training speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { fresh(S); },
    reset(S) { fresh(S); },
    onParam(S, id) { if (id === "data" || id === "hidden") fresh(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const side = Math.min(B.w * (n ? 0.47 : 0.48), B.h * (n ? 0.62 : 0.56));
      const plot = { x: B.x + (n ? 0 : fs * 0.2), y: B.y + fs * 1.6, s: side };
      const net = { x: plot.x + side + B.w * 0.06, y: plot.y, w: B.x + B.w - (plot.x + side + B.w * 0.06), h: side };
      const lossY = plot.y + side + fs * (n ? 1.6 : 2.4), lossH = Math.max(fs * 2.4, B.y + B.h - lossY - fs * (n ? 1.0 : 1.5));
      Object.assign(S.st, { plot, netBox: net, lossY, lossH });
      S.st.off = S.st.off || document.createElement("canvas"); S.st.off.width = G + 1; S.st.off.height = G + 1;
    },
    entry(S) { const p = S.st.plot; return [p.x, p.y + p.s * 0.5]; },
    pointer(S, type, x, y) {
      const p = S.st.plot; if (type !== "down" || !p || !S.st.net) return;
      if (x < p.x || x > p.x + p.s || y < p.y || y > p.y + p.s) return;
      const u = ((x - p.x) / p.s) * 2 - 1, v = 1 - ((y - p.y) / p.s) * 2;
      const pr = forward(S.st.net, u, v);
      S.st.pts.push([u, v, pr > 0.5 ? 0 : 1]); S.st.doneAt = null;   // a point the network currently gets wrong
      if (S.st.pts.length > 200) S.st.pts.splice(0, 1);
    },
    draw(S, k, ft, dt) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S), ctx = S.ctx;
      if (!st.net) fresh(S);
      const { plot, netBox } = st, net = st.net, H = net.H;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.2) / 0.4), k3 = S.ease((k - 0.68) / 0.32);
      // train
      if (k2 > 0.3 && dt > 0) {
        st.tAcc += dt * (S.p.speed ?? 1) * EPS;
        let steps = Math.min(40, Math.floor(st.tAcc)); st.tAcc -= steps;
        while (steps-- > 0) epoch(st, +S.p.lr);
        if (st.epoch % 4 === 0 || st.loss.length === 0) { st.loss.push(st.L); if (st.loss.length > 400) { st.loss = st.loss.filter((_, i) => i % 2 === 0); st.lossStride = (st.lossStride || 1) * 2; } }
        if (st.acc === 1 && st.L < 0.02) { if (st.doneAt == null) st.doneAt = ft; if (ft - st.doneAt > 5) { fresh(S); } }
      }
      // decision surface (a small image, scaled up smoothly)
      const grid = st.grid;
      for (let gy = 0; gy <= G; gy++) for (let gx = 0; gx <= G; gx++) grid[gy * (G + 1) + gx] = forward(net, (gx / G) * 2 - 1, 1 - (gy / G) * 2);
      const octx = st.off.getContext("2d"), img = octx.createImageData(G + 1, G + 1);
      const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const A = hex(C.accent.length === 7 ? C.accent : "#3E4FA0"), I = hex(C.ink.length === 7 ? C.ink : "#3F3D39");
      for (let i = 0; i < grid.length; i++) { const p = grid[i], c = p > 0.5 ? A : I, a = Math.abs(p - 0.5) * 2; img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = Math.round(255 * (p > 0.5 ? 0.16 : 0.06) * a * k2); }
      octx.putImageData(img, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(st.off, plot.x, plot.y, plot.s, plot.s); ctx.restore();
      S.rect(plot.x, plot.y, plot.s, plot.s, { color: C.ink, w: iw * 0.35, alpha: k1 });
      // the boundary p = 0.5 (marching squares)
      if (k2 > 0) {
        const cs = plot.s / G, segs = [];
        const P = (gx, gy) => grid[gy * (G + 1) + gx] - 0.5;
        for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
          const a = P(gx, gy), b = P(gx + 1, gy), c = P(gx + 1, gy + 1), d = P(gx, gy + 1), e = [];
          const X = gx * cs + plot.x, Y = gy * cs + plot.y;
          if ((a > 0) !== (b > 0)) e.push([X + cs * a / (a - b), Y]);
          if ((b > 0) !== (c > 0)) e.push([X + cs, Y + cs * b / (b - c)]);
          if ((c > 0) !== (d > 0)) e.push([X + cs * (1 - c / (c - d)), Y + cs]);
          if ((d > 0) !== (a > 0)) e.push([X, Y + cs * (1 - d / (d - a))]);
          if (e.length >= 2) segs.push([e[0], e[1]]); if (e.length === 4) segs.push([e[2], e[3]]);
        }
        ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = iw * 0.8; ctx.lineCap = "round"; ctx.globalAlpha = k2; ctx.beginPath();
        for (const [p, q] of segs) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } ctx.stroke(); ctx.restore();
      }
      // data points: filled = class 1, hollow = class 0
      const pr = Math.max(2.2, plot.s * 0.012);
      for (const [x, y, c] of st.pts) {
        const px = plot.x + (x + 1) / 2 * plot.s, py = plot.y + (1 - y) / 2 * plot.s;
        if (c) S.dot(px, py, pr, C.accent, k1); else S.circle(px, py, pr, { w: Math.max(1.2, iw * 0.4), color: C.ink, alpha: k1, fill: C.paper });
      }
      S.text(n ? "tap to add a point" : "click to add a point it gets wrong", plot.x, plot.y - fs * 0.55, { size: fs * 0.75, align: "left", color: C.soft, alpha: k1 });
      // the network: x, y → hidden → output; line width = |weight|; error pulses run backwards
      const nb = netBox, inX = nb.x + nb.w * 0.06, hX = nb.x + nb.w * 0.5, oX = nb.x + nb.w * 0.92;
      const inP = [[inX, nb.y + nb.h * 0.35], [inX, nb.y + nb.h * 0.65]], oP = [oX, nb.y + nb.h * 0.5];
      const hP = Array.from({ length: H }, (_, j) => [hX, nb.y + nb.h * (H === 1 ? 0.5 : 0.06 + 0.88 * j / (H - 1))]);
      const nr = Math.max(3, Math.min(fs * 0.5, nb.h / H * 0.3));
      const wl = w => Math.max(0.6, Math.min(iw * 1.4, Math.abs(w) * iw * 0.45));
      const gm = Math.max(1e-6, ...st.gradMag);
      const back = (a, b, j, w, phase) => {
        S.line([a, b], { w: wl(w), color: w >= 0 ? C.ink : C.soft, alpha: k1 * (w >= 0 ? 0.75 : 0.6) });
        if (k2 > 0 && !(st.doneAt != null)) { const s = Math.min(1, st.gradMag[j] / gm), u = (ft * 0.9 + phase) % 1; // pulse from b back to a
          S.dot(b[0] + (a[0] - b[0]) * u, b[1] + (a[1] - b[1]) * u, Math.max(2, iw * 0.9 * (0.55 + s)), C.accent, k2 * (0.35 + 0.65 * s)); }
      };
      for (let j = 0; j < H; j++) { back(hP[j], oP, j, net.W2[j], 0); back(inP[0], hP[j], j, net.W1[j][0], 0.5); back(inP[1], hP[j], j, net.W1[j][1], 0.5); }
      for (const p of inP) S.circle(p[0], p[1], nr * 1.3, { w: iw * 0.5, color: C.ink, alpha: k1, fill: C.paper });
      for (let j = 0; j < H; j++) S.circle(hP[j][0], hP[j][1], nr, { w: iw * 0.45, color: C.ink, alpha: k1, fill: C.paper });
      S.circle(oP[0], oP[1], nr * 1.5, { w: iw * 0.7, color: C.accent, alpha: k1, fill: C.paper });
      S.text("x", inP[0][0], inP[0][1] + nr * 0.5, { size: nr * 1.5, color: C.ink, alpha: k1, halo: false });
      S.text("y", inP[1][0], inP[1][1] + nr * 0.4, { size: nr * 1.5, color: C.ink, alpha: k1, halo: false });
      S.text("p", oP[0], oP[1] + nr * 0.5, { size: nr * 1.6, color: C.accent, alpha: k1, halo: false });
      S.text("error flows back ←", nb.x + nb.w, nb.y - fs * 0.55, { size: fs * 0.75, align: "right", color: C.accent, alpha: k2 });
      // loss curve
      const lx0 = B.x + fs * 1.6 + (n ? 0 : B.w * 0.05), lx1 = B.x + B.w * 0.5, ly1 = st.lossY, ly0 = st.lossY + st.lossH;
      S.line([[lx0, ly1], [lx0, ly0], [lx1, ly0]], { w: iw * 0.4, color: C.soft, alpha: k2 });
      S.text("loss", lx0 - fs * 0.3, ly1 + fs * 0.6, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
      S.text(`epoch ${st.epoch}`, lx1, ly0 + fs * 1.0, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
      if (st.loss.length > 1) {
        const mx = Math.max(0.8, ...st.loss), N = Math.max(60, st.loss.length);
        S.line(st.loss.map((L, i) => [lx0 + (lx1 - lx0) * i / (N - 1), ly0 - (ly0 - ly1) * Math.min(1, L / mx)]), { w: iw * 0.7, color: C.ink, alpha: k2 });
        const last = st.loss[st.loss.length - 1];
        S.text(last.toFixed(3), lx0 + (lx1 - lx0) * (st.loss.length - 1) / (N - 1) + fs * 0.3, ly0 - (ly0 - ly1) * Math.min(1, last / mx) - fs * 0.4, { size: fs * 0.75, align: "left", color: C.ink, alpha: k2 });
      }
      // AI beat: same algorithm, vastly bigger networks
      if (k3 > 0) {
        const x = B.x + B.w * 0.56, y = st.lossY + fs * (n ? 0.3 : 0.5), lh = fs * (n ? 1.05 : 1.35), sz = fs * (n ? 0.78 : 0.9);
        const nw = 4 * H + 1;
        const rows = n ? [["same rule, bigger nets", 1], [`here: ${nw} weights`, 0], ["2012 AlexNet: 60 million", 0], ["2020 GPT-3: 175 billion", 0]]
          : [["the same rule trains every deep net", 1], [`this network: ${nw} weights`, 0], ["1986: backprop paper in Nature", 0], ["2012: AlexNet, 60 million weights", 0], ["2020: GPT-3, 175 billion weights", 0]];
        rows.forEach(([t, b], i) => { if (y + i * lh < B.y + B.h + fs * 0.4) S.text(t, x, y + i * lh, { size: b ? sz * 1.05 : sz, align: "left", color: b ? C.accent : C.ink, weight: b ? 500 : 400, alpha: k3 }); });
      }
      return `epoch ${st.epoch} · loss ${st.L.toFixed(3)} · ${Math.round(st.acc * 100)}% of ${st.pts.length} points right · ${H} hidden units, ${4 * H + 1} weights · learning rate ${(+S.p.lr).toFixed(2)}`;
    },
    code(S) {
      return `${S.c("# backpropagation (Rumelhart, Hinton & Williams, 1986)")}
h = tanh(W1 @ [x, y] + b1)        ${S.c("# " + S.p.hidden + " hidden units")}
p = sigmoid(W2 @ h + b2)          ${S.c("# chance of the filled class")}
loss = -(t*log(p) + (1-t)*log(1-p))
d_out = p - t                     ${S.c("# error at the output")}
d_hid = (W2 * d_out) * (1 - h**2) ${S.c("# ... passed backwards")}
grad_W2, grad_W1 = d_out * h, outer(d_hid, [x, y])
v = 0.9 * v - ${S.v((+S.p.lr).toFixed(2))} * grad          ${S.c("# step downhill (with momentum)")}
W += v`;
    },
  });
})();
