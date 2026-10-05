// Alan Turing — a Turing machine stepping along its tape → rule table → the tape read as tokens by a universal machine running a neural network
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  const PROGS = {
    inc: { name: "binary increment", start: "right", startAt: "left", blankStart: false,
      rules: [["right", "0", "0", "R", "right"], ["right", "1", "1", "R", "right"], ["right", "_", "_", "L", "carry"],
              ["carry", "1", "0", "L", "carry"], ["carry", "0", "1", "R", "halt"], ["carry", "_", "1", "R", "halt"]] },
    beaver: { name: "3-state busy beaver", start: "A", startAt: "left", blankStart: true,
      rules: [["A", "0", "1", "R", "B"], ["A", "1", "1", "R", "halt"], ["B", "0", "0", "R", "C"],
              ["B", "1", "1", "R", "B"], ["C", "0", "1", "L", "C"], ["C", "1", "1", "L", "A"]] },
    parity: { name: "parity checker", start: "even", startAt: "left", blankStart: false,
      rules: [["even", "0", "0", "R", "even"], ["even", "1", "1", "R", "odd"], ["even", "_", "E", "R", "halt"],
              ["odd", "0", "0", "R", "odd"], ["odd", "1", "1", "R", "even"], ["odd", "_", "O", "R", "halt"]] },
  };
  const TOK = ["I", "propose", "to", "consider", "the", "question", ",", "“Can", "machines", "think?”"];
  const RATE = 1.8; // steps per second of field time

  const clean = s => String(s || "").replace(/[^01]/g, "").slice(0, 12);
  function fresh(S) {
    const P = PROGS[S.p.prog] || PROGS.inc, inp = P.blankStart ? "" : clean(S.p.input);
    const tape = new Map();
    for (let i = 0; i < inp.length; i++) tape.set(i, inp[i]);
    S.st.m = { P, tape, head: 0, prev: 0, state: P.start, steps: 0, halted: false, rule: -1, written: -1, ones: 0, input: inp };
    S.st.ft0 = S.st.ft || 0; S.st.haltAt = null;
  }
  function blankFor(P) { return P === PROGS.beaver ? "0" : "_"; }
  function step(m) {
    if (m.halted) return;
    const bl = blankFor(m.P), read = m.tape.has(m.head) ? m.tape.get(m.head) : bl;
    const ri = m.P.rules.findIndex(r => r[0] === m.state && r[1] === read);
    if (ri < 0) { m.halted = true; m.rule = -1; return; }
    const r = m.P.rules[ri];
    if (r[2] === bl) m.tape.delete(m.head); else m.tape.set(m.head, r[2]);
    m.written = m.head; m.prev = m.head; m.head += r[3] === "R" ? 1 : -1; m.state = r[4]; m.rule = ri; m.steps++;
    if (m.state === "halt") m.halted = true;
  }

  Lineage.scene({
    params: [
      { id: "prog", label: "Program", type: "select", value: "inc",
        options: [{ value: "inc", label: "Binary increment" }, { value: "beaver", label: "3-state busy beaver" }, { value: "parity", label: "Parity checker" }] },
      { id: "input", label: "Input tape (0s and 1s)", type: "text", value: "1011", maxlength: 12 },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { fresh(S); S.st.cam = 0; },
    reset(S) { fresh(S); },
    onParam(S, id) { if (id !== "speed") fresh(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const cs = Math.min(B.w / (n ? 9.5 : 10.5), B.h * (n ? 0.13 : 0.1));
      const top = B.y + fs * 1.1;
      const rowH = fs * (n ? 0.95 : 1.15);
      const tableY = top + fs * (n ? 0.9 : 1.1);
      const tapeY = Math.max(tableY + rowH * 3.6 + cs * 1.25, B.y + B.h * (n ? 0 : 0.38));
      const aiY = tapeY + cs + fs * (n ? 2.0 : 3.4);
      Object.assign(S.st, { cs, top, rowH, tableY, tapeY, aiY, nC: Math.floor(B.w / cs) + 2 });
    },
    entry(S) { return [S.box.x, S.st.tapeY + S.st.cs / 2]; },
    draw(S, k, ft) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S);
      const { cs, tableY, rowH, tapeY, aiY } = st;
      st.ft = ft;
      if (!st.m) fresh(S);
      const m = st.m;
      // advance the machine in field time
      const kr = S.ease((k - 0.1) / 0.3);
      if (kr <= 0) st.ft0 = ft;
      const want = Math.floor((ft - st.ft0) * RATE);
      while (!m.halted && m.steps < want) step(m);
      if (m.halted) { if (st.haltAt == null) st.haltAt = ft; if (ft - st.haltAt > 2.6) fresh(S); }
      const frac = m.halted ? 1 : Math.min(1, ((ft - st.ft0) * RATE - m.steps) * 1.8);
      const hx = m.prev + (m.head - m.prev) * S.ease(m.steps ? frac : 1);
      // the window follows the head, smoothly
      const dtc = Math.min(1, 0.06 + Math.abs(hx - st.cam) * 0.02);
      st.cam += (hx - st.cam) * dtc;
      const cx = B.x + B.w * 0.5, cellX = i => cx + (i - st.cam) * cs - cs / 2;
      const k1 = S.ease(k / 0.3), kT = S.ease((k - 0.15) / 0.35), kA = S.ease((k - 0.68) / 0.32);
      const P = m.P, bl = blankFor(P);
      // program title
      S.text("program: " + P.name, B.x, st.top, { size: fs * 1.05, align: "left", color: C.ink, alpha: k1 });
      S.text(m.halted ? "halted" : "state: " + m.state, B.x + B.w, st.top, { size: fs * 1.05, align: "right", color: m.halted ? C.soft : C.accent, weight: 500, alpha: k1 });
      // rule table: two columns of three rules (on phones, just the rules for the current state)
      let ruleBox = null;
      if (kT > 0) {
        const cols = n ? 1 : 2, colW = B.w / cols, sz = fs * (n ? 0.8 : 0.84);
        const shown = n ? (() => { const st0 = m.halted ? (m.rule >= 0 ? P.rules[m.rule][0] : P.start) : m.state; const a = P.rules.map((r, i) => i).filter(i => P.rules[i][0] === st0); return a.length ? a : [0, 1, 2]; })() : [0, 1, 2, 3, 4, 5];
        const sym = v => (v === "_" ? "□" : v);
        for (let c = 0; c < cols; c++) {
          const x0 = B.x + c * colW;
          S.text("state read → write move next", x0 + 4, tableY, { size: sz, align: "left", mono: true, italic: false, color: C.soft, alpha: kT });
          S.line([[x0, tableY + rowH * 0.32], [x0 + colW - 10, tableY + rowH * 0.32]], { w: iw * 0.3, color: C.soft, alpha: kT });
          for (let r = 0; r < 3; r++) {
            const ri = shown[c * 3 + r]; if (ri == null) continue;
            const R = P.rules[ri], y = tableY + rowH * (r + 1.2), on = ri === m.rule;
            const s = R[0].padEnd(6) + sym(R[1]).padEnd(5) + "→ " + sym(R[2]).padEnd(6) + R[3].padEnd(5) + R[4];
            if (on) { const ctx = S.ctx; ctx.save(); ctx.font = `500 ${sz.toFixed(1)}px "IBM Plex Mono", monospace`; const tw = ctx.measureText(s).width; ctx.restore();
              ruleBox = [x0, y - rowH * 0.8, tw + 10, rowH * 1.08];
              S.rect(...ruleBox, { color: C.accent, w: iw * 0.45, alpha: kT }); }
            S.text(s, x0 + 4, y, { size: sz, align: "left", mono: true, italic: false, color: on ? C.accent : C.ink, weight: on ? 500 : 400, alpha: kT });
          }
        }
      }
      // tape
      const lo = Math.floor(st.cam - st.nC / 2), hi = Math.ceil(st.cam + st.nC / 2);
      const L = B.x, Rr = B.x + B.w, edge = cs * 1.4;
      for (let i = lo; i <= hi; i++) {
        const x = cellX(i);
        if (x + cs < L || x > Rr) continue;
        const mid = x + cs / 2, a = Math.min(1, (mid - L) / edge, (Rr - mid) / edge) * k1;
        if (a <= 0) continue;
        S.rect(x, tapeY, cs, cs, { color: C.ink, w: iw * 0.55, alpha: a });
        const v = m.tape.has(i) ? m.tape.get(i) : bl;
        if (v !== "_") {
          const fresh = i === m.written && frac < 1 && !m.halted;
          S.text(v, mid, tapeY + cs * 0.7, { size: cs * 0.56, mono: true, italic: false, color: fresh ? C.accent : C.ink, weight: fresh ? 500 : 400, alpha: a, halo: false });
        }
      }
      S.line([[L, tapeY], [Rr, tapeY]], { w: iw * 0.3, color: C.soft, alpha: 0.6 * k1 });
      S.line([[L, tapeY + cs], [Rr, tapeY + cs]], { w: iw * 0.3, color: C.soft, alpha: 0.6 * k1 });
      // head: a pointer above the cell it reads
      const hxp = cellX(hx) + cs / 2, hy = tapeY - cs * 0.18;
      if (k1 > 0) {
        const hw = cs * 0.42, hh = cs * 0.62;
        S.line([[hxp, hy], [hxp - hw, hy - hh * 0.45], [hxp - hw, hy - hh], [hxp + hw, hy - hh], [hxp + hw, hy - hh * 0.45]], { w: iw * 0.9, color: C.accent, close: true, alpha: k1 });
        if (ruleBox && kT > 0) S.line([[ruleBox[0] + ruleBox[2] / 2, ruleBox[1] + ruleBox[3]], [hxp, hy - hh]], { w: iw * 0.4, color: C.accent, dash: [iw, iw * 1.6], alpha: 0.55 * kT });
        S.text("head", hxp, hy - hh * 0.56, { size: fs * 0.72, color: C.accent, halo: false, alpha: k1 });
      }
      const sy = tapeY + cs + fs * 1.2;
      S.text(`step ${m.steps}`, B.x + B.w, sy, { size: fs * 0.9, align: "right", color: C.soft, alpha: k1 });
      const note = P === PROGS.beaver ? "starts on a blank tape of 0s" : !m.input ? "empty input: try 1011" : "";
      if (note) S.text(note, B.x + (n ? B.w * 0.08 : cs), sy, { size: fs * 0.85, align: "left", color: C.soft, alpha: k1 });
      // AI beat: the tape becomes a stream of tokens fed to a universal machine running a neural network
      if (kA > 0) {
        const bw = Math.min(B.w * 0.34, cs * 4.2), bh = Math.min(B.y + B.h - aiY - fs * 2.2, bw * 0.8);
        const bx = B.x + B.w - bw, by = n ? aiY + fs * 0.4 : B.y + B.h - fs * 2 - bh;
        const ty = by + bh * 0.5, th = Math.min(cs * 0.8, fs * 1.6);
        S.text(n ? "tape → tokens" : "the tape becomes a stream of tokens", n ? B.x + B.w * 0.06 : B.x, ty - th * 0.5 - fs * 0.6, { size: fs * 0.95, align: "left", color: C.accent, alpha: kA });
        // token stream sliding into the machine
        const ctx = S.ctx; ctx.save(); ctx.globalAlpha = kA;
        ctx.font = `400 ${(th * 0.48).toFixed(1)}px "IBM Plex Mono", monospace`;
        const widths = TOK.map(t => ctx.measureText(t).width + th * 0.5), total = widths.reduce((a, b) => a + b + 6, 0);
        ctx.restore();
        const shift = (ft * cs * 0.9) % total, xEnd = bx - cs * 0.55;
        ctx.save(); ctx.beginPath(); ctx.rect(B.x, ty - th, xEnd - B.x, th * 2); ctx.clip();
        for (let rep = 0; rep < 3; rep++) {
          let x = xEnd - total * (rep + 1) + shift;
          for (let i = 0; i < TOK.length; i++) {
            const w = widths[i];
            if (x + w > B.x - 4 && x < xEnd) {
              const a = Math.min(1, (x + w - B.x) / (cs * 1.2)) * kA;
              S.rect(x, ty - th / 2, w, th, { color: C.accent, w: iw * 0.5, alpha: a });
              S.text(TOK[i], x + w / 2, ty + th * 0.17, { size: th * 0.48, mono: true, italic: false, color: C.ink, alpha: a, halo: false });
            }
            x += w + 6;
          }
        }
        ctx.restore();
        S.arrow(xEnd + 3, ty, bx + 2, ty, { w: iw * 0.7, color: C.accent, alpha: kA });
        // the universal machine, whose program is a neural network
        S.rect(bx, by, bw, bh, { color: C.accent, w: iw * 0.9, alpha: kA });
        const layers = [3, 4, 4, 2], pts = layers.map((c, li) => Array.from({ length: c }, (_, j) => [bx + bw * (0.18 + 0.64 * li / (layers.length - 1)), by + bh * (0.22 + 0.56 * (c === 1 ? 0.5 : j / (c - 1)))]));
        const pulse = (ft * 0.8) % 1;
        for (let li = 0; li < layers.length - 1; li++)
          for (const a of pts[li]) for (const b of pts[li + 1]) {
            const on = Math.abs(pulse * (layers.length - 1) - li - 0.5) < 0.5;
            S.line([a, b], { w: iw * (on ? 0.5 : 0.28), color: on ? C.accent : C.ink, alpha: kA * (on ? 0.9 : 0.4) });
          }
        for (const L2 of pts) for (const p of L2) S.dot(p[0], p[1], Math.max(2.2, iw * 0.8), C.accent, kA);
        S.text("universal machine", bx + bw / 2, by - fs * 0.35, { size: fs * 0.85, color: C.accent, weight: 500, alpha: kA });
        S.text("program = a neural network", bx + bw, by + bh + fs * 1.05, { size: fs * 0.8, align: "right", color: C.ink, alpha: kA });
        if (!n) S.text("rules are just more data on the tape", B.x, by + bh + fs * 1.05, { size: fs * 0.8, align: "left", color: C.soft, alpha: kA });
      }
      const ones = [...m.tape.values()].filter(v => v === "1").length;
      const tapeStr = (() => { const ks = [...m.tape.keys()]; if (!ks.length) return "blank"; const a = Math.min(...ks), b = Math.max(...ks); let s = ""; for (let i = a; i <= b; i++) s += m.tape.has(i) ? m.tape.get(i) : (bl === "_" ? "□" : bl); return s; })();
      if (P === PROGS.beaver) return `busy beaver · step ${m.steps} · ${ones} ones on the tape${m.halted ? " · halted (the record is 6 ones in 14 steps)" : ""}`;
      if (P === PROGS.parity) return `parity · step ${m.steps} · state ${m.state} · tape ${tapeStr}${m.halted ? (tapeStr.endsWith("E") ? " · even number of 1s" : " · odd number of 1s") : ""}`;
      const val = m.input ? parseInt(m.input, 2) : 0;
      return `increment · step ${m.steps} · state ${m.state} · tape ${tapeStr}${m.halted ? ` · ${val} + 1 = ${val + 1}` : ""}`;
    },
    code(S) {
      const P = PROGS[S.p.prog] || PROGS.inc, inp = P.blankStart ? "" : clean(S.p.input);
      const r = P.rules.slice(0, 3).map(r => `    ("${r[0]}", "${r[1]}"): ("${r[2]}", ${r[3]}, "${r[4]}"),`).join("\n");
      return `${S.c("# a Turing machine: " + P.name)}
rules = {   ${S.c("# (state, read) -> (write, move, next)")}
${r}
    ${S.c("# ... " + (P.rules.length - 3) + " more rules")}
}
tape, head, state = ${S.v('"' + (inp || (P.blankStart ? "000…" : "")) + '"')}, 0, ${S.v('"' + P.start + '"')}
while state != "halt":
    write, move, state = rules[state, tape[head]]
    tape[head] = write
    head += 1 if move == R else -1`;
    },
  });
})();
