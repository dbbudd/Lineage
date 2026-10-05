// Tim Berners-Lee — the 1989 "mesh" of linked documents → a reader clicking through hypertext → a crawler gathering the web into a training corpus
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  const NAMES = ["This document", "Linked information", "Hypertext", "CERNDOC", "ENQUIRE", "Hyper Card", "VAX/NOTES", "uucp News",
    "IBM GroupTalk", "Hierarchical systems", "Computer conferencing", "Tim Berners-Lee", "C.E.R.N", "Comms ACM", "Hypermedia", "Mesh"];
  const CRAWL = 0.55, HOP = 1.7;

  function build(S) {
    const N = +S.p.pages, L = +S.p.links, r = S.rng(1989 + N * 31 + L * 7);
    // pages scattered, then relaxed by a little spring layout (unit square)
    const P = []; for (let i = 0; i < N; i++) { const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / N) * 0.45; P.push([0.5 + rr * Math.cos(a), 0.5 + rr * Math.sin(a)]); }
    const E = [], out = P.map(() => []);
    const addE = (a, b) => { if (a !== b && !out[a].includes(b)) { out[a].push(b); E.push([a, b]); } };
    for (let i = 1; i < N; i++) addE(Math.floor(r() * i), i);                       // every page is linked from an earlier one
    for (let i = 0; i < N; i++) { let g = 0; while (out[i].length < L && g++ < 30) { const d = P.map((p, j) => [Math.hypot(p[0] - P[i][0], p[1] - P[i][1]) + r() * 0.35, j]).sort((a, b) => a[0] - b[0]); addE(i, d[1 + Math.floor(r() * Math.min(5, N - 1))][1]); } }
    for (let it = 0; it < 220; it++) {
      const F = P.map(() => [0, 0]), kk = 0.9 / Math.sqrt(N);
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        let dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d2 = dx * dx + dy * dy + 1e-4, f = (kk * kk) / d2 * 0.02;
        F[i][0] += dx * f; F[i][1] += dy * f; F[j][0] -= dx * f; F[j][1] -= dy * f;
      }
      for (const [a, b] of E) { const dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], d = Math.hypot(dx, dy) + 1e-6, f = (d - kk) * 0.05; F[a][0] += dx / d * f; F[a][1] += dy / d * f; F[b][0] -= dx / d * f; F[b][1] -= dy / d * f; }
      for (let i = 0; i < N; i++) { P[i][0] = Math.min(1, Math.max(0, P[i][0] + Math.max(-0.03, Math.min(0.03, F[i][0])))); P[i][1] = Math.min(1, Math.max(0, P[i][1] + Math.max(-0.03, Math.min(0.03, F[i][1])))); }
    }
    // normalise to fill the square
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    P.forEach(p => { p[0] = (p[0] - x0) / (x1 - x0 || 1); p[1] = (p[1] - y0) / (y1 - y0 || 1); });
    // put the seed page ("This document") where the line arrives: the left-most spot nearest the middle
    let li = 0, lb = Infinity; P.forEach((p, i) => { const sc = p[0] * 2 + Math.abs(p[1] - 0.5); if (sc < lb) { lb = sc; li = i; } });
    [P[0], P[li]] = [P[li], P[0]];
    // breadth-first crawl order from "This document"
    const order = [0], seen = new Set([0]);
    for (let q = 0; q < order.length; q++) for (const b of out[order[q]]) if (!seen.has(b)) { seen.add(b); order.push(b); }
    const words = P.map((_, i) => 180 + Math.floor(r() * 700));
    const name = i => NAMES[i] || "page " + (i + 1);
    Object.assign(S.st, { N, L, P, E, out, order, words, name, crawlT0: S.st.ft || 0, user: 0, from: 0, hopT: (S.st.ft || 0), clicks: 0, trail: [0], holdAt: null });
  }

  Lineage.scene({
    params: [
      { id: "pages", label: "Pages", type: "range", min: 8, max: 40, step: 1, value: 24, fmt: v => String(v) },
      { id: "links", label: "Links per page", type: "range", min: 1, max: 4, step: 1, value: 2, fmt: v => String(v) },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { build(S); },
    reset(S) { build(S); },
    onParam(S, id) { if (id !== "speed") build(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const pw = fs * (n ? 1.05 : 1.35), ph = pw * 1.3;
      const g = { x: B.x + pw * 0.9, y: B.y + fs * (n ? 1.6 : 2.0), w: B.w - pw * 1.8 - (n ? 0 : fs * 3.5), h: B.h * (n ? 0.56 : 0.6) };
      const corpusY = g.y + g.h + ph + fs * (n ? (S.narrow ? 1.4 : 2.3) : 2.2);
      Object.assign(S.st, { pw, ph, g, corpusY });
      if (!S.st.P) build(S);
    },
    entry(S) { const st = S.st; const p = st.P[0]; return [st.g.x + p[0] * st.g.w - st.pw * 0.5, st.g.y + p[1] * st.g.h]; },
    pointer(S, type, x, y) {
      if (type !== "down" || !S.st.P) return;
      const st = S.st; let best = -1, bd = Infinity;
      st.P.forEach((p, i) => { const d = Math.hypot(st.g.x + p[0] * st.g.w - x, st.g.y + p[1] * st.g.h - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < st.pw * 2.2 && best !== st.user) {
        st.from = st.user; st.user = best; st.hopT = st.ft; st.clicks++; st.jump = !st.out[st.from].includes(best); st.manualUntil = st.ft + HOP * 2.5;
        st.trail.push(best); if (st.trail.length > 8) st.trail.shift();
      }
    },
    draw(S, k, ft) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S);
      st.ft = ft;
      if (!st.P) build(S);
      const { P, E, g, pw, ph, order, words } = st;
      const at = i => [g.x + P[i][0] * g.w, g.y + P[i][1] * g.h];
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.66) / 0.34);
      // crawler progress
      if (k2 <= 0) st.crawlT0 = ft;
      const nCrawl = Math.min(order.length, Math.floor((ft - st.crawlT0) / CRAWL) + (k2 > 0 ? 1 : 0));
      if (nCrawl >= order.length) { if (st.holdAt == null) st.holdAt = ft; if (ft - st.holdAt > 3.5) { st.crawlT0 = ft; st.holdAt = null; } }
      const crawled = new Set(order.slice(0, nCrawl)), newest = nCrawl ? order[nCrawl - 1] : -1;
      const fracC = ((ft - st.crawlT0) / CRAWL) % 1;
      // links
      const nE = Math.floor(E.length * k1);
      for (let e = 0; e < nE; e++) {
        const [a, b] = E[e], A = at(a), Bp = at(b), dx = Bp[0] - A[0], dy = Bp[1] - A[1], d = Math.hypot(dx, dy) || 1;
        const sh = pw * 0.75, x0 = A[0] + dx / d * sh, y0 = A[1] + dy / d * sh, x1 = Bp[0] - dx / d * sh, y1 = Bp[1] - dy / d * sh;
        const frontier = crawled.has(a) && !crawled.has(b);
        S.arrow(x0, y0, x1, y1, { w: iw * (frontier ? 0.5 : 0.32), color: frontier ? C.accent : C.ink, alpha: frontier ? 0.85 : 0.35, head: Math.max(5, iw * 1.8) });
      }
      // pages
      for (let i = 0; i < P.length; i++) {
        const a = Math.max(0, Math.min(1, (k1 * P.length * 1.25 - i) / 2));
        if (a <= 0) continue;
        const [x, y] = at(i), c = crawled.has(i), isU = i === st.user;
        const col = c ? C.accent : C.ink;
        S.line([[x - pw / 2, y - ph / 2], [x + pw * 0.22, y - ph / 2], [x + pw / 2, y - ph / 2 + pw * 0.28], [x + pw / 2, y + ph / 2], [x - pw / 2, y + ph / 2]], { w: iw * (c ? 0.6 : 0.45), color: col, close: true, alpha: a, fill: S.C.paper });
        for (let l = 0; l < 3; l++) S.line([[x - pw * 0.32, y - ph * 0.12 + l * ph * 0.17], [x + pw * (l === 2 ? 0.05 : 0.3), y - ph * 0.12 + l * ph * 0.17]], { w: iw * 0.28, color: col, alpha: a * 0.7 });
        if (i === newest && fracC < 0.5 && k2 > 0) S.circle(x, y, pw * (0.9 + fracC * 1.2), { w: iw * 0.5, color: C.accent, alpha: (1 - fracC * 2) * 0.8 });
        const named = i < NAMES.length && (!S.narrow ? (P.length <= 26 || i < 10) && (!n || i < 8) : i === 0);
        if (named || isU) S.text(st.name(i), x, y + ph / 2 + fs * 0.95, { size: fs * (n ? 0.72 : 0.74), color: isU ? C.ink : C.soft, weight: isU ? 600 : 400, alpha: a });
      }
      // the reader, clicking from link to link
      if (k2 > 0) {
        if (ft - st.hopT > HOP && !(st.manualUntil > ft)) {
          const o = st.out[st.user]; if (o.length) { st.from = st.user; st.user = o[Math.floor(S.rng(Math.floor(ft * 10))() * o.length)]; st.hopT = ft; st.jump = false; st.trail.push(st.user); if (st.trail.length > 8) st.trail.shift(); }
        }
        const u = S.ease(Math.min(1, (ft - st.hopT) / (HOP * 0.45))), A = at(st.from), Bp = at(st.user);
        const cx = A[0] + (Bp[0] - A[0]) * u, cy = A[1] + (Bp[1] - A[1]) * u;
        // cursor: a little arrow pointer
        const s = fs * 0.9, px = cx + pw * 0.25, py = cy + ph * 0.05;
        S.line([[px, py], [px, py + s * 1.25], [px + s * 0.32, py + s * 0.95], [px + s * 0.55, py + s * 1.45], [px + s * 0.72, py + s * 1.36], [px + s * 0.5, py + s * 0.88], [px + s * 0.9, py + s * 0.85]], { w: iw * 0.5, color: C.ink, close: true, fill: C.paper, alpha: k2 });
        if (!n) S.text("click a page to follow it", g.x + g.w + pw * 0.9, B.y + fs * 0.9, { size: fs * 0.78, align: "right", color: C.soft, alpha: k2 });
      }
      S.text(n ? "a mesh of linked pages (1989)" : "“a ‘web’ of notes with links between them” (1989)", B.x, B.y + fs * 0.9, { size: fs * (n ? 0.85 : 0.92), align: "left", color: C.ink, alpha: k1 });
      // the corpus: text from every crawled page piles up
      let total = 0; order.slice(0, nCrawl).forEach(i => (total += words[i]));
      if (k2 > 0) {
        const tall = !S.narrow && B.h > B.w * 1.3;   // a tall, thin box beside a wide portrait: pile on the right, label above
        const cy = st.corpusY, cw = tall ? B.w * 0.56 : B.w * (n ? 0.62 : 0.55), cx0 = tall ? B.x + B.w * 0.44 : B.x, lineH = Math.max(2.5, iw * 0.75);
        const maxLines = Math.floor((B.y + B.h - cy - fs * (tall ? 4.6 : 0.6)) / lineH);
        const nl = Math.min(maxLines, Math.round((total / (P.length * 540)) * maxLines));
        const r = S.rng(7);
        for (let l = 0; l < nl; l++) { const y = B.y + B.h - fs * 0.4 - l * lineH, w = cw * (0.55 + 0.45 * r()); S.line([[cx0, y], [cx0 + w, y]], { w: lineH * 0.45, color: C.ink, alpha: 0.6 * k2 }); }
        // a strip of text flying from the newest page down to the pile
        if (newest >= 0 && fracC < 0.9) {
          const A = at(newest), tx = cx0 + cw * 0.5, ty = B.y + B.h - fs * 0.4 - nl * lineH, u = S.ease(fracC / 0.9);
          const x = A[0] + (tx - A[0]) * u, y = A[1] + (ty - A[1]) * u;
          for (let l = 0; l < 3; l++) S.line([[x - pw * 0.6, y + l * lineH], [x + pw * (0.6 - l * 0.2), y + l * lineH]], { w: lineH * 0.45, color: C.accent, alpha: (1 - u * 0.5) * k2 });
        }
        S.text(`corpus: ${nCrawl} of ${P.length} pages · ${total.toLocaleString("en-GB")} words`, cx0, cy - fs * 0.2, { size: fs * 0.85, align: "left", color: C.ink, alpha: k2 });
        if (k3 > 0 && tall) {
          const tx = B.x + B.w, ty = cy + fs * 1.5;
          S.text("training data for an LLM", tx, ty, { size: fs * 1.0, align: "right", color: C.accent, weight: 600, alpha: k3 });
          S.text("Common Crawl: billions of web pages", tx, ty + fs * 1.15, { size: fs * 0.78, align: "right", color: C.accent, alpha: k3 });
          S.arrow(tx - cw * 0.5, ty + fs * 1.6, tx - cw * 0.5, ty + fs * 2.6, { w: iw * 0.6, color: C.accent, alpha: k3 });
        } else if (k3 > 0) {
          const ax = cx0 + cw + fs * 0.8, ay = B.y + B.h - fs * 2.2, bx = B.x + B.w;
          S.arrow(ax, ay, Math.min(bx - fs * (n ? 4.5 : 6.5), ax + fs * 3), ay, { w: iw * 0.8, color: C.accent, alpha: k3 });
          const tx = bx;
          S.text("training data", tx, ay - fs * (n ? 1.5 : 1.9), { size: fs * (n ? 0.9 : 1.1), align: "right", color: C.accent, weight: 600, alpha: k3 });
          S.text("for an LLM", tx, ay - fs * (n ? 0.45 : 0.6), { size: fs * (n ? 0.9 : 1.1), align: "right", color: C.accent, weight: 600, alpha: k3 });
          S.text(n ? "Common Crawl: billions of pages" : "Common Crawl: billions of web pages", tx, ay + fs * (n ? 0.75 : 1.0), { size: fs * (n ? 0.68 : 0.8), align: "right", color: C.accent, alpha: k3 });
        }
      }
      return `crawled ${nCrawl} of ${P.length} pages · corpus ${total.toLocaleString("en-GB")} words · reader on “${st.name(st.user)}” after ${st.clicks} click${st.clicks === 1 ? "" : "s"}`;
    },
    code(S) {
      const st = S.st;
      return `${S.c("# a web crawler: breadth-first over hyperlinks")}
frontier = ["This document"]
seen, corpus = set(frontier), []
while frontier:
    page = fetch(frontier.pop(0))
    corpus.append(page.text)        ${S.c("# " + (+S.p.pages) + " pages in this web")}
    for link in page.links:         ${S.c("# " + S.p.links + " link" + (+S.p.links === 1 ? "" : "s") + " per page")}
        if link not in seen:
            seen.add(link)
            frontier.append(link)
train_language_model(corpus)       ${S.c("# Common Crawl: billions of pages")}`;
    },
  });
})();
