// Gladys West — GPS needs a model of the Earth's shape: satellites, ranges, trilateration, then the fix is
// turned into a height using a sphere, an ellipsoid or the geoid; precise positioning → drones and robots
Lineage.scene({
  params: [
    { id: "model", label: "Earth model", type: "select", value: "geoid", options: [{ value: "sphere", label: "Perfect sphere" }, { value: "ellipsoid", label: "Ellipsoid (WGS 84)" }, { value: "geoid", label: "Geoid (lumpy sea level)" }] },
    { id: "n", label: "Satellites in view", type: "range", min: 2, max: 8, step: 1, value: 5, fmt: v => String(v) },
    { id: "clock", label: "Receiver clock error", type: "range", min: 0, max: 1000, step: 10, value: 400, fmt: v => v + " ns = " + Math.round(v * 0.2998) + " m" },
    { id: "speed", label: "Signal speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  // receiver at sea level near Dahlgren, Virginia (latitude 38.3° N), where West worked
  heights() {
    const a = 6378.137, b = 6356.752, f = (38.3 * Math.PI) / 180, c = Math.cos(f), s = Math.sin(f);
    const r = Math.sqrt(((a * a * c) ** 2 + (b * b * s) ** 2) / ((a * c) ** 2 + (b * s) ** 2));
    const N = -33; // geoid lies about 33 m below the ellipsoid in this region (approximate)
    // offset of each model's surface above true sea level, in metres
    return { sphere: (6371.0 - r) * 1000 - N, ellipsoid: -N, geoid: 0 };
  },
  layout(S) {
    const { box, narrow } = S, st = S.st;
    const ew = box.w * (narrow ? 0.58 : 0.62);
    st.ew = ew;
    st.R = ew * 0.8;
    const ry = box.y + box.h * (narrow ? 0.66 : 0.74);           // receiver height on screen
    st.E = [box.x + ew * 0.5, ry + st.R * 0.93];
    st.orb = st.R + box.h * (narrow ? 0.5 : 0.53);
    st.spread = Math.min(0.95, (ew * 0.86) / st.orb);
    st.ang = -Math.PI / 2;                                       // receiver at the top of the arc
    st.inR = Math.min((box.w - ew) * 0.44, box.h * (narrow ? 0.3 : 0.24));
    st.inC = [box.x + ew + (box.w - ew) * 0.52, box.y + box.h * (narrow ? 0.42 : 0.42)];
  },
  surf(S, a) { // exaggerated Earth outline: flattened ellipse + geoid bumps
    const st = S.st, fl = 0.93, bump = 1 + 0.018 * Math.sin(a * 7 + 0.6) + 0.012 * Math.sin(a * 13);
    return [st.E[0] + st.R * Math.cos(a) * bump, st.E[1] + st.R * fl * Math.sin(a) * bump];
  },
  entry(S) { const st = S.st, p = this.surf(S, st.ang - 0.75); return [p[0] - S.iw, p[1]]; },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, lab = Math.max(12, fs * 0.82);
    const kA = S.ease(k / 0.35), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const n = Math.round(S.p.n), model = S.p.model, H = this.heights(), clockM = S.p.clock * 0.2998;
    // Earth: geoid (ink), ellipsoid and sphere guides
    const A0 = st.ang - 0.75, A1 = st.ang + 0.75, arc = f => { const p = []; for (let i = 0; i <= 90; i++) p.push(f(A0 + ((A1 - A0) * i) / 90)); return p; };
    const geo = arc(a => this.surf(S, a));
    S.line(geo.slice(0, Math.max(2, Math.round(geo.length * kA))), { w: iw * 0.9, color: C.ink });
    S.line(arc(a => [st.E[0] + st.R * Math.cos(a), st.E[1] + st.R * 0.93 * Math.sin(a)]), { w: iw * 0.4, color: C.soft, dash: [iw * 1.4, iw * 1.4], alpha: 0.8 * kA });
    S.line(arc(a => [st.E[0] + st.R * 1.025 * Math.cos(a), st.E[1] + st.R * 1.025 * Math.sin(a)]), { w: iw * 0.4, color: C.soft, dash: [iw * 0.3, iw * 1.6], alpha: 0.8 * kA });
    const rx = this.surf(S, st.ang);
    const lp = this.surf(S, st.ang);
    S.text("Earth's shape (exaggerated)", lp[0], lp[1] + lab * 4.6, { size: lab * 0.9, color: C.soft, alpha: kA });
    // satellites on an orbit (not to scale), sending signals
    const sats = [];
    for (let i = 0; i < n; i++) { const a = st.ang + (n > 1 ? (i / (n - 1) - 0.5) * st.spread : 0); sats.push([st.E[0] + st.orb * Math.cos(a), st.E[1] + st.orb * Math.sin(a)]); }
    const cyc = 4.2, ph = (ft % cyc) / cyc, solvable = n >= 3, solve = solvable ? S.ease((ph - 0.35) / 0.3) : 0;
    const infl = (S.p.clock / 1000) * st.R * 0.09 * (1 - solve);
    sats.forEach((s, i) => {
      const a = S.ease(kA * n - i * 0.6 + 0.3); if (a <= 0) return;
      const rr = Math.hypot(s[0] - rx[0], s[1] - rx[1]);
      // signal ring travelling from the satellite
      const ring = ((ft * 0.6 + i * 0.17) % 1) * rr;
      const dir = Math.atan2(rx[1] - s[1], rx[0] - s[0]);
      S.circle(s[0], s[1], ring, { w: iw * 0.35, color: C.soft, alpha: 0.5 * a * (1 - ring / rr), a0: dir - 0.35, a1: dir + 0.35 });
      // the measured range: an arc through the receiver (inflated by clock error until it is solved)
      if (kB > 0) S.circle(s[0], s[1], rr + infl, { w: iw * 0.5, color: C.ink, alpha: 0.6 * kB, a0: dir - 0.3, a1: dir + 0.3 });
      if (kB > 0) S.line([s, rx], { w: iw * 0.3, color: C.soft, alpha: 0.35 * kB });
      // satellite icon
      const sz = iw * 2.4, ang = dir + Math.PI / 2;
      const P = (u, v) => [s[0] + u * Math.cos(ang) - v * Math.sin(ang), s[1] + u * Math.sin(ang) + v * Math.cos(ang)];
      S.line([P(-sz * 0.6, -sz * 0.6), P(sz * 0.6, -sz * 0.6), P(sz * 0.6, sz * 0.6), P(-sz * 0.6, sz * 0.6)], { close: true, w: iw * 0.6, color: C.ink, fill: S.mix(C.ink, C.paper, 0.75), alpha: a });
      S.line([P(-sz * 2, 0), P(-sz * 0.6, 0)], { w: iw * 0.8, color: C.ink, alpha: a }); S.line([P(sz * 0.6, 0), P(sz * 2, 0)], { w: iw * 0.8, color: C.ink, alpha: a });
      S.line([P(-sz * 2, -sz * 0.45), P(-sz * 2, sz * 0.45)], { w: iw * 0.6, color: C.ink, alpha: a }); S.line([P(sz * 2, -sz * 0.45), P(sz * 2, sz * 0.45)], { w: iw * 0.6, color: C.ink, alpha: a });
    });
    S.text("satellites (orbit not to scale)", st.E[0], st.E[1] - st.orb - lab * 1.6, { size: lab * 0.9, color: C.soft, alpha: kA });
    // receiver
    S.dot(rx[0], rx[1], iw * 1.3, C.ink, kA);
    let status;
    if (n < 3) status = "2 ranges: two possible points, no fix";
    else if (n === 3) status = "3 + Earth model as the 4th surface";
    else status = `${n} satellites: x, y, z and clock solved`;
    if (kB > 0) {
      const t = S.p.clock > 0 && solve < 0.5 ? `clock ${S.p.clock} ns off: ranges miss` : status;
      S.text(t, rx[0], rx[1] + lab * 2.6, { size: lab, color: C.ink, alpha: kB, weight: 500 });
    }
    // zoom inset: the three surfaces at the receiver, true scale in metres
    const ic = st.inC, R = st.inR;
    const offSel = H[model], hz = n >= 4 ? 0 : n === 3 ? 0 : NaN; // receiver truly at sea level
    const rep = n >= 3 ? -offSel : NaN; // reported height above the chosen model surface
    const horiz = n === 3 ? Math.abs(offSel) * 1.4 : 0;
    st.out = { rep, horiz, offSel };
    if (kB > 0) {
      S.line([rx, [ic[0] - R * 0.98, ic[1]]], { w: iw * 0.3, color: C.soft, dash: [iw, iw * 1.4], alpha: 0.7 * kB });
      S.circle(ic[0], ic[1], R, { w: iw * 0.7, color: C.ink, alpha: kB });
      const vmax = Math.max(Math.abs(offSel) * 1.25, 40), py = m => ic[1] + R * 0.35 - (m / vmax) * R * 0.75;
      ctx.save(); ctx.beginPath(); ctx.arc(ic[0], ic[1], R - iw * 0.5, 0, Math.PI * 2); ctx.clip();
      const xs = []; for (let i = 0; i <= 40; i++) xs.push(ic[0] - R + (2 * R * i) / 40);
      const draws = [["geoid", 0, S.narrow ? "sea level" : "sea level (geoid)", []], ["ellipsoid", H.ellipsoid, "ellipsoid", [iw * 1.4, iw * 1.4]], ["sphere", H.sphere, "sphere", [iw * 0.3, iw * 1.6]]];
      draws.forEach(([id, off, name, dash]) => {
        const sel = id === model, y = py(off);
        if (y < ic[1] - R || y > ic[1] + R) return;
        S.line(xs.map((x, i) => [x, y + (id === "geoid" ? Math.sin(i * 0.5 + 1) * R * 0.025 : 0)]), { w: sel ? iw * 0.9 : iw * 0.45, color: sel ? C.ink : C.soft, dash, alpha: kB });
        if (id !== "geoid" && Math.abs(y - py(0)) < lab * 1.2) return;
        S.text(name, ic[0] - R * 0.8, y - lab * 0.45, { size: lab * 0.82, color: sel ? C.ink : C.soft, alpha: kB, align: "left" });
      });
      ctx.restore();
      [["ellipsoid", H.ellipsoid], ["sphere", H.sphere]].forEach(([id, off], j) => {
        if (py(off) < ic[1] - R) S.text(`${id} ${Math.round(off).toLocaleString("en-AU")} m higher ↑`, ic[0], ic[1] - R - lab * (0.5 + 1.2 * j), { size: lab * 0.82, color: C.soft, alpha: kB });
      });
      S.dot(ic[0], py(0), iw * 1.2, C.ink, kB);
      // AI beat: a drone hovering 10 m above the water believes it is at 10 m minus the model's error
      if (kC > 0 && n >= 3) {
        const dy = Math.min(py(10), py(0) - R * 0.16), dxp = ic[0] + R * 0.5, w = R * 0.16, bob = Math.sin(ft * 2.2) * R * 0.015;
        S.line([[dxp - w, dy + bob], [dxp + w, dy + bob]], { w: iw * 0.8, color: C.accent, alpha: kC });
        [-1, 1].forEach(sg => S.line([[dxp + sg * w - w * 0.35, dy - w * 0.25 + bob], [dxp + sg * w + w * 0.35, dy - w * 0.25 + bob]], { w: iw * 0.6, color: C.accent, alpha: kC }));
        S.line([[dxp, dy + bob], [dxp, py(0)]], { w: iw * 0.35, color: C.accent, dash: [iw * 0.8, iw], alpha: kC * 0.8 });
        const thinks = 10 - offSel;
        const verdict = Math.abs(offSel) < 1 ? "right" : thinks < 0 ? "underwater!" : "off";
        const t1 = `drone thinks it is at ${Math.round(thinks).toLocaleString("en-AU")} m`;
        if (S.narrow) {
          S.text("drone thinks it is at", ic[0], ic[1] + R + lab * 1.3, { size: lab * 0.9, color: C.accent, alpha: kC });
          S.text(`${Math.round(thinks).toLocaleString("en-AU")} m: ${verdict}`, ic[0], ic[1] + R + lab * 2.45, { size: lab, color: C.accent, alpha: kC, weight: 500 });
        } else {
          S.text(`${t1}: ${verdict}`, ic[0], ic[1] + R + lab * 1.4, { size: lab * 0.95, color: C.accent, alpha: kC, weight: 500 });
          S.text("robots and drones need metres, not kilometres", ic[0], ic[1] + R + lab * 2.7, { size: lab * 0.85, color: C.accent, alpha: kC });
        }
      }
    }
    if (n < 3) return `${n} satellites: not enough for a fix`;
    return `${model} model · height above sea level reported ${(Math.round(rep) || 0).toLocaleString("en-AU")} m (true 0 m)` + (n === 3 ? ` · position off by about ${Math.round(horiz).toLocaleString("en-AU")} m` : ` · clock error ${S.p.clock} ns solved`);
  },
  code(S) {
    const H = this.heights(), n = Math.round(S.p.n), m = S.p.model;
    return `${S.c("# GPS: each satellite's signal gives a range")}
c = 299_792_458                   ${S.c("# m/s")}
ranges = [c * (t_rx - t_tx) for sat in sats]   ${S.c("# " + n + " satellites")}
${S.c("# a clock off by " + S.p.clock + " ns adds " + Math.round(S.p.clock * 0.2998) + " m to every range")}

${S.c("# 4 unknowns: x, y, z and the clock error b")}
x, y, z, b = solve(|p - sat_i| + c*b == ranges[i])

model = ${S.v('"' + m + '"')}
h = height_above(model, (x, y, z))
${S.c("# sphere " + Math.round(-H.sphere).toLocaleString("en-AU") + " m · ellipsoid " + Math.round(-H.ellipsoid) + " m · geoid 0 m")}`;
  },
});
