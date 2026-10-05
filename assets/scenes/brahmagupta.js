// Brahmagupta — area of a cyclic quadrilateral, √((s−a)(s−b)(s−c)(s−d)); rules for zero, fortunes and debts → signed weights in a neural network
(function () {
  const RU = 5; // circle radius in units
  const RULES = [
    { op: "-", a: -3, b: 0, say: "a debt minus zero is a debt" },
    { op: "+", a: 2, b: -5, say: "a fortune plus a larger debt is a debt" },
    { op: "-", a: 0, b: -3, say: "zero minus a debt is a fortune" },
    { op: "x", a: 2, b: -3, say: "a fortune times a debt is a debt" },
    { op: "x", a: -2, b: -3, say: "a debt times a debt is a fortune" },
    { op: "-", a: 4, b: 4, say: "a number minus itself is zero" },
  ];
  const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
  const sgn = v => (v < 0 ? `(${v})` : String(v));
  const res = r => (r.op === "+" ? r.a + r.b : r.op === "-" ? r.a - r.b : r.a * r.b);
  const name = v => (v > 0 ? `fortune ${v}` : v < 0 ? `debt ${-v}` : "zero");
  function quad(S) {
    const th = S.st.th, P = th.map(t => [Math.cos(t) * RU, Math.sin(t) * RU]);
    const side = i => Math.hypot(P[(i + 1) % 4][0] - P[i][0], P[(i + 1) % 4][1] - P[i][1]);
    const L = [0, 1, 2, 3].map(side), s = (L[0] + L[1] + L[2] + L[3]) / 2;
    const area = Math.sqrt(Math.max(0, (s - L[0]) * (s - L[1]) * (s - L[2]) * (s - L[3])));
    let sh = 0; for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; sh += p[0] * q[1] - q[0] * p[1]; }
    return { P, L, s, area, shoe: Math.abs(sh) / 2 };
  }
  Lineage.scene({
    params: [
      { id: "rule", label: "Rule for fortunes and debts", type: "select", value: "all", options: [{ value: "all", label: "Cycle through all six" }].concat(RULES.map((r, i) => ({ value: String(i), label: r.say }))) },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Make a square", run(S) { S.st.th = [0.25, 0.25 + Math.PI / 2, 0.25 + Math.PI, 0.25 + 1.5 * Math.PI].map(t => t - Math.PI / 2); } }],
    init(S) { S.st.th = [3.55, 4.75, 0.35, 1.9]; S.st.th.sort((a, b) => a - b); S.st.drag = -1; },
    layout(S) {
      const { box, narrow, fs } = S;
      const r = narrow ? Math.min(box.w * 0.2, box.h * 0.23) : Math.min(box.w * 0.22, box.h * 0.25);
      const c = narrow ? [box.x + box.w * 0.25, box.y + fs * 1.6 + r] : [box.x + box.w * 0.3, box.y + fs * 2.2 + r];
      const fx = box.x + box.w * (narrow ? 0.52 : 0.6), fy = c[1] - r * (narrow ? 0.85 : 0.7);
      const ny = narrow ? box.y + box.h * 0.86 : box.y + box.h * 0.8, nx0 = box.x + fs * (narrow ? 0.7 : 1.2), nx1 = box.x + box.w * (narrow ? 0.6 : 0.6);
      const N = { x: box.x + box.w * (narrow ? 0.66 : 0.66), y: c[1] + r + fs * (narrow ? 1.6 : 2.6), w: box.w * (narrow ? 0.34 : 0.33) };
      N.h = box.y + box.h - N.y;
      Object.assign(S.st, { c, r, fx, fy, ny, nx0, nx1, N });
    },
    entry(S) { const { c, r } = S.st; return [c[0] - r, c[1]]; },
    pointer(S, type, x, y) {
      const st = S.st, { c, r } = st;
      if (type === "down") {
        let bi = -1, bd = Math.max(20, S.fs * 1.5);
        st.th.forEach((t, i) => { const d = Math.hypot(c[0] + Math.cos(t) * r - x, c[1] + Math.sin(t) * r - y); if (d < bd) { bd = d; bi = i; } });
        st.drag = bi;
      } else if (type === "drag" && st.drag >= 0) {
        let t = Math.atan2(y - c[1], x - c[0]); if (t < 0) t += Math.PI * 2;
        const others = st.th.filter((_, i) => i !== st.drag);
        if (others.every(o => Math.abs(((t - o + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) > 0.08)) {
          st.th[st.drag] = t; const keep = t; st.th = st.th.map(v => (v + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b); st.drag = st.th.indexOf(keep);
        }
      } else if (type === "up") st.drag = -1;
    },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, { c, r } = st;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.7) / 0.3);
      const Q = quad(S), px = p => [c[0] + p[0] / RU * r, c[1] + p[1] / RU * r];
      const fz = fs * (nar ? 0.8 : 1);
      // 1. the circle and the four-sided figure inside it
      S.circle(c[0], c[1], r, { color: C.soft, w: iw * 0.5, a0: Math.PI, a1: Math.PI + k1 * Math.PI * 2 });
      const V = Q.P.map(px);
      S.line(V.concat([V[0]]), { color: C.ink, w: iw * 0.9, alpha: k1, fill: S.mix(C.accent, C.paper, 0.9) });
      const names = ["A", "B", "C", "D"], sides = ["a", "b", "c", "d"];
      V.forEach((v, i) => {
        S.dot(v[0], v[1], iw * (st.drag === i ? 2.2 : 1.6), C.ink, k1);
        S.circle(v[0], v[1], iw * 3, { color: C.accent, w: iw * 0.4, alpha: k1 * 0.6 });
        const d = [(v[0] - c[0]) / r, (v[1] - c[1]) / r];
        S.text(names[i], v[0] + d[0] * fz * 1.3, v[1] + d[1] * fz * 1.3 + fz * 0.35, { size: fz * 1.05, color: C.ink, weight: 500, alpha: k1 });
        const w = V[(i + 1) % 4], m = [(v[0] + w[0]) / 2, (v[1] + w[1]) / 2], dm = [m[0] - c[0], m[1] - c[1]], lm = Math.hypot(dm[0], dm[1]) || 1;
        S.text(`${sides[i]} = ${f1(Q.L[i])}`, m[0] - dm[0] / lm * fz * 1.6, m[1] - dm[1] / lm * fz * 1.2 + fz * 0.3, { size: fz * 0.82, color: C.ink, alpha: k2 });
      });
      if (!nar) S.text("drag the corners around the circle", c[0], c[1] + r + fz * 2.6, { size: fz * 0.82, color: C.soft, alpha: k2 });
      // 2. his formula
      if (k2 > 0) {
        const x = st.fx, y = st.fy, lh = fz * (nar ? 1.45 : 1.75);
        S.text("Brahmagupta, 628 CE", x, y, { align: "left", size: fz * 0.9, color: C.soft, alpha: k2 });
        S.text(`s = (a + b + c + d) / 2 = ${f1(Q.s)}`, x, y + lh, { align: "left", size: fz * 0.95, color: C.ink, alpha: k2 });
        S.text("area = √((s−a)(s−b)(s−c)(s−d))", x, y + lh * 2.2, { align: "left", size: fz * (nar ? 0.95 : 1.12), color: C.accent, weight: 600, alpha: k2 });
        S.text(nar ? `= √(${f1(Q.s - Q.L[0])}·${f1(Q.s - Q.L[1])}·${f1(Q.s - Q.L[2])}·${f1(Q.s - Q.L[3])})` : `= √(${f1(Q.s - Q.L[0])} × ${f1(Q.s - Q.L[1])} × ${f1(Q.s - Q.L[2])} × ${f1(Q.s - Q.L[3])})`, x, y + lh * 3.3, { align: "left", size: fz * 0.9, color: C.ink, alpha: k2 });
        S.text(`= ${f1(Q.area)}`, x, y + lh * 4.5, { align: "left", size: fz * 1.4, color: C.accent, weight: 600, alpha: k2 });
        S.text(`measured: ${f1(Q.shoe)} ✓`, x, y + lh * 5.5, { align: "left", size: fz * 0.82, color: C.soft, alpha: k2 });
      }
      // 3a. zero, fortunes and debts on a number line
      const idx = S.p.rule === "all" ? Math.floor(ft / 3.2) % RULES.length : +S.p.rule, R = RULES[idx], lt = S.p.rule === "all" ? (ft % 3.2) / 3.2 : (ft % 3.2) / 3.2;
      const lo = -7, hi = 7, X = v => st.nx0 + (v - lo) / (hi - lo) * (st.nx1 - st.nx0), ny = st.ny;
      if (k2 > 0) {
        S.line([[st.nx0, ny], [st.nx1, ny]], { color: C.ink, w: iw * 0.5, alpha: k2 });
        for (let v = lo; v <= hi; v++) {
          S.line([[X(v), ny - (v ? fz * 0.25 : fz * 0.45)], [X(v), ny + (v ? fz * 0.25 : fz * 0.45)]], { color: C.ink, w: iw * (v ? 0.35 : 0.6), alpha: k2 });
          if (v % 2 === 0 || !nar) S.text(String(v), X(v), ny + fz * 1.25, { size: fz * 0.72, color: v < 0 ? C.accent : C.ink, italic: false, alpha: k2 * (v % 2 ? 0.7 : 1) });
        }
        S.text("debts", X(lo + 1.6), ny + fz * 2.4, { size: fz * 0.8, color: C.accent, alpha: k2 });
        S.text("fortunes", X(hi - 1.8), ny + fz * 2.4, { size: fz * 0.8, color: C.ink, alpha: k2 });
        // jumps: a + b starts at a and moves b; a − b moves −b; a × b makes |a| jumps of ±b from zero
        const jumps = R.op === "x" ? Array.from({ length: Math.abs(R.a) }, () => Math.sign(R.a) * R.b) : [R.op === "+" ? R.b : -R.b];
        let pos = R.op === "x" ? 0 : R.a; const p0 = pos;
        const prog = S.ease(lt / 0.65) * jumps.length;
        S.dot(X(p0), ny, iw * 1.3, C.ink, k2);
        jumps.forEach((j, n) => {
          const f = Math.max(0, Math.min(1, prog - n)); if (f <= 0) { pos += j; return; }
          const a0 = X(pos), a1 = X(pos + j * f), h = Math.max(fz * 0.9, Math.abs(X(pos + j) - X(pos)) * 0.35), pts = [];
          for (let q = 0; q <= 16; q++) { const u = q / 16 * f; pts.push([X(pos) + (X(pos + j) - X(pos)) * u, ny - h * Math.sin(Math.PI * u)]); }
          if (j !== 0) { S.line(pts, { color: C.ink, w: iw * 0.6, alpha: k2 }); const e = pts[pts.length - 1], b = pts[pts.length - 3]; S.arrow(b[0], b[1], e[0], e[1], { color: C.ink, w: iw * 0.6, alpha: k2, head: fz * 0.55 }); } else S.circle(a0, ny - fz * 0.9, fz * 0.6, { color: C.ink, w: iw * 0.5, alpha: k2 * f });
          pos += j; void a1;
        });
        const out = res(R), done = lt > 0.68;
        if (done) { S.dot(X(out), ny, iw * 2, out < 0 ? C.accent : C.ink, k2); S.circle(X(out), ny, iw * 3.6, { color: out < 0 ? C.accent : C.ink, w: iw * 0.5, alpha: k2 }); }
        const eq = `${sgn(R.a)} ${R.op === "x" ? "×" : R.op} ${sgn(R.b)} = ${done ? out : "?"}`;
        const tY = ny - fz * (nar ? 3.0 : 3.9);
        S.text(eq, (st.nx0 + st.nx1) / 2, tY, { size: fz * 1.15, color: C.ink, weight: 600, italic: false, alpha: k2 });
        S.text(R.say, (st.nx0 + st.nx1) / 2, tY + fz * 1.1, { size: fz * 0.85, color: C.soft, alpha: k2 * (nar ? 0 : 1) });
      }
      // 3b. signed weights in a neuron
      if (k3 > 0) {
        const N = st.N, ws = [0.9, -1.4, 0.6], xs = [1, 1, 1];
        const ox = N.x + N.w * 0.82, oy = N.y + N.h * 0.48, ix = N.x + N.w * 0.1;
        S.text("neural network weights", N.x + N.w / 2, N.y + fz * 0.1, { size: fz * 0.9, color: C.accent, weight: 600, alpha: k3 });
        ws.forEach((w, i) => {
          const iy = N.y + N.h * (0.24 + i * 0.25), neg = w < 0;
          S.line([[ix, iy], [ox, oy]], { color: neg ? C.accent : C.ink, w: Math.max(1.2, iw * 0.55 * Math.abs(w)), dash: neg ? [iw * 1.4, iw * 1.2] : null, alpha: k3 });
          S.dot(ix, iy, iw * 1.3, C.ink, k3);
          const mx = ix + (ox - ix) * 0.42, my = iy + (oy - iy) * 0.42;
          S.text((w > 0 ? "+" : "−") + Math.abs(w).toFixed(1), mx, my - fz * 0.35, { size: fz * 0.82, color: neg ? C.accent : C.ink, weight: 600, italic: false, alpha: k3 });
          const f = (ft * 0.7 + i * 0.3) % 1; S.dot(ix + (ox - ix) * f, iy + (oy - iy) * f, iw * 0.8, neg ? C.accent : C.ink, k3 * 0.8);
        });
        S.circle(ox, oy, fz * 0.9, { color: C.ink, w: iw * 0.7, fill: C.paper, alpha: k3 });
        S.text("Σ", ox, oy + fz * 0.35, { size: fz, color: C.ink, italic: false, alpha: k3, halo: false });
        const tot = ws.reduce((s, w, i) => s + w * xs[i], 0);
        S.text(`0.9 − 1.4 + 0.6 = ${tot.toFixed(1)}`, N.x + N.w / 2, N.y + N.h - fz * (nar ? 0.4 : 1.4), { size: fz * 0.8, color: C.ink, italic: false, alpha: k3 });
        if (!nar) S.text("a debt-like weight says “less of this”", N.x + N.w / 2, N.y + N.h - fz * 0.1, { size: fz * 0.78, color: C.soft, alpha: k3 });
      }
      return `a ${f1(Q.L[0])}, b ${f1(Q.L[1])}, c ${f1(Q.L[2])}, d ${f1(Q.L[3])} · area ${f1(Q.area)} (radius 5) · ${sgn(R.a)} ${R.op === "x" ? "×" : R.op} ${sgn(R.b)} = ${res(R)}: ${name(res(R))}`;
    },
    code(S) {
      const Q = quad(S), L = Q.L.map(f1);
      const idx = S.p.rule === "all" ? 0 : +S.p.rule, R = RULES[idx];
      return `${S.c("# Brahmagupta's formula (628 CE), cyclic quadrilateral")}
a, b, c, d = ${S.v(L.join(", "))}
s = (a + b + c + d) / 2            ${S.c("# " + f1(Q.s))}
area = sqrt((s-a)*(s-b)*(s-c)*(s-d))   ${S.c("# " + f1(Q.area))}

${S.c("# his rules for zero, fortunes (+) and debts (−)")}
-3 - 0   == -3      ${S.c("# a debt minus zero is a debt")}
-2 * -3  ==  6      ${S.c("# debt times debt is a fortune")}
 4 - 4   ==  0      ${S.c("# a number minus itself is zero")}
${S.v(sgn(R.a) + " " + (R.op === "x" ? "*" : R.op) + " " + sgn(R.b))}  ==  ${res(R)}      ${S.c("# " + R.say)}`;
    },
  });
})();
