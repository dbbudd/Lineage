// Yann LeCun — a handwritten digit, a 3×3 kernel sliding across it, feature map, max-pool, a (toy) classifier → LeNet / CNNs
(function () {
  const G = 16;
  const KER = {
    vert: { name: "vertical edges", k: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
    horz: { name: "horizontal edges", k: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
    diag: { name: "diagonal edges", k: [0, 1, 2, -1, 0, 1, -2, -1, 0] },
    blur: { name: "blur", k: [1, 1, 1, 1, 1, 1, 1, 1, 1], div: 9 },
  };
  const arc = (cx, cy, rx, ry, a0, a1, n = 18) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; };
  const PI = Math.PI;
  // hand-made templates (one clean drawing per digit)
  const TPL = [
    [arc(0.5, 0.5, 0.27, 0.38, 0, 2 * PI, 28)],
    [[[0.36, 0.28], [0.54, 0.12], [0.54, 0.88]]],
    [[...arc(0.5, 0.33, 0.24, 0.2, PI * 1.05, PI * 2.15), [0.25, 0.86], [0.78, 0.86]]],
    [arc(0.48, 0.31, 0.24, 0.18, PI * 1.1, PI * 2.5), arc(0.48, 0.67, 0.27, 0.21, PI * 1.5, PI * 2.9)],
    [[[0.64, 0.88], [0.64, 0.12], [0.2, 0.64], [0.82, 0.64]]],
    [[[0.74, 0.14], [0.32, 0.14], [0.28, 0.45], ...arc(0.47, 0.64, 0.27, 0.22, PI * 1.3, PI * 2.85)]],
    [[[0.66, 0.13], ...arc(0.62, 0.55, 0.36, 0.42, PI * 1.35, PI * 0.95), ...arc(0.5, 0.66, 0.24, 0.21, PI, PI * 3)]],
    [[[0.22, 0.14], [0.78, 0.14], [0.42, 0.88]]],
    [arc(0.5, 0.3, 0.2, 0.17, 0, 2 * PI, 22), arc(0.5, 0.68, 0.25, 0.2, 0, 2 * PI, 24)],
    [arc(0.5, 0.33, 0.23, 0.2, 0, 2 * PI, 24), [[0.73, 0.33], [0.66, 0.88]]],
  ];
  // a few common alternative ways of writing a digit
  const ALT = [
    { d: 4, s: [[[0.38, 0.12], [0.22, 0.6], [0.82, 0.6]], [[0.64, 0.36], [0.64, 0.9]]] },
    { d: 1, s: [[[0.5, 0.12], [0.5, 0.88]]] },
    { d: 7, s: [[[0.22, 0.14], [0.78, 0.14], [0.42, 0.88]], [[0.35, 0.5], [0.7, 0.5]]] },
  ];
  // "handwritten" samples, deliberately different from the templates
  const SAMPLES = [
    { d: 7, s: [[[0.2, 0.2], [0.42, 0.15], [0.8, 0.17], [0.6, 0.5], [0.48, 0.86]], [[0.42, 0.52], [0.72, 0.5]]] },
    { d: 3, s: [[[0.28, 0.2], ...arc(0.47, 0.32, 0.22, 0.16, PI * 1.35, PI * 2.45), [0.42, 0.48], ...arc(0.47, 0.68, 0.25, 0.2, PI * 1.6, PI * 2.85)]] },
    { d: 2, s: [[...arc(0.48, 0.32, 0.22, 0.18, PI * 1.1, PI * 2.1), [0.6, 0.55], [0.28, 0.84], [0.5, 0.8], [0.8, 0.84]]] },
    { d: 4, s: [[[0.42, 0.14], [0.26, 0.58], [0.78, 0.56]], [[0.66, 0.3], [0.62, 0.9]]] },
    { d: 0, s: [arc(0.52, 0.5, 0.24, 0.36, -PI * 0.4, PI * 1.65, 26)] },
  ];
  function raster(strokes) {
    const img = new Float32Array(G * G);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const px = (x + 0.5) / G, py = (y + 0.5) / G; let d = 1e9;
      for (const s of strokes) for (let i = 0; i < s.length - 1; i++) {
        const [ax, ay] = s[i], [bx, by] = s[i + 1], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1e-9;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
        d = Math.min(d, Math.hypot(px - ax - t * vx, py - ay - t * vy));
      }
      img[y * G + x] = Math.max(0, Math.min(1, 1.5 - d * G * 0.95));
    }
    return img;
  }
  function conv(img, k, div, stride) { // valid 3×3 convolution, |response|
    const n = Math.floor((G - 3) / stride) + 1, out = new Float32Array(n * n);
    for (let oy = 0; oy < n; oy++) for (let ox = 0; ox < n; ox++) {
      let s = 0; const y0 = oy * stride, x0 = ox * stride;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) s += img[(y0 + j) * G + x0 + i] * k[j * 3 + i];
      out[oy * n + ox] = Math.abs(s / (div || 1));
    }
    return { n, out };
  }
  function pool(m, n) { const q = Math.floor(n / 2), out = new Float32Array(q * q);
    for (let y = 0; y < q; y++) for (let x = 0; x < q; x++) out[y * q + x] = Math.max(m[(2 * y) * n + 2 * x], m[(2 * y) * n + 2 * x + 1], m[(2 * y + 1) * n + 2 * x], m[(2 * y + 1) * n + 2 * x + 1]);
    return { q, out }; }
  function normalise(img) { // centre the ink and scale it to a 12-pixel box, like MNIST's preprocessing
    let x0 = G, x1 = -1, y0 = G, y1 = -1;
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (img[y * G + x] > 0.25) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return null;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, sc = 12 / Math.max(w, h, 4), cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, out = new Float32Array(G * G);
    const at = (x, y) => (x < 0 || y < 0 || x >= G || y >= G ? 0 : img[y * G + x]);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const sx = cx + (x + 0.5 - G / 2) / sc - 0.5, sy = cy + (y + 0.5 - G / 2) / sc - 0.5, ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
      out[y * G + x] = at(ix, iy) * (1 - fx) * (1 - fy) + at(ix + 1, iy) * fx * (1 - fy) + at(ix, iy + 1) * (1 - fx) * fy + at(ix + 1, iy + 1) * fx * fy;
    }
    return out;
  }
  function features(img) {
    const n = normalise(img); if (!n) return null; const f = [];
    for (const id of ["vert", "horz", "diag"]) { const c = conv(n, KER[id].k, 1, 1), p = pool(c.out, c.n); f.push(...p.out); }
    const d = [0, 1, 2, 1, 0, -1, 2, 1, 0]; { const c = conv(n, [2, 1, 0, 1, 0, -1, 0, -1, -2], 1, 1), p = pool(c.out, c.n); f.push(...p.out); }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) f.push(1.5 * (n[(2 * y) * G + 2 * x] + n[(2 * y) * G + 2 * x + 1] + n[(2 * y + 1) * G + 2 * x] + n[(2 * y + 1) * G + 2 * x + 1]));
    let m = 0; for (const v of f) m += v * v; m = Math.sqrt(m) || 1; return f.map(v => v / m);
  }
  let TF = null;
  function classify(S) {
    const st = S.st; if (!TF) TF = [...TPL.map((s, d) => ({ d, f: features(raster(s)) })), ...ALT.map(a => ({ d: a.d, f: features(raster(a.s)) }))];
    const f = features(st.img);
    if (!f) { st.probs = null; st.guess = null; return; }
    const sims = new Array(10).fill(-1);
    for (const t of TF) sims[t.d] = Math.max(sims[t.d], t.f.reduce((s, v, i) => s + v * f[i], 0));
    const mx = Math.max(...sims);
    const e = sims.map(s => Math.exp((s - mx) * 25)), z = e.reduce((a, b) => a + b, 0);
    st.probs = e.map(v => v / z); st.guess = st.probs.indexOf(Math.max(...st.probs));
  }
  function load(S, i) { const st = S.st; st.si = i % SAMPLES.length; st.img = raster(SAMPLES[st.si].s); st.preset = true; classify(S); }
  Lineage.scene({
    params: [
      { id: "ker", label: "Kernel (filter)", type: "select", value: "vert", options: Object.keys(KER).map(k => ({ value: k, label: KER[k].name })) },
      { id: "stride", label: "Stride", type: "select", value: "1", options: [{ value: "1", label: "1 (every pixel)" }, { value: "2", label: "2 (every other pixel)" }] },
      { id: "speed", label: "Scan speed", type: "range", min: 0, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) + "×" },
    ],
    actions: [
      { label: "Clear", run: S => { S.st.img = new Float32Array(G * G); S.st.preset = false; classify(S); } },
      { label: "Next sample", run: S => load(S, (S.st.si ?? 0) + 1) },
    ],
    init(S) { load(S, 0); },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const gi = Math.floor(Math.min(b.w * (narrow ? 0.44 : 0.44), b.h * (narrow ? 0.56 : 0.52)) / G) * G;
      const gx = b.x + (narrow ? 0 : fs * 0.5), gy = b.y + fs * (narrow ? 1.5 : 2.2);
      const fx = gx + gi + b.w * (narrow ? 0.1 : 0.12), fm = Math.min(gi * 0.62, b.x + b.w - fx - fs * 0.5);
      const px = fx, py = gy + fm + fs * (narrow ? 2.2 : 3.2), pm = fm * 0.5;
      const oy = Math.max(gy + gi, py + pm) + fs * (narrow ? 2.2 : 3.4), oh = b.y + b.h - oy - fs * (narrow ? 1.0 : 2.4);
      Object.assign(S.st, { gi, gx, gy, fx, fm, px, py, pm, oy, oh });
    },
    entry(S) { const st = S.st; return [st.gx, st.gy + st.gi * 0.5]; },
    pointer(S, type, x, y) {
      const st = S.st, c = st.gi / G, gx = (x - st.gx) / c, gy = (y - st.gy) / c;
      const inside = gx >= -0.5 && gy >= -0.5 && gx < G + 0.5 && gy < G + 0.5;
      if (type === "down") st.drawing = inside;
      if (type === "up") { st.drawing = false; st.lastP = null; return; }
      if (!st.drawing || (type !== "down" && type !== "drag")) return;
      if (st.preset) { st.img = new Float32Array(G * G); st.preset = false; }
      const pts = st.lastP && type === "drag" ? [st.lastP, [gx, gy]] : [[gx, gy]];
      const steps = pts.length > 1 ? Math.ceil(Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) * 3) : 0;
      for (let s = 0; s <= steps; s++) {
        const u = steps ? s / steps : 0, qx = pts[0][0] + (pts[pts.length - 1][0] - pts[0][0]) * u, qy = pts[0][1] + (pts[pts.length - 1][1] - pts[0][1]) * u;
        for (let j = Math.floor(qy - 2); j <= qy + 2; j++) for (let i = Math.floor(qx - 2); i <= qx + 2; i++) {
          if (i < 0 || j < 0 || i >= G || j >= G) continue;
          const d = Math.hypot(i + 0.5 - qx, j + 0.5 - qy), v = Math.max(0, Math.min(1, 1.45 - d * 0.95));
          st.img[j * G + i] = Math.max(st.img[j * G + i], v);
        }
      }
      st.lastP = [gx, gy]; classify(S);
    },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, nar = S.narrow, { gi, gx, gy, fx, fm, px, py, pm, oy, oh } = st;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      const c = gi / G, ker = KER[S.p.ker] || KER.vert, stride = +S.p.stride || 1;
      const F = conv(st.img, ker.k, ker.div, stride), Pm = pool(F.out, F.n), n = F.n;
      const ink = S.mix(C.ink, C.paper, 0), fmax = Math.max(1e-6, ...F.out);
      // input pixels
      ctx.save(); ctx.globalAlpha = k1;
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { const v = st.img[y * G + x]; if (v > 0.02) { ctx.fillStyle = ink; ctx.globalAlpha = k1 * v * 0.88; ctx.fillRect(gx + x * c, gy + y * c, c + 0.5, c + 0.5); } }
      ctx.restore();
      for (let i = 0; i <= G; i++) { S.line([[gx + i * c, gy], [gx + i * c, gy + gi]], { w: 0.5, color: C.soft, alpha: 0.35 * k1 }); S.line([[gx, gy + i * c], [gx + gi, gy + i * c]], { w: 0.5, color: C.soft, alpha: 0.35 * k1 }); }
      S.rect(gx, gy, gi, gi, { w: iw * 0.45, color: C.ink, alpha: k1 });
      S.text(nar ? "16×16 pixels" : "handwritten digit, 16×16 pixels", gx + gi / 2, gy - fs * 0.5, { size: fs * 0.85, alpha: k1 });
      S.text(st.preset ? "draw your own digit here" : "draw here · Clear to restart", gx + gi / 2, gy + gi + fs * 1.25, { size: fs * 0.8, color: C.soft, alpha: k1 });
      // sliding kernel
      let rel = "";
      if (k2 > 0) {
        const total = n * n, rate = (stride === 1 ? 32 : 12), cyc = total + rate * 1.6;
        const pos = Math.floor((ft * rate) % cyc), cur = Math.min(pos, total - 1), done = Math.min(total, pos + 1);
        const fc = fm / n, ox = cur % n, oyy = Math.floor(cur / n);
        // feature map
        ctx.save();
        for (let i = 0; i < done; i++) { const v = F.out[i] / fmax; if (v > 0.03) { ctx.globalAlpha = k2 * v * 0.9; ctx.fillStyle = C.ink; ctx.fillRect(fx + (i % n) * fc, gy + Math.floor(i / n) * fc, fc + 0.4, fc + 0.4); } }
        ctx.restore();
        S.rect(fx, gy, fm, fm, { w: iw * 0.45, color: C.ink, alpha: k2 });
        S.text(`feature map ${n}×${n}`, fx + fm / 2, gy - fs * 0.5, { size: fs * 0.85, alpha: k2 });
        const wx = gx + ox * stride * c, wy = gy + oyy * stride * c;
        if (pos < total) {
          S.rect(wx, wy, 3 * c, 3 * c, { w: iw * 0.8, color: C.ink, alpha: k2 });
          const tx = fx + ox * fc, ty = gy + oyy * fc;
          S.line([[wx + 3 * c, wy], [tx, ty]], { w: iw * 0.3, color: C.ink, alpha: 0.5 * k2 });
          S.line([[wx + 3 * c, wy + 3 * c], [tx, ty + fc]], { w: iw * 0.3, color: C.ink, alpha: 0.5 * k2 });
          S.rect(tx, ty, fc, fc, { w: iw * 0.55, color: C.ink, alpha: k2 });
        }
        // kernel weights
        const kc = Math.min(fs * 1.25, (fx - gx - gi) * 0.26), kx = gx + gi + (fx - gx - gi - 3 * kc) / 2, ky = gy + fm + fs * (nar ? 0.6 : 1.4);
        if (!nar || kc > 10) {
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
            S.rect(kx + i * kc, ky + j * kc, kc, kc, { w: iw * 0.3, color: C.ink, alpha: k2 });
            const v = ker.k[j * 3 + i];
            S.text(String(v), kx + (i + 0.5) * kc, ky + (j + 0.72) * kc, { size: Math.min(fs * 0.7, kc * 0.62), mono: true, italic: false, halo: false, color: v < 0 ? C.soft : C.ink, alpha: k2 });
          }
          if (!nar) S.text(ker.div ? "kernel ÷ 9" : "kernel", kx + 1.5 * kc, ky + 3 * kc + fs * 1.1, { size: fs * 0.8, color: C.soft, alpha: k2 });
        }
        // pooled
        const q = Pm.q, pc = pm / q, pmax = Math.max(1e-6, ...Pm.out);
        { ctx.save(); for (let i = 0; i < q * q; i++) { const v = Pm.out[i] / pmax; if ((2 * Math.floor(i / q) + 1) * n + 2 * (i % q) + 1 < done && v > 0.03) { ctx.globalAlpha = k2 * v * 0.9; ctx.fillStyle = C.ink; ctx.fillRect(px + (i % q) * pc, py + Math.floor(i / q) * pc, pc + 0.4, pc + 0.4); } } ctx.restore(); }
        S.rect(px, py, pm, pm, { w: iw * 0.45, color: C.ink, alpha: k2 });
        S.arrow(fx + fm * 0.25, gy + fm + fs * 0.25, fx + fm * 0.25, py - fs * 0.3, { w: iw * 0.4, color: C.ink, alpha: k2 });
        S.text(nar ? `pool ${q}×${q}` : `max-pool → ${q}×${q}`, px + pm + fs * 0.5, py + pm * 0.5 + fs * 0.3, { size: fs * 0.8, align: "left", alpha: k2 });
        rel = `${ker.name} · stride ${stride} → ${n}×${n} map → pooled ${q}×${q}`;
      }
      // output layer (toy classifier)
      if (k3 > 0 && oh > fs * 1.5) {
        const ox0 = S.box.x + (nar ? 0 : fs * 0.5), ow = S.box.w - (nar ? 0 : fs * 1), colw = ow / 10, base = oy + oh;
        S.line([[ox0, base], [ox0 + ow, base]], { w: iw * 0.4, color: C.ink, alpha: k3 });
        for (let d = 0; d < 10; d++) {
          const p = st.probs ? st.probs[d] : 0, h = Math.max(1, p * (oh - fs * 0.8)), x = ox0 + d * colw + colw * 0.22, w = colw * 0.56, win = st.guess === d;
          S.rect(x, base - h, w, h, { w: iw * (win ? 0.7 : 0.4), color: C.accent, fill: win ? S.mix(C.accent, C.paper, 0.55) : null, alpha: k3 });
          S.text(String(d), x + w / 2, base + fs * 1.15, { size: fs * (win ? 1.1 : 0.9), italic: false, weight: win ? 600 : 400, color: win ? C.accent : C.ink, alpha: k3 });
        }
        const lab = st.guess == null ? "draw a digit" : `guess: ${st.guess}  (${Math.round(st.probs[st.guess] * 100)}%)`;
        S.text(lab, ox0 + ow, oy - fs * 0.4, { size: fs * 1.05, align: "right", weight: 600, color: C.accent, alpha: k3 });
        S.text(nar ? "toy: matches templates" : "toy last layer: compares features with hand-made templates", ox0, oy - fs * 0.4, { size: fs * 0.78, align: "left", color: C.accent, alpha: k3 });
        if (!nar) S.text("LeNet learned all its kernels and weights from thousands of examples", ox0 + ow / 2, base + fs * 2.4, { size: fs * 0.8, color: C.soft, alpha: k3 });
        if (st.guess != null) rel += ` · guess ${st.guess} (${Math.round(st.probs[st.guess] * 100)}%)`;
      }
      return rel || "a handwritten digit, as pixels";
    },
    code(S) {
      const ker = KER[S.p.ker] || KER.vert, k = ker.k, st = S.st, stride = +S.p.stride || 1, n = Math.floor((G - 3) / stride) + 1;
      const row = j => `[${k.slice(j * 3, j * 3 + 3).map(v => String(v).padStart(2)).join(", ")}]`;
      return `${S.c("# one convolution layer, then pooling")}
kernel = [${S.v(row(0))},             ${S.c("# " + ker.name)}
          ${S.v(row(1))},
          ${S.v(row(2))}]${ker.div ? " / 9" : ""}
stride = ${S.v(stride)}
for y in range(0, 14, stride):
    for x in range(0, 14, stride):
        patch = image[y:y+3, x:x+3]
        feature[y][x] = abs(sum(patch * kernel))
pooled = max_pool(feature, 2)              ${S.c(`# ${n}×${n} → ${Math.floor(n / 2)}×${Math.floor(n / 2)}`)}
guess = best_match(pooled, templates)      ${S.c("# toy; LeNet learned this")}`;
    },
  });
})();
