// Leibniz — binary arithmetic (1703): counting with 0 and 1, adding with carries, the I Ching hexagram → the chain rule in his notation → backpropagation
(function () {
  const bits = (v, n) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
  const bin = (v, n) => bits(v, n).join("");
  Lineage.scene({
    params: [
      { id: "a", label: "First number", type: "range", min: 0, max: 31, step: 1, value: 22, fmt: v => `${v} = ${v.toString(2)}` },
      { id: "b", label: "Second number", type: "range", min: 0, max: 31, step: 1, value: 13, fmt: v => `${v} = ${v.toString(2)}` },
      { id: "hex", label: "Show the sum as an I Ching hexagram", type: "toggle", value: true },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { S.st.t0 = 0; },
    onParam(S, id) { if (id === "a" || id === "b") S.st.t0 = S.st.ftNow || 0; },
    layout(S) {
      const { box, narrow, fs } = S;
      const s1 = box.h * (narrow ? 0.2 : 0.2), s2 = box.h * (narrow ? 0.44 : 0.44), s3 = box.h - s1 - s2;
      const y1 = box.y, y2 = y1 + s1, y3 = y2 + s2;
      const cw = Math.min(s2 / 5.4, box.w * (narrow ? 0.5 : 0.48) / 7.5);
      const gx = box.x + fs * (narrow ? 1.2 : 1.6) + cw * 1.2; // left edge of the six digit columns
      Object.assign(S.st, { s1, s2, s3, y1, y2, y3, cw, gx });
    },
    entry(S) { const st = S.st; return [S.box.x + S.fs * 0.4, st.y2 + st.s2 * 0.5]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, box = S.box;
      st.ftNow = ft;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.68) / 0.32);
      const fz = fs * (nar ? 0.82 : 1);
      // 1. counting with lights: 8 4 2 1
      {
        const v = Math.floor(ft * 1.1) % 16, r = Math.min(st.s1 * 0.2, fs * 1.1), cy = st.y1 + st.s1 * 0.56, x0 = box.x + fs * (nar ? 1.6 : 2.2) + r;
        if (!nar) S.text("counting", box.x + fs * 0.3, st.y1 + st.s1 * 0.12 + fz * 0.4, { align: "left", size: fz * 0.9, color: C.soft, alpha: k1 });
        bits(v, 4).forEach((b, i) => {
          const x = x0 + i * r * 3;
          S.text(String(8 >> i), x, cy - r - fz * 0.45, { size: fz * 0.8, color: C.soft, alpha: k1, italic: false });
          S.circle(x, cy, r, { color: b ? C.accent : C.soft, w: iw * (b ? 0.8 : 0.5), fill: b ? S.mix(C.accent, C.paper, 0.35) : null, alpha: k1 });
          S.text(String(b), x, cy + r + fz * 1.05, { size: fz, color: b ? C.accent : C.ink, weight: 600, italic: false, alpha: k1 });
        });
        const tx = x0 + 4 * r * 3 - r * 0.6;
        S.text(`${bin(v, 4)}  =  ${v}`, tx, cy + fz * 0.35, { align: "left", size: fz * 1.25, color: C.ink, italic: false, mono: true, alpha: k1 });
        if (!nar) S.text("each light is worth twice the one to its right", tx, cy + fz * 1.9, { align: "left", size: fz * 0.82, color: C.soft, alpha: k1 });
      }
      // 2. adding with carries, column by column from the right
      const A = S.p.a, B = S.p.b, sum = A + B, n = 6;
      const ab = bits(A, n), bb = bits(B, n), sb = bits(sum, n);
      const carry = [0, 0, 0, 0, 0, 0, 0]; // carry INTO column i (counted from the right)
      for (let i = 0; i < n; i++) { const s = ((A >> i) & 1) + ((B >> i) & 1) + carry[i]; carry[i + 1] = s >> 1; }
      const per = 0.75, cyc = n * per + 2.5, lt = ((ft - (st.t0 || 0)) % cyc + cyc) % cyc, done = Math.min(n, Math.floor(lt / per)), cur = lt < n * per ? done : -1;
      const cw = st.cw, gx = st.gx, rows = st.y2 + st.s2 * 0.08, dz = cw * 0.78;
      const cx = j => gx + (j + 0.5) * cw; // j = 0..5 left to right
      const ry = [rows + cw * 0.75, rows + cw * 1.85, rows + cw * 2.95, rows + cw * 4.25]; // carries, A, B, sum
      if (k2 > 0) {
        if (!nar) S.text("adding", box.x + fs * 0.3, rows + fz * 0.1, { align: "left", size: fz * 0.9, color: C.soft, alpha: k2 });
        for (let j = 0; j < n; j++) {
          const i = n - 1 - j, shown = i < done || cur < 0;
          if (i === cur) S.rect(cx(j) - cw * 0.46, ry[1] - cw * 0.85, cw * 0.92, ry[3] - ry[1] + cw * 1.1, { color: C.accent, w: iw * 0.5, alpha: k2 });
          if (carry[i] && (i <= done || cur < 0) && i > 0) S.text("1", cx(j), ry[0], { size: dz * 0.72, color: C.accent, weight: 600, italic: false, alpha: k2 });
          S.text(String(ab[j]), cx(j), ry[1], { size: dz, color: C.ink, italic: false, mono: true, alpha: k2 });
          S.text(String(bb[j]), cx(j), ry[2], { size: dz, color: C.ink, italic: false, mono: true, alpha: k2 });
          if (shown) S.text(String(sb[j]), cx(j), ry[3], { size: dz, color: C.accent, weight: 600, italic: false, mono: true, alpha: k2 });
        }
        S.text("+", gx - cw * 0.6, ry[2], { size: dz, color: C.ink, italic: false, alpha: k2 });
        S.line([[gx - cw * 0.9, ry[2] + cw * 0.42], [gx + n * cw, ry[2] + cw * 0.42]], { color: C.ink, w: iw * 0.55, alpha: k2 });
        const dx = gx + n * cw + cw * 0.5, dsz = dz * 0.82;
        S.text(`= ${A}`, dx, ry[1], { align: "left", size: dsz, color: C.soft, alpha: k2 });
        S.text(`= ${B}`, dx, ry[2], { align: "left", size: dsz, color: C.soft, alpha: k2 });
        if (cur < 0) S.text(`= ${sum}`, dx, ry[3], { align: "left", size: dsz, color: C.accent, weight: 600, alpha: k2 });
        if (!nar) S.text("1 + 1 = 10: write 0, carry 1", gx - cw * 0.9, ry[3] + cw * 1.15, { align: "left", size: fz * 0.82, color: C.soft, alpha: k2 });
        // the I Ching hexagram Leibniz was sent from China: six lines, solid or broken
        if (S.p.hex) {
          const hx = dx + cw * 2.3, hw = Math.min(cw * 2.4, box.x + box.w - hx - fs * 0.3), lh = (ry[3] - ry[1] + cw * 0.3) / 6;
          if (hw > cw * 1.2) {
            sb.forEach((b, j) => {
              const y = ry[1] - cw * 0.45 + (j + 0.5) * lh, on = j >= n - done || cur < 0, col = on ? C.ink : C.soft, w = Math.max(2.5, lh * 0.42);
              if (b) S.line([[hx, y], [hx + hw, y]], { color: col, w, alpha: k2 * (on ? 1 : 0.3) });
              else { S.line([[hx, y], [hx + hw * 0.4, y]], { color: col, w, alpha: k2 * (on ? 1 : 0.3) }); S.line([[hx + hw * 0.6, y], [hx + hw, y]], { color: col, w, alpha: k2 * (on ? 1 : 0.3) }); }
            });
            S.text("I Ching", hx + hw / 2, ry[3] + cw * 0.75, { size: fz * 0.8, color: C.soft, alpha: k2 });
          }
        }
      }
      // 3. the chain rule in Leibniz's notation → backpropagation
      if (k3 > 0) {
        const y = st.y3 + st.s3 * 0.3, bw = box.w * 0.25, bh = fz * 2.1, gap = (box.w - 3 * bw) / 3;
        const bx = i => box.x + gap * 0.5 + i * (bw + gap);
        const lab = ["x = 1.5", "u = 2x = 3", "y = u² = 9"];
        if (!nar) S.text("backpropagation", box.x + fs * 0.3, st.y3 + fz * 0.2, { align: "left", size: fz * 0.9, color: C.soft, alpha: k3 });
        lab.forEach((l, i) => {
          S.rect(bx(i), y - bh / 2, bw, bh, { color: C.ink, w: iw * 0.55, alpha: k3 });
          S.text(l, bx(i) + bw / 2, y + fz * 0.33, { size: fz * (nar ? 0.95 : 1.05), color: C.ink, alpha: k3 });
          if (i < 2) {
            S.arrow(bx(i) + bw + 4, y - bh * 0.2, bx(i + 1) - 4, y - bh * 0.2, { color: C.ink, w: iw * 0.5, alpha: k3, head: fs * 0.45 });
            const yb = y + bh * 0.85;
            S.arrow(bx(i + 1) - 2, yb, bx(i) + bw * 0.6, yb, { color: C.accent, w: iw * 0.65, alpha: k3, head: fs * 0.5 });
            S.text(i === 0 ? "du/dx = 2" : "dy/du = 2u = 6", (bx(i) + bw * 0.6 + bx(i + 1)) / 2, yb + fz * 1.15, { size: fz * 0.85, color: C.accent, alpha: k3 });
            const f = (ft * 0.6 + (1 - i) * 0.5) % 1; // gradient pulses flowing backwards
            S.dot(bx(i + 1) - (bx(i + 1) - bx(i) - bw * 0.6) * f, yb, iw * 0.9, C.accent, k3 * Math.sin(Math.PI * f));
          }
        });
        const fy = y + bh * 0.85 + fz * 3.1;
        S.text("dy/dx = dy/du · du/dx = 6 · 2 = 12", box.x + box.w / 2, fy, { size: fz * (nar ? 1.05 : 1.3), color: C.accent, weight: 600, alpha: k3 });
        if (!nar) S.text("the chain rule, applied layer after layer, on binary chips", box.x + box.w / 2, fy + fz * 1.4, { size: fz * 0.85, color: C.ink, alpha: k3 });
      }
      return `${A} + ${B}: ${bin(A, n)} + ${bin(B, n)} = ${bin(sum, n)} = ${sum}` + (cur >= 0 ? ` · column ${cur + 1} of 6` : ` · ${carry.slice(1).filter(Boolean).length} carries`);
    },
    code(S) {
      const A = S.p.a, B = S.p.b;
      return `${S.c("# binary addition, as Leibniz wrote it in 1703")}
a, b = ${S.v(A.toString(2).padStart(6, "0"))}, ${S.v(B.toString(2).padStart(6, "0"))}   ${S.c("# " + A + " and " + B)}
carry, total = 0, ""
for da, db in reversed(list(zip(a, b))):
    s = int(da) + int(db) + carry     ${S.c("# 0, 1, 2 or 3")}
    total = str(s % 2) + total        ${S.c("# write the digit")}
    carry = s // 2                    ${S.c("# 1 + 1 = 10: carry the 1")}
${S.c("# total = " + (A + B).toString(2).padStart(6, "0") + " = " + (A + B))}

${S.c("# his notation for the chain rule = backprop")}
dy_dx = dy_du * du_dx                ${S.c("# 6 * 2 = 12")}`;
    },
  });
})();
