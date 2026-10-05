// Lynn Conway — Mead–Conway λ-based design rules: a CMOS inverter laid out in multiples of λ,
// tiled onto a fixed die; shrink λ and the same layout packs ever more circuits → AI accelerator tiles
Lineage.scene({
  params: [
    { id: "lam", label: "λ: the design unit", type: "range", min: 0.25, max: 3, step: 0.05, value: 2.5, fmt: v => v.toFixed(2) + " µm" },
    { id: "grid", label: "Show the λ rules grid", type: "toggle", value: true },
    { id: "speed", label: "Signal speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  init(S) {
    // one CMOS inverter, every coordinate a whole number of λ (cell 16λ × 36λ)
    S.st.CW = 16; S.st.CH = 36;
    S.st.shapes = [
      { t: "well", x: 0.5, y: 3, w: 15, h: 15.5 },
      { t: "diff", x: 3, y: 7, w: 10, h: 7, n: "p" },
      { t: "diff", x: 3, y: 22, w: 10, h: 7, n: "n" },
      { t: "poly", pts: [[7, 5], [9, 5], [9, 31], [7, 31], [7, 20.5], [1.5, 20.5], [1.5, 16.5], [7, 16.5]] },
      { t: "metal", x: 0, y: 0, w: 16, h: 3.5 },
      { t: "metal", x: 0, y: 32.5, w: 16, h: 3.5 },
      { t: "metal", x: 3.5, y: 3.5, w: 3, h: 9 },
      { t: "metal", x: 3.5, y: 23.5, w: 3, h: 9 },
      { t: "metal", x: 9.5, y: 9, w: 3, h: 18.5 },
      { t: "metal", x: 12.5, y: 17, w: 3.5, h: 3 },
      { t: "cut", x: 4, y: 9.5 }, { t: "cut", x: 10, y: 9.5 }, { t: "cut", x: 4, y: 24.5 }, { t: "cut", x: 10, y: 24.5 }, { t: "cut", x: 2.5, y: 17.5 },
    ];
  },
  layout(S) {
    const { box, narrow } = S, st = S.st; st.CW = 16; st.CH = 36;
    const ch = box.h * (narrow ? 0.72 : 0.7);
    const L = ch / st.CH, cw = L * st.CW;
    const cx = box.x + (narrow ? box.w * 0.08 : box.w * 0.07), cy = box.y + (narrow ? box.h * 0.1 : box.h * 0.09);
    const dieS = Math.min(box.w - (cx - box.x) - cw - box.w * 0.18, box.h * (narrow ? 0.72 : 0.66));
    const dx = box.x + box.w - dieS - box.w * (narrow ? 0.03 : 0.04), dy = cy + (ch - dieS) / 2;
    Object.assign(st, { L, cw, ch, cx, cy, dieS, dx, dy });
  },
  entry(S) { const st = S.st; return [st.cx - S.iw * 2, st.cy + st.ch * 0.52]; },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, { L, cx, cy, cw, ch, dieS, dx, dy } = st;
    const P = (x, y) => [cx + x * L, cy + y * L];
    const kA = S.ease(k / 0.4), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const polyCol = S.mix(C.accent, C.ink, 0.45), tint = S.mix(C.ink, C.paper, 0.88), mtint = S.mix(C.ink, C.paper, 0.8);
    // λ grid (the rules made visible)
    if (S.p.grid && kB > 0) {
      const ctx = S.ctx; ctx.save(); ctx.globalAlpha = 0.28 * kB; ctx.strokeStyle = C.soft; ctx.lineWidth = Math.max(0.5, iw * 0.18); ctx.beginPath();
      for (let i = 0; i <= st.CW; i++) { ctx.moveTo(cx + i * L, cy); ctx.lineTo(cx + i * L, cy + ch); }
      for (let j = 0; j <= st.CH; j++) { ctx.moveTo(cx, cy + j * L); ctx.lineTo(cx + cw, cy + j * L); }
      ctx.stroke(); ctx.restore();
    }
    // the inverter, layer by layer
    const sig = Math.sin(ft * 1.6) > 0 ? 1 : 0; // input logic level
    st.shapes.forEach((s, i) => {
      const a = S.ease(kA * st.shapes.length * 0.9 - i * 0.9 + 0.6); if (a <= 0) return;
      if (s.t === "well") S.line([P(s.x, s.y), P(s.x + s.w, s.y), P(s.x + s.w, s.y + s.h), P(s.x, s.y + s.h)], { close: true, w: iw * 0.4, color: C.soft, dash: [iw * 1.4, iw * 1.4], alpha: a });
      else if (s.t === "diff") {
        const on = (s.n === "p") === (sig === 0); // p conducts when input is 0, n when input is 1
        S.line([P(s.x, s.y), P(s.x + s.w, s.y), P(s.x + s.w, s.y + s.h), P(s.x, s.y + s.h)], { close: true, w: iw * 0.55, color: C.ink, fill: on && kB > 0 ? S.mix(C.accent, C.paper, 0.8) : tint, alpha: a });
      } else if (s.t === "poly") S.line(s.pts.map(q => P(q[0], q[1])), { close: true, w: iw * 0.8, color: polyCol, alpha: a });
      else if (s.t === "metal") S.line([P(s.x, s.y), P(s.x + s.w, s.y), P(s.x + s.w, s.y + s.h), P(s.x, s.y + s.h)], { close: true, w: iw * 0.7, color: C.ink, fill: mtint, alpha: a * 0.95 });
      else { const q = [P(s.x, s.y), P(s.x + 2, s.y), P(s.x + 2, s.y + 2), P(s.x, s.y + 2)];
        S.line(q, { close: true, w: iw * 0.5, color: C.ink, alpha: a }); S.line([q[0], q[2]], { w: iw * 0.35, color: C.ink, alpha: a }); S.line([q[1], q[3]], { w: iw * 0.35, color: C.ink, alpha: a }); }
    });
    // labels
    const lab = Math.max(12, fs * 0.82), la = S.ease((kA - 0.5) / 0.4);
    if (la > 0) {
      const R = cx + cw + L * 1.2;
      S.text("VDD", cx - L * 0.6, cy + L * 2.6, { size: lab, align: "right", alpha: la, italic: false, mono: true });
      S.text("GND", cx - L * 0.6, cy + L * 35, { size: lab, align: "right", alpha: la, italic: false, mono: true });
      S.text("in", cx - L * 0.4, cy + L * 19.3, { size: lab, align: "right", alpha: la, color: polyCol });
      S.text("out", R, cy + L * 19.3, { size: lab, align: "left", alpha: la });
      S.text("p-type", R, cy + L * 11.3, { size: lab, align: "left", alpha: la, color: C.soft });
      S.text("n-type", R, cy + L * 26.3, { size: lab, align: "left", alpha: la, color: C.soft });
      S.text(`in ${sig} → out ${1 - sig}`, cx + cw / 2, cy + ch + lab * 1.7, { size: lab * 1.05, alpha: la, mono: true, italic: false });
    }
    // dimension markers: every rule is a multiple of λ
    if (kB > 0) {
      const dim = (a, b, txt, side) => {
        const o = { w: iw * 0.45, color: C.accent, alpha: kB };
        S.line([a, b], o);
        const nx = b[1] - a[1], ny = a[0] - b[0], nl = Math.hypot(nx, ny) || 1, t = L * 0.5;
        [a, b].forEach(p => S.line([[p[0] - nx / nl * t, p[1] - ny / nl * t], [p[0] + nx / nl * t, p[1] + ny / nl * t]], o));
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        S.text(txt, m[0] + side[0], m[1] + side[1], { size: lab, color: C.accent, alpha: kB, weight: 500 });
      };
      dim(P(7, 15.2), P(9, 15.2), "2λ", [-L * 1.9, L * 0.45]);      // poly width, where the gate runs alone
      dim(P(9.5, 31.2), P(12.5, 31.2), "3λ", [0, lab * 1.05]);     // metal width
      dim(P(2.2, 7), P(2.2, 14), "7λ", [-lab * 0.9, lab * 0.35]);  // diffusion height
      dim(P(0, -1.3), P(16, -1.3), "16λ", [0, -lab * 0.35]);
    }
    // the die: a fixed 0.5 mm square, tiled with as many inverters as fit
    const lam = S.p.lam, DIE = 500, nx = Math.floor(DIE / (st.CW * lam)), ny = Math.floor(DIE / (st.CH * lam));
    const n = nx * ny, perMM = 1e6 / (st.CW * st.CH * lam * lam);
    if (kB > 0) {
      const tw = dieS / (DIE / (st.CW * lam)), th = dieS / (DIE / (st.CH * lam));
      S.rect(dx, dy, dieS, dieS, { w: iw * 0.8, color: C.ink, alpha: kB });
      const rows = Math.ceil(ny * kB), ctx = S.ctx;
      ctx.save(); ctx.globalAlpha = kB; ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(0.5, Math.min(iw * 0.4, tw * 0.08)); ctx.beginPath();
      if (tw >= 5) {
        for (let j = 0; j < rows; j++) for (let i = 0; i < nx; i++) { const x = dx + i * tw, y = dy + j * th; ctx.rect(x + tw * 0.12, y + th * 0.04, tw * 0.76, th * 0.92); }
        ctx.stroke(); ctx.strokeStyle = polyCol; ctx.beginPath();
        for (let j = 0; j < rows; j++) for (let i = 0; i < nx; i++) { const x = dx + (i + 0.5) * tw, y = dy + j * th; ctx.moveTo(x, y + th * 0.16); ctx.lineTo(x, y + th * 0.84); }
        ctx.stroke();
      } else {
        const step = Math.max(1, Math.ceil(2.2 / tw));
        for (let i = 0; i <= nx; i += step) { ctx.moveTo(dx + i * tw, dy); ctx.lineTo(dx + i * tw, dy + rows * th); }
        for (let j = 0; j <= rows; j++) { ctx.moveTo(dx, dy + j * th); ctx.lineTo(dx + nx * tw, dy + j * th); }
        ctx.stroke();
      }
      ctx.restore();
      // zoom lines from the cell to one tile
      S.line([[cx + cw, cy], [dx, dy]], { w: iw * 0.3, color: C.soft, dash: [iw, iw * 1.5], alpha: 0.6 * kB });
      S.line([[cx + cw, cy + ch], [dx + tw, dy + th]], { w: iw * 0.3, color: C.soft, dash: [iw, iw * 1.5], alpha: 0.6 * kB });
      S.rect(dx, dy, tw, th, { w: iw * 0.6, color: C.accent, alpha: kB });
      S.text("0.5 mm die", dx + dieS / 2, dy - lab * 0.7, { size: lab, alpha: kB, italic: false, mono: true });
      S.text(`${n.toLocaleString("en-AU")} inverters`, dx + dieS / 2, dy + dieS + lab * 1.5, { size: lab * 1.12, alpha: kB, weight: 500 });
      S.text(`${(2 * n).toLocaleString("en-AU")} transistors`, dx + dieS / 2, dy + dieS + lab * 2.8, { size: lab, alpha: kB, color: C.soft });
      // AI accelerator: the repeated tile becomes a systolic array, data pulsing across rows and down columns
      if (kC > 0) {
        const ux = nx * tw, uy = ny * th, cs = Math.max(1, Math.ceil(nx / 10)), rs = Math.max(1, Math.ceil(ny / 8)), ph = ft * 0.45;
        for (let i = 0; i <= nx; i += cs) S.line([[dx + i * tw, dy], [dx + i * tw, dy + uy]], { w: iw * 0.4, color: C.accent, alpha: 0.5 * kC });
        for (let j = 0; j <= ny; j += rs) S.line([[dx, dy + j * th], [dx + ux, dy + j * th]], { w: iw * 0.4, color: C.accent, alpha: 0.5 * kC });
        for (let j = 0, g = 0; j + rs <= ny; j += rs, g++) S.dot(dx + ((ph + g * 0.17) % 1) * ux, dy + (j + rs / 2) * th, iw * 1.15, C.accent, kC);
        for (let i = 0, g = 0; i + cs <= nx; i += cs, g++) S.dot(dx + (i + cs / 2) * tw, dy + ((ph * 0.8 + g * 0.23 + 0.4) % 1) * uy, iw * 1.0, C.accent, kC * 0.75);
        S.text("AI accelerator:", dx + dieS / 2, dy + dieS + lab * 4.4, { size: lab * 1.05, color: C.accent, alpha: kC, weight: 500 });
        S.text("one simple tile, repeated", dx + dieS / 2, dy + dieS + lab * 5.6, { size: lab * 1.05, color: C.accent, alpha: kC });
      }
    }
    return `λ = ${lam.toFixed(2)} µm · inverter ${(st.CW * lam).toFixed(0)} × ${(st.CH * lam).toFixed(0)} µm · ${Math.round(perMM).toLocaleString("en-AU")} inverters per mm²`;
  },
  code(S) {
    const lam = S.p.lam, per = 1e6 / (16 * 36 * lam * lam), n = Math.floor(500 / (16 * lam)) * Math.floor(500 / (36 * lam));
    return `${S.c("# Mead–Conway rules: every size is a multiple of λ")}
λ = ${S.v(lam.toFixed(2))}                ${S.c("# µm")}
poly_width   = 2 * λ       ${S.c("# " + (2 * lam).toFixed(2) + " µm")}
metal_width  = 3 * λ       ${S.c("# " + (3 * lam).toFixed(2) + " µm")}
contact_cut  = 2 * λ
cell = (16 * λ, 36 * λ)    ${S.c("# one CMOS inverter")}

per_mm2 = 1e6 / (cell.w * cell.h)   ${S.c("# " + Math.round(per).toLocaleString("en-AU"))}
on_die  = fit(cell, die=500)        ${S.c("# " + n.toLocaleString("en-AU") + " inverters")}
${S.c("# halve λ and four times as many fit")}`;
  },
});
