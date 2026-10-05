// Radia Perlman — Spanning Tree Protocol: bridges elect a root (lowest ID), keep the shortest path to it,
// block every other link so no loops remain; cut a link and it re-converges → AI data-centre fabrics
Lineage.scene({
  params: [
    { id: "n", label: "Bridges", type: "range", min: 4, max: 12, step: 1, value: 8, fmt: v => String(v) },
    { id: "speed", label: "Message speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  actions: [{ label: "Mend all links", run(S) { S.st.cut = new Set(); S.st.t0 = S.st.ft || 0; } }],
  init(S) { S.st.cut = new Set(); S.st.t0 = 0; this.build(S); },
  reset(S) { S.st.cut = new Set(); S.st.t0 = 0; },
  onParam(S, id) { if (id === "n") { S.st.cut = new Set(); S.st.t0 = S.st.ft || 0; this.build(S); this.place(S); } },
  build(S) {
    const st = S.st, n = Math.round(S.p.n), r = S.rng(100 + n);
    const ids = []; while (ids.length < n) { const v = 10 + Math.floor(r() * 90); if (!ids.includes(v)) ids.push(v); }
    const E = [], has = (a, b) => E.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    for (let i = 0; i < n; i++) E.push([i, (i + 1) % n]);                  // a ring: already one loop
    for (let i = 0; i < n; i++) if (r() < 0.5) { const j = (i + 2 + Math.floor(r() * Math.max(1, n - 3))) % n; if (j !== i && !has(i, j)) E.push([i, j]); }
    if (E.length < n + 2 && n > 4 && !has(0, Math.floor(n / 2))) E.push([0, Math.floor(n / 2)]);
    st.ids = ids; st.E = E; st.n = n; st.jit = Array.from({ length: n }, () => [r() - 0.5, r() - 0.5]);
  },
  place(S) {
    const st = S.st, { box, narrow } = S, nw = box.w * (narrow ? 0.6 : 0.6);
    const cx = box.x + nw * 0.5, cy = box.y + box.h * 0.5, rx = nw * 0.4, ry = box.h * 0.36;
    st.pos = st.ids.map((_, i) => { const a = -Math.PI / 2 + (i / st.n) * Math.PI * 2; return [cx + rx * Math.cos(a) + st.jit[i][0] * rx * 0.25, cy + ry * Math.sin(a) + st.jit[i][1] * ry * 0.25]; });
    st.nr = Math.max(13, S.fs * 0.95);
    st.ix = box.x + nw + box.w * 0.03; st.iw2 = box.x + box.w - st.ix;
  },
  layout(S) { if (!S.st.ids || S.st.n !== Math.round(S.p.n)) this.build(S); if (!S.st.cut) S.st.cut = new Set(); this.place(S); },
  entry(S) { const st = S.st; let b = 0; if (S.narrow) { st.pos.forEach((p, i) => { if (p[1] > st.pos[b][1]) b = i; }); return [st.pos[b][0], st.pos[b][1] + st.nr * 0.7 + S.iw]; } st.pos.forEach((p, i) => { if (p[0] < st.pos[b][0]) b = i; }); return [st.pos[b][0] - st.nr - S.iw, st.pos[b][1]]; },
  tree(S) {
    // STP: lowest ID is root; each bridge keeps the link towards the root with fewest hops (ties: lowest neighbour ID)
    const st = S.st, n = st.n, adj = Array.from({ length: n }, () => []);
    st.E.forEach((e, k) => { if (!st.cut.has(k)) { adj[e[0]].push([e[1], k]); adj[e[1]].push([e[0], k]); } });
    let root = 0; st.ids.forEach((v, i) => { if (v < st.ids[root]) root = i; });
    const d = Array(n).fill(Infinity); d[root] = 0; const q = [root];
    while (q.length) { const u = q.shift(); adj[u].forEach(([v]) => { if (d[v] === Infinity) { d[v] = d[u] + 1; q.push(v); } }); }
    const par = Array(n).fill(-1), pk = Array(n).fill(-1);
    for (let v = 0; v < n; v++) if (v !== root && d[v] < Infinity) {
      let best = null; adj[v].forEach(([u, k]) => { if (d[u] === d[v] - 1 && (!best || st.ids[u] < st.ids[best[0]])) best = [u, k]; });
      par[v] = best[0]; pk[v] = best[1];
    }
    return { root, d, par, pk, active: new Set(pk.filter(k => k >= 0)) };
  },
  pointer(S, type, x, y) {
    if (type !== "down") return;
    const st = S.st; let best = -1, bd = Math.max(14, st.nr);
    st.E.forEach((e, k) => {
      const a = st.pos[e[0]], b = st.pos[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)), px = a[0] + t * dx, py = a[1] + t * dy, dd = Math.hypot(x - px, y - py);
      if (dd < bd && t > 0.08 && t < 0.92) { bd = dd; best = k; }
    });
    if (best >= 0) { if (st.cut.has(best)) st.cut.delete(best); else st.cut.add(best); st.t0 = st.ft || 0; st.last = best; }
  },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nr = st.nr, lab = Math.max(12, fs * 0.82);
    st.ft = ft;
    const kA = S.ease(k / 0.35), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const T = this.tree(S), hop = (ft - st.t0) / 0.55; // the tree spreads out from the root one hop at a time
    const known = v => T.d[v] <= hop;
    // links
    st.E.forEach((e, k2) => {
      const a = st.pos[e[0]], b = st.pos[e[1]], ea = S.ease(kA * st.E.length * 0.25 - k2 * 0.25 + 0.5);
      if (ea <= 0) return;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ux = (b[0] - a[0]), uy = (b[1] - a[1]), ul = Math.hypot(ux, uy);
      if (st.cut.has(k2)) {
        const g = nr * 0.5 / ul;
        S.line([a, [m[0] - ux * g, m[1] - uy * g]], { w: iw * 0.5, color: C.soft, alpha: ea });
        S.line([[m[0] + ux * g, m[1] + uy * g], b], { w: iw * 0.5, color: C.soft, alpha: ea });
        S.text("cut", m[0], m[1] - nr * 0.5, { size: lab * 0.85, color: C.soft, alpha: ea });
        return;
      }
      const child = T.pk.indexOf(k2), isTree = child >= 0 && known(child);
      if (kB > 0 && isTree) {
        S.line([a, b], { w: iw * 0.6, color: C.ink, alpha: ea * (1 - kB) });
        S.line([a, b], { w: iw * 1.25, color: C.accent, alpha: ea * kB });
      } else if (kB > 0 && hop > Math.max(T.d[e[0]], T.d[e[1]]) - 0.01 && T.d[e[0]] < Infinity) {
        S.line([a, b], { w: iw * 0.45, color: C.soft, dash: [iw * 1.2, iw * 1.4], alpha: ea });
        const nx = -uy / ul, ny = ux / ul, s = nr * 0.45; // blocked port marker near the end that blocks it
        const end = T.d[e[0]] > T.d[e[1]] || (T.d[e[0]] === T.d[e[1]] && st.ids[e[0]] > st.ids[e[1]]) ? 0 : 1;
        const p = end === 0 ? [a[0] + ux / ul * nr * 1.6, a[1] + uy / ul * nr * 1.6] : [b[0] - ux / ul * nr * 1.6, b[1] - uy / ul * nr * 1.6];
        S.line([[p[0] - nx * s, p[1] - ny * s], [p[0] + nx * s, p[1] + ny * s]], { w: iw * 0.9, color: C.ink, alpha: ea * kB });
      } else S.line([a, b], { w: iw * 0.6, color: C.ink, alpha: ea });
    });
    // hello messages (BPDUs) flowing from the root down the tree
    if (kB > 0) {
      const cyc = (ft * 0.9) % 1;
      for (let v = 0; v < st.n; v++) if (T.par[v] >= 0 && known(v)) {
        const a = st.pos[T.par[v]], b = st.pos[v], dep = T.d[v], u = (cyc * 3 - (dep - 1) * 0.5) % 3;
        if (u >= 0 && u <= 1) S.dot(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, iw * 1.1, C.accent, kB);
      }
    }
    // bridges
    st.pos.forEach((p, i) => {
      const a = S.ease(kA * st.n * 0.5 - i * 0.5 + 0.5); if (a <= 0) return;
      const isRoot = i === T.root && kB > 0, lost = T.d[i] === Infinity;
      S.line([[p[0] - nr, p[1] - nr * 0.7], [p[0] + nr, p[1] - nr * 0.7], [p[0] + nr, p[1] + nr * 0.7], [p[0] - nr, p[1] + nr * 0.7]], { close: true, w: iw * (isRoot ? 0.9 : 0.6), color: isRoot ? C.accent : lost ? C.soft : C.ink, fill: C.paper, alpha: a });
      S.text(String(st.ids[i]), p[0], p[1] + nr * 0.33, { size: nr * 0.95, color: isRoot ? C.accent : lost ? C.soft : C.ink, alpha: a, italic: false, mono: true, weight: isRoot ? 500 : 400, halo: false });
      if (isRoot) S.text("root", p[0], p[1] - nr * 1.15, { size: lab, color: C.accent, alpha: kB, weight: 500 });
      if (kB > 0 && !isRoot && T.d[i] < Infinity && known(i) && !S.narrow) S.text(T.d[i] + (T.d[i] === 1 ? " hop" : " hops"), p[0], p[1] + nr * 1.75, { size: lab * 0.78, color: C.soft, alpha: kB, italic: false, mono: true });
    });
    if (kB > 0) {
      const bx = S.box.x + S.box.w * (S.narrow ? 0.3 : 0.3), by = S.box.y + S.box.h - lab * 0.4;
      S.text(S.narrow ? "tap a link to cut it" : "click a link to cut it", bx, by, { size: lab * 0.9, color: C.soft, alpha: kB });
    }
    // AI beat: a leaf–spine fabric linking GPUs: every path active, chosen by link-state routing
    if (kC > 0) {
      const x0 = st.ix, w = st.iw2, y0 = S.box.y + S.box.h * 0.18, h = S.box.h * 0.5;
      const sp = [0.3, 0.7].map(f => [x0 + w * f, y0 + h * 0.12]), lf = [0.1, 0.37, 0.63, 0.9].map(f => [x0 + w * f, y0 + h * 0.62]);
      const bs = Math.max(5, nr * 0.55);
      sp.forEach(s => lf.forEach((l, j) => S.line([s, l], { w: iw * 0.55, color: C.accent, alpha: kC * 0.85 })));
      sp.forEach(s => S.rect(s[0] - bs, s[1] - bs * 0.7, bs * 2, bs * 1.4, { w: iw * 0.6, color: C.accent, fill: C.paper, alpha: kC }));
      lf.forEach(l => { S.rect(l[0] - bs, l[1] - bs * 0.7, bs * 2, bs * 1.4, { w: iw * 0.6, color: C.accent, fill: C.paper, alpha: kC });
        [-1, 1].forEach(sg => { const g = [l[0] + sg * bs * 0.9, l[1] + h * 0.28]; S.line([[l[0], l[1] + bs * 0.7], g], { w: iw * 0.4, color: C.ink, alpha: kC }); S.rect(g[0] - bs * 0.6, g[1], bs * 1.2, bs * 1.2, { w: iw * 0.5, color: C.ink, alpha: kC }); }); });
      // a few packets taking different paths at once
      for (let j = 0; j < 4; j++) { const s = sp[j % 2], l = lf[j], u = (ft * 0.7 + j * 0.27) % 1; S.dot(l[0] + (s[0] - l[0]) * u, l[1] + (s[1] - l[1]) * u, iw * 1, C.accent, kC); }
      const tx = x0 + w / 2;
      S.text("AI cluster", tx, y0 - lab * 0.9, { size: lab * 1.05, color: C.accent, alpha: kC, weight: 500 });
      S.text("spine", sp[1][0] + bs * 1.4, sp[1][1] + lab * 0.35, { size: lab * 0.8, color: C.accent, alpha: kC, align: "left" });
      S.text("GPUs", tx, y0 + h * 0.9 + bs * 1.2 + lab * 1.2, { size: lab * 0.85, color: C.ink, alpha: kC });
      S.text("all paths active:", tx, y0 + h * 0.9 + bs * 1.2 + lab * 2.7, { size: lab * 0.9, color: C.accent, alpha: kC });
      S.text("link-state routing", tx, y0 + h * 0.9 + bs * 1.2 + lab * 3.8, { size: lab * 0.9, color: C.accent, alpha: kC });
      if (!S.narrow) S.text("“A graph more lovely than a tree.”", tx, S.box.y + S.box.h - lab * 1.6, { size: lab * 0.85, color: C.soft, alpha: kC });
      if (!S.narrow) S.text("Perlman, Algorhyme", tx, S.box.y + S.box.h - lab * 0.4, { size: lab * 0.75, color: C.soft, alpha: kC, italic: false, mono: true });
    }
    const blocked = st.E.length - st.cut.size - T.active.size, lost = T.d.filter(v => v === Infinity).length;
    st.T = T;
    const conv = hop < Math.max(...T.d.filter(v => v < Infinity)) + 1 ? "converging… " : "";
    return `${conv}${st.n} bridges · root ${st.ids[T.root]} · ${T.active.size} active links, ${blocked} blocked` + (st.cut.size ? ` · ${st.cut.size} cut` : "") + (lost ? ` · ${lost} cut off` : " · no loops");
  },
  code(S) {
    const st = S.st, T = st.T || this.tree(S), blocked = st.E.length - st.cut.size - T.active.size;
    return `${S.c("# Spanning Tree Protocol: every bridge runs this")}
root = min(bridges, key=bridge_id)      ${S.c("# " + st.ids[T.root])}
hops = shortest_hops_from(root)

for b in bridges:
    if b is root: continue
    up = min(b.links, key=lambda l: (hops[l.peer], l.peer.id))
    forward(up)                         ${S.c("# one way towards the root")}

block(all other links)                  ${S.c("# " + blocked + " blocked: no loops")}
on link_down: run again                 ${S.c("# the tree heals itself")}`;
  },
});
