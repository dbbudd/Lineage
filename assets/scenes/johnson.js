// Katherine Johnson — an orbit and re-entry computed step by step (Euler's method); big steps drift, small steps track.
// Glenn asked her to check the electronic computer's numbers → checking AI outputs independently.
(function () {
  const R0 = 1.25, V0 = Math.sqrt(1 / R0) * 1.03, A0 = Math.PI * 0.95, DV = 0.65, PER = 2 * Math.PI * Math.pow(R0, 1.5), TMAX = 26;
  const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [-x / r3, -y / r3]; };
  // integrate; method 'euler' with step h, or 'rk4'. Burn when the swept angle passes burnDeg.
  function fly(h, burnDeg, method) {
    let x = R0 * Math.cos(A0), y = R0 * Math.sin(A0), vx = -V0 * Math.sin(A0), vy = V0 * Math.cos(A0), t = 0, swept = 0, burnt = false;
    const pts = [[x, y, t]]; let burnAt = null, splash = null, prevA = Math.atan2(y, x);
    const f = (s) => { const a = acc(s[0], s[1]); return [s[2], s[3], a[0], a[1]]; };
    while (t < TMAX) {
      if (method === "euler") {
        const a = acc(x, y); x += vx * h; y += vy * h; vx += a[0] * h; vy += a[1] * h;
      } else {
        const s = [x, y, vx, vy], k1 = f(s), k2 = f(s.map((v, i) => v + k1[i] * h / 2)), k3 = f(s.map((v, i) => v + k2[i] * h / 2)), k4 = f(s.map((v, i) => v + k3[i] * h));
        [x, y, vx, vy] = s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      }
      t += h;
      const a = Math.atan2(y, x); let da = a - prevA; if (da < -Math.PI) da += 2 * Math.PI; if (da > Math.PI) da -= 2 * Math.PI; swept += da; prevA = a;
      if (!burnt && swept * 180 / Math.PI >= burnDeg) { burnt = true; vx *= DV; vy *= DV; burnAt = [x, y]; }
      const r = Math.hypot(x, y);
      if (r <= 1) { const s = 1 / r; splash = [x * s, y * s, a]; pts.push([x * s, y * s, t]); break; }
      if (r > 3) break;
      pts.push([x, y, t]);
    }
    return { pts, burnAt, splash, T: t };
  }

  Lineage.scene({
    params: [
      { id: "lg", label: "Steps per orbit (smaller steps →)", type: "range", min: 1.4, max: 4.4, step: 0.02, value: 4, fmt: v => Math.round(Math.pow(10, v)).toLocaleString("en-AU") },
      { id: "burn", label: "Retro-rocket burn at", type: "range", min: 150, max: 330, step: 1, value: 250, fmt: v => v + "° round the orbit" },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { this.sim(S); },
    onParam(S, id) { if (id !== "speed") this.sim(S, id === "burn"); },
    sim(S, full = true) {
      const st = S.st;
      S.p.h = PER / Math.round(Math.pow(10, S.p.lg));
      st.E = fly(S.p.h, S.p.burn, "euler");
      if (full || !st.T) st.T = fly(0.004, S.p.burn, "rk4");
      st.miss = st.E.splash && st.T.splash ? Math.round(Math.abs(Math.atan2(Math.sin(st.E.splash[2] - st.T.splash[2]), Math.cos(st.E.splash[2] - st.T.splash[2]))) * 6371) : null;
      // values to compare at three check times
      const at = (P, t) => { for (let i = 1; i < P.pts.length; i++) if (P.pts[i][2] >= t) return Math.hypot(P.pts[i][0], P.pts[i][1]); return null; };
      st.checks = [2, 3, 4].map(t => ({ t, m: at(st.T, t), hnd: at(st.E, t) }));
      st.ref = st.T; st.t0 = null;
    },
    layout(S) {
      const b = S.box, st = S.st, wide = b.w / b.h > 1.15;
      st.wide = wide;
      if (!wide) { st.Re = Math.min(b.w * 0.2, b.h * 0.19); st.c = [b.x + b.w * 0.42, b.y + b.h * 0.33]; st.pn = { x: b.x + b.w * 0.04, y: b.y + b.h * 0.68, w: b.w * 0.94, h: b.h * 0.3 }; }
      else { st.Re = Math.min(b.w * 0.13, b.h * 0.24); st.c = [b.x + b.w * 0.22, b.y + b.h * 0.52]; st.pn = { x: b.x + b.w * 0.47, y: b.y + b.h * 0.04, w: b.w * 0.53, h: b.h * 0.94 }; }
    },
    entry(S) { const { c, Re } = S.st; return [c[0] - Re * 1.45, c[1]]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, Re = st.Re, [cx, cy] = st.c, wide = st.wide;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.6) / 0.4);
      const P = p => [cx + p[0] * Re, cy - p[1] * Re];
      // ---- Earth, atmosphere, true path ----
      S.circle(cx, cy, Re, { color: C.ink, w: iw * 0.8, alpha: k1, a1: Math.PI * 2 * k1 });
      S.circle(cx, cy, Re * 1.06, { color: C.soft, w: iw * 0.3, alpha: 0.6 * k1, dash: [2, 4] });
      S.text("Earth", cx, cy + fs * 0.3, { size: fs * 0.9, color: C.soft, alpha: k1 });
      const tp = st.T.pts, tpx = []; for (let i = 0; i < tp.length; i += 6) tpx.push(P(tp[i])); tpx.push(P(tp[tp.length - 1]));
      S.line(tpx.slice(0, Math.max(2, Math.round(tpx.length * k1))), { color: C.soft, w: iw * 0.45, dash: [iw * 1.2, iw * 1.5], alpha: k1 });
      if (k1 > 0.9 && !wide) {
        const q = tp[Math.floor(tp.length * 0.42)], rr = Math.hypot(q[0], q[1]), lp = P([q[0] / rr * (rr + 0.12), q[1] / rr * (rr + 0.12)]);
        S.text("true path (tiny steps)", lp[0], lp[1], { size: fs * 0.8, color: C.soft, align: "left", alpha: k1 });
      }
      const L0 = P(tp[0]); S.dot(L0[0], L0[1], iw * 0.8, C.ink, k1);
      if (!wide) S.text("orbit insertion", L0[0] - fs * 0.5, L0[1] + fs * 0.4, { size: fs * 0.75, color: C.soft, align: "right", alpha: k1 });
      // target splashdown (true)
      if (st.T.splash) {
        const sp = P(st.T.splash), o = [cx + (sp[0] - cx) * 1.12, cy + (sp[1] - cy) * 1.12];
        S.line([sp, o], { color: C.accent, w: iw * 0.7, alpha: k1 });
        S.circle(sp[0], sp[1], iw * 1.4, { color: C.accent, w: iw * 0.6, alpha: k1 });
        const o2 = [cx + (sp[0] - cx) * 1.25, cy + (sp[1] - cy) * 1.25];
        S.text("target", o2[0], o2[1] + fs * 0.3, { size: fs * 0.8, color: C.accent, alpha: k1 });
      }
      // ---- beat 2: Euler's method, step by step ----
      const E = st.E, ep = E.pts;
      if (st.t0 == null) st.t0 = ft;
      const cyc = E.T / 2.6 + 1.6, tt = (((ft - st.t0) / cyc) % 1) * (E.T / 2.6 + 1.6) * 2.6;
      let n = 0; while (n < ep.length - 1 && ep[n + 1][2] <= tt) n++;
      if (k2 > 0) {
        const path = ep.slice(0, n + 1).map(P);
        S.line(path, { color: C.ink, w: iw * 0.8, alpha: k2 });
        const every = Math.max(1, Math.round(0.15 / S.p.h));
        for (let i = 0; i <= n; i += every) { const q = P(ep[i]); S.dot(q[0], q[1], iw * 0.55, C.ink, k2); }
        if (E.burnAt && tt > 0) {
          const bi = ep.findIndex(p => p[0] === E.burnAt[0] && p[1] === E.burnAt[1]);
          if (bi >= 0 && bi <= n) { const q = P(E.burnAt); S.circle(q[0], q[1], iw * 2, { color: C.ink, w: iw * 0.5, alpha: k2 }); if (!wide) S.text("retro burn", q[0] + fs * 0.6, q[1] + fs * 0.35, { size: fs * 0.8, color: C.ink, align: "left", alpha: k2 }); }
        }
        const cap = P(ep[n]);
        S.circle(cap[0], cap[1], iw * 1.5, { color: C.ink, w: iw * 0.7, fill: C.paper, alpha: k2 });
        if (n === ep.length - 1 && E.splash) {
          const s = 1.12, sp = P(E.splash), o = [cx + (sp[0] - cx) * s, cy + (sp[1] - cy) * s];
          S.line([[sp[0] - iw * 2, sp[1] - iw * 2], [sp[0] + iw * 2, sp[1] + iw * 2]], { color: C.ink, w: iw * 0.7 });
          S.line([[sp[0] - iw * 2, sp[1] + iw * 2], [sp[0] + iw * 2, sp[1] - iw * 2]], { color: C.ink, w: iw * 0.7 });
          if (st.miss > 150) S.text("splash", o[0], o[1] + fs * 0.3, { size: fs * 0.8, color: C.ink, alpha: k2 });
        }
        if (!E.splash && n === ep.length - 1) S.text("misses: never comes down", cap[0], cap[1] - fs, { size: fs * 0.8, color: C.ink, alpha: k2 });
        S.text(`Euler, ${Math.round(Math.pow(10, S.p.lg))} steps per orbit`, cx, wide ? cy + Re * 1.7 + fs * 0.9 : cy - Re * 1.75 - fs * 0.2, { size: fs * 0.9, color: C.ink, alpha: k2 });
      }
      // ---- beat 3: checking the machine ----
      const pn = st.pn;
      if (k3 > 0) {
        const sz = fs * (wide ? 0.8 : 0.85), lh = sz * 1.55;
        let y = pn.y + sz;
        const colM = pn.x + pn.w * (wide ? 0.52 : 0.42), colH = pn.x + pn.w * (wide ? 0.84 : 0.68), colT = pn.x + pn.w * (wide ? 0.97 : 0.8);
        S.text(wide ? "1962: Glenn asked her" : "1962: Glenn asked her to check the computer", pn.x, y, { size: sz, color: C.accent, align: "left", alpha: k3 });
        y += lh;
        S.text(wide ? "t" : "time", pn.x, y, { size: sz * 0.9, color: C.soft, align: "left", alpha: k3 });
        S.text(wide ? "IBM" : "IBM computer", colM, y, { size: sz * 0.9, color: C.soft, align: "right", alpha: k3 });
        S.text(wide ? "hand" : "by hand (your steps)", colH, y, { size: sz * 0.9, color: C.soft, align: "right", alpha: k3 });
        let allOk = true;
        st.checks.forEach((c, i) => {
          y += lh;
          const a = c.m == null ? "—" : c.m.toFixed(3), b = c.hnd == null ? "—" : c.hnd.toFixed(3), ok = c.m != null && c.hnd != null && Math.abs(c.m - c.hnd) < 0.005 * c.m; allOk = allOk && ok;
          S.text(wide ? String(c.t) : "t = " + c.t, pn.x, y, { size: sz, mono: true, italic: false, color: C.ink, align: "left", alpha: k3 });
          S.text(a, colM, y, { size: sz, mono: true, italic: false, color: C.ink, align: "right", alpha: k3 });
          S.text(b, colH, y, { size: sz, mono: true, italic: false, color: ok ? C.ink : C.accent, align: "right", alpha: k3 });
          S.text(ok ? "✓" : "✗", colT, y, { size: sz * 1.1, italic: false, color: C.accent, weight: 600, alpha: k3 });
        });
        y += lh * 1.3;
        S.text(allOk ? (wide ? "match: “ready to go”" : "numbers match: “then I'm ready to go”") : (wide ? "no match: find out why" : "numbers disagree: find out why first"), pn.x, y, { size: sz, color: C.ink, align: "left", alpha: k3 });
        y += lh * 1.2;
        S.text(wide ? "check AI answers too" : "AI answers need the same independent check", pn.x, y, { size: sz, color: C.accent, weight: 600, align: "left", alpha: k3 });
      }
      const miss = st.miss;
      const spo = Math.round(Math.pow(10, S.p.lg)).toLocaleString("en-AU");
      return E.splash ? `${spo} steps per orbit · ${(ep.length - 1).toLocaleString("en-AU")} steps · splashdown ${miss} km from the true target (toy model)` : `${spo} steps per orbit · Euler drift is so large the capsule never re-enters`;
    },
    code(S) {
      const st = S.st;
      return `${S.c("# Euler's method: one small step at a time")}
h = period / ${S.v(Math.round(Math.pow(10, S.p.lg)))}      ${S.c("# time per step")}
while r > R_earth:
    ax, ay = -G*M*x / r**3, -G*M*y / r**3
    x,  y  = x + vx*h,  y + vy*h
    vx, vy = vx + ax*h, vy + ay*h
    if angle_flown >= ${S.v(S.p.burn)}:        ${S.c("# fire retro-rockets once")}
        vx, vy = 0.65*vx, 0.65*vy
${S.c("# " + (st.E.pts.length - 1) + " steps; " + (st.miss != null ? "lands " + st.miss + " km from target" : "never lands"))}`;
    },
  });
})();
