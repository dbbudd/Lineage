// Rudolf Kálmán — the Kalman filter: predict, then update; a noisy track becomes a confident estimate
// → sensor fusion in robots and self-driving cars
Lineage.scene({
  params: [
    { id: "sig", label: "Measurement noise σ", type: "range", min: 0.5, max: 10, step: 0.1, value: 4, fmt: v => v.toFixed(1) + " m" },
    { id: "q", label: "Process noise q (surprise in the motion)", type: "range", min: 0.05, max: 4, step: 0.05, value: 1, fmt: v => v.toFixed(2) + " m/s²" },
    { id: "filter", label: "Kalman filter on", type: "toggle", value: true },
    { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  init(S) { this.restart(S, 0); },
  reset(S) { this.restart(S, 0); },
  onParam(S, id) { if (id === "sig" || id === "q") S.st.dirty = true; },
  restart(S, ft) {
    const st = S.st;
    st.step = 0; st.ft0 = ft; st.hist = []; st.rng = S.rng(7 + Math.floor(ft * 13) % 1000); st.kal = null; st.dirty = false;
  },
  // world: 100 m × 56 m; true path is a smooth curve the filter does not know
  truth(t) { const u = t / 26; return [6 + 88 * u, 28 + 19 * Math.sin(2 * Math.PI * u * 0.85 + 0.5) + 2 * Math.sin(2 * Math.PI * u * 2.6)]; },
  layout(S) {
    const { box, narrow } = S, st = S.st;
    const WW = 100, WH = 56, top = narrow ? box.h * 0.2 : box.h * 0.27;
    const sc = Math.min(box.w * 0.96 / WW, (box.h - top - box.h * 0.14) / WH);
    const ox = box.x + (box.w - WW * sc) / 2, oy = box.y + top;
    Object.assign(st, { sc, ox, oy, WW, WH, path: [] });
    for (let i = 0; i <= 160; i++) st.path.push(this.truth((26 * i) / 160));
  },
  entry(S) { const st = S.st, p = this.truth(0); return [st.ox + p[0] * st.sc - S.iw * 3, st.oy + p[1] * st.sc]; },
  gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
  advance(S) {
    // one filter step of dt = 0.5 s world time; x and y run independent constant-velocity filters
    const st = S.st, dt = 0.25, t = st.step * dt, tr = this.truth(t), sig = S.p.sig, q = S.p.q;
    const sy = sig * 0.7; // the sensor is a little better in y than in x, so the uncertainty is an ellipse
    const z = [tr[0] + sig * this.gauss(st.rng), tr[1] + sy * this.gauss(st.rng)];
    const R = [sig * sig, sy * sy];
    let rec = { t, tr, z };
    if (!st.kal) {
      const t1 = this.truth(0.1), v0 = [(t1[0] - tr[0]) * 10, (t1[1] - tr[1]) * 10]; 
      st.kal = [0, 1].map(a => ({ x: [tr[a], v0[a]], P: [[1, 0], [0, 1]] })); // launch state is known
      rec.pred = st.kal.map(f => ({ x: f.x.slice(), P: f.P.map(r => r.slice()) })); rec.upd = rec.pred; rec.K = [1, 1];
    } else {
      const Q00 = q * q * dt ** 4 / 4, Q01 = q * q * dt ** 3 / 2, Q11 = q * q * dt * dt;
      rec.pred = []; rec.upd = []; rec.K = [];
      st.kal.forEach((f, a) => {
        const x = [f.x[0] + dt * f.x[1], f.x[1]], P = f.P;
        const p00 = P[0][0] + dt * (P[1][0] + P[0][1]) + dt * dt * P[1][1] + Q00, p01 = P[0][1] + dt * P[1][1] + Q01, p11 = P[1][1] + Q11;
        rec.pred.push({ x: x.slice(), P: [[p00, p01], [p01, p11]] });
        const Sv = p00 + R[a], K0 = p00 / Sv, K1 = p01 / Sv, y = z[a] - x[0];
        f.x = [x[0] + K0 * y, x[1] + K1 * y];
        f.P = [[(1 - K0) * p00, (1 - K0) * p01], [p01 - K1 * p00, p11 - K1 * p01]];
        rec.upd.push({ x: f.x.slice(), P: f.P.map(r => r.slice()) }); rec.K.push(K0);
      });
    }
    st.hist.push(rec); if (st.hist.length > 110) st.hist.shift();
    st.step++;
  },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, sc = st.sc;
    const W = p => [st.ox + p[0] * sc, st.oy + p[1] * sc];
    const kA = S.ease(k / 0.35), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const Ts = 0.2; // real seconds per filter step
    if (st.dirty) { st.dirty = false; this.restart(S, ft); }
    if (ft < st.ft0) this.restart(S, ft);
    let target = Math.floor((ft - st.ft0) / Ts) + 1;
    if (target - st.step > 150) { this.restart(S, ft); target = 1; }
    while (st.step < target) { this.advance(S); if (st.step > 104) { this.restart(S, ft); target = 1; } }
    const f = ((ft - st.ft0) / Ts) % 1, H = st.hist, cur = H[H.length - 1];
    const lab = Math.max(12, fs * 0.85), on = S.p.filter;
    // true path
    if (!cur) return "";
    // measurements: noisy dots, joined by a jagged raw track
    const zs = H.map(h => W(h.z));
    S.line(zs, { w: iw * 0.3, color: C.ink, alpha: 0.22 * kA });
    zs.forEach((p, i) => S.dot(p[0], p[1], iw * 0.7, C.ink, kA * (0.2 + 0.5 * (i / zs.length))));
    S.line(st.path.map(W).slice(0, Math.max(2, Math.round(st.path.length * kA))), { w: iw * 0.55, color: C.ink, dash: [iw * 1.4, iw * 1.4], alpha: 0.8 });
    // the craft itself, on the true path
    const tp = W(this.truth(cur.t + 0.25 * f)), tn = W(this.truth(cur.t + 0.25 * f + 0.3));
    const ang = Math.atan2(tn[1] - tp[1], tn[0] - tp[0]), r = iw * 3.2;
    const tri = [0, 2.4, -2.4].map(a => [tp[0] + r * Math.cos(ang + a) * (a ? 0.9 : 1.3), tp[1] + r * Math.sin(ang + a) * (a ? 0.9 : 1.3)]);
    S.line(tri, { close: true, w: iw * 0.6, color: C.ink, fill: S.mix(C.ink, C.paper, 0.75), alpha: kA });
    const lz = zs[zs.length - 1];
    const pa = W(this.truth(18.5)), pb = W(this.truth(5.5)), off = Math.min(S.p.sig, 5) * sc * 1.6 + lab;
    S.text("true path", pa[0], pa[1] + off + lab * 0.5, { size: lab, color: C.ink, alpha: kA });
    S.text("noisy measurements", pb[0], pb[1] - off, { size: lab, color: C.soft, alpha: kA });
    // the filter: estimate trail, predicted point, update, uncertainty ellipse
    let errRaw = 0, errKf = 0, n = 0;
    H.slice(-40).forEach(h => { errRaw += (h.z[0] - h.tr[0]) ** 2 + (h.z[1] - h.tr[1]) ** 2; errKf += (h.upd[0].x[0] - h.tr[0]) ** 2 + (h.upd[1].x[0] - h.tr[1]) ** 2; n++; });
    errRaw = Math.sqrt(errRaw / n); errKf = Math.sqrt(errKf / n);
    let est = null;
    if (on && kB > 0) {
      const es = H.map(h => W([h.upd[0].x[0], h.upd[1].x[0]]));
      S.line(es, { w: iw * 1.1, color: C.accent, alpha: kB });
      // within a step: predict (first half), then the measurement pulls the estimate (second half)
      const nxt = H.length > 1 ? cur : null, prev = H.length > 1 ? H[H.length - 2] : cur;
      const ph = S.ease((f - 0.45) / 0.3);
      const pe = W([cur.pred[0].x[0], cur.pred[1].x[0]]), ue = W([cur.upd[0].x[0], cur.upd[1].x[0]]);
      const pv = W([prev.upd[0].x[0], prev.upd[1].x[0]]);
      const g = S.ease(f / 0.4);
      est = f < 0.45 ? [pv[0] + (pe[0] - pv[0]) * g, pv[1] + (pe[1] - pv[1]) * g] : [pe[0] + (ue[0] - pe[0]) * ph, pe[1] + (ue[1] - pe[1]) * ph];
      const sx0 = Math.sqrt(prev.upd[0].P[0][0]), sy0 = Math.sqrt(prev.upd[1].P[0][0]);
      const sx1 = Math.sqrt(cur.pred[0].P[0][0]), sy1 = Math.sqrt(cur.pred[1].P[0][0]);
      const sx2 = Math.sqrt(cur.upd[0].P[0][0]), sy2 = Math.sqrt(cur.upd[1].P[0][0]);
      const ex = f < 0.45 ? sx0 + (sx1 - sx0) * g : sx1 + (sx2 - sx1) * ph, ey = f < 0.45 ? sy0 + (sy1 - sy0) * g : sy1 + (sy2 - sy1) * ph;
      ctx.save(); ctx.globalAlpha = kB; ctx.strokeStyle = C.accent; ctx.lineWidth = iw * 0.6; ctx.fillStyle = S.mix(C.accent, C.paper, 0.86);
      ctx.beginPath(); ctx.ellipse(est[0], est[1], Math.max(2, 2 * ex * sc), Math.max(2, 2 * ey * sc), 0, 0, Math.PI * 2); ctx.globalAlpha = kB * 0.6; ctx.fill(); ctx.globalAlpha = kB; ctx.stroke(); ctx.restore();
      if (f >= 0.45 && nxt) S.line([pe, lz], { w: iw * 0.4, color: C.accent, dash: [iw, iw], alpha: kB * 0.7 });
      S.dot(est[0], est[1], iw * 1.4, C.accent, kB);
      const above = est[1] - Math.max(2 * ey * sc, iw * 4) - lab * 0.6;
      S.text("estimate ± 2σ", est[0], above, { size: lab, color: C.accent, alpha: kB, weight: 500 });
    }
    // AI beat: many sensors fused into one estimate, the thing a robot's AI plans from
    if (on && kC > 0 && est) {
      const sensors = ["GPS", "wheels", "camera", "lidar"], y0 = S.box.y + S.box.h * (S.narrow ? 0.04 : 0.06);
      sensors.forEach((s, i) => {
        const x = S.box.x + S.box.w * (0.2 + 0.2 * i);
        S.line([[x, y0 + lab * 0.5], est], { w: iw * 0.35, color: C.accent, dash: [iw * 0.8, iw * 1.4], alpha: 0.5 * kC });
        S.text(s, x, y0, { size: lab, color: C.accent, alpha: kC, italic: false, mono: true });
      });
      const by = st.oy + st.WH * sc + lab * 2.2;
      S.text(S.narrow ? "many sensors, one estimate for the robot to plan with" : "many sensors fused into one estimate: what a robot or self-driving car plans with", S.box.x + S.box.w / 2, Math.min(by, S.box.y + S.box.h - lab * 0.3), { size: lab * (S.narrow ? 0.85 : 1), color: C.accent, alpha: kC });
    }
    const K = cur.K ? cur.K[0] : 1;
    st.K = K;
    return on ? `raw error ${errRaw.toFixed(1)} m · filter error ${errKf.toFixed(1)} m · gain K = ${K.toFixed(2)}` : `raw measurements only: error ${errRaw.toFixed(1)} m`;
  },
  code(S) {
    const sig = S.p.sig, K = S.st.K != null ? S.st.K : 0.3;
    return `${S.c("# Kalman filter, one axis (x and y run the same way)")}
σ = ${S.v(sig.toFixed(1))}; q = ${S.v(S.p.q.toFixed(2))}     ${S.c("# sensor noise, motion surprise")}

${S.c("# 1. predict: move by the velocity, grow the doubt")}
x = F @ x
P = F @ P @ F.T + Q(q)

${S.c("# 2. update: blend in the new measurement z")}
K = P[0,0] / (P[0,0] + σ**2)     ${S.c("# gain ≈ " + K.toFixed(2))}
x = x + K * (z - x[0])
P = (I - K @ H) @ P              ${S.c("# doubt shrinks")}`;
  },
});
