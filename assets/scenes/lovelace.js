// Ada Lovelace — Note G (1843): the Analytical Engine computing Bernoulli numbers, operation by operation → "originates nothing" vs generative AI
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const add = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => fr(a.n * b.n, a.d * b.d), div = (a, b) => fr(a.n * b.d, a.d * b.n);
  const fs_ = a => (a.d === 1 ? String(a.n) : `${a.n < 0 ? "−" : ""}${Math.abs(a.n)}/${a.d}`).replace(/^-/, "−");
  const OPS = { "×": mul, "÷": div, "+": add, "−": sub };
  const MODERN = ["B2", "B4", "B6", "B8", "B10", "B12", "B14"];

  // Build the program in the spirit of Note G: ops 1–7 set up, 8–12 first term, 13–23 the repeating loop, 24 result, 25 next n
  function program(N) {
    const out = [];
    for (let n = 1; n <= N; n++) {
      const P = [], o = (op, a, b, r, note, loop) => P.push({ op, a, b, r, note, loop, n });
      o("×", "V2", "V3", ["V4", "V5", "V6"], "2n");
      o("−", "V4", "V1", ["V4"], "2n − 1");
      o("+", "V5", "V1", ["V5"], "2n + 1");
      o("÷", "V4", "V5", ["V11"], "(2n−1)/(2n+1)");
      o("÷", "V11", "V2", ["V11"], "½ (2n−1)/(2n+1)");
      o("−", "V13", "V11", ["V13"], "A0 = −½ (2n−1)/(2n+1)");
      o("−", "V3", "V1", ["V10"], "n − 1 terms to go");
      if (n > 1) {
        o("+", "V2", "V7", ["V7"], "2");
        o("÷", "V6", "V7", ["V11"], "A1 = 2n/2");
        o("×", "V21", "V11", ["V12"], "B1 · A1");
        o("+", "V12", "V13", ["V13"], "running sum");
        o("−", "V10", "V1", ["V10"], "one term done");
        for (let j = 2; j < n; j++) {
          const Bv = "V" + (20 + j);
          o("−", "V6", "V1", ["V6"], "2n − " + (2 * j - 3), true);
          o("+", "V1", "V7", ["V7"], String(2 * j - 1), true);
          o("÷", "V6", "V7", ["V8"], "next factor", true);
          o("×", "V8", "V11", ["V11"], "", true);
          o("−", "V6", "V1", ["V6"], "2n − " + (2 * j - 2), true);
          o("+", "V1", "V7", ["V7"], String(2 * j), true);
          o("÷", "V6", "V7", ["V9"], "next factor", true);
          o("×", "V9", "V11", ["V11"], "A" + (2 * j - 1), true);
          o("×", Bv, "V11", ["V12"], "B" + (2 * j - 1) + " · A" + (2 * j - 1), true);
          o("+", "V12", "V13", ["V13"], "running sum", true);
          o("−", "V10", "V1", ["V10"], "one term done", true);
        }
      }
      o("−", "V0", "V13", ["V" + (20 + n)], "B" + (2 * n - 1) + " = −(sum)");
      o("+", "V1", "V3", ["V3"], "n + 1, ready for the next");
      out.push(P);
    }
    return out;
  }
  function freshStore() {
    const V = {}; for (let i = 0; i <= 13; i++) V["V" + i] = fr(0); V.V1 = fr(1); V.V2 = fr(2); V.V3 = fr(1); return V;
  }
  function run(op, V) {
    const r = OPS[op.op](V[op.a] || fr(0), V[op.b] || fr(0));
    if (op.op === "÷" && V[op.b] && V[op.b].n === 0) return;
    for (const t of op.r) V[t] = r;
    op.val = r;
    // after storing a Bernoulli number the engine clears its working columns (Lovelace notes this in the table)
    if (/^V2\d$/.test(op.r[0])) { V.V6 = fr(0); V.V7 = fr(0); V.V13 = fr(0); }
  }

  function fresh(S) {
    const N = +S.p.which, prog = program(N), flat = [];
    prog.forEach(P => { let k = 0, pass = 0; P.forEach((op, i) => {
      if (op.loop) { if (k % 11 === 0) pass++; op.no = 13 + (k % 11); op.pass = pass; k++; }
      else if (i >= P.length - 2) op.no = 24 + (i - (P.length - 2)); else op.no = i + 1;
      flat.push(op); }); });
    S.st.flat = flat; S.st.V = freshStore(); S.st.done = 0; S.st.t0 = S.st.ft || 0; S.st.N = N; S.st.holdAt = null;
  }

  Lineage.scene({
    params: [
      { id: "which", label: "Compute up to", type: "select", value: "4",
        options: [1, 2, 3, 4, 5, 6, 7].map(n => ({ value: String(n), label: `B${2 * n - 1} (today ${MODERN[n - 1]})${n === 4 ? ": Note G" : ""}` })) },
      { id: "speed", label: "Engine speed", type: "range", min: 0, max: 4, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { fresh(S); },
    reset(S) { fresh(S); },
    onParam(S, id) { if (id === "which") fresh(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const rows = n ? 4 : 9, rowH = fs * (n ? 1.05 : 1.32);
      const tY = B.y + fs * 1.0, tableY = tY + fs * (n ? 1.3 : 1.7);
      const varY = tableY + rowH * (rows + 0.6) + fs * (n ? 0.6 : 1.0);
      const vb = Math.min(B.w / 7, fs * 4.2), vh = fs * (n ? 2.1 : 2.6);
      const resY = varY + vh * 2 + 4 + fs * (n ? 1.15 : 1.7);
      const qY = resY + fs * (n ? 2.5 : 3.6);
      Object.assign(S.st, { rows, rowH, tY, tableY, varY, vb, vh, resY, qY });
    },
    entry(S) { return [S.box.x, S.st.tableY + S.st.rowH * 0.32]; },
    draw(S, k, ft) {
      const ind = NARROW(S) ? FS(S) * 0.5 : FS(S) * 1.1, B = { x: S.box.x + ind, y: S.box.y, w: S.box.w - ind, h: S.box.h }, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S);
      st.ft = ft;
      if (!st.flat) fresh(S);
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.2) / 0.4), k3 = S.ease((k - 0.68) / 0.32);
      const STEP = 0.4;
      if (k1 < 0.5) st.t0 = ft;
      const want = Math.min(st.flat.length, Math.floor((ft - st.t0) / STEP));
      while (st.done < want) run(st.flat[st.done++], st.V);
      if (st.done >= st.flat.length) { if (st.holdAt == null) st.holdAt = ft; if (ft - st.holdAt > 4) fresh(S); }
      const cur = st.flat[Math.max(0, st.done - 1)], live = st.done > 0 ? cur : null;
      const nNow = live ? live.n : 1, mono = { mono: true, italic: false };
      // title
      S.text(`Note G · computing B${2 * nNow - 1}`, B.x, st.tY, { size: fs * 1.05, align: "left", color: C.ink, alpha: k1 });
      S.text(`n = ${nNow}`, B.x + B.w, st.tY, { size: fs * 1.05, align: "right", color: C.accent, weight: 500, alpha: k1 });
      // the table of operations, scrolled to the current one
      const cols = n ? [0, 0.1, 0.2, 0.52, 0.74] : [0, 0.07, 0.15, 0.4, 0.62];
      const X = c => B.x + B.w * cols[c], sz = fs * (n ? 0.74 : 0.82);
      const hd = n ? ["", "", "acted upon", "result", "value"] : ["no.", "op", "variables acted upon", "result to", "value"];
      hd.forEach((h, c) => S.text(h, X(c), st.tableY, { size: sz * 0.92, align: "left", color: C.soft, alpha: k1 }));
      S.line([[S.box.x, st.tableY + st.rowH * 0.32], [B.x + B.w, st.tableY + st.rowH * 0.32]], { w: iw * 0.35, color: C.soft, alpha: k1 });
      const ci = Math.max(0, st.done - 1), first = Math.max(0, Math.min(ci - Math.floor(st.rows * 0.6), st.flat.length - st.rows));
      for (let r = 0; r < st.rows; r++) {
        const i = first + r, op = st.flat[i]; if (!op) break;
        const y = st.tableY + st.rowH * (r + 1.25), on = i === ci && st.done > 0, past = i < st.done;
        const col = on ? C.accent : past ? C.ink : C.soft, a = k1 * (on ? 1 : past ? 0.85 : 0.55);
        if (on) S.rect(B.x - 4, y - st.rowH * 0.8, B.w + 8, st.rowH * 1.05, { color: C.accent, w: iw * 0.45, alpha: k1 });
        if (op.loop && !n) S.line([[B.x - 9, y - st.rowH * 0.7], [B.x - 9, y + st.rowH * 0.2]], { w: iw * 0.6, color: C.accent, alpha: 0.5 * k1 });
        const va = op.a === "V0" ? "0" : op.a;
        if (!n) S.text(String(op.no), X(0), y, { size: sz, align: "left", ...mono, color: col, alpha: a });
        S.text(op.op, X(1), y, { size: sz * 1.1, align: "left", ...mono, color: col, alpha: a, weight: 600 });
        S.text(`${va} ${op.op} ${op.b}`, X(2), y, { size: sz, align: "left", ...mono, color: col, alpha: a });
        S.text(n ? op.r[0] : op.r.join(", "), X(3), y, { size: sz, align: "left", ...mono, color: col, alpha: a });
        const vtxt = past && op.val ? fs_(op.val) : "";
        S.text(vtxt + (!n && op.note && on ? "   " + op.note : ""), X(4), y, { size: sz, align: "left", ...mono, color: col, alpha: a });
      }
      if (!n) S.text("│ = the loop, repeated for each earlier B", B.x + B.w, st.varY - fs * 0.45, { size: fs * 0.72, align: "right", color: C.accent, alpha: 0.75 * k1 });
      // the store: columns of figure wheels V1..V13
      if (k2 > 0) {
        const names = ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13"];
        const per = 7, vb = (B.w - 6 * 6) / per;
        names.forEach((nm, i) => {
          const row = Math.floor(i / per), c = i % per;
          const x = B.x + c * (vb + 6), y = st.varY + row * (st.vh + 4);
          const hit = live && live.r.includes(nm) && (ft - st.t0) / STEP - st.done < 0.6;
          const read = live && (live.a === nm || live.b === nm);
          S.rect(x, y, vb, st.vh, { color: hit ? C.accent : C.ink, w: iw * (hit ? 0.7 : 0.35), alpha: k2 * (hit ? 1 : 0.8) });
          S.text(nm, x + 4, y + fs * 0.75, { size: fs * 0.66, align: "left", color: read ? C.accent : C.soft, alpha: k2, halo: false });
          const v = fs_(st.V[nm]);
          const vs = Math.min(fs * (n ? 0.78 : 0.92), (vb - 6) / Math.max(1, v.length) / 0.6);
          S.text(v, x + vb / 2, y + st.vh * 0.82, { size: vs, ...mono, color: hit ? C.accent : C.ink, weight: hit ? 600 : 400, alpha: k2, halo: false });
        });
        if (!n) S.text("the store: columns of figure wheels", B.x, st.varY - fs * 0.45, { size: fs * 0.72, align: "left", color: C.soft, alpha: k2 });
        // results
        const ry = st.resY, N = st.N, bw = B.w / Math.max(4, N);
        for (let j = 1; j <= N; j++) {
          const v = st.V["V" + (20 + j)], got = v && v.n !== 0 || (j === 1 && st.done > 0 && st.flat.slice(0, st.done).some(o => o.r[0] === "V21"));
          const x = B.x + bw * (j - 0.5), tgt = j === N;
          S.text(`B${2 * j - 1}`, x, ry, { size: fs * (n ? 0.8 : 0.9), color: tgt ? C.accent : C.ink, weight: tgt ? 600 : 400, alpha: k2 });
          S.text(got ? fs_(v) : "?", x, ry + fs * (n ? 1.15 : 1.35), { size: fs * (n ? 0.9 : 1.05), ...mono, color: tgt ? C.accent : C.ink, weight: got && tgt ? 600 : 400, alpha: k2 * (got ? 1 : 0.4) });
        }
        if (!n) S.text(`her B1, B3, B5, B7 are today's B2, B4, B6, B8: she numbered only the Bernoulli numbers that are not zero`, B.x, ry + fs * 2.6, { size: fs * 0.72, align: "left", color: C.soft, alpha: k2 });
      }
      // AI beat: the objection
      if (k3 > 0) {
        const qs = fs * (n ? 0.86 : 1.08), y = st.qY + (n ? 0 : fs * 1.2);
        const ql = n ? ["“The Analytical Engine has no pretensions", "whatever to originate anything.”"]
                     : ["“The Analytical Engine has no pretensions whatever to originate", "anything. It can do whatever we know how to order it to perform.”"];
        S.line([[B.x, y - qs * 1.0], [B.x, y + qs * 1.45 * (ql.length - 1) + qs * 0.3]], { w: iw * 0.8, color: C.accent, alpha: k3 });
        ql.forEach((l, i) => S.text(l, B.x + fs * 0.7, y + i * qs * 1.4, { size: qs, align: "left", color: C.accent, alpha: k3 }));
        S.text(n ? "Does generative AI originate, or recombine?" : "Does a generative AI that writes, paints and composes originate anything, or only recombine?",
          B.x + fs * 0.7, y + ql.length * qs * 1.4 + fs * 0.2, { size: fs * (n ? 0.78 : 0.86), align: "left", color: C.ink, alpha: k3 });
      }
      if (!live) return "";
      const target = st.N;
      const tv = st.V["V" + (20 + target)];
      return `n = ${live.n} · operation ${live.no}${live.pass ? " (loop pass " + live.pass + ")" : ""}: ${live.a === "V0" ? "0" : live.a} ${live.op} ${live.b} = ${fs_(live.val || fr(0))} → ${live.r.join(", ")}` +
        (st.done >= st.flat.length ? ` · B${2 * target - 1} (today ${MODERN[target - 1]}) = ${fs_(tv)}` : "");
    },
    code(S) {
      const N = +S.p.which;
      return `${S.c("# Note G (1843): each Bernoulli number from the earlier ones")}
${S.c("# 0 = A0 + B1·A1 + B3·A3 + ... + B(2n-1)")}
B = []                         ${S.c("# B1, B3, B5 ... in Lovelace's numbering")}
for n in range(1, ${S.v(N + 1)}):
    A = -Fraction(2*n - 1, 2*n + 1) / 2      ${S.c("# A0")}
    total, coef = A, Fraction(n)             ${S.c("# A1 = 2n/2")}
    for j, b in enumerate(B):                ${S.c("# the loop: ops 13-23")}
        total += b * coef
        coef *= Fraction((2*n-2*j-1)*(2*n-2*j-2), (2*j+3)*(2*j+4))
    B.append(-total)                         ${S.c("# B" + (2 * N - 1) + " = " + ["1/6", "-1/30", "1/42", "-1/30", "5/66", "-691/2730", "7/6"][N - 1])}`;
    },
  });
})();
