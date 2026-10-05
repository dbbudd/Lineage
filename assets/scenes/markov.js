// Andrey Markov — Eugene Onegin as vowels and consonants (1913); a two-state chain generates new sequences.
// → language models predicting the next token from the ones before.
(function () {
  const VOW = new Set("аеёиоуыэюяaeiouàáâäèéêëìíîïòóôöùúûü".split(""));
  const SKIP = new Set("ъь".split(""));
  const classify = text => {
    const out = [];
    for (const ch of String(text || "").toLowerCase()) {
      if (SKIP.has(ch) || !/\p{L}/u.test(ch)) continue;
      out.push({ ch, v: VOW.has(ch) });
    }
    return out;
  };
  const stats = L => {
    let vv = 0, vc = 0, cv = 0, cc = 0, nv = 0;
    L.forEach((x, i) => { if (x.v) nv++; if (i) { const a = L[i - 1].v, b = x.v; if (a && b) vv++; else if (a) vc++; else if (b) cv++; else cc++; } });
    return { n: L.length, nv, pvv: vv + vc ? vv / (vv + vc) : null, pcc: cc + cv ? cc / (cc + cv) : null };
  };
  const setParam = (id, v) => { const el = document.getElementById("p-" + id); if (el) { el.value = v; el.dispatchEvent(new Event("input")); } };

  Lineage.scene({
    params: [
      { id: "pvv", label: "P(vowel → vowel)", type: "range", min: 0, max: 0.95, step: 0.001, value: 0.128, fmt: v => v.toFixed(3) },
      { id: "pcc", label: "P(consonant → consonant)", type: "range", min: 0, max: 0.95, step: 0.001, value: 0.337, fmt: v => v.toFixed(3) },
      { id: "text", label: "Text to analyse (type your own)", type: "text", maxlength: 200, value: "Мой дядя самых честных правил, когда не в шутку занемог" },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [
      { label: "Use my text's odds", run(S) { const s = stats(classify(S.p.text)); if (s.pvv != null) setParam("pvv", s.pvv.toFixed(3)); if (s.pcc != null) setParam("pcc", s.pcc.toFixed(3)); } },
      { label: "Pushkin's odds", run(S) { setParam("pvv", 0.128); setParam("pcc", 0.337); } },
    ],
    init(S) { const st = S.st; st.seq = []; st.cur = 0; st.prev = 0; st.lastStep = null; st.nv = 0; st.n = 0; st.rng = S.rng(1913); st.L = classify(S.p.text); st.S = stats(st.L); },
    reset(S) { const st = S.st; st.seq = []; st.nv = 0; st.n = 0; st.lastStep = null; },
    onParam(S, id) { const st = S.st; if (id === "text") { st.L = classify(S.p.text); st.S = stats(st.L); } else if (id !== "speed") { st.nv = 0; st.n = 0; } },
    layout(S) {
      const b = S.box, st = S.st, wide = b.w / b.h > 1.15;
      st.wide = wide;
      if (!wide) {
        st.strip = { x: b.x + b.w * 0.02, y: b.y + b.h * 0.02, w: b.w * 0.96, cells: 22 };
        st.r = Math.min(b.w * 0.075, b.h * 0.07);
        st.V = [b.x + b.w * 0.3, b.y + b.h * 0.37]; st.C = [b.x + b.w * 0.7, b.y + b.h * 0.37];
        st.beads = { x: b.x + b.w * 0.04, y: b.y + b.h * 0.6, w: b.w * 0.92 };
        st.lm = { x: b.x + b.w * 0.04, y: b.y + b.h * 0.67, w: b.w * 0.92, h: b.h * 0.3 };
      } else {
        st.strip = { x: b.x, y: b.y, w: b.w, cells: 16 };
        st.r = Math.min(b.w * 0.05, b.h * 0.075);
        st.V = [b.x + b.w * 0.13, b.y + b.h * 0.52]; st.C = [b.x + b.w * 0.41, b.y + b.h * 0.52];
        st.beads = { x: b.x, y: b.y + b.h * 0.84, w: b.w * 0.5 };
        st.lm = { x: b.x + b.w * 0.56, y: b.y + b.h * 0.33, w: b.w * 0.44, h: b.h * 0.62 };
      }
    },
    entry(S) { const { strip } = S.st; return [strip.x, strip.y + S.fs * 1.2]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, r = st.r, wide = st.wide;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.6) / 0.4);
      const pvv = S.p.pvv, pcc = S.p.pcc;
      // ---- beat 1: the text as vowels and consonants ----
      const sp = st.strip, cw = sp.w / sp.cells, L = st.L, M = Math.min(L.length, sp.cells);
      const lsz = Math.min(fs * 1.15, cw * 0.95);
      for (let i = 0; i < M; i++) {
        const a = S.ease(k1 * M * 1.2 - i), x = sp.x + cw * (i + 0.5), y = sp.y + lsz;
        if (a <= 0) continue;
        S.text(L[i].ch, x, y, { size: lsz, color: C.ink, italic: false, alpha: a });
        S.text(L[i].v ? "V" : "C", x, y + lsz * 1.05, { size: lsz * 0.8, color: L[i].v ? C.accent : C.soft, weight: 600, italic: false, alpha: a });
        if (i && k2 > 0) { const same = L[i].v === L[i - 1].v; if (same) S.line([[x - cw * 0.85, y + lsz * 1.35], [x - cw * 0.15, y + lsz * 1.35]], { color: L[i].v ? C.accent : C.ink, w: iw * 0.45, alpha: k2 * a }); }
      }
      if (!L.length) S.text("type some text to see its vowels and consonants", sp.x + sp.w / 2, sp.y + lsz * 1.4, { size: fs * 0.8, color: C.soft, alpha: k1 });
      const s = st.S;
      if (s.n > 1) {
        const f = v => (v == null ? "–" : v.toFixed(2));
        const msg = wide ? `this text: V→V ${f(s.pvv)} · C→C ${f(s.pcc)}` : `this text: ${s.n} letters, ${Math.round((s.nv / s.n) * 100)}% vowels · V→V ${f(s.pvv)} · C→C ${f(s.pcc)}`;
        S.text(msg, sp.x + sp.w / 2, sp.y + lsz * 2.75 + fs * 0.4, { size: fs * 0.8, color: C.soft, alpha: k1 });
      }
      // ---- beat 2: the two-state chain ----
      const [V, Cn] = [st.V, st.C], d = Cn[0] - V[0];
      const P = { vv: pvv, vc: 1 - pvv, cv: 1 - pcc, cc: pcc };
      const bez = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
      const paths = {
        vc: { a: [V[0] + r * 0.7, V[1] - r * 0.7], c: [(V[0] + Cn[0]) / 2, V[1] - d * 0.36], b: [Cn[0] - r * 0.7, Cn[1] - r * 0.7] },
        cv: { a: [Cn[0] - r * 0.7, Cn[1] + r * 0.7], c: [(V[0] + Cn[0]) / 2, V[1] + d * 0.36], b: [V[0] + r * 0.7, V[1] + r * 0.7] },
      };
      const loopO = (ctr, dir) => [ctr[0] + dir * r * 1.62, ctr[1]], loop = (ctr, dir, u) => { const R = r * 0.62, O = loopO(ctr, dir), back = dir > 0 ? Math.PI : 0, a = back + 0.95 + u * (2 * Math.PI - 1.9); return [O[0] + R * Math.cos(a), O[1] + R * Math.sin(a)]; };
      const pathPt = (key, u) => key === "vv" ? loop(V, -1, u) : key === "cc" ? loop(Cn, 1, u) : bez(paths[key].a, paths[key].c, paths[key].b, u);
      if (k2 > 0) {
        for (const key of ["vv", "vc", "cv", "cc"]) {
          const pts = []; for (let i = 0; i <= 30; i++) pts.push(pathPt(key, i / 30));
          const w = iw * (0.3 + 1.6 * P[key]), col = key[1] === "v" ? C.accent : C.ink;
          S.line(pts, { color: col, w, alpha: k2 * 0.85 });
          const e = pts[pts.length - 1], q = pts[pts.length - 4];
          S.arrow(q[0], q[1], e[0], e[1], { color: col, w, alpha: k2, head: Math.max(8, w * 2.8) });
          const m = pathPt(key, 0.5), lift = key === "vc" ? -fs * 0.5 : key === "cv" ? fs * 1.15 : 0;
          const self = key[0] === key[1], O = self ? loopO(key === "vv" ? V : Cn, key === "vv" ? -1 : 1) : null;
          const lx = self ? O[0] : m[0], ly = self ? O[1] - r * 0.62 - fs * 0.45 : m[1] + lift;
          S.text(P[key].toFixed(2), lx, ly, { size: fs * 0.9, color: col, weight: 600, italic: false, alpha: k2 });
        }
        S.circle(V[0], V[1], r, { color: C.accent, w: iw * 0.9, fill: C.paper, alpha: k2 });
        S.circle(Cn[0], Cn[1], r, { color: C.ink, w: iw * 0.9, fill: C.paper, alpha: k2 });
        S.text("V", V[0], V[1] + fs * 0.42, { size: fs * 1.2, color: C.accent, weight: 600, italic: false, alpha: k2 });
        S.text("C", Cn[0], Cn[1] + fs * 0.42, { size: fs * 1.2, color: C.ink, weight: 600, italic: false, alpha: k2 });
        if (!wide) {
          S.text("vowel", V[0], V[1] + r + fs * 1.1, { size: fs * 0.8, color: C.accent, alpha: k2 });
          S.text("consonant", Cn[0], Cn[1] + r + fs * 1.1, { size: fs * 0.8, color: C.ink, alpha: k2 });
        }
        // step the chain
        const dtStep = 0.55;
        if (st.lastStep == null) st.lastStep = ft;
        let guard = 0;
        while (ft - st.lastStep > dtStep && guard++ < 20) {
          st.lastStep += dtStep; st.prev = st.cur;
          const stay = st.cur === 0 ? pvv : pcc;
          st.cur = st.rng() < stay ? st.cur : 1 - st.cur;
          st.seq.push(st.cur); if (st.seq.length > 60) st.seq.shift();
          st.n++; if (st.cur === 0) st.nv++;
        }
        if (st.lastStep > ft) st.lastStep = ft;
        const u = Math.min(1, (ft - st.lastStep) / (dtStep * 0.8)), key = (st.prev ? "c" : "v") + (st.cur ? "c" : "v");
        const tp = st.seq.length ? pathPt(key, S.ease(u)) : V;
        S.dot(tp[0], tp[1], iw * 1.6, st.cur ? C.ink : C.accent, k2);
        // generated sequence
        const bd = st.beads, n = wide ? 16 : 26, bw = bd.w / n, seq = st.seq.slice(-n);
        seq.forEach((v, i) => {
          const x = bd.x + bw * (i + 0.5);
          if (v === 0) S.dot(x, bd.y, bw * 0.3, C.accent, k2); else S.circle(x, bd.y, bw * 0.27, { color: C.ink, w: iw * 0.45, alpha: k2 });
        });
        const pv = st.n ? Math.round((st.nv / st.n) * 100) : 0;
        S.text(wide ? `generated: ${pv}% V` : `generated by the chain: ${st.n} letters, ${pv}% vowels (Pushkin: 43%)`, bd.x, bd.y - bw * 0.55 - fs * 0.25, { size: fs * 0.8, align: "left", color: C.soft, alpha: k2 });
      }
      // ---- beat 3: predict the next symbol → the next token ----
      if (k3 > 0) {
        const lm = st.lm, cur = st.cur, pV = cur === 0 ? pvv : 1 - pcc;
        const bh = Math.min(fs * 0.9, lm.h * 0.09), x0 = lm.x + (wide ? fs * 0.2 : lm.w * 0.27), bwMax = lm.x + lm.w - x0 - fs * 3;
        let y = lm.y + fs * 0.9;
        S.text(wide ? "next symbol?" : `last letter ${cur ? "C" : "V"}: what comes next?`, lm.x, y, { size: fs * 0.85, align: "left", color: C.accent, alpha: k3 });
        y += fs * 0.7;
        [["V", pV], ["C", 1 - pV]].forEach(([lab, p], i) => {
          const yy = y + i * bh * 1.6;
          if (!wide) S.text(lab, x0 - fs * 0.6, yy + bh * 0.85, { size: fs * 0.8, color: C.ink, italic: false, align: "right", alpha: k3 });
          S.rect(x0, yy, bwMax * p * k3, bh, { fill: lab === "V" ? C.accent : S.mix(C.ink, C.paper, 0.35), w: 0 });
          S.text((wide ? lab + " " : "") + p.toFixed(2), x0 + bwMax * p * k3 + fs * 0.3, yy + bh * 0.85, { size: fs * 0.75, color: C.ink, italic: false, mono: true, align: "left", alpha: k3 });
        });
        y += bh * 3.2 + fs * 1.2;
        const words = [["mat", 0.41], ["floor", 0.17], ["sofa", 0.08]];
        S.text(wide ? "language model:" : "a language model does it with words, looking far back:", lm.x, y, { size: fs * 0.8, align: "left", color: C.accent, alpha: k3 });
        y += fs * (wide ? 1.1 : 1.3);
        S.text("“the cat sat on the …”", lm.x, y, { size: fs * 0.8, align: "left", color: C.ink, alpha: k3 });
        y += fs * 0.5;
        words.forEach(([w, p], i) => {
          const yy = y + i * bh * 1.5;
          if (!wide) S.text(w, x0 - fs * 0.6, yy + bh * 0.85, { size: fs * 0.8, color: C.ink, align: "right", alpha: k3 });
          S.rect(x0, yy, bwMax * p * k3, bh, { fill: S.mix(C.accent, C.paper, 0.15 + i * 0.2), w: 0 });
          S.text((wide ? w + " " : "") + p.toFixed(2), x0 + bwMax * p * k3 + fs * 0.3, yy + bh * 0.85, { size: fs * 0.75, color: C.ink, italic: false, align: "left", alpha: k3 });
        });
        if (!wide) S.text("(made-up numbers, for illustration)", lm.x + lm.w, y + bh * 1.5 * 2 + bh * 0.85, { size: fs * 0.7, align: "right", color: C.soft, alpha: k3 });
      }
      const pv = st.n ? Math.round((st.nv / st.n) * 100) : 0;
      const eqV = (1 - pcc) / ((1 - pvv) + (1 - pcc) || 1);
      return `V→V ${pvv.toFixed(3)} · C→C ${pcc.toFixed(3)} · chain settles at ${Math.round(eqV * 100)}% vowels · generated so far ${pv}% of ${st.n}`;
    },
    code(S) {
      const s = stats(classify(S.p.text)), f = v => (v == null ? "None" : v.toFixed(3));
      return `${S.c("# Markov (1913): count what follows what")}
letters = [c for c in text if c.isalpha()]
kinds = ["V" if c in VOWELS else "C" for c in letters]
pairs = Counter(zip(kinds, kinds[1:]))
P_VV = pairs["V","V"] / (pairs["V","V"] + pairs["V","C"])   ${S.c("# your text: " + f(s.pvv))}
P_CC = pairs["C","C"] / (pairs["C","C"] + pairs["C","V"])   ${S.c("# your text: " + f(s.pcc))}

${S.c("# Pushkin, 20,000 letters: 0.128 and 0.337")}
state = "V"
for step in range(n):
    stay = ${S.v(S.p.pvv.toFixed(3))} if state == "V" else ${S.v(S.p.pcc.toFixed(3))}
    if random() > stay:
        state = "C" if state == "V" else "V"`;
    },
  });
})();
