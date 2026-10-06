// Isaac Newton — the apple he points at, fired from the cannon on the mountain (Principia, "A Treatise of the System of the World")
// → falling around the Earth: v += a·dt with a = −GM r/|r|³ → the same update is gradient descent with momentum
Lineage.scene({
  params: [
    { id: "v", label: "Launch speed", type: "range", min: 3, max: 13, step: 0.1, value: 7.9, fmt: v => v.toFixed(1) + " km/s" },
    { id: "g", label: "Gravity strength", type: "range", min: 0.5, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "× Earth" },
    { id: "speed", label: "Time speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  // physics units: mountain-top radius = 1, circular speed there at g = 1 is 1 (= 7.9 km/s), GM = g
  sim(S, v, g, tmax) {
    const R = S.st.R, h = 0.004, pts = [[0, 1]];
    let x = 0, y = 1, vx = v, vy = 0, t = 0, end = "orbit", n = 0;
    while (t < tmax) {
      const r = Math.hypot(x, y), a = -g / (r * r * r);
      vx += a * x * h; vy += a * y * h; x += vx * h; y += vy * h; t += h;
      if (++n % 4 === 0) pts.push([x, y]);
      const rr = Math.hypot(x, y);
      if (rr < R) { const f = R / rr; pts.push([x * f, y * f]); end = "falls"; break; }
      if (rr > 3.2) { end = "escapes"; break; }
    }
    return { pts, end };
  },
  fate(v, g, R) {
    const u = v / 7.9;
    if (u * u >= 2 * g - 1e-9) return "escapes";
    const r2 = (u * u) / (2 * g - u * u);
    return r2 < R ? "falls" : Math.abs(u * u - g) < 0.02 * g ? "circle" : "orbit";
  },
  ghosts(S) {
    const g = S.p.g;
    S.st.gh = [4, 5.6, 6.8].map(kms => ({ kms, ...this.sim(S, kms / 7.9, g, 7) }));
    S.st.orbitGhost = this.sim(S, Math.sqrt(g), g, 2 * Math.PI + 0.05);
  },
  fire(S) {
    const u = S.p.v / 7.9;
    S.st.shot = { x: 0, y: 1, vx: u, vy: 0, t: 0, trail: [[0, 1]], n: 0, done: null, hold: 0, ang: 0 };
  },
  // Newton's apple: outline dimpled at the top, stem and leaf (same shape as the card's glyph)
  apple(S, x, y, s, o = {}) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = -Math.PI / 2 + (2 * Math.PI * i) / 60;
      const r = s * (1 - 0.24 * Math.exp(-(((t + Math.PI / 2) / 0.32) ** 2)) - 0.07 * Math.exp(-(((t - Math.PI / 2) / 0.3) ** 2)) - 0.24 * Math.exp(-(((t - 1.5 * Math.PI) / 0.32) ** 2)));
      pts.push([x + r * Math.cos(t) * 1.06, y + r * Math.sin(t)]);
    }
    const col = o.color || S.C.accent, w = o.w ?? S.iw, a = o.alpha;
    S.line(pts, { w, color: col, alpha: a, close: true, fill: o.fill || S.C.paper });
    const tx = x, ty = y - s * 0.76;
    S.line([[tx, ty], [tx + s * 0.05, ty - s * 0.35], [tx + s * 0.2, ty - s * 0.62]], { w: w * 0.9, color: col, alpha: a });
    const ax = tx + s * 0.18, ay = ty - s * 0.3, bx = tx + s * 1.05, by = ty - s * 0.72, leaf = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; leaf.push([ax + (bx - ax) * u, ay + (by - ay) * u - s * 0.28 * Math.sin(Math.PI * u)]); }
    for (let i = 12; i >= 0; i--) { const u = i / 12; leaf.push([ax + (bx - ax) * u, ay + (by - ay) * u + s * 0.16 * Math.sin(Math.PI * u)]); }
    S.line(leaf, { w: w * 0.8, color: col, alpha: a, close: true });
  },
  init(S) { S.st.R = 0.66; this.ghosts(S); this.fire(S); S.st.gd = { w: -1.15, m: 0, hist: [], acc: 0, wait: 0 }; },
  reset(S) { this.fire(S); S.st.gd = { w: -1.15, m: 0, hist: [], acc: 0, wait: 0 }; },
  onParam(S, id) { if (id === "g") this.ghosts(S); if (id !== "speed") { this.fire(S); S.st.gd = { w: -1.15, m: 0, hist: [], acc: 0, wait: 0 }; } },
  layout(S) {
    const { box, narrow } = S;
    const lw = narrow ? 0.6 : 0.64;
    const E = { x: box.x, y: box.y, w: box.w * lw, h: box.h };
    const cxR = box.x + box.w * (lw + 0.02), cwR = box.w * (1 - lw - 0.02);
    const B = { x: cxR, y: box.y + box.h * (narrow ? 0.56 : 0.56), w: cwR, h: box.h * (narrow ? 0.36 : 0.3) };
    const Rt = { x: cxR, y: box.y + box.h * (narrow ? 0.1 : 0.12), w: cwR };
    const r0 = Math.min(E.w * 0.42, E.h * (narrow ? 0.36 : 0.34));
    const cx = E.x + E.w * 0.5, cy = E.y + Math.max(r0 * 1.12 + S.fs * 1.2, E.h * 0.44);
    Object.assign(S.st, { E, B, Rt, r0, cx, cy, view: null });
  },
  ctrl(S, e, h) { const { cx, cy, r0 } = S.st; return S.narrow ? [cx + r0 * 1.6, cy - r0 * 0.2] : [e[0] + (h[0] - e[0]) * 0.12, h[1] + (e[1] - h[1]) * 0.12]; },   // rise from the fingertip, then arc onto the summit
  // the portrait's line leaves Newton's pointing finger and lands on the apple waiting on the summit
  entry(S) { const { cx, cy, r0 } = S.st, iw = S.iw; return [cx + r0 * 0.1 - iw * 2.9, cy - r0 - iw * 3.2]; },
  draw(S, k, ft, dt) {
    const st = S.st, { cx, cy, r0, R, E, B } = st, iw = S.iw, C = S.C, ctx = S.ctx, fs = S.fs;
    // the view zooms out smoothly so a long ellipse fits the panel
    const u = S.p.v / 7.9, g = S.p.g, fate0 = this.fate(S.p.v, g, R);
    let tgt = { s: r0, X: cx, Y: cy, yc: 0 };
    if (fate0 === "escapes") { const s2 = r0 * 0.5; tgt = { s: s2, X: E.x + E.w * 0.3, Y: E.y + E.h * 0.2 + s2, yc: 0 }; }
    else if (fate0 === "orbit") {
      const r2 = Math.min(7, (u * u) / (2 * g - u * u)), b = Math.sqrt(r2);
      if (r2 > 1.12) tgt = { s: Math.min(r0, E.h * 0.9 / (1 + r2 + 0.2), E.w * 0.94 / (2 * b + 0.3)), X: cx, Y: E.y + E.h * 0.52, yc: (1 - r2) / 2 };
    }
    const vw = st.view || (st.view = { ...tgt }), fz = 1 - Math.exp(-(dt || 0) * 3);
    for (const key of ["s", "X", "Y", "yc"]) vw[key] += (tgt[key] - vw[key]) * fz;
    const sc = vw.s, P = (x, y) => [vw.X + x * sc, vw.Y - (y - vw.yc) * sc], O = P(0, 0);
    const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    const live = k > 0.42;

    // ---- the Earth and Newton's mountain
    S.circle(O[0], O[1], sc * R, { w: iw * 0.9, color: C.ink, a0: -Math.PI / 2, a1: -Math.PI / 2 + k1 * Math.PI * 2 });
    // a faint equator arc so it reads as a globe
    S.line(Array.from({ length: 41 }, (_, i) => { const a = Math.PI * i / 40; return P(R * Math.cos(a), -R * 0.28 * Math.sin(a)); }), { w: iw * 0.4, color: C.soft, alpha: 0.6 * k1 });
    // mountain: from the surface up to radius 1
    const mt = [P(-R * Math.sin(0.26), R * Math.cos(0.26) - 0.004), P(-0.1, 0.84), P(-0.06, 0.9), P(-0.025, 0.97), P(0, 1), P(0.035, 0.96), P(0.07, 0.89), P(0.12, 0.8), P(R * Math.sin(0.28), R * Math.cos(0.28) - 0.004)];
    S.line(mt.slice(0, Math.max(2, Math.ceil(mt.length * k1))), { w: iw * 0.8, color: C.ink });
    // cannon
    if (k1 > 0.6) { const [mx, my] = P(0, 1), L = sc * 0.11; S.line([[mx - L * 0.35, my - iw * 0.4], [mx + L * 0.65, my - iw * 0.9]], { w: iw * 1.6, color: C.ink, alpha: (k1 - 0.6) / 0.4 }); S.dot(mx - L * 0.1, my, iw * 0.9, C.ink, (k1 - 0.6) / 0.4); }
    if (k1 > 0.6 && (!live || st.shot.t < 0.02)) { const [mx, my] = P(0, 1); this.apple(S, mx + sc * 0.1, my - iw * 3.2, iw * 2.6, { alpha: (k1 - 0.6) / 0.4, w: iw * 0.8 }); }
    S.text("Earth", O[0], O[1] + fs * 0.35, { size: fs * 1.05, color: C.soft, alpha: k1 });
    if (!S.narrow) S.text("Newton\u2019s apple, fired from a mountain", P(0, 1)[0] + fs * 0.6, P(0, 1)[1] - iw * 3.2 - fs * 1.5, { size: fs * 0.85, align: "left", alpha: k1 });

    // ---- clip the trajectories to the drawing panel
    ctx.save(); ctx.beginPath(); ctx.rect(E.x - fs, E.y, E.w + fs * 2, E.h); ctx.clip();
    // Newton's fan of shots, each a little faster
    if (k2 > 0) {
      st.gh.forEach((gh, j) => {
        const n = Math.max(2, Math.floor(gh.pts.length * Math.min(1, k2 * 1.6 - j * 0.2)));
        if (n < 2) return;
        const pts = gh.pts.slice(0, n).map(p => P(p[0], p[1]));
        S.line(pts, { w: iw * 0.5, color: C.ink, dash: [iw * 1.2, iw * 1.6], alpha: 0.55 });
        if (gh.end === "falls" && n === gh.pts.length) { const q = pts[pts.length - 1], rr = Math.hypot(q[0] - O[0], q[1] - O[1]), s0 = iw * 1.6; this.apple(S, q[0] + (q[0] - O[0]) / rr * s0, q[1] + (q[1] - O[1]) / rr * s0, s0, { color: C.ink, w: iw * 0.5, alpha: 0.7 }); }
      });
      const og = st.orbitGhost.pts, n = Math.max(2, Math.floor(og.length * Math.min(1, Math.max(0, k2 * 1.4 - 0.4))));
      if (n > 2) S.line(og.slice(0, n).map(p => P(p[0], p[1])), { w: iw * 0.45, color: C.soft, alpha: 0.8 });
    }
    // the live shot: step the real equations
    let msg = "";
    const sh = st.shot;
    if (live) {
      if (!sh.done) {
        let tt = (dt || 0) * 1.25 * (S.p.speed ?? 1) * Math.pow(r0 / sc, 0.8);
        const cut = Math.max(3.4, 1.25 * E.h / tgt.s);
        const g = S.p.g, h = 0.004;
        while (tt > 0 && !sh.done) {
          const r = Math.hypot(sh.x, sh.y), a = -g / (r * r * r);
          sh.vx += a * sh.x * h; sh.vy += a * sh.y * h; sh.x += sh.vx * h; sh.y += sh.vy * h; sh.t += h; tt -= h;
          if (++sh.n % 3 === 0) { sh.trail.push([sh.x, sh.y]); if (sh.trail.length > 1800) sh.trail.shift(); }
          const rr = Math.hypot(sh.x, sh.y);
          if (rr < R) { const f = R / rr; sh.x *= f; sh.y *= f; sh.trail.push([sh.x, sh.y]); sh.done = "falls"; }
          else if (rr > cut) sh.done = "escapes";
        }
      } else { sh.hold += dt || 0; if (sh.hold > 1.6) this.fire(S); }
      const tr = sh.trail.map(p => P(p[0], p[1]));
      S.line(tr, { w: iw * 1.1, color: C.accent });
      if (fate0 === "escapes" && tr.length > 20) {
        let q = null; for (let i = tr.length - 1; i >= 0; i--) if (tr[i][0] < E.x + E.w - fs * 3 && tr[i][1] < E.y + E.h - fs) { q = tr[i]; break; }
        if (q && q !== tr[0]) st.escLab = q;
      } else st.escLab = null;
      const [bx, by] = P(sh.x, sh.y);
      if (sh.done === "falls") { const rr = Math.hypot(bx - O[0], by - O[1]), s0 = iw * 2.4; this.apple(S, bx + (bx - O[0]) / rr * s0, by + (by - O[1]) / rr * s0, s0, { w: iw * 0.8 }); }
      else if (!sh.done) {
        // gravity points to the centre; velocity along the path
        const r = Math.hypot(sh.x, sh.y), gl = r0 * 0.3 * Math.min(1.4, S.p.g / (r * r));
        S.arrow(bx, by, bx - (sh.x / r) * gl, by + (sh.y / r) * gl, { w: iw * 0.7, color: C.ink, alpha: 0.85 * k2 });
        const sp = Math.hypot(sh.vx, sh.vy), vl = r0 * 0.28 * Math.min(1.6, sp);
        S.arrow(bx, by, bx + (sh.vx / sp) * vl, by - (sh.vy / sp) * vl, { w: iw * 0.7, color: C.accent, alpha: 0.85 * k2 });
        this.apple(S, bx, by, iw * 2.6, { w: iw * 0.8 });
        if (k2 > 0.5 && sh.t < 1.2) {
          S.text("gravity", bx - (sh.x / r) * gl * 0.5 - fs * 0.4, by + (sh.y / r) * gl * 0.75 + fs * 0.3, { size: fs * 0.8, align: "right", alpha: k2 });
          S.text("velocity", bx + (sh.vx / sp) * vl, by - fs * 0.55, { size: fs * 0.8, color: C.accent, align: "left", alpha: k2 });
        }
      }
    }
    ctx.restore();
    if (st.escLab) S.text("escapes", st.escLab[0] - fs * 0.6, st.escLab[1] + fs * 1.2, { size: fs * 0.95, color: C.accent, align: "right" });
    // labels for the outcomes
    if (k2 > 0.3) {
      const a = k2;
      const [fx, fy] = P(0.62, 0.15);
      S.text("falls back", fx + fs * 0.4, fy - fs * 2.4, { size: fs * 0.85, color: C.soft, align: "left", alpha: a });
      const [ox, oy] = P(-0.72, -0.72);
      S.text("orbit", ox - fs * 0.2, oy + fs * 0.6, { size: fs * 0.9, color: C.soft, align: "right", alpha: a });
    }

    // ---- Newton's update rule, set beside the AI one
    const Rt = st.Rt, rx = Rt.x + Rt.w * 0.5, mfs = fs * (S.narrow ? 0.8 : 0.95), lh = mfs * 1.45;
    if (k2 > 0) {
      S.text(S.narrow ? "the apple" : "the apple, stepped", rx, Rt.y, { size: fs * (S.narrow ? 0.85 : 1.1), weight: 500, alpha: k2 });
      ["a = −GM·r/|r|³", "v += a·dt", "r += v·dt"].forEach((l, i) => S.text(l, rx, Rt.y + lh * (i + 1.15), { size: mfs, mono: true, italic: false, color: i === 1 ? C.accent : C.ink, alpha: k2 }));
    }
    // ---- AI beat: gradient descent with momentum in a loss bowl
    let gdMsg = "";
    if (k3 > 0) {
      const gd = st.gd, eta = 0.09 * S.p.g, beta = 0.6;
      gd.acc += (dt || 0) * (S.p.speed ?? 1);
      if (gd.acc > 0.38) {
        gd.acc = 0;
        if (gd.hist.length > 16 || (gd.hist.length > 3 && Math.abs(gd.w) < 0.02 && Math.abs(gd.m) < 0.02)) { gd.wait++; if (gd.wait > 4) { gd.w = -1.15; gd.m = 0; gd.hist = []; gd.wait = 0; } }
        else { gd.hist.push(gd.w); const grad = 2 * gd.w; gd.m = beta * gd.m - eta * grad; gd.w += gd.m; gd.w = Math.max(-1.25, Math.min(1.25, gd.w)); }
      }
      const bw = B.w, bh = B.h, bx0 = B.x + bw * 0.5, by0 = B.y + bh * 0.82, sx = bw * 0.4, sy = bh * 0.55 / 1.5;
      const Q = w => [bx0 + w * sx, by0 - w * w * sy];
      S.line(Array.from({ length: 41 }, (_, i) => Q(-1.25 + 2.5 * i / 40)), { w: iw * 1.0, color: C.accent, alpha: k3 });
      S.line([[B.x + bw * 0.06, by0 + iw * 2], [B.x + bw * 0.94, by0 + iw * 2]], { w: iw * 0.4, color: C.soft, alpha: k3 });
      S.text("loss", Q(-1.25)[0] - fs * 0.25, Q(-1.25)[1] - fs * 0.3, { size: fs * 0.85, color: C.accent, alpha: k3 });
      S.text("w", B.x + bw * 0.94, by0 + iw * 2 + fs * 1.0, { size: fs * 0.85, color: C.soft, alpha: k3 });
      const hs = gd.hist.map(Q);
      if (hs.length) S.line([...hs, Q(gd.w)], { w: iw * 0.45, color: C.ink, alpha: 0.6 * k3, dash: [iw, iw * 1.2] });
      hs.forEach((q, i) => S.dot(q[0], q[1], iw * 0.7, C.ink, k3 * (0.25 + 0.6 * i / hs.length)));
      const [qx, qy] = Q(gd.w);
      // slope arrow: the negative gradient
      const gr = -2 * gd.w, al = Math.max(-1, Math.min(1, gr)) * bw * 0.16;
      if (Math.abs(al) > iw * 4) S.arrow(qx, qy - iw * 2.5, qx + al, qy - iw * 2.5, { w: iw * 0.6, color: C.ink, alpha: k3 });
      S.dot(qx, qy - iw * 1.2, iw * 1.6, C.accent, k3);
      const tl = B.y - lh * 2.2;
      S.text("gradient descent", bx0, tl - lh * 0.15, { size: fs * (S.narrow ? 0.85 : 1.1), color: C.accent, weight: 500, alpha: k3 });
      ["m = β·m − η·∇L", "w += m"].forEach((l, i) => S.text(l, bx0, tl + lh * (i + 1), { size: mfs, mono: true, italic: false, color: i === 0 ? C.accent : C.ink, alpha: k3 }));
      if (!S.narrow) S.text("the same nudge, then repeat", bx0, by0 + fs * 2.3, { size: fs * 0.85, color: C.soft, alpha: k3 });
      gdMsg = ` · loss ${(gd.w * gd.w).toFixed(3)}`;
    }

    const fate = this.fate(S.p.v, S.p.g, R), vc = 7.9 * Math.sqrt(S.p.g), ve = 11.2 * Math.sqrt(S.p.g);
    const word = fate === "falls" ? "falls back to Earth" : fate === "escapes" ? "escapes Earth's pull" : fate === "circle" ? "circular orbit" : "elliptical orbit";
    msg = `${S.p.v.toFixed(1)} km/s → ${word} · orbit ${vc.toFixed(1)}, escape ${ve.toFixed(1)} km/s${gdMsg}`;
    return msg;
  },
  code(S) {
    const g = S.p.g, u = S.p.v;
    return `${S.c("# Newton's apple, fired from a mountain: gravity weakens as 1/r²")}
GM = ${S.v((g).toFixed(2))} * GM_earth
r  = (0, R_mountain)          ${S.c("# start on the summit")}
v  = (${S.v(u.toFixed(1))}, 0)               ${S.c("# km/s, fired sideways")}

while not hit_ground(r):
    a  = -GM * r / |r|**3      ${S.c("# pull toward the centre")}
    v += a * dt                ${S.c("# nudge velocity by the force")}
    r += v * dt                ${S.c("# move, then repeat")}

${S.c("# gradient descent with momentum: the same two lines")}
m  = β*m - η*grad(loss, w)     ${S.c(`# η = ${(0.09 * g).toFixed(2)}`)}
w += m`;
  },
});
