// Elon Musk (Joker) — a reusable booster landing ("hoverslam"): thrust > weight even at low throttle, so the engine
// must light at just the right height to reach zero speed at the deck → automated guidance solving the burn
Lineage.scene({
  params: [
    { id: "ign", label: "Engine ignition altitude", type: "range", min: 400, max: 3800, step: 10, value: 2200, fmt: v => v.toLocaleString("en-AU") + " m" },
    { id: "thr", label: "Throttle (guidance trims ±15%)", type: "range", min: 55, max: 100, step: 1, value: 75, fmt: v => v + "%" },
    { id: "wind", label: "Crosswind", type: "range", min: 0, max: 25, step: 1, value: 8, fmt: v => v + " m/s" },
    { id: "speed", label: "Playback speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "Launch again", run(S) { S.st.restart = true; } }],
  K: { g: 9.81, vt: 280, dry: 25600, fuel: 6000, T: 845e3, isp: 282, h0: 4000, v0: -260, deck: 26 },
  fresh() { const K = this.K; return { t: 0, h: K.h0, v: K.v0, fuel: K.fuel, x: 0, vx: 0, on: false, lit: false, end: null, trace: [[K.h0, -K.v0]], hold: 0, cut: null }; },
  step(s, p, dt, trim = true) {
    const K = this.K, m = K.dry + s.fuel, set = p.thr / 100;
    if (!s.lit && s.h <= p.ign && s.fuel > 0) { s.on = true; s.lit = true; s.ignH = s.h; }
    if (s.on && s.fuel <= 0) { s.on = false; s.cut = "fuel ran out"; }
    const drag = (s.v < 0 ? 1 : -1) * K.g * (s.v / K.vt) ** 2;
    let a = -K.g + drag, thr = set;
    if (s.on) {
      if (trim) { // guidance: trim the throttle (±15%) to follow the curve that stops exactly at the deck
        const need = Math.max(0, s.v * s.v - 1) / (2 * Math.max(s.h, 0.5)) + K.g - drag;
        thr = Math.max(Math.max(0.4, set - 0.15), Math.min(Math.min(1, set + 0.15), (need * m) / K.T));
      }
      a += (K.T * thr) / m; s.fuel = Math.max(0, s.fuel - ((K.T * thr) / (K.isp * 9.81)) * dt);
    }
    s.thr = s.on ? thr : 0;
    s.v += a * dt; s.h += s.v * dt;
    if (s.on && s.v >= 0) { s.on = false; s.cut = `stopped at ${Math.round(s.h)} m, then fell`; } // it cannot hover, so the engine shuts down
    // sideways: the wind pushes it; with the engine lit, gimbal steering pulls it back over the deck
    const ax = s.on ? Math.max(-1.6, Math.min(1.6, -0.05 * s.x - 0.45 * s.vx)) : (0.9 * p.wind - s.vx) * 0.15;
    s.vx += ax * dt; s.x += s.vx * dt;
    s.t += dt; s.a = a;
  },
  run(p, trim = false) { const s = this.fresh(); for (let i = 0; i < 6000 && s.h > 0; i++) this.step(s, p, 0.01, trim); return s; },
  ideal(p) { // the guidance computer: the latest ignition that still lands softly (latest = least fuel burned)
    let lo = 200, hi = 4000;
    for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2, s = this.run({ ...p, ign: mid }, true); if (this.outcome(s, true).ok || (s.cut && s.cut.startsWith("stopped"))) hi = mid; else lo = mid; }
    return Math.min(4000, hi + 15);
  },
  init(S) { S.st.sim = this.fresh(); S.st.best = this.ideal({ ...S.p }); },
  reset(S) { S.st.sim = this.fresh(); },
  onParam(S, id) { if (id !== "speed") { S.st.best = this.ideal({ ...S.p }); S.st.restart = true; } },
  layout(S) {
    const { box, narrow } = S, st = S.st;
    st.lw = box.w * (narrow ? 0.46 : 0.46);
    st.ax = box.x + box.w * 0.08;                       // altitude axis
    st.gy = box.y + box.h * 0.88;                        // sea level
    st.ty = box.y + box.h * 0.08;                        // 4000 m
    st.sx = box.x + st.lw * 0.62;                        // droneship centre
    st.bh = box.h * 0.17;                                // booster icon height (not to scale)
    st.px = box.x + st.lw + box.w * 0.06; st.pw = box.x + box.w - st.px;
  },
  entry(S) { const st = S.st; return S.narrow ? [S.box.x + st.lw, st.gy + S.iw * 1.2] : [st.ax - S.iw * 2, st.gy]; },
  outcome(s, noX) {
    const sp = Math.abs(s.v);
    if (!noX && Math.abs(s.x) > this.K.deck) return { ok: false, msg: `missed the droneship by ${Math.round(Math.abs(s.x) - this.K.deck)} m` };
    if (s.cut && s.cut.startsWith("stopped")) return { ok: false, msg: s.cut + ` · hit at ${sp.toFixed(0)} m/s` };
    if (sp <= 3) return { ok: true, msg: `landed at ${sp.toFixed(1)} m/s` };
    if (sp <= 8) return { ok: false, msg: `hard landing at ${sp.toFixed(1)} m/s` };
    return { ok: false, msg: `crashed at ${sp.toFixed(0)} m/s` + (s.cut === "fuel ran out" ? " (fuel ran out)" : !s.lit ? " (engine never lit)" : "") };
  },
  draw(S, k, ft, dt) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, K = this.K, lab = Math.max(12, fs * 0.8), box = S.box;
    const kA = S.ease(k / 0.3), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    if (st.restart || !st.sim) { st.sim = this.fresh(); st.restart = false; }
    const s = st.sim, sp = S.p.speed ?? 1;
    if (!s.end && k > 0.05) { let n = Math.round((dt * sp * 1.6) / 0.01); while (n-- > 0 && s.h > 0) { this.step(s, S.p, 0.01); if (Math.round(s.t * 100) % 10 === 0) s.trace.push([Math.max(0, s.h), -s.v]); } if (s.h <= 0) { s.h = 0; s.end = this.outcome(s); s.on = false; } }
    else if (s.end) { s.hold += dt; if (s.hold > 4.5 && sp > 0) st.restart = true; }
    const Y = h => st.gy - (h / K.h0) * (st.gy - st.ty);
    // altitude axis and the ignition marker
    S.line([[st.ax, st.gy], [st.ax, st.ty]], { w: iw * 0.45, color: C.soft, alpha: kA });
    for (let h = 0; h <= 4000; h += 1000) { S.line([[st.ax - iw * 1.5, Y(h)], [st.ax, Y(h)]], { w: iw * 0.45, color: C.soft, alpha: kA }); S.text(h ? h / 1000 + " km" : "0", st.ax - iw * 2.4, Y(h) + lab * 0.35, { size: lab * 0.8, color: C.soft, align: "right", alpha: kA, italic: false, mono: true }); }
    const yi = Y(S.p.ign);
    S.line([[st.ax, yi], [st.sx - st.lw * 0.25, yi]], { w: iw * 0.4, color: C.ink, dash: [iw, iw * 1.3], alpha: 0.7 * kA });
    S.text("ignite", st.ax + iw * 2, yi - lab * 0.4, { size: lab * 0.85, color: C.ink, align: "left", alpha: kA });
    if (kC > 0) {
      const yb = Y(st.best);
      S.line([[st.ax - iw * 2.2, yb], [st.ax + iw * 2.2, yb]], { w: iw * 1.1, color: C.accent, alpha: kC });
      S.text("guidance", st.ax + iw * 2, yb + lab * 1.05, { size: lab * 0.85, color: C.accent, align: "left", alpha: kC, weight: 500 });
    }
    // sea and droneship
    const sw = st.lw * 0.42, ppm = sw / 52, wave = ft * 1.5;
    const sea = []; for (let i = 0; i <= 40; i++) { const x = st.ax + ((box.x + st.lw - st.ax) * i) / 40; sea.push([x, st.gy + iw * 1.2 + Math.sin(i * 0.9 + wave) * iw * 0.5]); }
    S.line(sea, { w: iw * 0.45, color: C.soft, alpha: kA });
    const rock = Math.sin(wave * 0.6) * 0.012, sh = (u, v) => [st.sx + u * Math.cos(rock) - v * Math.sin(rock), st.gy + u * Math.sin(rock) + v * Math.cos(rock)];
    S.line([sh(-sw / 2, 0), sh(sw / 2, 0), sh(sw * 0.44, iw * 3), sh(-sw * 0.44, iw * 3)], { close: true, w: iw * 0.7, color: C.ink, fill: S.mix(C.ink, C.paper, 0.85), alpha: kA });
    S.text("droneship", st.sx, st.gy + iw * 3 + lab * 1.3, { size: lab * 0.85, color: C.soft, alpha: kA });
    // the booster (icon not to scale), flipping from its coast to upright
    const flip = Math.max(0, 1 - s.t / 3.5), ang = (S.ease(flip) * Math.PI) / 2 * 0.95;
    const bx = st.sx + Math.max(-sw * 0.85, Math.min(sw * 0.85, s.x * ppm)), by = Y(s.h), bh = st.bh, bw = Math.max(5, bh * 0.085);
    const R = (u, v) => [bx + u * Math.cos(ang) + v * Math.sin(ang), by - bh * 0.02 + (-u * Math.sin(ang) + v * Math.cos(ang))]; // v up = negative
    const crashed = s.end && !s.end.ok;
    if (kA > 0 && !crashed) {
      S.line([R(-bw / 2, 0), R(bw / 2, 0), R(bw / 2, -bh), R(-bw / 2, -bh)], { close: true, w: iw * 0.6, color: C.ink, fill: C.paper, alpha: kA });
      S.line([R(-bw / 2, -bh * 0.88), R(bw / 2, -bh * 0.88)], { w: iw * 0.5, color: C.ink, alpha: kA });
      [-1, 1].forEach(sg => S.line([R(sg * bw / 2, -bh * 0.94), R(sg * bw * 1.2, -bh * 0.94)], { w: iw * 0.7, color: C.ink, alpha: kA })); // grid fins
      if (s.h < 600 || s.end) { const lg = Math.min(1, (600 - s.h) / 300 || 1); [-1, 1].forEach(sg => S.line([R(sg * bw / 2, -bh * 0.2), R(sg * (bw / 2 + bh * 0.16 * lg), bh * 0.01)], { w: iw * 0.6, color: C.ink, alpha: kA })); }
      if (s.on) { const fl = bh * (0.12 + 0.28 * (S.p.thr / 100)) * (0.85 + 0.15 * Math.sin(ft * 40)); S.line([R(-bw * 0.4, 0), R(0, fl), R(bw * 0.4, 0)], { w: iw * 0.6, color: C.ink, fill: S.mix(C.accent, C.paper, 0.6), alpha: kA }); }
    }
    if (crashed) { for (let i = 0; i < 9; i++) { const a = -Math.PI * (i / 8); S.line([[bx + Math.cos(a) * bw, st.gy - iw * 2 + Math.sin(a) * bw], [bx + Math.cos(a) * bw * 3, st.gy - iw * 2 + Math.sin(a) * bw * 3]], { w: iw * 0.6, color: C.ink }); } }
    if (s.end) S.text(s.end.ok ? "landed" : "lost", bx, Y(0) - bh - lab * 0.8, { size: lab * 1.1, color: s.end.ok ? C.accent : C.ink, weight: 500 });
    // readouts and the hoverslam plot: speed against altitude
    const px = st.px, pw = st.pw, m = K.dry + s.fuel, tw = (K.T * (s.on ? s.thr : S.p.thr / 100)) / (m * K.g);
    if (kA > 0) {
      const ry = box.y + lab * 1.2, rl = lab * 1.35;
      S.text(`altitude ${Math.round(s.h).toLocaleString("en-AU")} m`, px, ry, { size: lab, align: "left", alpha: kA, italic: false, mono: true });
      S.text(`speed ${Math.abs(s.v).toFixed(0)} m/s ${s.v < -0.5 ? "↓" : s.v > 0.5 ? "↑" : ""}`, px, ry + rl, { size: lab, align: "left", alpha: kA, italic: false, mono: true });
      S.text(`thrust ÷ weight ${tw.toFixed(2)}`, px, ry + rl * 2, { size: lab, align: "left", alpha: kA, italic: false, mono: true });
      const fy = ry + rl * 2.6, fw = pw * 0.6;
      S.rect(px, fy, fw, lab * 0.6, { w: iw * 0.4, color: C.ink, alpha: kA });
      S.rect(px, fy, fw * (s.fuel / K.fuel), lab * 0.6, { w: 0, fill: S.mix(C.ink, C.paper, 0.55), alpha: kA });
      S.text("fuel", px + fw + lab * 0.4, fy + lab * 0.55, { size: lab * 0.85, align: "left", alpha: kA, color: C.soft });
      st.plotTop = fy + lab * 2.4;
    }
    if (kB > 0) {
      const x0 = px + lab * 0.6, y1 = st.plotTop + lab * 0.6, y0 = Math.min(st.gy, box.y + box.h - lab * 2.2), w = pw - lab * 1.2, vmax = 300;
      const P = (h, v) => [x0 + (h / K.h0) * w, y0 - (Math.min(v, vmax) / vmax) * (y0 - y1)];
      S.line([[x0, y1], [x0, y0], [x0 + w, y0]], { w: iw * 0.45, color: C.soft, alpha: kB });
      S.text("speed", x0 + lab * 0.3, y1 + lab * 0.2, { size: lab * 0.8, color: C.soft, align: "left", alpha: kB });
      S.text("altitude →", x0 + w, y0 + lab * 1.2, { size: lab * 0.8, color: C.soft, align: "right", alpha: kB });
      S.line(s.trace.map(q => P(q[0], q[1])), { w: iw * 0.8, color: C.ink, alpha: kB });
      const ip = P(S.p.ign, 0); S.line([[ip[0], y0], [ip[0], y0 - iw * 2]], { w: iw * 0.6, color: C.ink, alpha: kB });
      if (kC > 0) { // the burn the guidance computer would fly: the stopping curve that ends at zero speed on the deck
        const g = this.fresh(); const pts = []; const pp = { ...S.p, ign: st.best };
        if (!st.bestTrace || st.bestKey !== st.best + "|" + S.p.thr) { const tr = []; for (let i = 0; i < 6000 && g.h > 0; i++) { this.step(g, pp, 0.01, true); if (i % 10 === 0) tr.push([Math.max(0, g.h), -g.v]); } st.bestTrace = tr; st.bestKey = st.best + "|" + S.p.thr; }
        st.bestTrace.forEach(q => pts.push(P(q[0], q[1])));
        S.line(pts, { w: iw * 0.6, color: C.accent, dash: [iw * 1.2, iw * 1.1], alpha: kC });
        S.text(S.narrow ? "guidance" : "automated guidance's burn", P(st.best, 0)[0] + lab * 0.3, y0 - lab * 0.5, { size: lab * 0.85, color: C.accent, align: "left", alpha: kC });
      }
    }
    const status = s.end ? s.end.msg : s.on ? "engine burning: can't hover, must reach zero at the deck" : s.lit ? s.cut : s.t < 3.5 ? "flipping to land" : "falling";
    return `${status} · computer's ignition point ${Math.round(st.best).toLocaleString("en-AU")} m`;
  },
  code(S) {
    const K = this.K, m = K.dry + K.fuel, a = (K.T * S.p.thr) / 100 / m - K.g;
    return `${S.c("# hoverslam: thrust beats weight, so it cannot hover")}
throttle = ${S.v(S.p.thr + "%")}
a_burn = thrust * throttle / m - g    ${S.c("# " + a.toFixed(1) + " m/s² of braking")}

while h > 0:
    if h <= ${S.v(S.p.ign)}: engine_on()
    a = drag(v) - g + (thrust * throttle / m if engine else 0)
    v += a * dt;  h += v * dt
    if engine and v >= 0: engine_off()    ${S.c("# stopped too high")}

${S.c("# guidance solves for the ignition height: " + Math.round(S.st.best || 0) + " m")}`;
  },
});
