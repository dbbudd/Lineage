// Grace Hopper — an English-like statement tokenised, parsed and compiled to machine instructions that run on a toy machine → AI turning plain English into code
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  const VERBS = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MOVE"], KEYS = ["TO", "BY", "GIVING", "FROM", "INTO"];
  const DEF = { HOURS: 40, RATE: 25, PRICE: 12, QTY: 3, TAX: 2, BONUS: 150, TOTAL: 480, PAY: 1000, COST: 90 };
  const OPC = { LOAD: "0001", STORE: "0010", ADD: "0011", SUB: "0100", MUL: "0101", DIV: "0110" };
  const SYM = { ADD: "+", SUB: "−", MUL: "×", DIV: "÷" };
  const T_TOK = 0.32, T_PARSE = 1.0, T_GEN = 0.45, T_RUN = 0.85, T_HOLD = 3;

  function kind(t) { return VERBS.includes(t) ? "verb" : KEYS.includes(t) ? "keyword" : /^\d+(\.\d+)?$/.test(t) ? "number" : /^[A-Z][A-Z0-9-]*$/.test(t) ? "name" : "?"; }
  function compile(src) {
    const toks = String(src || "").toUpperCase().replace(/[^A-Z0-9.\s-]/g, " ").replace(/\.(?!\d)/g, " ").split(/\s+/).filter(Boolean).slice(0, 9);
    const R = { toks, kinds: toks.map(kind), err: null, tree: null, code: [] };
    if (!toks.length) { R.err = "type a statement"; return R; }
    const opd = i => toks[i] && (R.kinds[i] === "name" || R.kinds[i] === "number");
    const v = toks[0], need = (i, kw) => { if (toks[i] !== kw) throw `expected ${kw}${toks[i] ? " not " + toks[i] : ""}`; };
    try {
      if (!VERBS.includes(v)) throw `start with ADD, SUBTRACT, MULTIPLY, DIVIDE or MOVE`;
      if (!opd(1)) throw `expected a name or number after ${v}`;
      const a = toks[1]; let b, op, dest, l, r, mid;
      if (v === "MOVE") { need(2, "TO"); if (!opd(3) || R.kinds[3] !== "name") throw "expected a name after TO"; dest = toks[3]; R.tree = { dest, expr: a }; R.code = [["LOAD", a], ["STORE", dest]]; if (toks.length > 4) throw `unexpected ${toks[4]}`; return R; }
      mid = { ADD: "TO", SUBTRACT: "FROM", MULTIPLY: "BY", DIVIDE: toks[2] === "BY" ? "BY" : "INTO" }[v];
      need(2, mid); if (!opd(3)) throw `expected a name or number after ${mid}`; b = toks[3];
      if (toks[4] === "GIVING") { if (!opd(5) || R.kinds[5] !== "name") throw "expected a name after GIVING"; dest = toks[5]; if (toks.length > 6) throw `unexpected ${toks[6]}`; }
      else if (toks[4]) throw `expected GIVING not ${toks[4]}`;
      else { if (R.kinds[3] !== "name") throw "needs GIVING to store a result"; if (v === "DIVIDE" && mid === "BY") throw "DIVIDE … BY needs GIVING"; dest = b; }
      if (v === "ADD") { op = "ADD"; l = a; r = b; } else if (v === "SUBTRACT") { op = "SUB"; l = b; r = a; }
      else if (v === "MULTIPLY") { op = "MUL"; l = a; r = b; } else if (mid === "INTO") { op = "DIV"; l = b; r = a; } else { op = "DIV"; l = a; r = b; }
      R.tree = { dest, op, l, r }; R.code = [["LOAD", l], [op, r], ["STORE", dest]];
    } catch (e) { R.err = String(e); R.tree = null; R.code = []; }
    return R;
  }
  const valOf = (t, mem) => (/^\d/.test(t) ? +t : mem[t] ?? 0);
  const fmtN = x => (Number.isInteger(x) ? String(x) : x.toFixed(2));

  function fresh(S) {
    const R = compile(S.p.src), names = [];
    R.toks.forEach((t, i) => { if (R.kinds[i] === "name" && !names.includes(t)) names.push(t); });
    const mem0 = {}; names.forEach((nm, i) => { const destOnly = R.tree && nm === R.tree.dest && nm !== R.tree.l && nm !== R.tree.r && nm !== R.tree.expr; mem0[nm] = destOnly ? 0 : nm in DEF ? DEF[nm] : 2 + ((nm.charCodeAt(0) * 7 + nm.length * 3) % 19); });
    S.st.R = R; S.st.names = names.slice(0, 4); S.st.mem0 = mem0; S.st.t0 = S.st.ft || 0;
  }
  function timeline(R) {
    const a = R.toks.length * T_TOK, b = a + (R.err ? 2.5 : T_PARSE), c = b + R.code.length * T_GEN, d = c + R.code.length * T_RUN;
    return { a, b, c, d, end: d + T_HOLD };
  }

  Lineage.scene({
    params: [
      { id: "src", label: "Statement (try ADD BONUS TO PAY)", type: "text", value: "MULTIPLY HOURS BY RATE GIVING PAY", maxlength: 60 },
      { id: "bin", label: "Show machine code in binary", type: "toggle", value: false },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { fresh(S); },
    reset(S) { fresh(S); },
    onParam(S, id) { if (id === "src") fresh(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const lab = n ? 0 : fs * 5.2;                   // left gutter for stage labels
      const sY = B.y + fs * 1.6, kY = sY + fs * (n ? 1.25 : 1.45);
      const midY = kY + fs * (n ? 1.0 : 1.9), midH = B.h * (n ? 0.32 : 0.33);
      const runY = midY + midH + fs * (n ? 1.3 : 1.9), runH = fs * (n ? 2.4 : 3.4);
      const aiY = runY + runH + fs * (n ? 1.6 : 3.6);
      Object.assign(S.st, { lab, sY, kY, midY, midH, runY, runH, aiY });
    },
    entry(S) { return [S.box.x, S.st.sY - FS(S) * 0.4]; },
    draw(S, k, ft) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S), ctx = S.ctx;
      st.ft = ft;
      if (!st.R) fresh(S);
      const R = st.R, TL = timeline(R);
      const k1 = S.ease(k / 0.3), k3 = S.ease((k - 0.7) / 0.3);
      if (k1 < 0.6) st.t0 = ft;
      let t = ft - st.t0; if (t > TL.end) { st.t0 = ft; t = 0; }
      const X0 = B.x + st.lab, W0 = B.w - st.lab, mono = { mono: true, italic: false };
      const stage = (txt, y, a) => { if (!n) S.text(txt, B.x, y, { size: fs * 0.72, align: "left", color: C.soft, alpha: a }); };
      // 1. the English statement, scanned token by token
      const nT = Math.min(R.toks.length, Math.floor(t / T_TOK) + 1), toks = R.toks;
      let size = fs * (n ? 1.0 : 1.2);
      ctx.save(); ctx.font = `500 ${size}px "IBM Plex Mono", monospace`;
      let widths = toks.map(s => ctx.measureText(s).width), total = widths.reduce((a, b) => a + b, 0) + (toks.length - 1) * size * 0.6;
      if (total > W0 - 4) { size *= (W0 - 4) / total; widths = widths.map(w => w * (W0 - 4) / total); total = W0 - 4; }
      ctx.restore();
      stage("English", st.sY, k1);
      const tx = []; let x = X0;
      toks.forEach((s, i) => { tx.push(x); x += widths[i] + size * 0.6; });
      if (!toks.length) S.text("type a statement, e.g. ADD BONUS TO PAY", X0, st.sY, { size: fs * 0.9, align: "left", color: C.soft, alpha: k1 });
      const KC = { verb: C.accent, keyword: C.ink, name: C.ink, number: C.ink, "?": C.soft };
      toks.forEach((s, i) => {
        const on = i < nT;
        S.text(s, tx[i], st.sY, { size, align: "left", ...mono, color: C.ink, weight: 500, alpha: k1 });
        if (on) {
          S.rect(tx[i] - size * 0.18, st.sY - size * 0.95, widths[i] + size * 0.36, size * 1.3, { color: KC[R.kinds[i]], w: iw * (i === nT - 1 && t < TL.a ? 0.7 : 0.4), alpha: k1 });
          S.text(n && R.kinds[i] === "keyword" ? "kw" : R.kinds[i], tx[i] + widths[i] / 2, st.kY, { size: Math.min(fs * 0.72, size * 0.75), color: R.kinds[i] === "verb" ? C.accent : C.soft, alpha: k1 });
        }
      });
      stage("tokens", st.kY, k1 * (nT ? 1 : 0));
      // 2. parse tree and 3. machine code
      const tP = Math.min(1, Math.max(0, (t - TL.a) / (T_PARSE * 0.8)));
      const treeW = W0 * (n ? 0.46 : 0.44), treeX = X0, my = st.midY, mh = st.midH;
      if (tP > 0) {
        stage("parse tree", my + fs * 0.6, k1);
        if (R.err) {
          S.text("can't parse: " + R.err, X0, my + fs * 1.2, { size: fs * 0.85, align: "left", color: C.accent, alpha: tP * k1 });
          S.text("a compiler follows strict rules", X0, my + fs * 2.4, { size: fs * 0.75, align: "left", color: C.soft, alpha: tP * k1 });
        } else {
          const T = R.tree, r0 = Math.max(fs * 0.9, Math.min(fs * 1.3, mh * 0.12));
          const root = [treeX + treeW * 0.45, my + r0 + 2], L1 = [treeX + treeW * 0.15, my + mh * 0.5], R1 = [treeX + treeW * 0.72, my + mh * 0.5];
          const L2 = [treeX + treeW * 0.48, my + mh - r0], R2 = [treeX + treeW * 0.95, my + mh - r0];
          const node = (p, label, a, acc) => {
            S.circle(p[0], p[1], r0, { w: iw * 0.5, color: acc ? C.accent : C.ink, alpha: a, fill: C.paper });
            S.text(label, p[0], p[1] + r0 * 0.35, { size: Math.min(r0 * 0.95, fs), ...mono, color: acc ? C.accent : C.ink, alpha: a, halo: false });
          };
          const edge = (a, b, al) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy); S.line([[a[0] + dx / d * r0, a[1] + dy / d * r0], [b[0] - dx / d * r0, b[1] - dy / d * r0]], { w: iw * 0.45, color: C.ink, alpha: al }); };
          const a1 = tP * k1, a2 = Math.max(0, tP * 2 - 0.6) * k1, a3 = Math.max(0, tP * 2 - 1) * k1;
          edge(root, L1, a2); edge(root, R1, a2);
          node(root, "=", a1, true);
          const lab = s => (s.length > 6 ? s.slice(0, 5) + "…" : s);
          const leaf = (p, s, a) => { S.text(lab(s), p[0], p[1] + fs * 0.32, { size: fs * (n ? 0.78 : 0.85), ...mono, color: C.ink, alpha: a }); };
          leaf(L1, T.dest, a2);
          if (T.op) { node(R1, SYM[T.op], a2, true); edge(R1, L2, a3); edge(R1, R2, a3); leaf(L2, T.l, a3); leaf(R2, T.r, a3); }
          else leaf(R1, T.expr, a2);
        }
      }
      const codeX = X0 + W0 * (n ? 0.54 : 0.56), lineH = Math.min(fs * (n ? 1.3 : 1.55), mh / 3.4);
      const nG = Math.min(R.code.length, Math.max(0, Math.floor((t - TL.b) / T_GEN) + 1));
      const runI = t >= TL.c ? Math.min(R.code.length - 1, Math.floor((t - TL.c) / T_RUN)) : -1;
      if (nG > 0 && !R.err) {
        S.text("machine code", codeX, my + fs * 0.4, { size: fs * 0.72, align: "left", color: C.soft, alpha: k1 });
        R.code.forEach((ins, i) => {
          if (i >= nG) return;
          const y = my + fs * 0.6 + lineH * (i + 1.1), on = i === runI && t < TL.d;
          const addr = st.names.indexOf(ins[1]);
          const txt = S.p.bin ? `${OPC[ins[0]]} ${/^\d/.test(ins[1]) ? (+ins[1] & 15).toString(2).padStart(4, "0") + "#" : (addr < 0 ? 0 : addr + 1).toString(2).padStart(4, "0")}` : `${ins[0].padEnd(6)}${/^\d/.test(ins[1]) ? "#" : ""}${ins[1]}`;
          if (on) S.text("▸", codeX - fs * 0.3, y, { size: fs * 0.9, align: "right", color: C.accent, alpha: k1 });
          S.text(txt, codeX, y, { size: fs * (n ? 0.8 : 0.92), align: "left", ...mono, color: on ? C.accent : C.ink, weight: on ? 600 : 400, alpha: k1 });
        });
        if (!n) S.arrow(treeX + treeW + fs * 0.1, my + mh * 0.5, codeX - fs * 1.2, my + mh * 0.5, { w: iw * 0.5, color: C.soft, alpha: k1 * 0.8 });
      }
      // 4. the toy machine: memory cells and the accumulator
      const mem = Object.assign({}, st.mem0); let acc = 0, lastStore = null, lastRead = null;
      if (!R.err) for (let i = 0; i <= runI && t >= TL.c; i++) {
        const [op, a] = R.code[i];
        if (op === "LOAD") acc = valOf(a, mem); else if (op === "STORE") { mem[a] = acc; lastStore = a; }
        else { const v = valOf(a, mem); acc = op === "ADD" ? acc + v : op === "SUB" ? acc - v : op === "MUL" ? acc * v : v ? acc / v : NaN; }
        if (i === runI) lastRead = op === "STORE" ? null : a;
      }
      const ry = st.runY, rh = st.runH;
      stage("run", ry + rh * 0.62, k1);
      const cells = st.names, cw = Math.min(fs * 5.4, (W0 * (n ? 0.98 : 0.62)) / (cells.length + 1.3));
      const fresh = runI >= 0 && t - TL.c - runI * T_RUN < T_RUN * 0.7 && t < TL.d;
      cells.forEach((nm, i) => {
        const x = X0 + i * (cw + 4), hot = fresh && (nm === lastStore || nm === lastRead);
        S.rect(x, ry, cw, rh, { color: hot ? C.accent : C.ink, w: iw * (hot ? 0.7 : 0.4), alpha: k1 });
        S.text(nm.length > 7 ? nm.slice(0, 6) + "…" : nm, x + 4, ry + fs * 0.75, { size: fs * 0.62, align: "left", ...mono, color: C.soft, alpha: k1, halo: false });
        S.text(fmtN(mem[nm] ?? 0), x + cw / 2, ry + rh * 0.82, { size: Math.min(fs * (n ? 0.85 : 1.0), cw / 4.2), ...mono, color: hot && nm === lastStore ? C.accent : C.ink, weight: hot ? 600 : 400, alpha: k1, halo: false });
      });
      const ax = X0 + cells.length * (cw + 4) + fs * 0.3;
      S.rect(ax, ry, cw * 1.1, rh, { color: C.accent, w: iw * 0.6, alpha: k1 });
      S.text("ACC", ax + 4, ry + fs * 0.75, { size: fs * 0.62, align: "left", ...mono, color: C.accent, alpha: k1, halo: false });
      S.text(t >= TL.c && !R.err ? fmtN(acc) : "–", ax + cw * 0.55, ry + rh * 0.82, { size: Math.min(fs * (n ? 0.85 : 1.0), cw / 4.2), ...mono, color: C.accent, weight: 600, alpha: k1, halo: false });
      // her nanosecond: about 30 cm of wire, the distance light travels in a billionth of a second
      const wx0 = n ? X0 + W0 * 0.56 : Math.max(X0 + W0 * 0.66, X0 + (st.names.length + 1.1) * Math.min(fs * 5.4, (W0 * 0.62) / (st.names.length + 1.3)) + fs * 1.2), wx1 = B.x + B.w - fs * 0.4, wy = n ? st.midY + st.midH - fs * 0.5 : ry + rh * 0.45;
      if (!n || true) {
        const wl = wx1 - wx0;
        S.line([[wx0, wy], [wx1, wy]], { w: iw * 0.7, color: C.ink, alpha: k1 });
        S.line([[wx0, wy - fs * 0.25], [wx0, wy + fs * 0.25]], { w: iw * 0.5, color: C.ink, alpha: k1 });
        S.line([[wx1, wy - fs * 0.25], [wx1, wy + fs * 0.25]], { w: iw * 0.5, color: C.ink, alpha: k1 });
        const u = (ft * 0.6) % 1; S.dot(wx0 + wl * u, wy, iw * 0.9, C.accent, k1);
        if (n) S.text("1 ns of wire ≈ 30 cm", (wx0 + wx1) / 2, wy + fs * 1.0, { size: fs * 0.66, color: C.ink, alpha: k1 });
        else S.text("1 nanosecond of wire", (wx0 + wx1) / 2, wy - fs * 0.55, { size: fs * (n ? 0.66 : 0.74), color: C.ink, alpha: k1 });
        if (!n) { S.text("≈ 30 cm (11.8 in), the distance light", (wx0 + wx1) / 2, wy + fs * 1.05, { size: fs * 0.66, color: C.soft, alpha: k1 });
          S.text("travels in a billionth of a second", (wx0 + wx1) / 2, wy + fs * 1.85, { size: fs * 0.66, color: C.soft, alpha: k1 }); }
      }
      // AI beat: plain English in, code out
      if (k3 > 0) {
        let y = st.aiY + (n ? 0 : fs * 0.4); const sz = fs * (n ? 0.8 : 0.95);
        const eng = R.tree && R.tree.op ? `“${R.tree.dest.toLowerCase()} is ${R.tree.l.toLowerCase()} ${({ ADD: "plus", SUB: "minus", MUL: "times", DIV: "divided by" })[R.tree.op]} ${R.tree.r.toLowerCase()}”` : "“work out everyone's pay”";
        const code = R.tree && R.tree.op ? `${R.tree.dest.toLowerCase()} = ${R.tree.l.toLowerCase()} ${({ ADD: "+", SUB: "-", MUL: "*", DIV: "/" })[R.tree.op]} ${R.tree.r.toLowerCase()}` : "pay = hours * rate";
        if (!n) S.text("today", B.x, y, { size: fs * 0.72, align: "left", color: C.accent, alpha: k3 });
        ctx.save(); ctx.font = `italic 400 ${sz}px Newsreader, Georgia, serif`; const ew = ctx.measureText(eng).width; ctx.restore();
        S.text(eng, X0, y, { size: sz, align: "left", color: C.accent, alpha: k3 });
        const bx = n ? X0 - fs * 0.2 : X0 + ew + fs * 0.6, bw = fs * 2.6, y0 = y;
        if (n) y += sz * 1.6;
        S.arrow(bx, y - sz * 0.3, bx + fs * 1.4, y - sz * 0.3, { w: iw * 0.6, color: C.accent, alpha: k3 });
        S.rect(bx + fs * 1.6, y - sz * 1.05, bw, sz * 1.4, { color: C.accent, w: iw * 0.7, alpha: k3 });
        S.text("AI", bx + fs * 1.6 + bw / 2, y, { size: sz, color: C.accent, weight: 600, italic: false, alpha: k3, halo: false });
        S.arrow(bx + fs * 1.8 + bw, y - sz * 0.3, bx + fs * 3.2 + bw, y - sz * 0.3, { w: iw * 0.6, color: C.accent, alpha: k3 });
        const cx = bx + fs * 3.5 + bw, room = B.x + B.w - cx;
        if (room > fs * 4) S.text(code, cx, y, { size: Math.min(sz, room / (code.length * 0.62)), align: "left", ...mono, color: C.accent, weight: 500, alpha: k3 });
        else S.text(code, B.x + B.w, y + sz * 1.5, { size: sz, align: "right", ...mono, color: C.accent, weight: 500, alpha: k3 });
        if (!n) S.text("people describe the program in plain English and an AI writes the code", X0, y + sz * (room > fs * 4 ? 1.6 : 3.0), { size: fs * 0.75, align: "left", color: C.soft, alpha: k3 });
      }
      if (R.err) return `${R.toks.length} tokens · can't parse: ${R.err}`;
      const T = R.tree, res = t >= TL.d ? fmtN(mem[T.dest]) : "…";
      const expr = T.op ? `${T.l} ${SYM[T.op]} ${T.r}` : T.expr;
      return `${R.toks.length} tokens → ${T.dest} = ${expr} → ${R.code.length} instructions → ${T.dest} = ${t >= TL.d ? (T.op ? `${fmtN(valOf(T.l, st.mem0))} ${SYM[T.op]} ${fmtN(valOf(T.r, st.mem0))} = ` : "") + res : "running…"}`;
    },
    code(S) {
      const R = compile(S.p.src), src = R.toks.join(" ");
      const T = R.tree, tree = R.err ? "error: " + R.err : T.op ? `${T.dest} = ${T.l} ${SYM[T.op]} ${T.r}` : `${T.dest} = ${T.expr}`;
      return `${S.c("# a compiler: English-like words in, machine code out")}
src    = ${S.v('"' + src.replace(/</g, "") + '"')}
tokens = src.split()               ${S.c("# " + R.toks.length + " tokens")}
tree   = parse(tokens)             ${S.c("# " + tree)}
code   = generate(tree)
${R.code.length ? R.code.map(c => `         ${S.c("# " + c[0].padEnd(6) + c[1])}`).join("\n") : `         ${S.c("# (nothing to run)")}`}
machine.run(code)                  ${S.c("# 1 instruction per step")}`;
    },
  });
})();
