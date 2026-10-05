// Joy Buolamwini — Gender Shades (2018): error rates by skin type × gender for IBM, Microsoft, Face++ → bias auditing
(function () {
  // Buolamwini & Gebru 2018 (Table 4, error = 1 − TPR, %), and Raji & Buolamwini 2019 re-audit (Aug 2018, Table 1)
  const DATA = {
    ibm: { name: "IBM", y2017: [34.7, 12.0, 7.1, 0.3], all2017: 12.1, y2018: [16.97, 0.63, 2.37, 0.26], all2018: 4.41 },
    msft: { name: "Microsoft", y2017: [20.8, 6.0, 1.7, 0.0], all2017: 6.3, y2018: [1.52, 0.33, 0.34, 0.0], all2018: 0.48 },
    face: { name: "Face++", y2017: [34.5, 0.7, 9.8, 0.8], all2017: 10.0, y2018: [4.1, 1.3, 1.0, 0.5], all2018: 1.6 },
  };
  const GROUPS = [["darker", "female"], ["darker", "male"], ["lighter", "female"], ["lighter", "male"]];
  const COLS = 6, ROWS = 5, NF = COLS * ROWS;
  const fmt = v => (v < 1 && v > 0 ? v.toFixed(1) : v < 10 ? v.toFixed(1) : v.toFixed(1)) + "%";
  function vals(S, id) { const d = DATA[id]; return S.p.redo ? d.y2018 : d.y2017; }
  function overall(S, id) { const d = DATA[id]; return S.p.redo ? d.all2018 : d.all2017; }
  Lineage.scene({
    params: [
      { id: "co", label: "Company tested", type: "select", value: "ibm", options: [{ value: "ibm", label: "IBM" }, { value: "msft", label: "Microsoft" }, { value: "face", label: "Face++" }, { value: "all", label: "Compare all three" }] },
      { id: "redo", label: "Show the 2018 re-audit (after the companies updated)", type: "toggle", value: false },
      { id: "speed", label: "Audit speed", type: "range", min: 0.2, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) + "×" },
    ],
    init(S) {
      const r = S.rng(2018); S.st.order = GROUPS.map(() => { const a = [...Array(NF).keys()]; for (let i = NF - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; });
      S.st.disp = null; S.st.s0 = null;
    },
    onParam(S, id) { if (id !== "speed") S.st.s0 = null; },
    reset(S) { S.st.s0 = null; S.st.disp = null; },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const ax = b.x + fs * (narrow ? 2.2 : 3.0), aw = b.x + b.w - ax - (narrow ? fs * 0.2 : fs * 5.2);
      const gap = aw * 0.05, bw = (aw - gap * 3) / 4, cell = Math.min(bw / COLS, b.h * 0.055);
      const fy = b.y + fs * (narrow ? 1.6 : 2.4), fh = cell * ROWS;
      const by0 = fy + fh + fs * (narrow ? 3.0 : 4.2), by1 = b.y + b.h - fs * (narrow ? 3.9 : 4.4);
      Object.assign(S.st, { ax, aw, gap, bw, cell, fy, fh, by0, by1 });
    },
    entry(S) { const st = S.st; return [st.ax - S.fs * 0.8, st.fy + st.fh * 0.5]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, { ax, aw, gap, bw, cell, fy, fh, by0, by1 } = st;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      const co = S.p.co, ids = co === "all" ? ["ibm", "msft", "face"] : [co];
      // the sweep
      if (k2 <= 0 || st.s0 == null) st.s0 = ft;
      const sw = Math.min(1.08, (ft - st.s0) / 3.5);
      const target = ids.map(id => vals(S, id));
      if (!st.disp || st.disp.length !== target.length) st.disp = target.map(v => v.map(() => 0));
      const a = dt > 0 ? 1 - Math.exp(-dt * 5) : 1;
      const faceErr = GROUPS.map((_, g) => target.reduce((s, v) => s + v[g], 0) / target.length);
      GROUPS.forEach((_, g) => { const on = sw > (g + 1) / 4; target.forEach((v, i) => { st.disp[i][g] += ((on ? v[g] : 0) - st.disp[i][g]) * a; }); });
      // ---- faces: the benchmark ----
      const sx = ax + sw * (aw + fs);
      GROUPS.forEach(([skin, sex], g) => {
        const gx = ax + g * (bw + gap), x0 = gx + (bw - cell * COLS) / 2, wrong = Math.round((faceErr[g] / 100) * NF);
        const tone = skin === "darker" ? S.mix(C.ink, C.paper, 0.42) : S.mix(C.ink, C.paper, 0.88);
        for (let i = 0; i < NF; i++) {
          const cx = x0 + (i % COLS + 0.5) * cell, cy = fy + (Math.floor(i / COLS) + 0.5) * cell, r = cell * 0.36;
          if (k1 * NF * 4 < g * NF + i) continue;
          S.dot(cx, cy, r, tone); S.circle(cx, cy, r, { w: Math.max(0.6, iw * 0.2), color: C.ink, alpha: 0.6 });
          if (sex === "female") S.circle(cx, cy - r * 0.15, r * 1.12, { w: Math.max(0.6, iw * 0.18), color: C.ink, alpha: 0.45, a0: Math.PI * 1.05, a1: Math.PI * 1.95 });
          const scanned = k2 > 0 && cx < sx, isWrong = st.order[g].indexOf(i) < wrong;
          if (scanned && isWrong) { const q = r * 0.95; S.line([[cx - q, cy - q], [cx + q, cy + q]], { w: Math.max(1.2, iw * 0.45), color: C.ink }); S.line([[cx - q, cy + q], [cx + q, cy - q]], { w: Math.max(1.2, iw * 0.45), color: C.ink }); }
        }
        S.text(nar ? `${skin} ${sex[0].toUpperCase()}` : `${skin} ${sex}`, gx + bw / 2, fy - fs * 0.5, { size: fs * (nar ? 0.72 : 0.85), alpha: k1 });
      });
      if (k2 > 0 && sw < 1.05) S.line([[sx, fy - fs * 0.2], [sx, by1]], { w: iw * 0.5, color: C.ink, alpha: 0.5 * k2, dash: [iw, iw * 1.4] });
      if (!nar) S.text(co === "all" ? "faces from 6 national parliaments · ✕ = wrong gender (average of the three)" : "faces from 6 national parliaments · ✕ = gender guessed wrong", ax + aw / 2, fy + fh + fs * 1.3, { size: fs * 0.8, color: C.soft, alpha: k1 });
      // ---- bar chart ----
      let rel = "";
      if (k2 > 0) {
        const top = 40, Y = v => by1 - (Math.min(v, top) / top) * (by1 - by0);
        S.line([[ax, by0 - fs * 0.3], [ax, by1], [ax + aw, by1]], { w: iw * 0.45, color: C.ink, alpha: k2 });
        for (const t of [0, 10, 20, 30, 40]) {
          S.text(t + "%", ax - fs * 0.35, Y(t) + fs * 0.3, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
          if (t) S.line([[ax, Y(t)], [ax + aw, Y(t)]], { w: 0.6, color: C.soft, alpha: 0.35 * k2 });
        }
        if (!nar) S.text("error rate", ax + fs * 0.3, by0 - fs * 0.8, { size: fs * 0.8, align: "left", color: C.soft, alpha: k2 });
        const n = ids.length;
        GROUPS.forEach((_, g) => {
          const gx = ax + g * (bw + gap), slot = (bw * 0.8) / n, x00 = gx + bw * 0.1;
          ids.forEach((id, i) => {
            const v = st.disp[i][g], x = x00 + i * slot + slot * 0.1, w = slot * 0.8, y = Y(v);
            if (S.p.redo) { const old = DATA[id].y2017[g]; S.rect(x, Y(old), w, by1 - Y(old), { w: iw * 0.3, color: C.soft, alpha: k2 * 0.8 }); }
            S.rect(x, y, w, by1 - y, { w: iw * 0.55, color: C.ink, fill: S.mix(C.ink, C.paper, 0.78), alpha: k2 });
            if (sw > (g + 1) / 4) S.text(fmt(target[i][g]), x + w / 2, y - fs * 0.35, { size: fs * (n > 1 ? (nar ? 0.5 : 0.62) : (nar ? 0.75 : 0.9)), weight: 500, italic: n === 1, mono: false, alpha: k2 });
            if (n > 1) S.text(DATA[id].name === "Microsoft" ? "M" : DATA[id].name === "Face++" ? "F" : "I", x + w / 2, by1 + fs * 1.0, { size: fs * 0.62, italic: false, mono: true, color: C.soft, alpha: k2 });
          });
          S.text(nar ? `${GROUPS[g][0]} ${GROUPS[g][1][0].toUpperCase()}` : `${GROUPS[g][0]} ${GROUPS[g][1]}`, gx + bw / 2, by1 + fs * (n > 1 ? 2.1 : 1.2), { size: fs * (nar ? 0.68 : 0.8), alpha: k2 });
        });
        if (n === 1) {
          const ov = overall(S, co), yo = Y(ov);
          S.line([[ax, yo], [ax + aw, yo]], { w: iw * 0.45, color: C.ink, dash: [iw * 1.4, iw * 1.4], alpha: k2 * Math.min(1, sw) });
          if (nar) S.text(`- - -  overall error ${fmt(ov)}`, ax + aw / 2, by1 + fs * 2.25, { size: fs * 0.72, weight: 500, alpha: k2 * Math.min(1, sw) });
          else S.text(`overall ${fmt(ov)}`, ax + aw - fs * 0.2, yo - fs * 0.35, { size: fs * 0.82, align: "right", weight: 500, alpha: k2 * Math.min(1, sw) });
        } else if (!nar) S.text("I = IBM, M = Microsoft, F = Face++", ax + aw, by0 - fs * 0.8, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
        // ---- accent: audit by subgroup ----
        if (k3 > 0 && sw >= 1) {
          const v = target[0], hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v));
          const xh = ax + hi * (bw + gap) + bw / 2, xl = ax + lo * (bw + gap) + bw / 2, yh = Y(v[hi]), yl = Y(v[lo]);
          if (n === 1) {
            const xr = ax + aw + fs * (nar ? -0.1 : 0.9);
            S.line([[xh + bw * 0.42, yh], [xr, yh], [xr, yl], [xl + bw * 0.42, yl]], { w: iw * 0.6, color: C.accent, dash: [iw, iw], alpha: k3 });
            if (!nar) { S.text(`gap ${(v[hi] - v[lo]).toFixed(1)}`, xr + fs * 0.3, (yh + yl) / 2 - fs * 0.2, { size: fs * 0.85, align: "left", color: C.accent, weight: 500, alpha: k3 });
              S.text("points", xr + fs * 0.3, (yh + yl) / 2 + fs * 0.95, { size: fs * 0.85, align: "left", color: C.accent, alpha: k3 }); }
          }
          const ty = by1 + fs * (n > 1 ? 3.4 : nar ? 3.45 : 2.7);
          S.text(nar ? "Audit every group, not one average" : "Bias audit: test every group separately; one overall number hides the gap", ax + aw / 2, ty, { size: fs * (nar ? 0.8 : 0.9), color: C.accent, weight: 500, alpha: k3 });
        }
        const d0 = DATA[ids[0]], v0 = target[0], yr = S.p.redo ? "2018 re-audit" : "Gender Shades";
        rel = n === 1 ? `${d0.name}, ${yr}: darker-skinned women ${fmt(v0[0])} wrong · lighter-skinned men ${fmt(v0[3])} · overall ${fmt(overall(S, co))}`
          : `${yr}: worst group is darker-skinned women for all three (${ids.map(id => DATA[id].name + " " + fmt(vals(S, id)[0])).join(", ")})`;
      }
      return rel || "Pilot Parliaments Benchmark: 1,270 faces";
    },
    code(S) {
      const id = S.p.co === "all" ? "ibm" : S.p.co, d = DATA[id], v = vals(S, id);
      return `${S.c("# Gender Shades: audit each subgroup separately")}
model = "${S.v(d.name)}"                    ${S.c(S.p.redo ? "# August 2018 re-audit" : "# tested 2017, published 2018")}
for group in ["darker F", "darker M", "lighter F", "lighter M"]:
    faces = benchmark[group]           ${S.c("# Pilot Parliaments Benchmark")}
    wrong = count(model(f) != f.gender for f in faces)
    error[group] = wrong / len(faces)  ${S.c("# " + v.map(fmt).join(", "))}

overall = all_wrong / all_faces        ${S.c("# " + fmt(overall(S, id)) + ", looks fine")}
gap = max(error) - min(error)          ${S.c("# " + (Math.max(...v) - Math.min(...v)).toFixed(1) + " points")}`;
    },
  });
})();
