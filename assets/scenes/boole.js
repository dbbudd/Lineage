// Boole — logic as algebra on 0 and 1 → drawn as a gate circuit with a truth table → Shannon's switching circuits → AI chips built from billions of gates
(function () {
  const AND = (x, y) => x * y, OR = (x, y) => x + y - x * y, NOT = x => 1 - x;
  // gates: {t: type, in: [sources], c: column, y: 0..1}; sources are "A" "B" "C" or a gate index
  const EXPR = {
    e1: { label: "(A AND B) OR NOT C", ins: ["A", "B", "C"], cols: 2, gates: [{ t: "AND", in: ["A", "B"], c: 1, y: 0.25 }, { t: "NOT", in: ["C"], c: 1, y: 0.82 }, { t: "OR", in: [0, 1], c: 2, y: 0.5 }],
      py: (A, B, C) => `OR(AND(A, B), NOT(C))`, f: (A, B, C) => OR(AND(A, B), NOT(C)) },
    e2: { label: "A AND (B OR C)", ins: ["A", "B", "C"], cols: 2, gates: [{ t: "OR", in: ["B", "C"], c: 1, y: 0.68 }, { t: "AND", in: ["A", 0], c: 2, y: 0.4 }],
      py: () => `AND(A, OR(B, C))`, f: (A, B, C) => AND(A, OR(B, C)) },
    e3: { label: "NOT (A AND B)", ins: ["A", "B"], cols: 2, gates: [{ t: "AND", in: ["A", "B"], c: 1, y: 0.32 }, { t: "NOT", in: [0], c: 2, y: 0.32 }],
      py: () => `NOT(AND(A, B))`, f: (A, B) => NOT(AND(A, B)) },
    e4: { label: "A XOR B = (A OR B) AND NOT (A AND B)", ins: ["A", "B"], cols: 3, gates: [{ t: "OR", in: ["A", "B"], c: 1, y: 0.18 }, { t: "AND", in: ["A", "B"], c: 1, y: 0.62 }, { t: "NOT", in: [1], c: 2, y: 0.62 }, { t: "AND", in: [0, 2], c: 3, y: 0.4 }],
      py: () => `AND(OR(A, B), NOT(AND(A, B)))`, f: (A, B) => AND(OR(A, B), NOT(AND(A, B))) },
  };
  const IY = { A: 0.12, B: 0.42, C: 0.82 };
  function evalAll(E, v) { const out = []; E.gates.forEach((g, i) => { const x = g.in.map(s => (typeof s === "string" ? v[s] : out[s])); out[i] = g.t === "AND" ? AND(x[0], x[1]) : g.t === "OR" ? OR(x[0], x[1]) : NOT(x[0]); }); return out; }
  const combo = n => ({ A: (n >> 2) & 1, B: (n >> 1) & 1, C: n & 1 });

  Lineage.scene({
    params: [
      { id: "expr", label: "Expression", type: "select", value: "e1", options: Object.entries(EXPR).map(([value, e]) => ({ value, label: e.label })) },
      { id: "auto", label: "Step through every input", type: "toggle", value: true },
      { id: "speed", label: "Stepping speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { Object.assign(S.st, { v: { A: 1, B: 0, C: 1 }, seen: new Set(), last: -1 }); },
    onParam(S, id) { if (id === "expr") S.st.seen = new Set(); },
    layout(S) {
      const { box, narrow, fs } = S;
      const R = narrow ? { x: box.x + fs * 2.2, y: box.y + fs * 1.6, w: box.w * 0.6 - fs * 2.6, h: box.h * 0.58 }
        : { x: box.x + fs * 3.2, y: box.y + fs * 3.2, w: box.w * 0.62 - fs * 3.6, h: box.h * 0.54 };
      const T = narrow ? { x: box.x + box.w * 0.66, y: box.y + fs * 1.4, w: box.w * 0.34 } : { x: box.x + box.w * 0.7, y: box.y + fs * 3.0, w: box.w * 0.3 };
      const bY = R.y + R.h + fs * (narrow ? 1.8 : 3.0);
      Object.assign(S.st, { R, T, bY });
    },
    entry(S) { const R = S.st.R; return [R.x - S.fs * 1.6, R.y + R.h * 0.42]; },
    pointer(S, type, x, y) {
      if (type !== "down") return; const st = S.st, R = st.R, E = EXPR[S.p.expr] || EXPR.e1;
      E.ins.forEach(n => { const p = [R.x, R.y + IY[n] * R.h]; if (Math.hypot(p[0] - x, p[1] - y) < Math.max(22, S.fs * 1.6)) { st.v[n] = 1 - st.v[n]; S.p.auto = false; const el = document.getElementById("p-auto"); if (el) el.checked = false; } });
    },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, ctx = S.ctx, R = st.R, E = EXPR[S.p.expr] || EXPR.e1;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.7) / 0.3);
      const fz = fs * (nar ? 0.8 : 1);
      if (S.p.auto && k2 > 0.5) { const n = Math.floor(ft / 1.3) % 8; if (n !== st.last) { st.last = n; Object.assign(st.v, combo(n)); } }
      const v = st.v, go = evalAll(E, v), out = go[go.length - 1];
      const row = (v.A << 2) | (E.ins.includes("C") ? v.C : 0) | (v.B << 1);
      if (k2 > 0.5) { st.seen.add(E.ins.includes("C") ? row : row); }
      // geometry
      const gh = Math.min(R.h * 0.22, R.w * 0.16), gw = gh * 1.25, c0 = R.x + fz * 0.9 + gh * 1.5 + gw / 2, c1 = R.x + R.w - gw / 2 - fz * 1.2, colX = c => E.cols < 2 ? c0 : c0 + (c - 1) / (E.cols - 1) * (c1 - c0);
      const pos = E.gates.map(g => [colX(g.c), R.y + g.y * R.h]);
      const outPin = i => { const g = E.gates[i], p = pos[i]; return [p[0] + gw / 2 + (g.t === "NOT" ? gh * 0.16 : 0), p[1]]; };
      const inPin = (i, j) => { const g = E.gates[i], p = pos[i]; return [p[0] - gw / 2 + (g.t === "OR" ? gh * 0.12 : 0), g.in.length === 1 ? p[1] : p[1] + (j ? 1 : -1) * gh * 0.27]; };
      const val = s => (typeof s === "string" ? v[s] : go[s]);
      const src = s => (typeof s === "string" ? [R.x + fz * 0.9, R.y + IY[s] * R.h] : outPin(s));
      const wire = (a, b, on, alpha, s) => {
        const back = s === "A" ? 0.78 : 0.42; // separate verticals so fanned-out inputs stay readable
        const mx = Math.max(a[0] + gh * 0.3, b[0] - gh * back), pts = [a, [mx, a[1]], [mx, b[1]], b];
        S.line(pts, { color: on ? C.accent : C.soft, w: on ? iw * 0.95 : iw * 0.55, alpha });
      };
      // wires (drawn first)
      E.gates.forEach((g, i) => g.in.forEach((s, j) => wire(src(s), inPin(i, j), val(s), k1, s)));
      const oEnd = [R.x + R.w + fz * 0.4, pos[pos.length - 1][1]];
      wire(outPin(E.gates.length - 1), oEnd, out, k1);
      // gates
      ctx.save(); ctx.globalAlpha = k1; ctx.lineWidth = iw * 0.8; ctx.lineJoin = "round";
      E.gates.forEach((g, i) => {
        const [x, y] = pos[i], l = x - gw / 2, r = x + gw / 2, t = y - gh / 2, b = y + gh / 2, on = go[i];
        ctx.strokeStyle = C.ink; ctx.fillStyle = on ? S.mix(C.accent, C.paper, 0.8) : C.paper; ctx.beginPath();
        if (g.t === "AND") { ctx.moveTo(l, t); ctx.lineTo(x, t); ctx.arc(x, y, gh / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(l, b); ctx.closePath(); }
        else if (g.t === "OR") { ctx.moveTo(l, t); ctx.quadraticCurveTo(x + gw * 0.1, t, r, y); ctx.quadraticCurveTo(x + gw * 0.1, b, l, b); ctx.quadraticCurveTo(l + gh * 0.3, y, l, t); }
        else { ctx.moveTo(l, t); ctx.lineTo(r - gh * 0.1, y); ctx.lineTo(l, b); ctx.closePath(); }
        ctx.fill(); ctx.stroke();
        if (g.t === "NOT") { ctx.beginPath(); ctx.arc(r + gh * 0.03, y, gh * 0.12, 0, Math.PI * 2); ctx.fillStyle = C.paper; ctx.fill(); ctx.stroke(); }
        S.text(g.t, x - (g.t === "NOT" ? gw * 0.12 : 0), y + fz * 0.3, { size: Math.min(fz * 0.82, gh * (g.t === "NOT" ? 0.24 : 0.32)), color: C.ink, italic: false, weight: 600, halo: false });
      });
      ctx.restore();
      // input switches and output lamp
      ["A", "B", "C"].forEach(n => {
        const used = E.ins.includes(n), p = [R.x, R.y + IY[n] * R.h], on = v[n] && used;
        S.circle(p[0], p[1], fz * 0.85, { color: used ? (on ? C.accent : C.ink) : C.soft, w: iw * 0.7, fill: on ? S.mix(C.accent, C.paper, 0.35) : C.paper, alpha: k1 * (used ? 1 : 0.4) });
        S.text(String(v[n]), p[0], p[1] + fz * 0.33, { size: fz * 0.95, color: on ? C.paper : C.ink, italic: false, weight: 600, halo: false, alpha: k1 * (used ? 1 : 0.35) });
        S.text(n, p[0] - fz * 1.6, p[1] + fz * 0.35, { size: fz * 1.1, color: C.ink, weight: 500, alpha: k1 * (used ? 1 : 0.35) });
      });
      S.circle(oEnd[0] + fz * 0.9, oEnd[1], fz * 0.95, { color: out ? C.accent : C.ink, w: iw * 0.8, fill: out ? C.accent : C.paper, alpha: k1 });
      S.text(String(out), oEnd[0] + fz * 0.9, oEnd[1] + fz * 0.35, { size: fz, color: out ? C.paper : C.ink, italic: false, weight: 600, halo: false, alpha: k1 });
      S.text(E.label, R.x - fz * 1.6, R.y - fz * (nar ? 1.0 : 1.6), { align: "left", size: fz * (nar ? 0.9 : 1.1), color: C.ink, weight: 600, alpha: k1 });
      if (!nar) S.text("click A, B or C to flip a switch", R.x - fz * 1.6, R.y + R.h + fz * 1.3, { align: "left", size: fz * 0.8, color: C.soft, alpha: k2 });
      // truth table
      const T = st.T, cols = E.ins.concat(["out"]), cwT = T.w / cols.length, lh = fz * (nar ? 1.12 : 1.42);
      const rowsN = E.ins.length === 3 ? 8 : 4;
      if (k2 > 0) {
        cols.forEach((c, j) => S.text(c, T.x + (j + 0.5) * cwT, T.y, { size: fz * 0.9, color: c === "out" ? C.accent : C.ink, weight: 600, alpha: k2 }));
        S.line([[T.x, T.y + lh * 0.35], [T.x + T.w, T.y + lh * 0.35]], { color: C.ink, w: iw * 0.4, alpha: k2 });
        for (let r = 0; r < rowsN; r++) {
          const vv = E.ins.length === 3 ? combo(r) : { A: (r >> 1) & 1, B: r & 1, C: 0 }, key = E.ins.length === 3 ? r : (vv.A << 2) | (vv.B << 1);
          const y = T.y + lh * (r + 1.25), curRow = vv.A === v.A && vv.B === v.B && (E.ins.length === 2 || vv.C === v.C);
          if (curRow) S.rect(T.x - fz * 0.2, y - lh * 0.78, T.w + fz * 0.4, lh, { color: C.accent, w: iw * 0.45, alpha: k2 });
          E.ins.forEach((n, j) => S.text(String(vv[n]), T.x + (j + 0.5) * cwT, y, { size: fz * 0.9, color: C.ink, italic: false, mono: true, alpha: k2 }));
          if (st.seen.has(key)) { const o = E.f(vv.A, vv.B, vv.C); S.text(String(o), T.x + (cols.length - 0.5) * cwT, y, { size: fz * 0.95, color: o ? C.accent : C.ink, italic: false, mono: true, weight: 600, alpha: k2 }); }
        }
      }
      // Shannon 1937 → AI chips
      if (k3 > 0) {
        const y0 = st.bY, x0 = R.x - fz * 1.6, box = S.box;
        const chipW = box.w * (nar ? 0.3 : 0.26), chipH = Math.min(box.y + box.h - y0 - fz * 0.4, chipW * 0.62), cx = box.x + box.w - chipW - fz * 0.4, cy = y0 - fz * 0.6;
        S.text("Shannon, 1937: Boole's algebra", x0, y0, { align: "left", size: fz * 0.95, color: C.accent, weight: 600, alpha: k3 });
        S.text("designs switching circuits", x0, y0 + fz * 1.3, { align: "left", size: fz * 0.95, color: C.accent, weight: 600, alpha: k3 });
        S.text(nar ? "AI chips: billions of gates" : "every AI chip is billions of these gates", x0, y0 + fz * 2.7, { align: "left", size: fz * 0.88, color: C.ink, alpha: k3 });
        if (chipH > fz * 1.5) {
          S.rect(cx, cy, chipW, chipH, { color: C.ink, w: iw * 0.6, alpha: k3 });
          if (!nar) S.text("an AI chip", cx + chipW / 2, cy - fz * 0.9, { size: fz * 0.8, color: C.soft, alpha: k3 });
          for (let j = 0; j < 7; j++) { const px = cx + chipW * (j + 0.5) / 7; S.line([[px, cy - fz * 0.35], [px, cy]], { color: C.ink, w: iw * 0.4, alpha: k3 }); S.line([[px, cy + chipH], [px, cy + chipH + fz * 0.35]], { color: C.ink, w: iw * 0.4, alpha: k3 }); }
          const nx = 14, ny = Math.max(3, Math.round(nx * chipH / chipW)), rr = S.rng(1937);
          for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
            const ph = rr(), on = Math.sin(ft * 3 + ph * 20) > 0.3;
            S.dot(cx + chipW * (a + 0.5) / nx, cy + chipH * (b + 0.5) / ny, Math.max(1.2, chipW / nx * 0.2), on ? C.accent : C.soft, k3 * (on ? 1 : 0.5));
          }
        }
      }
      const seenN = [...st.seen].filter(x => (E.ins.length === 3 ? true : (x & 1) === 0)).length;
      return `${E.ins.map(n => `${n} = ${v[n]}`).join(", ")} → ${E.label.split(" = ")[0]} = ${out} · ${Math.min(seenN, rowsN)} of ${rowsN} rows of the truth table filled`;
    },
    code(S) {
      const E = EXPR[S.p.expr] || EXPR.e1, v = S.st.v || { A: 1, B: 0, C: 1 }, out = E.f(v.A, v.B, v.C);
      return `${S.c("# Boole, 1854: logic as algebra on 0 and 1")}
AND = lambda x, y: x * y          ${S.c("# 1 only when both are 1")}
OR  = lambda x, y: x + y - x * y
NOT = lambda x: 1 - x

${E.ins.join(", ")} = ${S.v(E.ins.map(n => v[n]).join(", "))}
out = ${E.py()}   ${S.c("# " + out)}

${S.c("# Shannon, 1937: each function is a switching circuit")}`;
    },
  });
})();
