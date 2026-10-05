// Euler — the seven bridges of Königsberg → a graph of 4 nodes and 7 edges → the odd-degree rule → graph neural networks
(function () {
  const NAMES = ["A", "B", "C", "D"], PLACE = ["Kneiphof", "north bank", "south bank", "Lomse"];
  // map positions of the four land masses and graph positions (unit coords, 1.5 wide × 1 high)
  const MAPN = [[0.6, 0.5], [0.72, 0.1], [0.72, 0.9], [1.22, 0.5]];
  const GRAPHN = [[0.24, 0.5], [0.74, 0.07], [0.74, 0.93], [1.24, 0.5]];
  // Euler's seven bridges: a, b (A–B), c, d (A–C), e (A–D), f (B–D), g (C–D); each with its crossing on the map
  const BR = [
    { a: 0, b: 1, s: [0.53, 0.38], t: [0.53, 0.24], n: "a" }, { a: 0, b: 1, s: [0.68, 0.38], t: [0.68, 0.24], n: "b" },
    { a: 0, b: 2, s: [0.53, 0.62], t: [0.53, 0.76], n: "c" }, { a: 0, b: 2, s: [0.68, 0.62], t: [0.68, 0.76], n: "d" },
    { a: 0, b: 3, s: [0.79, 0.5], t: [0.93, 0.5], n: "e" },
    { a: 1, b: 3, s: [1.12, 0.17], t: [1.12, 0.37], n: "f" }, { a: 2, b: 3, s: [1.12, 0.83], t: [1.12, 0.63], n: "g" },
  ];
  // river centre lines: west stream, north and south branches, and the channel between Kneiphof and Lomse
  const RIVER = [
    [[-0.05, 0.52], [0.18, 0.5], [0.33, 0.5]],
    [[0.33, 0.5], [0.4, 0.36], [0.55, 0.31], [0.86, 0.3], [1.15, 0.27], [1.55, 0.2]],
    [[0.33, 0.5], [0.4, 0.64], [0.55, 0.69], [0.86, 0.7], [1.15, 0.73], [1.55, 0.8]],
    [[0.86, 0.3], [0.86, 0.7]],
  ];
  const PRESETS = {
    k7: [[0, 1], [0, 1], [0, 2], [0, 2], [0, 3], [1, 3], [2, 3]],
    k8: [[0, 1], [0, 1], [0, 2], [0, 2], [0, 3], [1, 3], [2, 3], [1, 2]],
    k5: [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
  };
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const NS = 26;

  function analyse(S) {
    const st = S.st, E = st.edges, deg = [0, 0, 0, 0];
    E.forEach(e => { deg[e.a]++; deg[e.b]++; });
    const odd = [0, 1, 2, 3].filter(i => deg[i] % 2);
    // longest trail by depth-first search (at most a dozen edges, so this is instant)
    const used = E.map(() => false); let best = [], it = 0;
    const dfs = (v, path) => {
      if (++it > 200000) return true;
      if (path.length > best.length) best = path.slice();
      if (best.length === E.length) return true;
      for (let i = 0; i < E.length; i++) {
        if (used[i] || (E[i].a !== v && E[i].b !== v)) continue;
        const w = E[i].a === v ? E[i].b : E[i].a;
        used[i] = true; path.push({ e: i, from: v, to: w });
        if (dfs(w, path)) return true;
        path.pop(); used[i] = false;
      }
      return false;
    };
    const starts = odd.concat([0, 1, 2, 3].filter(i => !odd.includes(i) && deg[i] > 0));
    for (const s0 of starts) { if (dfs(s0, [])) break; }
    const start = best.length ? best[0].from : 0;
    Object.assign(st, { deg, odd, trail: best, start, full: E.length > 0 && best.length === E.length, wt: 0 });
  }
  function geom(S) {
    const st = S.st, cnt = {}, idx = {};
    st.edges.forEach(e => { const key = Math.min(e.a, e.b) + "-" + Math.max(e.a, e.b); cnt[key] = (cnt[key] || 0) + 1; });
    st.edges.forEach(e => {
      const lo = Math.min(e.a, e.b), hi = Math.max(e.a, e.b), key = lo + "-" + hi, i = (idx[key] = (idx[key] || 0) + 1) - 1, m = cnt[key];
      const P = GRAPHN[lo], Q = GRAPHN[hi], d = [Q[0] - P[0], Q[1] - P[1]], L = Math.hypot(d[0], d[1]), nrm = [-d[1] / L, d[0] / L];
      const bend = (i - (m - 1) / 2) * 0.2, c = [(P[0] + Q[0]) / 2 + nrm[0] * bend, (P[1] + Q[1]) / 2 + nrm[1] * bend];
      const g = [];
      for (let j = 0; j <= NS; j++) { const t = j / NS, u = 1 - t; g.push([u * u * P[0] + 2 * u * t * c[0] + t * t * Q[0], u * u * P[1] + 2 * u * t * c[1] + t * t * Q[1]]); }
      if (e.a !== lo) g.reverse();
      let mp = g;
      if (e.br) { // on the map: land centre → over the bridge → land centre
        const A = MAPN[e.a], B = MAPN[e.b], s = e.br.s, t = e.br.t; mp = [];
        for (let j = 0; j <= NS; j++) { const f = j / NS; mp.push(f < 0.35 ? lerp(A, s, f / 0.35) : f < 0.65 ? lerp(s, t, (f - 0.35) / 0.3) : lerp(t, B, (f - 0.65) / 0.35)); }
      }
      e.g = g; e.mp = mp;
    });
  }
  function setPreset(S, key) {
    S.st.edges = (PRESETS[key] || PRESETS.k7).map(([a, b], i) => ({ a, b, br: key !== "k5" && i < 7 ? BR[i] : null }));
    S.st.sel = -1; geom(S); analyse(S);
  }

  Lineage.scene({
    params: [
      { id: "preset", label: "Bridges", type: "select", value: "k7", options: [
        { value: "k7", label: "Königsberg, 1735: seven bridges" }, { value: "k8", label: "Add an eighth bridge (B to C)" }, { value: "k5", label: "Only five bridges" }] },
      { id: "deg", label: "Show degrees", type: "toggle", value: true },
      { id: "speed", label: "Walking speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Walk again", run(S) { S.st.wt = 0; } }],
    init(S) { setPreset(S, S.p.preset); },
    reset(S) { S.st.T = 0; S.st.wt = 0; },
    onParam(S, id) { if (id === "preset") setPreset(S, S.p.preset); },
    layout(S) {
      const { box, narrow, fs } = S;
      const R = { x: box.x + fs * 0.6, y: box.y + fs * (narrow ? 0.4 : 1.6), w: box.w - fs * 1.2, h: box.h * (narrow ? 0.6 : 0.6) };
      const sc = Math.min(R.w / 1.5, R.h), ox = R.x + (R.w - sc * 1.5) / 2, oy = R.y + (R.h - sc) / 2;
      const by = R.y + R.h + fs * (narrow ? 1.3 : 2.4);
      const mw = box.w * (narrow ? 0.38 : 0.34), mh = box.y + box.h - by + fs * 0.9;
      const M = { x: box.x + box.w - mw, y: by - fs * 0.9, w: mw, h: mh };
      Object.assign(S.st, { R, sc, ox, oy, by, M, P: p => [ox + p[0] * sc, oy + p[1] * sc] });
    },
    entry(S) { const st = S.st; return st.P([0.02, 0.5]); },
    pointer(S, type, x, y) {
      const st = S.st; if (type !== "down" || !st.ready) return;
      const near = (p, r) => Math.hypot(p[0] - x, p[1] - y) < r;
      const rN = Math.max(16, S.fs * 1.2);
      const ni = [0, 1, 2, 3].find(i => near(st.P(GRAPHN[i]), rN * 1.3));
      if (ni == null) {
        // remove the bridge nearest the click
        let bi = -1, bd = Math.max(12, S.iw * 4);
        st.edges.forEach((e, i) => e.g.forEach(p => { const q = st.P(p), d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; bi = i; } }));
        if (bi >= 0) { st.edges.splice(bi, 1); st.sel = -1; geom(S); analyse(S); } else st.sel = -1;
        return;
      }
      if (st.sel < 0 || st.sel === ni) { st.sel = st.sel === ni ? -1 : ni; return; }
      const pairCount = st.edges.filter(e => Math.min(e.a, e.b) === Math.min(st.sel, ni) && Math.max(e.a, e.b) === Math.max(st.sel, ni)).length;
      if (st.edges.length < 12 && pairCount < 3) { st.edges.push({ a: st.sel, b: ni, br: null }); geom(S); analyse(S); }
      st.sel = -1;
    },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, ctx = S.ctx, P = st.P, sc = st.sc;
      // own timeline so the map stays on screen long enough to read before it folds into a graph
      st.T = (st.T || 0) + dt; const T = st.T;
      const k1 = S.ease(T / 1.6), m = S.ease((T - 3.8) / 1.7), kd = S.ease((T - 5.4) / 0.8), kr = S.ease((T - 6.3) / 1.2);
      st.ready = m > 0.95;
      // 1. the map: river with banks, then the bridges
      if (m < 1) {
        const a = k1 * (1 - m);
        ctx.save(); ctx.globalAlpha = a; ctx.lineCap = "round"; ctx.lineJoin = "round";
        const path = () => { ctx.beginPath(); RIVER.forEach(l => l.forEach((p, i) => { const q = P(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); })); };
        path(); ctx.strokeStyle = C.soft; ctx.lineWidth = sc * 0.085 + iw * 1.2; ctx.stroke();
        path(); ctx.strokeStyle = S.mix(C.rule, C.paper, 0.35); ctx.lineWidth = sc * 0.085; ctx.stroke();
        ctx.restore();
        BR.forEach((b, i) => {
          const s = P(b.s), t = P(b.t), d = [t[0] - s[0], t[1] - s[1]], L = Math.hypot(d[0], d[1]), n = [-d[1] / L * iw * 1.3, d[0] / L * iw * 1.3];
          const ab = a * S.ease(k1 * 8 - i * 0.9);
          S.line([[s[0] + n[0], s[1] + n[1]], [t[0] + n[0], t[1] + n[1]]], { color: C.ink, w: iw * 0.8, alpha: ab });
          S.line([[s[0] - n[0], s[1] - n[1]], [t[0] - n[0], t[1] - n[1]]], { color: C.ink, w: iw * 0.8, alpha: ab });
          S.text(b.n, (s[0] + t[0]) / 2 + (b.s[0] === b.t[0] ? fs * 0.75 : 0), (s[1] + t[1]) / 2 + (b.s[0] === b.t[0] ? fs * 0.3 : -fs * 0.6), { size: fs * 0.85, color: C.ink, alpha: ab });
        });
        PLACE.forEach((nm, i) => { const q = P(MAPN[i]); S.text(nm, q[0], q[1] + fs * 0.35, { size: fs * (nar ? 0.85 : 1), color: C.soft, alpha: a }); });
        S.text("Königsberg and the Pregel river", P([0.06, 0.02])[0], P([0, 0.02])[1], { size: fs * 0.9, color: C.soft, align: "left", alpha: a * (nar ? 0 : 1) });
      }
      // 2. the graph: land becomes a dot, every bridge becomes a line
      const rN = Math.max(9, fs * (nar ? 0.62 : 0.75));
      const walkOn = kd > 0.99;
      if (walkOn) st.wt += dt * (S.p.speed ?? 1);
      const per = 0.85, n = st.trail.length, hold = 2.6, cyc = n * per + hold;
      if (st.wt > cyc) st.wt = 0;
      const steps = walkOn ? st.wt / per : 0, doneN = Math.min(n, Math.floor(steps));
      const usedE = new Set(st.trail.slice(0, doneN).map(s => s.e));
      st.edges.forEach((e, i) => {
        const pts = e.mp.map((p, j) => P(lerp(p, e.g[j], m)));
        const on = usedE.has(i), left = walkOn && doneN >= n && !on;
        S.line(pts, { color: on ? C.accent : C.ink, w: on ? iw * 1.15 : iw * (0.55 + 0.25 * m), alpha: k1 * Math.min(1, m * 1.6), dash: left ? [iw * 1.6, iw * 1.4] : null });
      });
      // the walker
      let pos = null;
      if (walkOn && n) {
        const j = Math.min(n - 1, Math.floor(steps)), f = steps >= n ? 1 : steps - j, s = st.trail[j], e = st.edges[s.e];
        const pts = e.a === s.from ? e.g : e.g.slice().reverse(), fi = f * NS, i0 = Math.floor(fi), i1 = Math.min(NS, i0 + 1);
        if (fi < 1 || steps < n) { const pa = lerp(pts[i0], pts[i1], fi - i0); const q = pts.slice(0, i0 + 1).concat([pa]);
          S.line(q.map(P), { color: C.accent, w: iw * 1.15 }); pos = P(pa); }
        else pos = P(GRAPHN[s.to]);
      }
      if (m > 0) S.line([P([0.02, 0.5]), P(GRAPHN[0])], { color: C.accent, w: iw * 0.6, alpha: m * 0.8 });
      [0, 1, 2, 3].forEach(i => {
        const q = P(lerp(MAPN[i], GRAPHN[i], m)), odd = st.deg[i] % 2 === 1, sel = st.sel === i;
        S.circle(q[0], q[1], rN, { color: C.ink, w: iw * 0.8, fill: C.paper, alpha: Math.max(m, 0.0001) * k1 });
        if (sel) S.circle(q[0], q[1], rN * 1.6, { color: C.accent, w: iw * 0.6, dash: [iw, iw] });
        S.text(NAMES[i], q[0], q[1] + rN * 0.38, { size: rN * 1.15, color: C.ink, alpha: m, halo: false });
        if (S.p.deg && kd > 0) {
          const off = i === 0 ? [-rN * 1.2, rN * 2.1] : i === 3 ? [rN * 2.3, 0] : i === 1 ? [rN * 2.4, -rN * 0.2] : [rN * 2.4, rN * 0.2];
          S.circle(q[0] + off[0], q[1] + off[1], rN * 0.8, { color: odd ? C.accent : C.soft, w: iw * (odd ? 0.7 : 0.45), alpha: kd });
          S.text(String(st.deg[i]), q[0] + off[0], q[1] + off[1] + rN * 0.32, { size: rN * 0.95, color: odd ? C.accent : C.ink, weight: 600, italic: false, alpha: kd, halo: false });
        }
      });
      if (pos) S.dot(pos[0], pos[1], iw * 2, C.accent);
      // 3. the rule, and the AI layer: message passing on a graph
      const nOdd = st.odd.length, E = st.edges.length;
      let verdict;
      if (!E) verdict = "no bridges left";
      else if (nOdd > 2) verdict = `${nOdd} odd nodes → no such walk`;
      else if (!st.full) verdict = "the land is split → no walk";
      else verdict = nOdd === 2 ? `2 odd nodes → walk from ${NAMES[st.odd[0]]} to ${NAMES[st.odd[1]]}` : "0 odd nodes → a round trip";
      const tx = st.R.x, ty = st.by, lh = fs * (nar ? 1.25 : 1.55), fz = fs * (nar ? 0.8 : 1.02);
      if (kd > 0) {
        S.text(`degree = bridges touching a node`, tx, ty, { align: "left", size: fz, color: C.ink, alpha: kd });
        S.text(nar ? "rule: a walk using each bridge once" : "Euler's rule: a walk using each bridge once", tx, ty + lh, { align: "left", size: fz, color: C.ink, alpha: kd });
        S.text("needs 0 or 2 odd nodes", tx, ty + lh * 2, { align: "left", size: fz, color: C.ink, alpha: kd });
        S.text(verdict, tx, ty + lh * 3.15, { align: "left", size: fz * 1.1, color: C.accent, weight: 600, alpha: kd });
      }
      if (st.ready && kr > 0) S.text(nar ? "tap a bridge to remove it · tap two dots to add one" : "click a bridge to remove it · click two dots to add one",
        P([0.75, 0])[0], st.R.y - fs * (nar ? -0.1 : 0.6), { size: fs * (nar ? 0.72 : 0.85), color: C.soft, alpha: kr * (nar ? 0 : 1) });
      if (kr > 0) {
        const M = st.M, top = fs * (nar ? 2.4 : 3.2), ms = Math.min(M.w / 1.3, (M.h - top) * 0.92), mx = M.x + (M.w - ms * 1.2) / 2, my = M.y + top;
        const G = [[0.08, 0.55], [0.6, 0.2], [0.6, 0.92], [1.12, 0.55]].map(p => [mx + p[0] * ms, my + p[1] * ms]);
        S.text("graph neural network", M.x + M.w / 2, M.y + fs * 0.25, { size: fz * 1.02, color: C.accent, weight: 600, alpha: kr });
        S.text("nodes pass messages", M.x + M.w / 2, M.y + fs * 0.25 + fz * 1.15, { size: fz * 0.85, color: C.ink, alpha: kr });
        const pairs = [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3]];
        pairs.forEach(([a, b]) => S.line([G[a], G[b]], { color: C.soft, w: iw * 0.45, alpha: kr }));
        const tgt = Math.floor(ft * 0.5) % 4, f = (ft * 0.5) % 1;
        pairs.forEach(([a, b]) => {
          if (a !== tgt && b !== tgt) return; const src = a === tgt ? b : a;
          const p = lerp(G[src], G[tgt], S.ease(f)); S.dot(p[0], p[1], iw * 0.9, C.accent, kr);
        });
        G.forEach((g, i) => {
          S.circle(g[0], g[1], ms * 0.07, { color: i === tgt ? C.accent : C.ink, w: iw * 0.55, fill: C.paper, alpha: kr });
          for (let j = 0; j < 3; j++) { // each node holds a small vector
            const h = ms * 0.12 * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + j * 2.1 + (i === tgt ? f * 2.5 : 0))));
            const bx = g[0] - ms * 0.06 + j * ms * 0.06, base = g[1] - ms * 0.1;
            S.line([[bx, base], [bx, base - h]], { color: i === tgt ? C.accent : C.ink, w: Math.max(1.5, iw * 0.55), alpha: kr });
          }
        });
      }
      let walk = "";
      if (walkOn && n) walk = steps >= n ? (st.full ? ` · walked all ${E} bridges once` : ` · stuck at ${NAMES[st.trail[n - 1].to]}, ${E - n} bridge${E - n > 1 ? "s" : ""} never crossed`) : ` · walking: ${doneN} of ${E} bridges`;
      return `${E} bridges · degrees A ${st.deg[0]}, B ${st.deg[1]}, C ${st.deg[2]}, D ${st.deg[3]} · ${verdict}${walk}`;
    },
    code(S) {
      const st = S.st, E = st.edges || [];
      const el = E.map(e => `"${NAMES[e.a]}${NAMES[e.b]}"`).join(", ");
      return `${S.c("# Euler, 1735: only the connections matter")}
edges = [${S.v(el)}]
degree = Counter()
for a, b in edges:
    degree[a] += 1; degree[b] += 1
${S.c("# " + NAMES.map((n, i) => n + ": " + (st.deg ? st.deg[i] : 0)).join("  "))}
odd = [n for n in degree if degree[n] % 2 == 1]
walk_exists = len(odd) in (0, 2)    ${S.c("# " + (st.odd ? st.odd.length : 0) + " odd → " + (st.odd && st.odd.length <= 2 && st.full ? "True" : "False"))}`;
    },
  });
})();
