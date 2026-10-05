// James Watt — centrifugal governor on a steam engine → speed plot with set point → the act/measure/correct loop of reinforcement learning
Lineage.scene({
  params: [
    { id: "load", label: "Load on the engine", type: "range", min: 0.6, max: 1.6, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    { id: "gain", label: "Governor gain", type: "range", min: 0.5, max: 9, step: 0.1, value: 3, fmt: v => v.toFixed(1) },
    { id: "speed", label: "Time speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "Jolt the load", run(S) { S.st.jolt = 2.2; } }],
  init(S) { this.reset(S); },
  reset(S) {
    Object.assign(S.st, { w: 1, x: 1, xv: 0, t: 0, th: 0, hist: [], acc: 0, jolt: 0, flow: 0, fly: 0 });
    // run 14 s ahead so the speed plot starts full
    for (let i = 0; i < 14 * 240; i++) { this.step(S, 1 / 240); if (i % 12 === 0) S.st.hist.push([S.st.t, S.st.w, S.st.L]); }
  },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15;
    let g, pl, lc;
    if (side) {
      g = { x: b.x, y: b.y + b.h * 0.02, w: b.w * 0.54, h: b.h * 0.9 };
      pl = { x: b.x + b.w * 0.6, y: b.y + b.h * 0.1, w: b.w * 0.38, h: b.h * 0.4 };
      lc = { x: b.x + b.w * 0.79, y: b.y + b.h * 0.79, r: Math.min(b.w * 0.1, b.h * 0.13) };
    } else {
      g = { x: b.x, y: b.y, w: b.w * 0.66, h: b.h * 0.64 };
      pl = { x: b.x + b.w * 0.08, y: b.y + b.h * 0.72, w: b.w * 0.88, h: b.h * 0.2 };
      lc = { x: b.x + b.w * 0.83, y: b.y + b.h * 0.27, r: Math.min(b.w * 0.1, b.h * 0.1) };
    }
    // governor geometry (all relative to region g)
    const sx = g.x + g.w * (side ? 0.52 : 0.5), py = g.y + g.h * 0.07;
    const La = Math.min(g.h * 0.3, g.w * 0.28);
    const pipeY = g.y + g.h * 0.88, baseY = g.y + g.h * 0.66;
    const R = Math.min(g.h * 0.15, g.w * 0.12);
    const fw = [g.x + g.w - R * 1.05, pipeY - R * 0.95];
    const cyl = { x: fw[0] - R * 3.1, w: R * 0.9, h: R * 0.9 };
    const fx = sx - La * 0.95, valveX = fx - La * 0.95 * 0.7;
    Object.assign(S.st, { side, g, pl, lc, sx, py, La, pipeY, baseY, R, fw, cyl, valveX, fx });
  },
  entry(S) { const { g, pipeY, sx, py, La } = S.st; return S.narrow ? [g.x, pipeY] : [sx, py - La * 0.08]; },
  step(S, h) {
    const st = S.st, G = S.p.gain;
    const L = S.p.load * ((st.t % 12) < 6 ? 1 : 1.5) * (1 + 0.6 * Math.min(1, st.jolt));
    const u = Math.min(1, Math.max(0, 0.5 - G * (st.x - 1)));
    st.w += (h * (2 * u - L * st.w)) / 2;
    const wn = 5, z = 0.4, a = wn * wn * (st.w - st.x) - 2 * z * wn * st.xv;
    st.xv += a * h; st.x += st.xv * h; st.t += h; st.jolt = Math.max(0, st.jolt - h);
    st.u = u; st.L = L;
  },
  draw(S, k, ft, dt) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs;
    const { g, pl, sx, py, La, pipeY, baseY, R, fw, cyl, valveX, side } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    // ---- simulate (in field time) ----
    const sdt = Math.min(0.1, dt * (S.p.speed ?? 1));
    if (sdt > 0) {
      const n = Math.ceil(sdt / (1 / 240));
      for (let i = 0; i < n; i++) this.step(S, sdt / n);
      st.th += sdt * st.w * 5.2; st.flow += sdt * (st.u || 0.5) * 3; st.fly += sdt * st.w * 3.4;
      st.acc += sdt; while (st.acc > 0.05) { st.acc -= 0.05; st.hist.push([st.t, st.w, st.L]); if (st.hist.length > 300) st.hist.shift(); }
    }
    const u = st.u ?? 0.5, w = st.w;
    // ball angle from the vertical follows the governor position x (the flyballs lag the engine)
    const phi = Math.max(0.18, Math.min(1.25, 0.8 + 1.6 * (st.x - 1)));
    const al = k1;
    // ---- steam pipe, valve, cylinder, flywheel ----
    const pw = Math.max(6, R * 0.22);
    S.line([[g.x, pipeY - pw / 2], [cyl.x, pipeY - pw / 2]], { w: iw * 0.55, color: C.ink, alpha: al });
    S.line([[g.x, pipeY + pw / 2], [cyl.x, pipeY + pw / 2]], { w: iw * 0.55, color: C.ink, alpha: al });
    // steam puffs moving through the pipe, faster when the valve is open
    for (let i = 0; i < 9; i++) {
      const f = (i / 9 + st.flow * 0.25) % 1, x = g.x + f * (cyl.x - g.x);
      if (x > valveX && u < 0.04) continue;
      S.dot(x, pipeY, Math.max(1.2, pw * 0.16), C.soft, al * (x > valveX ? 0.3 + 0.7 * u : 0.8));
    }
    // butterfly valve: the disc turns with the opening
    const va = (1 - u) * Math.PI * 0.5, vr = pw * 0.9;
    S.circle(valveX, pipeY, vr, { w: iw * 0.45, color: C.ink, alpha: al });
    S.line([[valveX - vr * Math.sin(va) * 0.85, pipeY - vr * Math.cos(va) * 0.85], [valveX + vr * Math.sin(va) * 0.85, pipeY + vr * Math.cos(va) * 0.85]], { w: iw * 0.8, color: C.ink, alpha: al });
    // cylinder + piston + connecting rod to the crank
    const cy0 = pipeY - cyl.h * 0.5;
    S.rect(cyl.x, cy0 - cyl.h * 0.5, cyl.w, cyl.h, { color: C.ink, w: iw * 0.55, alpha: al });
    const cr = R * 0.45, ca = st.th;
    const crank = [fw[0] + cr * Math.cos(ca), fw[1] + cr * Math.sin(ca)];
    const pistX = cyl.x + cyl.w * (0.35 + 0.25 * Math.cos(ca));
    S.line([[pistX, cy0 - cyl.h * 0.42], [pistX, cy0 + cyl.h * 0.42]], { w: iw * 0.8, color: C.ink, alpha: al });
    S.line([[pistX, cy0], [cyl.x + cyl.w, cy0], crank], { w: iw * 0.5, color: C.ink, alpha: al });
    S.circle(fw[0], fw[1], R, { w: iw * 0.9, color: C.ink, alpha: al });
    for (let j = 0; j < 6; j++) { const a = ca + (j * Math.PI) / 3; S.line([fw, [fw[0] + R * Math.cos(a), fw[1] + R * Math.sin(a)]], { w: iw * 0.35, color: C.ink, alpha: al }); }
    S.dot(crank[0], crank[1], iw * 0.8, C.ink, al);
    // belt from the flywheel up to the governor's pulley
    const pul = [sx, baseY + La * 0.12], pr = R * 0.22;
    S.circle(pul[0], pul[1], pr, { w: iw * 0.45, color: C.ink, alpha: al });
    S.line([[pul[0], pul[1] - pr], [fw[0], fw[1] - R * 0.3]], { w: iw * 0.35, color: C.soft, alpha: al });
    S.line([[pul[0], pul[1] + pr], [fw[0], fw[1] + R * 0.3]], { w: iw * 0.35, color: C.soft, alpha: al });
    // ---- the governor ----
    S.line([[sx, py - La * 0.08], [sx, pul[1]]], { w: iw * 0.7, color: C.ink, alpha: al });
    const sl = phi_ => py + La * 0.55 * Math.cos(phi_) + Math.sqrt(Math.pow(La * 0.75, 2) - Math.pow(La * 0.55 * Math.sin(phi_), 2));
    const sleeveY = sl(phi);
    const balls = [0, 1].map(j => {
      const a = st.fly + j * Math.PI, sp = Math.sin(phi) * Math.cos(a);
      return { x: sx + La * sp, y: py + La * Math.cos(phi), z: Math.sin(a), sp };
    }).sort((p, q) => p.z - q.z);
    const rb = La * 0.17;
    for (const B of balls) {
      const mid = [sx + (B.x - sx) * 0.55, py + (B.y - py) * 0.55];
      const sc = 1 + 0.12 * B.z;
      S.line([[sx, py], [B.x, B.y]], { w: iw * 0.6, color: C.ink, alpha: al });
      S.line([mid, [sx, sleeveY]], { w: iw * 0.4, color: C.ink, alpha: al });
      S.circle(B.x, B.y, rb * sc, { w: iw * 0.8, color: C.ink, fill: C.paper, alpha: al });
      S.circle(B.x - rb * 0.3, B.y - rb * 0.3, rb * 0.25 * sc, { w: iw * 0.3, color: C.soft, alpha: al });
    }
    S.dot(sx, py, iw * 0.9, C.ink, al);
    S.rect(sx - rb * 0.55, sleeveY - rb * 0.3, rb * 1.1, rb * 0.6, { color: C.ink, w: iw * 0.6, fill: C.paper, alpha: al });
    // bell-crank lever: sleeve rises -> far end falls -> rod turns the valve towards closed
    const fx = st.fx, fy = sl(0.8), ex = valveX, ey = fy + (fy - sleeveY) * ((fx - valveX) / (sx - fx));
    S.line([[sx, sleeveY], [ex, ey]], { w: iw * 0.6, color: C.ink, alpha: al });
    S.line([[fx - rb * 0.4, fy + rb * 0.7], [fx, fy], [fx + rb * 0.4, fy + rb * 0.7]], { w: iw * 0.45, color: C.ink, alpha: al, close: true });
    S.dot(fx, fy, iw * 0.7, C.ink, al);
    S.line([[ex, ey], [valveX, pipeY - vr]], { w: iw * 0.5, color: C.ink, alpha: al });
    // labels
    const f1 = fs * (side ? 0.8 : 0.85);
    if (al > 0.05) {
      S.text("flyballs", sx + La * Math.sin(phi) + rb * 1.3, py + La * 0.35, { size: f1, align: "left", alpha: al });
      S.text("steam valve", side ? g.x : valveX, pipeY + pw + f1 * 1.2, { size: f1, alpha: al, align: side ? "left" : "center" });
      if (k3 > 0 && !side) {
        const ta = { size: f1, color: C.accent, weight: 500, alpha: k3 };
        S.text("measure", sx - La * Math.sin(phi) - rb * 1.4, py + La * Math.cos(phi) - rb * 1.4, { ...ta, align: "right" });
        S.text("correct", fx, fy - rb * 0.9, ta);
        S.text("act", valveX - vr * 1.6, pipeY - vr * 1.8, { ...ta, align: "right" });
      }
      S.text("flywheel", fw[0], fw[1] + R + f1 * 1.15, { size: f1, alpha: al });
    }
    // ---- plot of speed against time ----
    if (k2 > 0) {
      const { x, y, w: pw2, h } = pl, lo = 0.78, hi = 1.22, Tw = 14;
      const Y = v => y + h * (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo));
      S.line([[x, y - h * 0.05], [x, y + h], [x + pw2 * k2, y + h]], { w: iw * 0.45, color: C.ink, alpha: k2 });
      S.line([[x, Y(1)], [x + pw2 * k2, Y(1)]], { w: iw * 0.45, color: C.soft, dash: [iw * 2, iw * 1.6], alpha: k2 });
      S.text("set point", x + pw2, Y(1) - fs * 0.45, { size: fs * 0.8, align: "right", color: C.soft, alpha: k2 });
      S.text("engine speed", x + fs * 0.3, y - h * 0.05 - fs * 0.35, { size: fs * 0.85, align: "left", alpha: k2 });
      S.text("time →", x + pw2, y + h + fs * 1.15, { size: fs * 0.8, align: "right", color: C.soft, alpha: k2 });
      const H = st.hist, tn = st.t, ptsW = [], ptsL = [];
      for (const [t, v, L] of H) {
        const px = x + pw2 * (1 - (tn - t) / Tw);
        if (px < x || px > x + pw2 * k2) continue;
        ptsW.push([px, Y(v)]); ptsL.push([px, y + h - h * 0.18 * (L - 0.5)]);
      }
      S.line(ptsL, { w: iw * 0.4, color: C.soft, alpha: k2 * 0.9 });
      if (ptsL.length) S.text("load", ptsL[0][0] + fs * 0.2, ptsL[0][1] - fs * 0.35, { size: fs * 0.75, align: "left", color: C.soft, alpha: k2 });
      S.line(ptsW, { w: iw * 1.0, color: C.accent, alpha: k2 });
      if (ptsW.length) { const p = ptsW[ptsW.length - 1]; S.dot(p[0], p[1], iw * 1.2, C.accent, k2); }
    }
    // ---- the same loop, relabelled as reinforcement learning ----
    if (k3 > 0) {
      const { x: cx, y: cy, r } = st.lc, ff = fs * (side ? 0.85 : 1.0);
      const items = [["act", Math.PI * 5 / 6], ["measure", Math.PI * 1.5], ["correct", Math.PI * 13 / 6]];
      const spin = ft * 0.6, gap = side ? 0.62 : 0.55;
      for (let i = 0; i < 3; i++) {
        const A0 = items[i][1] + gap, A1 = items[i][1] + (Math.PI * 2) / 3 - gap;
        S.circle(cx, cy, r, { w: iw * 0.6, a0: A0, a1: A1 - 0.1, alpha: k3 });
        S.arrow(cx + r * Math.cos(A1 - 0.12), cy + r * Math.sin(A1 - 0.12), cx + r * Math.cos(A1), cy + r * Math.sin(A1), { w: iw * 0.6, alpha: k3, head: iw * 2.4 });
      }
      for (const [word, a] of items) S.text(word, cx + r * Math.cos(a), cy + r * Math.sin(a) + ff * 0.32, { size: ff, color: C.accent, weight: 500, alpha: k3 });
            S.text("reinforcement", cx, cy + ff * 0.05, { size: ff * 0.85, color: C.accent, alpha: k3 });
      S.text("learning", cx, cy + ff * 0.95, { size: ff * 0.85, color: C.accent, alpha: k3 });
    }
    const rpm = Math.round(w * 50);
    const hunting = S.p.gain > 4.4 ? " · hunting!" : "";
    return `speed ${rpm} rev/min (set point 50) · valve ${Math.round(u * 100)}% open · load ${(st.L || 1).toFixed(2)}×${hunting}`;
  },
  code(S) {
    const st = S.st, G = S.p.gain, err = ((st.w || 1) - 1) * 50;
    return `${S.c("# centrifugal governor: feedback with no human")}
set_point = ${S.v("50")}            ${S.c("# rev/min")}
gain = ${S.v(G.toFixed(1))}
load = ${S.v(S.p.load.toFixed(2))}

while engine_running:
    speed = flyballs.measure()   ${S.c("# balls fly out as it speeds up")}
    error = speed - set_point    ${S.c("# act, measure ...")}
    valve = 0.5 - gain * error / set_point
    valve = clamp(valve, 0, 1)   ${S.c("# ... correct")}
    speed += (2 * valve - load * speed) * dt
${G > 4.4 ? S.c("# gain too high: it overshoots and 'hunts'") : S.c("# gain " + G.toFixed(1) + ": settles near the set point")}`;
  },
});
