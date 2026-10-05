// Maryam Mirzakhani — billiards in a polygon unfold into a straight line on a surface; geodesics on a hyperbolic
// surface (Poincaré disc). Illustration of the dynamics she studied. → Poincaré embeddings of hierarchies (2017).
(function () {
  const TABLES = {
    square: { poly: [[0, 0], [1, 0], [1, 1], [0, 1]], start: [0.3, 0.25] },
    triangle: { poly: [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], start: [0.35, 0.2] },
    lshape: { poly: [[0, 0], [1, 0], [1, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]], start: [0.2, 0.2] },
  };
  const NB = 9;
  const refl = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; const fx = a[0] + t * dx, fy = a[1] + t * dy; return [2 * fx - p[0], 2 * fy - p[1]]; };
  function trace(tb, ang) {
    const poly = tb.poly, n = poly.length;
    let p = tb.start.slice(), d = [Math.cos(ang), Math.sin(ang)];
    const pts = [p.slice()], edges = [];
    for (let b = 0; b <= NB; b++) {
      let best = Infinity, be = -1;
      for (let i = 0; i < n; i++) {
        const a = poly[i], c = poly[(i + 1) % n], ex = c[0] - a[0], ey = c[1] - a[1], den = d[0] * ey - d[1] * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den, s = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
        if (t > 1e-7 && s >= -1e-9 && s <= 1 + 1e-9 && t < best) { best = t; be = i; }
      }
      if (be < 0) break;
      p = [p[0] + d[0] * best, p[1] + d[1] * best]; pts.push(p.slice()); edges.push(be);
      const a = poly[be], c = poly[(be + 1) % n], ex = c[0] - a[0], ey = c[1] - a[1], L = Math.hypot(ex, ey), tx = ex / L, ty = ey / L, dt = d[0] * tx + d[1] * ty;
      d = [2 * dt * tx - d[0], 2 * dt * ty - d[1]];
    }
    // unfolding: reflect the table across the edge hit, again and again
    let cur = poly.map(q => q.slice()); const copies = [cur];
    for (let i = 0; i < edges.length - 1; i++) { const e = edges[i], a = cur[e], c = cur[(e + 1) % n]; cur = cur.map(q => refl(q, a, c)); copies.push(cur); }
    const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(tot); }
    const d0 = [Math.cos(ang), Math.sin(ang)], uEnd = [tb.start[0] + d0[0] * tot, tb.start[1] + d0[1] * tot];
    return { pts, copies, seg, tot, uEnd };
  }
  // circle through three points
  const circ3 = (a, b, c) => { const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])); if (Math.abs(d) < 1e-9) return null;
    const A = a[0] ** 2 + a[1] ** 2, B = b[0] ** 2 + b[1] ** 2, Cc = c[0] ** 2 + c[1] ** 2;
    const ux = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + Cc * (a[1] - b[1])) / d, uy = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + Cc * (b[0] - a[0])) / d; return [ux, uy, Math.hypot(a[0] - ux, a[1] - uy)]; };
  // points along the hyperbolic geodesic from p to q (unit-disc coordinates)
  function geo(p, q, m = 24) {
    const r2 = p[0] ** 2 + p[1] ** 2, inv = r2 > 1e-6 ? [p[0] / r2, p[1] / r2] : null, cc = inv ? circ3(p, q, inv) : null;
    const out = [];
    if (!cc) { for (let i = 0; i <= m; i++) out.push([p[0] + (q[0] - p[0]) * i / m, p[1] + (q[1] - p[1]) * i / m]); return out; }
    let a0 = Math.atan2(p[1] - cc[1], p[0] - cc[0]), a1 = Math.atan2(q[1] - cc[1], q[0] - cc[0]), da = a1 - a0;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    for (let i = 0; i <= m; i++) { const a = a0 + da * i / m; out.push([cc[0] + cc[2] * Math.cos(a), cc[1] + cc[2] * Math.sin(a)]); }
    return out;
  }
  const TREE = (() => {
    const N = [{ w: "animal", d: 0, a: 0, p: -1 }], kids = [["mammal", -1.75], ["bird", 0.35], ["fish", 2.45]];
    const g = { mammal: ["dog", "cat", "whale", "bat"], bird: ["eagle", "owl", "duck"], fish: ["shark", "trout", "eel"] };
    kids.forEach(([w, a]) => { const id = N.length; N.push({ w, d: 1, a, p: 0 }); const ch = g[w]; ch.forEach((c, j) => { N.push({ w: c, d: 2, a: a + (j - (ch.length - 1) / 2) * 0.42, p: id }); }); });
    const R = [0, Math.tanh(1.7 / 2), Math.tanh(3.6 / 2)];
    N.forEach(n => { n.x = R[n.d] * Math.cos(n.a); n.y = R[n.d] * Math.sin(n.a); });
    return N;
  })();

  Lineage.scene({
    params: [
      { id: "table", label: "Table shape", type: "select", value: "square", options: [{ value: "square", label: "Square" }, { value: "triangle", label: "Equilateral triangle" }, { value: "lshape", label: "L-shape" }] },
      { id: "angle", label: "Launch angle (or click the table)", type: "range", min: 1, max: 179, step: 0.5, value: 33.7, fmt: v => v.toFixed(1) + "°" },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { this.sim(S); },
    onParam(S, id) { if (id !== "speed") this.sim(S); },
    sim(S) {
      const st = S.st, tb = TABLES[S.p.table] || TABLES.square;
      st.tb = tb; st.tr = trace(tb, (S.p.angle * Math.PI) / 180); st.t0 = null;
      // unfolding coordinates: rotate so the straight path runs left to right
      const ang = (S.p.angle * Math.PI) / 180, ca = Math.cos(-ang), sa = Math.sin(-ang), s0 = tb.start;
      st.rot = q => [(q[0] - s0[0]) * ca - (q[1] - s0[1]) * sa, (q[0] - s0[0]) * sa + (q[1] - s0[1]) * ca];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      st.tr.copies.forEach(c => c.map(st.rot).forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }));
      st.ub = [x0, y0, x1, y1]; if (st.un) this.fit(S);
    },
    fit(S) {
      if (!S.st.ub || !S.st.un) return;
      const st = S.st, [x0, y0, x1, y1] = st.ub, u = st.un, sc = Math.min(u.w / (x1 - x0), u.h / (y1 - y0));
      st.uf = { sc, ox: u.x + (u.w - (x1 - x0) * sc) / 2 - x0 * sc, oy: u.y + u.h - (u.h - (y1 - y0) * sc) / 2 + y0 * sc };
    },
    layout(S) {
      const b = S.box, st = S.st, wide = b.w / b.h > 1.15; st.wide = wide;
      if (!wide) {
        st.tbx = { x: b.x + b.w * 0.05, y: b.y + b.h * 0.07, s: Math.min(b.w * 0.4, b.h * 0.38) };
        st.dc = [b.x + b.w * 0.76, b.y + b.h * 0.29]; st.dR = Math.min(b.w * 0.22, b.h * 0.22);
        st.un = { x: b.x + b.w * 0.03, y: b.y + b.h * 0.64, w: b.w * 0.94, h: b.h * 0.3 };
      } else {
        st.tbx = { x: b.x + b.w * 0.03, y: b.y + b.h * 0.1, s: Math.min(b.w * 0.26, b.h * 0.42) };
        st.dc = [b.x + b.w * 0.8, b.y + b.h * 0.32]; st.dR = Math.min(b.w * 0.17, b.h * 0.27);
        st.un = { x: b.x + b.w * 0.02, y: b.y + b.h * 0.7, w: b.w * 0.96, h: b.h * 0.28 };
      }
      this.fit(S);
    },
    entry(S) { const t = S.st.tbx; return [t.x, t.y + t.s]; },
    pointer(S, type, px, py) {
      if (type !== "down") return;
      const st = S.st, t = st.tbx, ux = (px - t.x) / t.s, uy = (t.y + t.s - py) / t.s;
      if (ux < -0.1 || ux > 1.1 || uy < -0.1 || uy > 1.1) return;
      const a = Math.atan2(uy - st.tb.start[1], ux - st.tb.start[0]) * 180 / Math.PI;
      if (a > 0.5 && a < 179.5) { S.p.angle = Math.round(a * 2) / 2; const el = document.getElementById("p-angle"); if (el) { el.value = S.p.angle; el.dispatchEvent(new Event("input")); } else this.sim(S); }
    },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, wide = st.wide, tr = st.tr, t = st.tbx;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.6) / 0.4);
      const T = p => [t.x + p[0] * t.s, t.y + t.s - p[1] * t.s];
      const U = p0 => { const p = st.rot(p0); return [st.uf.ox + p[0] * st.uf.sc, st.uf.oy - p[1] * st.uf.sc]; };
      // ---- beat 1: the billiard table ----
      const poly = st.tb.poly.map(T);
      S.line(poly, { close: true, color: C.ink, w: iw * 0.9, alpha: k1 });
      S.text("billiard table", t.x + t.s * 0.5, t.y - fs * 0.5, { size: fs * 0.85, color: C.ink, alpha: k1 });
      if (st.t0 == null) st.t0 = ft;
      const v = 0.55, cycle = tr.tot / v + 1.5, dist = Math.min(tr.tot, (((ft - st.t0) % cycle + cycle) % cycle) * v) * Math.min(1, k1 * 1.4);
      let j = 0; while (j < tr.seg.length - 1 && tr.seg[j] < dist) j++;
      const prev = j ? tr.seg[j - 1] : 0, f = (dist - prev) / ((tr.seg[j] - prev) || 1), A = tr.pts[j], B = tr.pts[j + 1] || A;
      const ball = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
      S.line([...tr.pts.slice(0, j + 1), ball].map(T), { color: C.accent, w: iw * 0.7, alpha: k1 });
      const bp = T(ball); S.circle(bp[0], bp[1], iw * 1.4, { color: C.ink, w: iw * 0.6, fill: C.paper, alpha: k1 });
      const s0 = T(st.tb.start); S.dot(s0[0], s0[1], iw * 0.6, C.ink, k1);
      S.text(`${j} bounce${j === 1 ? "" : "s"}`, t.x + t.s * 0.5, t.y + t.s + fs * 1.3, { size: fs * 0.8, color: C.soft, alpha: k1 });
      // ---- beat 2: unfold → a straight line through reflected copies ----
      if (k2 > 0) {
        tr.copies.forEach((c, i) => { if (i <= j) S.line(c.map(U), { close: true, color: C.ink, w: iw * (i === 0 ? 0.6 : 0.35), alpha: k2 * (i === 0 ? 0.9 : 0.55) }); });
        const d0 = [Math.cos(S.p.angle * Math.PI / 180), Math.sin(S.p.angle * Math.PI / 180)], s = st.tb.start;
        const e = [s[0] + d0[0] * dist, s[1] + d0[1] * dist];
        S.line([U(s), U(e)], { color: C.accent, w: iw * 0.8, alpha: k2 });
        const ue = U(e); S.circle(ue[0], ue[1], iw * 1.1, { color: C.ink, w: iw * 0.5, fill: C.paper, alpha: k2 });
        S.text(wide ? "unfolded: one straight line" : "unfolded: mirror the table at each bounce, the path is one straight line", st.un.x + st.un.w / 2, st.un.y - fs * 0.5, { size: fs * 0.85, color: C.accent, alpha: k2 });
      }
      // ---- beat 3: hyperbolic disc, geodesics, and a hierarchy embedded in it ----
      if (k3 > 0) {
        const [dx, dy] = st.dc, R = st.dR, D = p => [dx + p[0] * R, dy - p[1] * R];
        S.circle(dx, dy, R, { color: C.ink, w: iw * 0.7, alpha: k3 });
        // geodesics: arcs meeting the rim at right angles
        [[-2.6, 0.9], [1.2, 2.9], [-0.4, -1.9]].forEach(([a, b]) => {
          const p = [0.999 * Math.cos(a), 0.999 * Math.sin(a)], q = [0.999 * Math.cos(b), 0.999 * Math.sin(b)];
          S.line(geo(p, q, 30).map(D), { color: C.soft, w: iw * 0.4, alpha: k3 });
        });
        // the tree (Poincaré embedding style)
        TREE.forEach(n => { if (n.p >= 0) { const P0 = TREE[n.p]; S.line([D([P0.x, P0.y]), D([n.x, n.y])], { color: C.accent, w: iw * (0.85 - n.d * 0.18), alpha: k3 }); } });
        TREE.forEach(n => { const p = D([n.x, n.y]); S.dot(p[0], p[1], Math.max(1.5, iw * (0.95 - n.d * 0.2)), C.accent, k3); });
        const lab = wide ? ["animal", "dog"] : ["animal", "mammal", "bird", "fish", "dog", "eagle", "shark"];
        TREE.forEach(n => { if (!lab.includes(n.w)) return; const p = D([n.x, n.y]), o = n.d ? [Math.cos(n.a), -Math.sin(n.a)] : [0, 0];
          S.text(n.w, p[0] + o[0] * fs * 1.2, p[1] + o[1] * fs * 0.9 + (n.d ? fs * 0.3 : -fs * 0.5), { size: fs * 0.75, color: C.accent, alpha: k3 }); });
        // a point travelling a geodesic: equal hyperbolic steps look shorter near the rim
        const sgeo = ((ft * 0.5) % 8) - 4, r = Math.tanh(sgeo / 2), ga = 2.2, gp = D([r * Math.cos(ga), r * Math.sin(ga)]);
        S.circle(gp[0], gp[1], iw * 1.1, { color: C.ink, w: iw * 0.5, fill: C.paper, alpha: k3 });
        S.text(wide ? "hyperbolic disc" : "hyperbolic disc: more room near the rim", dx, dy + R + fs * 1.25, { size: fs * 0.8, color: C.ink, alpha: k3 });
      }
      return `${S.p.table === "lshape" ? "L-shaped" : S.p.table} table · launched at ${S.p.angle.toFixed(1)}° · ${j} of ${tr.pts.length - 2} bounces · unfolded path length ${dist.toFixed(2)}`;
    },
    code(S) {
      const tr = S.st.tr;
      return `${S.c("# billiards: bounce, or unfold the table instead")}
angle = ${S.v(S.p.angle.toFixed(1))}           ${S.c("# degrees")}
table = ${S.v(S.p.table)}
p, d = start, (cos(angle), sin(angle))
for bounce in range(${S.v(NB)}):
    edge, t = first_edge_hit(table, p, d)
    p = p + t * d
    d = reflect(d, edge)          ${S.c("# angle in = angle out")}
    table = mirror(table, edge)   ${S.c("# unfolding: the path stays straight")}
${S.c("# total length so far " + tr.tot.toFixed(2))}`;
    },
  });
})();
