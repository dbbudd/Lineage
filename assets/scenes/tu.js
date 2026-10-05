// Tu Youyou — sweet wormwood → low-temperature extraction keeps artemisinin's peroxide bridge intact → parasites cleared from red blood cells → AI screening of molecule libraries
(function () {
  const intactAt = T => 1 / (1 + Math.exp((T - 75) / 9)); // illustrative: share of molecules whose O–O bridge survives
  const COLS = 6, ROWS = 4, NCELL = COLS * ROWS, CYCLE = 16;

  function seedCells(st) {
    const r = st.rng; st.inf = new Array(NCELL).fill(0);
    let n = 0; while (n < 13) { const i = Math.floor(r() * NCELL); if (!st.inf[i]) { st.inf[i] = 1; n++; } }
    st.hist = [13]; st.tc = 0; st.ht = 0;
  }

  Lineage.scene({
    params: [
      { id: "temp", label: "Extraction temperature", type: "range", min: 20, max: 100, step: 1, value: 35, fmt: v => v + " °C" + (v <= 40 ? " (cold soak / ether)" : v >= 95 ? " (boiling)" : "") },
      { id: "dose", label: "Dose of extract", type: "range", min: 0.2, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) {
      const st = S.st; st.rng = S.rng(523); seedCells(st);
      const r2 = S.rng(2020); st.lib = Array.from({ length: 260 }, () => { const a = r2() * Math.PI * 2, d = Math.sqrt(r2()); return [Math.cos(a) * d, Math.sin(a) * d * 0.8, r2()]; });
      st.hal = [0.62, -0.28];
      const r3 = S.rng(7); st.mols = Array.from({ length: 9 }, (_, i) => ({ x: ((i % 3) + 0.5) / 3 + (r3() - 0.5) * 0.12, y: (Math.floor(i / 3) + 0.5) / 3 + (r3() - 0.5) * 0.12, ph: r3() * 6.28, rank: (i * 0.618) % 1 }));
    },
    reset(S) { seedCells(S.st); },
    onParam(S, id) { if (id !== "speed") seedCells(S.st); },
    layout(S) {
      const b = S.box, st = S.st, nar = S.narrow, fs = S.fs;
      const topH = b.h * (nar ? 0.7 : 0.66);
      const quoteY = b.y + fs * 0.8, titleY = quoteY + fs * (nar ? 1.45 : 1.8), bot = b.y + topH;
      st.quoteY = quoteY; st.titleY = titleY;
      st.sprig = { x: b.x + b.w * 0.06, y0: bot - fs * 0.6, y1: titleY + fs * 0.4, s: Math.min(b.w * 0.07, topH * 0.08) };
      const bw = b.w * 0.2, bTop = titleY + fs * 0.9, bh = Math.max(fs * 3, bot - bTop - fs * 4.6);
      st.beak = { x: b.x + b.w * 0.16, y: bTop, w: bw, h: bh };
      const gx = b.x + b.w * 0.52, gw = b.w * 0.46, gTop = titleY + fs * 0.45;
      const plotH = Math.max(fs * 2.2, topH * 0.2);
      const cell = Math.min(gw / COLS, (bot - gTop - plotH - fs * 1.9) / ROWS);
      st.grid = { x: gx + (gw - cell * COLS) / 2, y: gTop, c: cell };
      st.plot = { x: gx + gw * 0.06, y: gTop + cell * ROWS + fs * 0.6, w: gw * 0.9, h: plotH };
      st.strip = { y: b.y + topH + (b.h - topH) * (nar ? 0.45 : 0.5), h: b.h - topH, x0: b.x + b.w * 0.03, x1: b.x + b.w * 0.97 };
    },
    entry(S) { const s = S.st.sprig; return [s.x, s.y0]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const T = S.p.temp, dose = S.p.dose, intact = intactAt(T), kill = 0.3 * dose * intact;
      // ---- beat 1a: a sprig of sweet wormwood (feathery, finely divided leaves)
      const sp = st.sprig, H = (sp.y0 - sp.y1) * k1;
      const stem = []; for (let i = 0; i <= 30; i++) { const u = i / 30; stem.push([sp.x + Math.sin(u * 2.4) * sp.s * 0.6, sp.y0 - u * H]); }
      S.line(stem, { w: iw * 0.9, color: C.ink });
      for (let j = 0; j < 9; j++) {
        const u = 0.12 + j * 0.095; if (u * (sp.y0 - sp.y1) > H) break;
        const p = stem[Math.round(u * 30)], side = j % 2 ? 1 : -1, L = sp.s * (1.5 - u * 0.8), ang = -Math.PI / 2 + side * 1.0;
        const tip = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L];
        S.line([p, tip], { w: iw * 0.5, color: C.ink });
        for (let q = 1; q <= 4; q++) {
          const v = q / 5, bp = [p[0] + (tip[0] - p[0]) * v, p[1] + (tip[1] - p[1]) * v], l2 = L * 0.32 * (1 - v * 0.5);
          for (const s2 of [-1, 1]) S.line([bp, [bp[0] + Math.cos(ang + s2 * 0.9) * l2, bp[1] + Math.sin(ang + s2 * 0.9) * l2]], { w: iw * 0.38, color: C.ink });
        }
      }
      if (k1 > 0.6) S.text("qinghao", sp.x, sp.y1 - fs * 0.5, { size: fs * 0.85, alpha: S.ease((k1 - 0.6) / 0.4) });
      // ---- beat 1b: the extraction vessel, its temperature and the molecules
      const B = st.beak, ka = S.ease((k1 - 0.25) / 0.75);
      if (ka > 0) {
        const lip = B.w * 0.06;
        S.line([[B.x - lip, B.y], [B.x, B.y + lip], [B.x, B.y + B.h], [B.x + B.w, B.y + B.h], [B.x + B.w, B.y + lip], [B.x + B.w + lip, B.y]], { w: iw * 0.8, color: C.ink, alpha: ka });
        const lv = B.y + B.h * 0.28;
        const wave = []; for (let i = 0; i <= 20; i++) { const u = i / 20; wave.push([B.x + u * B.w, lv + Math.sin(u * 12 + ft * (1 + T / 30)) * B.h * 0.012 * (1 + T / 40)]); }
        S.line(wave, { w: iw * 0.45, color: C.soft, alpha: ka });
        // heat: flame size grows with temperature
        const fl = Math.max(0, (T - 20) / 80), fx = B.x + B.w / 2, fy = B.y + B.h + fs * 0.3;
        for (let j = -1; j <= 1; j++) {
          const h = (fs * 0.6 + fs * 1.6 * fl) * (j ? 0.7 : 1) * (1 + 0.12 * Math.sin(ft * 9 + j * 2));
          if (fl > 0.05) S.line([[fx + j * B.w * 0.2 - fs * 0.25, fy + h], [fx + j * B.w * 0.2, fy + h * 0.05 + fs * 0.1], [fx + j * B.w * 0.2 + fs * 0.25, fy + h]], { w: iw * 0.5, color: C.ink, alpha: ka * Math.min(1, fl * 3) });
        }
        // bubbles when hot
        if (T > 70) for (let j = 0; j < 6; j++) { const u = ((ft * 0.6 + j * 0.37) % 1); S.circle(B.x + B.w * (0.15 + 0.13 * j), B.y + B.h - u * (B.h * 0.7), Math.max(1.5, B.w * 0.025), { w: iw * 0.35, color: C.soft, alpha: ka * (1 - u) }); }
        // thermometer
        const tx = B.x + B.w + lip * 2.2 + S.fs * 0.5, ty0 = B.y - fs * 0.2, ty1 = B.y + B.h * 0.92;
        S.line([[tx, ty0], [tx, ty1]], { w: iw * 0.4, color: C.soft, alpha: ka });
        const ty = ty1 - (ty1 - ty0) * ((T - 15) / 90);
        S.line([[tx, ty1], [tx, ty]], { w: iw * 1.1, color: C.ink, alpha: ka }); S.dot(tx, ty1, iw * 1.2, C.ink, ka);
        S.text(`${T} °C`, tx, ty1 + fs * 1.3, { size: fs * 0.85, alpha: ka });
        // molecules: a ring with the peroxide bridge on top; broken bridges go grey
        const mr = Math.max(4, Math.min(B.w * 0.07, B.h * 0.08, fs * 0.55));
        st.mols.forEach((m, i) => {
          const x = B.x + mr * 0.6 + (B.w - mr * 1.2) * (m.x + 0.04 * Math.sin(ft * (0.8 + T / 50) + m.ph)), y = lv + mr * 1.2 + Math.max(0, B.y + B.h - lv - mr * 1.6) * (m.y + 0.04 * Math.cos(ft * (0.7 + T / 60) + m.ph));
          const ok = m.rank < intact, col = ok ? C.ink : C.soft;
          const hex = []; for (let a = 0; a <= 6; a++) hex.push([x + mr * Math.cos(a * Math.PI / 3 + Math.PI / 6), y + mr * Math.sin(a * Math.PI / 3 + Math.PI / 6)]);
          S.line(hex, { w: iw * 0.4, color: col, alpha: ka });
          const p1 = hex[4], p2 = hex[5], o1 = [p1[0] - mr * 0.15, p1[1] - mr * 0.95], o2 = [p2[0] + mr * 0.15, p2[1] - mr * 0.95], orr = Math.max(1.8, mr * 0.28);
          S.line([p1, o1], { w: iw * 0.4, color: col, alpha: ka }); S.line([p2, o2], { w: iw * 0.4, color: col, alpha: ka });
          if (ok) S.line([o1, o2], { w: iw * 0.75, color: C.ink, alpha: ka });
          S.circle(o1[0], o1[1], orr, { w: iw * 0.4, color: col, fill: C.paper, alpha: ka }); S.circle(o2[0], o2[1], orr, { w: iw * 0.4, color: col, fill: C.paper, alpha: ka });
        });
        S.text(S.narrow ? "O–O bridge" : "artemisinin, O–O bridge", B.x + B.w / 2, st.titleY, { size: fs * 0.78, color: C.soft, alpha: ka });
        S.text(`${Math.round(intact * 100)}% intact`, B.x + B.w / 2, fy + fs * 3.3, { size: fs * 0.9, weight: 500, alpha: ka });
        S.text("Ge Hong, c. 340 CE: “soak a handful in water, wring out the juice”", S.box.x + S.box.w * 0.02, st.quoteY, { size: fs * (S.narrow ? 0.72 : 0.8), align: "left", color: C.ink, alpha: ka });
      }
      // ---- beat 2: red blood cells with malaria parasites, cleared by the active extract
      const sdt = dt * (S.p.speed ?? 1), G = st.grid;
      if (k2 > 0 && sdt > 0) {
        st.tc += sdt; st.ht += sdt;
        const r = st.rng;
        for (let i = 0; i < NCELL; i++) if (st.inf[i] === 1) {
          if (r() < kill * sdt) st.inf[i] = 2; // cured: the parasite fades out
          else if (r() < 0.32 * sdt) { const nb = [i - 1, i + 1, i - COLS, i + COLS].filter(j => j >= 0 && j < NCELL && Math.abs((j % COLS) - (i % COLS)) <= 1); const j = nb[Math.floor(r() * nb.length)]; if (!st.inf[j]) st.inf[j] = 1; }
        }
        for (let i = 0; i < NCELL; i++) if (st.inf[i] >= 2) { st.inf[i] += sdt; if (st.inf[i] > 3.2) st.inf[i] = 0; }
        if (st.ht > 0.25) { st.ht = 0; st.hist.push(st.inf.filter(v => v === 1).length); }
        if (st.tc > CYCLE) seedCells(st);
      }
      if (k2 > 0) {
        const c = G.c;
        S.text(S.narrow ? "blood cells + parasites" : "red blood cells + malaria parasites", G.x + (c * COLS) / 2, st.titleY, { size: fs * 0.85, alpha: k2 });
        for (let i = 0; i < NCELL; i++) {
          const x = G.x + (i % COLS + 0.5) * c, y = G.y + (Math.floor(i / COLS) + 0.5) * c, rr = c * 0.42;
          ctx.save(); ctx.globalAlpha = k2; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.5;
          ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.86, 0.3, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = C.soft; ctx.lineWidth = iw * 0.3; ctx.beginPath(); ctx.ellipse(x, y, rr * 0.45, rr * 0.36, 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          if (st.inf[i] === 1) { // ring-stage parasite: a small ring with a dark dot
            const px = x + rr * 0.32 * Math.cos(i * 2.1 + ft * 0.4), py = y + rr * 0.28 * Math.sin(i * 2.1 + ft * 0.4);
            S.circle(px, py, Math.max(3, rr * 0.34), { w: iw * 0.8, color: C.ink, alpha: k2 }); S.dot(px + rr * 0.24, py - rr * 0.14, Math.max(1.8, rr * 0.13), C.ink, k2);
          } else if (st.inf[i] >= 2) { // dying parasite: a broken, fading ring
            const px = x + rr * 0.32 * Math.cos(i * 2.1), py = y + rr * 0.28 * Math.sin(i * 2.1), f = 1 - (st.inf[i] - 2) / 1.2;
            S.circle(px, py, Math.max(2.5, rr * 0.28), { w: iw * 0.5, color: C.soft, alpha: k2 * f, dash: [2, 3] });
          }
        }
        // parasite count over this cycle
        const Pl = st.plot, n = st.hist.length, maxN = CYCLE / 0.25;
        S.line([[Pl.x, Pl.y], [Pl.x, Pl.y + Pl.h], [Pl.x + Pl.w, Pl.y + Pl.h]], { w: iw * 0.4, color: C.soft, alpha: k2 });
        const pts = st.hist.map((v, i) => [Pl.x + (i / maxN) * Pl.w, Pl.y + Pl.h - (v / NCELL) * Pl.h]);
        S.line(pts, { w: iw * 0.9, color: C.ink, alpha: k2 });
        if (pts.length) S.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], iw * 1.0, C.ink, k2);
        S.text("infected cells", Pl.x + fs * 0.3, Pl.y + fs * 0.2, { size: fs * 0.75, align: "left", color: C.soft, alpha: k2 });
        S.text("time", Pl.x + Pl.w, Pl.y + Pl.h + fs * 0.95, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
        // extract arrow from beaker to cells
        const B2 = st.beak;
        const ay = B2.y + B2.h * 0.18, ax0 = B2.x + B2.w + B2.w * 0.132 + fs * 1.0;
        S.arrow(ax0, ay, G.x - fs * 0.25, ay, { w: iw * 0.7, color: C.ink, alpha: k2 });
        S.text(`dose ${dose.toFixed(1)}×`, (ax0 + G.x) / 2, ay - fs * 0.45, { size: fs * 0.78, color: C.ink, alpha: k2 });
      }
      // ---- beat 3: AI screens a vast library of molecules
      if (k3 > 0) {
        const T3 = st.strip, cx = (T3.x0 + T3.x1) / 2 + (T3.x1 - T3.x0) * (S.narrow ? 0 : 0.08), rx = (T3.x1 - T3.x0) * (S.narrow ? 0.46 : 0.36), ry = T3.h * (S.narrow ? 0.24 : 0.36), sweep = ((ft * 0.12) % 1.2) - 0.1;
        for (const [u, v, s] of st.lib) {
          const x = cx + u * rx, y = T3.y + v * ry, lit = Math.abs((u + 1) / 2 - sweep) < 0.05;
          S.dot(x, y, Math.max(1.3, iw * 0.42), lit ? C.accent : C.soft, k3 * (lit ? 0.9 : 0.45 + 0.3 * s));
        }
        const sx = cx + (sweep * 2 - 1) * rx;
        S.line([[sx, T3.y - ry * 1.05], [sx, T3.y + ry * 1.05]], { w: iw * 0.6, color: C.accent, alpha: k3 * 0.6 });
        const hx = cx + st.hal[0] * rx, hy = T3.y + st.hal[1] * ry, found = sweep > (st.hal[0] + 1) / 2;
        S.circle(hx, hy, Math.max(4, iw * 1.6), { w: iw * 0.8, color: C.accent, fill: found ? C.accent : C.paper, alpha: k3 });
        if (found) S.circle(hx, hy, Math.max(9, iw * 4), { w: iw * 0.5, color: C.accent, alpha: k3 * 0.7 });
        S.text("halicin", hx + fs * 0.7, hy - fs * 0.5, { size: fs * 0.9, color: C.accent, weight: 500, align: "left", alpha: k3 * (found ? 1 : 0.5) });
        const lx = T3.x0;
        if (S.narrow) S.text("a neural network scores a library of molecules", lx, T3.y - ry - fs * 0.45, { size: fs * 0.8, color: C.accent, align: "left", alpha: k3 });
        else { S.text("neural network", lx, T3.y - fs * 0.3, { size: fs * 0.9, color: C.accent, align: "left", alpha: k3 }); S.text("scores molecules", lx, T3.y + fs * 0.8, { size: fs * 0.8, color: C.accent, align: "left", alpha: k3 }); }
        S.text(S.narrow ? "MIT, 2020: a new antibiotic" : "MIT, 2020: an old diabetes compound becomes a new antibiotic", cx, T3.y + ry + fs * 1.2, { size: fs * 0.75, color: C.soft, alpha: k3 });
      }
      const inf = st.inf.filter(v => v === 1).length;
      return `${T} °C extraction · ${Math.round(intact * 100)}% of artemisinin intact · dose ${dose.toFixed(1)}× · ${inf} of ${NCELL} cells infected`;
    },
    code(S) {
      const T = S.p.temp, intact = intactAt(T), dose = S.p.dose;
      return `${S.c("# Tu Youyou, 1971: extract qinghao without heat")}
T = ${S.v(T)}                         ${S.c("# extraction temperature, °C")}
intact = 1 / (1 + exp((T - 75) / 9))   ${S.c("# " + intact.toFixed(2) + " (illustrative)")}
dose = ${S.v(dose.toFixed(2))}

kill = 0.3 * dose * intact         ${S.c("# " + (0.3 * dose * intact).toFixed(2) + " per second")}
for cell in infected:
    if random() < kill * dt:
        cure(cell)                 ${S.c("# O–O bridge attacks the parasite")}
    elif random() < 0.32 * dt:
        infect(neighbour(cell))    ${S.c("# parasites spread")}`;
    },
  });
})();
