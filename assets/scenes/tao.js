// Terence Tao — the Green–Tao theorem (2004): primes contain arithmetic progressions of every length.
// Search the primes for evenly spaced runs; → Lean checks every claim, AI as a co-mathematician.
(function () {
  const MAXN = 2000, SIEVE = new Uint8Array(MAXN + 1).fill(1); SIEVE[0] = SIEVE[1] = 0;
  for (let i = 2; i * i <= MAXN; i++) if (SIEVE[i]) for (let j = i * i; j <= MAXN; j += i) SIEVE[j] = 0;
  const isP = n => n >= 0 && n <= MAXN && SIEVE[n] === 1;
  function findAPs(k, N) {
    const P = []; for (let n = 2; n <= N; n++) if (isP(n)) P.push(n);
    const out = [];
    for (const a of P) for (let d = 1; a + (k - 1) * d <= N; d++) {
      let ok = true; for (let i = 1; i < k; i++) if (!isP(a + i * d)) { ok = false; break; }
      if (ok) out.push({ a, d, last: a + (k - 1) * d });
    }
    out.sort((x, y) => x.last - y.last || x.d - y.d);
    return { P, aps: out };
  }

  Lineage.scene({
    params: [
      { id: "k", label: "Length of the run, k", type: "range", min: 3, max: 8, step: 1, value: 5, fmt: v => v + " primes" },
      { id: "N", label: "Search the numbers up to", type: "select", value: "200", options: ["100", "200", "500", "1000", "2000"].map(v => ({ value: v, label: v })) },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Find another", run(S) { const st = S.st; if (st.aps.length) { st.idx = (st.idx + 1) % st.aps.length; st.tSwitch = st.ft; st.auto = false; } } }],
    init(S) { this.search(S); },
    onParam(S, id) { if (id !== "speed") this.search(S); },
    search(S) {
      const st = S.st, k = S.p.k | 0, N = +S.p.N, r = findAPs(k, N);
      st.P = r.P; st.aps = r.aps; st.idx = 0; st.tSwitch = st.ft || 0; st.auto = true; st.N = N; st.k = k;
      if (st.gr) this.grid(S);
    },
    grid(S) {
      const st = S.st, g = st.gr, N = st.N;
      let cols = Math.max(10, Math.ceil(Math.sqrt((N * g.w) / g.h))); if (N <= 200) cols = 10 * Math.max(1, Math.round(cols / 10));
      const rows = Math.ceil(N / cols), cell = Math.min(g.w / cols, g.h / rows);
      st.G = { cols, rows, cell, x0: g.x + (g.w - cols * cell) / 2, y0: g.y };
    },
    layout(S) {
      const b = S.box, st = S.st, wide = b.w / b.h > 1.15; st.wide = wide;
      if (!wide) {
        st.gr = { x: b.x + b.w * 0.03, y: b.y + b.h * 0.03, w: b.w * 0.94, h: b.h * 0.5 };
        st.nl = { x: b.x + b.w * 0.05, y: b.y + b.h * 0.67, w: b.w * 0.9 };
        st.ln = { x: b.x + b.w * 0.03, y: b.y + b.h * 0.77, w: b.w * 0.94, h: b.h * 0.23 };
      } else {
        st.gr = { x: b.x, y: b.y + b.h * 0.01, w: b.w, h: b.h * 0.42 };
        st.nl = { x: b.x + b.w * 0.03, y: b.y + b.h * 0.7, w: b.w * 0.94 };
        st.ln = { x: b.x, y: b.y + b.h * 0.8, w: b.w, h: b.h * 0.2 };
      }
      if (st.aps) this.grid(S);
    },
    entry(S) { const g = S.st.gr; return [g.x, g.y + g.h * 0.5]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, wide = st.wide, G = st.G, K = st.k;
      st.ft = ft;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.6) / 0.4);
      if (st.auto && st.aps.length > 1 && ft - st.tSwitch > 4) { st.idx = (st.idx + 1) % Math.min(st.aps.length, 12); st.tSwitch = ft; }
      const pos = n => { const i = n - 1, c = i % G.cols, r = Math.floor(i / G.cols); return [G.x0 + (c + 0.5) * G.cell, G.y0 + (r + 0.5) * G.cell]; };
      // ---- beat 1: the primes ----
      const shown = Math.floor(st.N * Math.min(1, k1 * 1.2));
      const showNums = G.cell > fs * 1.15;
      for (let n = 1; n <= shown; n++) {
        const [x, y] = pos(n);
        if (isP(n)) {
          if (showNums) S.text(String(n), x, y + G.cell * 0.18, { size: Math.min(fs * 0.8, G.cell * 0.42), color: C.ink, italic: false, weight: 600, halo: false });
          else S.dot(x, y, Math.max(1.3, G.cell * 0.24), C.ink);
        } else if (showNums) S.text(String(n), x, y + G.cell * 0.18, { size: Math.min(fs * 0.7, G.cell * 0.36), color: S.mix(C.soft, C.paper, 0.45), italic: false, halo: false });
        else S.dot(x, y, Math.max(0.6, G.cell * 0.07), C.soft, 0.6);
      }
      S.text(`primes up to ${st.N}: ${st.P.length}`, st.gr.x + st.gr.w / 2, G.y0 + G.rows * G.cell + fs * 1.1, { size: fs * 0.8, color: C.soft, alpha: k1 });
      // ---- beat 2: an evenly spaced run of primes ----
      const ap = st.aps[st.idx];
      let ro = `no run of ${K} evenly spaced primes below ${st.N}; search further`;
      if (k2 > 0 && ap) {
        const since = ft - st.tSwitch, terms = []; for (let i = 0; i < K; i++) terms.push(ap.a + i * ap.d);
        const m = Math.min(K, Math.floor(since * 4) + 1);
        const pts = terms.slice(0, m).map(pos);
        S.line(pts, { color: C.accent, w: iw * 0.6, alpha: k2 * 0.7 });
        pts.forEach(p => S.circle(p[0], p[1], Math.max(G.cell * 0.46, iw * 1.6), { color: C.accent, w: iw * 0.8, alpha: k2 }));
        // number line with equal hops
        const nl = st.nl, lo = Math.max(0, ap.a - ap.d * 0.5), hi = ap.last + ap.d * 0.5, X = n => nl.x + ((n - lo) / (hi - lo)) * nl.w;
        S.line([[nl.x, nl.y], [nl.x + nl.w, nl.y]], { color: C.ink, w: iw * 0.45, alpha: k2 });
        const span = hi - lo, stepTick = span > 400 ? 0 : 1;
        if (stepTick) for (let n = Math.ceil(lo); n <= hi; n++) if (isP(n)) S.line([[X(n), nl.y - fs * 0.25], [X(n), nl.y + fs * 0.25]], { color: C.ink, w: iw * 0.3, alpha: k2 * 0.6 });
        terms.forEach((t, i) => {
          const x = X(t), a = i < m ? k2 : 0;
          S.dot(x, nl.y, iw * 1.1, C.accent, a);
          if (i < m && (K <= 6 || !wide || i % 2 === 0 || i === K - 1)) S.text(String(t), x, nl.y + fs * 1.25, { size: fs * (wide ? 0.75 : 0.85), color: C.accent, weight: 600, italic: false, alpha: a });
          if (i && i < m) {
            const x0 = X(terms[i - 1]), hpts = []; for (let j = 0; j <= 16; j++) { const u = j / 16; hpts.push([x0 + (x - x0) * u, nl.y - Math.sin(Math.PI * u) * Math.min(fs * 1.6, (x - x0) * 0.45)]); }
            S.line(hpts, { color: C.accent, w: iw * 0.6, alpha: a });
          }
        });
        S.text(`+${ap.d} each time`, nl.x + nl.w / 2, nl.y - Math.min(fs * 1.6, (X(terms[1]) - X(terms[0])) * 0.45) - fs * 0.5, { size: fs * 0.85, color: C.accent, alpha: k2 });
        ro = `${terms.join(", ")} · step ${ap.d} · run ${st.idx + 1} of ${st.aps.length} with ${K} primes below ${st.N}`;
      }
      // ---- beat 3: Lean checks, AI assists ----
      if (k3 > 0 && ap) {
        const ln = st.ln, sz = wide ? fs * 0.75 : Math.min(fs * 0.78, ln.w / 46);
        const terms = []; for (let i = 0; i < K; i++) terms.push(ap.a + i * ap.d);
        let y = ln.y + sz * 1.1;
        S.text(wide ? "Lean checks it:" : "Lean proof assistant: every claim checked by computer", ln.x, y, { size: fs * 0.82, color: C.accent, align: "left", alpha: k3 });
        if (wide) {
          const t = `[${terms.join(",")}].all Nat.Prime ✓`, tsz = Math.min(sz, (ln.w * 0.62) / t.length / 0.6);
          S.text(t, ln.x + ln.w, y, { size: tsz, mono: true, italic: false, color: C.ink, align: "right", alpha: k3 });
          y += sz * 2.6;
        } else {
          y += sz * 1.9;
          S.text(`example : [${terms.join(", ")}].all Nat.Prime := by decide`, ln.x, y, { size: sz, mono: true, italic: false, color: C.ink, align: "left", alpha: k3 });
          y += sz * 1.75;
          S.text("✓ checked", ln.x, y, { size: sz * 1.1, italic: false, weight: 600, color: C.accent, align: "left", alpha: k3 });
          y += sz * 2.4;
        }
        // AI suggests → Lean checks → human directs
        const steps = wide ? ["AI suggests", "Lean checks", "humans direct"] : ["AI tools suggest", "Lean checks", "humans direct"];
        const bw = (ln.w - fs * 2) / 3;
        steps.forEach((t, i) => {
          const x = ln.x + i * (bw + fs), cx = x + bw / 2;
          S.rect(x, y - sz * 1.2, bw, sz * 1.8, { color: C.accent, w: iw * 0.45, alpha: k3 });
          S.text(t, cx, y + sz * 0.15, { size: sz * 0.95, color: C.accent, alpha: k3 });
          if (i < 2) S.arrow(x + bw + 2, y - sz * 0.3, x + bw + fs - 2, y - sz * 0.3, { color: C.accent, w: iw * 0.4, alpha: k3, head: 6 });
        });
      }
      return ro;
    },
    code(S) {
      const st = S.st, ap = st.aps[st.idx], K = st.k;
      return `${S.c("# search the primes for evenly spaced runs")}
k, N = ${S.v(K)}, ${S.v(st.N)}
primes = sieve(N)
for a in primes:
    for d in range(1, N):
        run = [a + i*d for i in range(k)]
        if run[-1] > N: break
        if all(is_prime(n) for n in run):
            found.append(run)        ${S.c("# " + st.aps.length + " runs found")}
${S.c(ap ? "# e.g. " + Array.from({ length: K }, (_, i) => ap.a + i * ap.d).join(", ") : "# none: raise N")}
${S.c("# Green-Tao (2004): runs exist for every k")}`;
    },
  });
})();
