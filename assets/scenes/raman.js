// C. V. Raman — laser light scatters off molecules: almost all keeps its colour (Rayleigh), a tiny fraction comes out
// shifted by a vibration (Stokes); the shifts build a spectrum that fingerprints the molecule → ML classifies spectra
(function () {
  const XMAX = 3800, BW = 10, NB = XMAX / BW;
  // approximate Raman bands: [shift cm⁻¹, relative height, width cm⁻¹, label]
  const MOL = {
    water: { name: "water", peaks: [[1640, 0.16, 70, "H–O–H bend"], [3250, 0.75, 170, ""], [3420, 1.0, 170, "O–H stretch"]] },
    ethanol: { name: "ethanol", peaks: [[884, 1.0, 22, "C–C–O stretch"], [1052, 0.42, 22, "#"], [1090, 0.32, 22, ""], [1455, 0.48, 30, "CH₂ / CH₃ bend"], [2880, 0.8, 35, ""], [2930, 1.25, 35, "C–H stretch"], [2975, 0.9, 30, ""]] },
    benzene: { name: "benzene", peaks: [[606, 0.12, 14, ""], [992, 1.0, 9, "ring breathing"], [1178, 0.13, 12, ""], [1586, 0.08, 14, ""], [1606, 0.09, 14, ""], [3062, 0.55, 22, "C–H stretch"]] },
  };
  const NAMES = ["water", "ethanol", "benzene"];
  const shape = m => { const out = new Float32Array(NB); for (let b = 0; b < NB; b++) { const x = b * BW + BW / 2; let v = 0; for (const [c, h, w] of MOL[m].peaks) v += h / (1 + ((x - c) / (w / 2)) ** 2); out[b] = v; } return out; };
  const SHAPES = {}; NAMES.forEach(n => (SHAPES[n] = shape(n)));

  // wavelength (nm) → an RGB colour string (approximate), dimmed at the edges of vision
  function wl(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    let f = l < 420 ? 0.35 + 0.65 * (l - 380) / 40 : l > 700 ? Math.max(0.3, 0.3 + 0.7 * (780 - l) / 80) : 1;
    if (l > 780) f = 0.3;
    const c = v => Math.round(255 * Math.pow(Math.max(0, v * f), 0.8) * 0.82);
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }
  const stokesNm = (laser, shift) => 1e7 / (1e7 / laser - shift);

  function startAcq(S) {
    const st = S.st, m = MOL[S.p.mol];
    st.counts = new Float32Array(NB); st.n = 0; st.t = 0; st.hold = 0; st.acq = (st.acq || 0) + 1;
    // sampling table: peaks plus a small flat background
    const sh = SHAPES[S.p.mol], cdf = new Float32Array(NB); let s = 0, mx = 0;
    for (let b = 0; b < NB; b++) { const v = sh[b] + 0.035; s += v; cdf[b] = s; if (v > mx) mx = v; }
    st.cdf = cdf; st.tot = s; st.pmax = mx / s;
    st.rate = 350 * Math.pow(532 / S.p.laser, 4); // Raman scattering grows as 1/λ⁴
    st.peaks = m.peaks;
  }

  Lineage.scene({
    params: [
      { id: "mol", label: "Molecule in the beam", type: "select", value: "ethanol", options: [{ value: "water", label: "Water" }, { value: "ethanol", label: "Ethanol" }, { value: "benzene", label: "Benzene" }] },
      { id: "laser", label: "Laser colour", type: "select", value: 532, options: [{ value: 405, label: "Violet 405 nm" }, { value: 532, label: "Green 532 nm" }, { value: 633, label: "Red 633 nm" }, { value: 785, label: "Near infrared 785 nm" }] },
      { id: "exp", label: "Exposure (time collecting light)", type: "range", min: 0.5, max: 15, step: 0.5, value: 6, fmt: v => v.toFixed(1) + " s" },
    ],
    init(S) { S.st.R = S.rng(1928); S.st.ph = []; S.p.laser = +S.p.laser; startAcq(S); },
    reset(S) { S.st.ph = []; startAcq(S); },
    onParam(S, id) { S.p.laser = +S.p.laser; if (id !== "exp") startAcq(S); },
    layout(S) {
      const b = S.box, nar = S.narrow, fs = S.fs, st = S.st;
      const beamY = b.y + b.h * (nar ? 0.15 : 0.17);
      const cs = b.h * (nar ? 0.2 : 0.17), cx = b.x + b.w * (nar ? 0.47 : 0.42);
      const spx0 = b.x + b.w * (nar ? 0.78 : 0.8), spx1 = b.x + b.w;
      const sx0 = b.x + fs * (nar ? 1.0 : 1.6), sx1 = b.x + b.w * (nar ? 1 : 0.64) - fs * 0.5;
      const sy0 = b.y + b.h * (nar ? 0.43 : 0.43), sy1 = b.y + b.h * (nar ? 0.74 : 0.8);
      Object.assign(st, { beamY, cs, cx, spx0, spx1, sx0, sx1, sy0, sy1,
        lx0: b.x + S.iw, lx1: b.x + Math.max(fs * 4.2, b.w * 0.15),
        mlx0: nar ? b.x : b.x + b.w * 0.71, mly0: nar ? b.y + b.h * 0.86 : b.y + b.h * 0.46 });
    },
    entry(S) { const st = S.st; return [st.lx0, st.beamY]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, b = S.box, nar = S.narrow, ctx = S.ctx;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const L0 = S.p.laser, lc = wl(L0), mol = S.p.mol;
      const { beamY, cs, cx, lx0, lx1, spx0, spx1 } = st;
      // ---- acquisition: photons counted by the spectrometer
      if (k > 0.25 && dt > 0) {
        if (st.hold > 0) { st.hold -= dt; if (st.hold <= 0) startAcq(S); }
        else {
          st.t += dt; let n = st.rate * dt, r = st.R;
          let whole = Math.floor(n) + (r() < n - Math.floor(n) ? 1 : 0);
          for (let e = 0; e < whole; e++) { const u = r() * st.tot; let lo = 0, hi = NB - 1; while (lo < hi) { const md = (lo + hi) >> 1; if (st.cdf[md] < u) lo = md + 1; else hi = md; } st.counts[lo]++; st.n++; }
          if (st.t >= S.p.exp) st.hold = 2.2;
        }
      }
      // ---- beat 1: laser, beam, sample, scattered photons
      ctx.save(); ctx.globalAlpha = k1;
      S.rect(lx0, beamY - fs * 0.9, lx1 - lx0, fs * 1.8, { w: iw * 0.7, color: C.ink });
      ctx.restore();
      S.text(`laser ${L0} nm`, (lx0 + lx1) / 2, beamY - fs * 1.35, { size: fs * (nar ? 0.75 : 0.85), alpha: k1 });
      const bx1 = lx1 + (cx - cs / 2 - lx1) * k1;
      S.line([[lx1, beamY], [bx1, beamY]], { w: iw * 1.1, color: lc, alpha: k1 });
      // sample cell
      S.rect(cx - cs / 2, beamY - cs / 2, cs, cs, { w: iw * 0.6, color: C.ink, alpha: k1 });
      S.text(MOL[mol].name, cx, nar ? beamY - cs / 2 - fs * 0.4 : beamY + cs / 2 + fs * 1.05, { size: fs * 0.85, alpha: k1 });
      drawMolecule(S, mol, cx, beamY, cs * 0.4, ft, k1);
      // spectrometer
      S.rect(spx0, beamY - cs * 0.42, spx1 - spx0 - iw, cs * 0.84, { w: iw * 0.6, color: C.ink, alpha: k1 });
      S.text(nar ? "detector" : "spectrometer", (spx0 + spx1) / 2, beamY - cs * 0.42 - fs * 0.4, { size: fs * 0.75, alpha: k1 });
      // little rainbow inside the spectrometer: where shifted light lands
      for (let i = 0; i < 24; i++) { const l = 380 + i * 16, x = spx0 + (spx1 - spx0 - iw) * (0.1 + 0.8 * i / 23); S.line([[x, beamY + cs * 0.12], [x, beamY + cs * 0.3]], { w: Math.max(1.5, (spx1 - spx0) * 0.03), color: wl(l), alpha: k1 * 0.55 }); }
      // photons
      if (k > 0.2 && dt > 0) {
        const nNew = dt * 14; if (st.R() < nNew) {
          const stokes = st.R() < 1 / 12; let lam = L0;
          if (stokes) { const p = pickPeak(st.peaks, st.R); lam = stokesNm(L0, p[0]); }
          st.ph.push({ x: lx1, y: beamY, vx: 1, vy: 0, lam, stokes, hit: false, a: st.R() });
        }
      }
      const v = b.w * 0.33;
      st.ph = st.ph.filter(p => {
        if (dt > 0) { p.x += p.vx * v * dt; p.y += p.vy * v * dt; }
        if (!p.hit && p.x >= cx) { p.hit = true; let a; if (p.stokes || st.R() < 0.35) { a = (st.R() - 0.5) * 0.5; } else a = st.R() * Math.PI * 2; p.vx = Math.cos(a); p.vy = Math.sin(a); }
        return p.x > b.x && p.x < spx0 + (spx1 - spx0) * 0.3 && p.y > b.y && p.y < st.sy0 - fs * 1.8;
      });
      for (const p of st.ph) {
        const col = wl(p.hit ? p.lam : L0);
        S.dot(p.x, p.y, p.stokes ? iw * 1.15 : iw * 0.75, col, k1 * (p.stokes ? 1 : 0.75));
        if (p.stokes && p.hit && p.x > cx + cs * 0.5) S.circle(p.x, p.y, iw * 2.4, { w: iw * 0.5, color: C.accent, alpha: k1 });
      }
      if (k2 > 0 && !nar) {
        S.text("● same colour: Rayleigh", cx + cs * 0.65, beamY + cs * 0.95, { size: fs * 0.75, align: "left", color: C.ink, alpha: k2 });
        S.text("◯ shifted colour: Raman (Stokes)", cx + cs * 0.65, beamY + cs * 0.95 + fs * 1.05, { size: fs * 0.75, align: "left", color: C.accent, alpha: k2 });
        S.text("shown 1 in 12; really about 1 in 10 million", cx + cs * 0.65, beamY + cs * 0.95 + fs * 2.1, { size: fs * 0.7, align: "left", color: C.soft, alpha: k2 });
      } else if (k2 > 0) S.text("◯ shifted: 1 in 12 here, ~1 in 10 million really", b.x, st.sy0 - fs * 1.75, { size: fs * 0.66, align: "left", color: C.accent, alpha: k2 });
      // ---- beat 2: the spectrum builds; peaks fingerprint the molecule
      const { sx0, sx1, sy0, sy1 } = st, X = s => sx0 + (sx1 - sx0) * (s / XMAX);
      let ref = 1;
      if (k2 > 0) {
        S.line([[sx0, sy0 - fs * 0.3], [sx0, sy1], [sx0 + (sx1 - sx0) * k2, sy1]], { w: iw * 0.5, color: C.ink, alpha: k2 });
        for (let s = 0; s <= XMAX; s += 1000) { S.line([[X(s), sy1], [X(s), sy1 + fs * 0.3]], { w: iw * 0.4, color: C.ink, alpha: k2 }); S.text(String(s), X(s), sy1 + fs * 1.15, { size: fs * 0.7, color: C.ink, alpha: k2, italic: false }); }
        if (nar) S.text("Raman shift, cm⁻¹", sx1, sy0 - fs * 0.15, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
        else S.text("Raman shift (cm⁻¹)", sx1, sy1 + fs * 2.3, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
        S.text(nar ? "photons" : "photons counted", sx0 + fs * 0.3, sy0 - fs * 0.15, { size: fs * 0.72, align: "left", color: C.soft, alpha: k2 });
        // Rayleigh line at 0, off the scale and filtered
        S.line([[X(0) + iw, sy1], [X(0) + iw, sy0 - fs * 0.1]], { w: iw * 0.9, color: lc, alpha: k2 * 0.7 });
        if (!nar) S.text("Rayleigh, off the scale (filtered)", X(0) + fs * 0.5, sy0 + fs * 0.9, { size: fs * 0.66, align: "left", color: C.soft, alpha: k2 });
        // counts
        ref = Math.max(1, st.rate * S.p.exp * st.pmax * 1.4);
        const pts = []; const sm = st.counts;
        for (let bb = 0; bb < NB; bb++) pts.push([X(bb * BW + BW / 2), sy1 - (sy1 - sy0) * Math.min(1.05, sm[bb] / ref) * k2]);
        S.line(pts, { w: iw * 0.7, color: C.ink, alpha: k2 });
        // peak labels: the main bands, with the colour the light came out
        const labelled = st.peaks.filter(p => p[3]);
        labelled.forEach((p, i) => {
          const x = X(p[0]); let y = sy1; const bb = Math.min(NB - 1, Math.floor(p[0] / BW)); let lm = 0; for (let q = bb - 2; q <= bb + 2; q++) if (q >= 0 && q < NB) lm = Math.max(lm, sm[q]);
          y = sy1 - (sy1 - sy0) * Math.min(1.05, lm / ref) * k2;
          const nm = Math.round(stokesNm(L0, p[0])), ly = Math.max(sy0 + fs * (nar ? 0.2 : 0.9), Math.min(y - fs * 0.5, sy1 - fs * 1.2));
          S.dot(x, sy1 + fs * 0.0, iw * 0.9, wl(nm), k2);
          if (nar && p[3] === "#") return;
          S.text(`${p[0]}`, x, ly, { size: fs * 0.75, color: C.accent, alpha: k2, italic: false, weight: 600 });
          if (!nar && p[3] !== "#") S.text(`${p[3]} · ${nm} nm`, x, ly - fs * 0.95, { size: fs * 0.66, color: C.ink, alpha: k2 });
        });
      }
      // ---- beat 3: a classifier reads the spectrum
      let probs = null;
      if (k3 > 0) {
        // compare the measured shape with reference shapes (cosine similarity), softmax into probabilities
        const sm = st.counts; let nm2 = 0; for (let bb = 25; bb < NB; bb++) nm2 += sm[bb] * sm[bb]; nm2 = Math.sqrt(nm2) || 1;
        const sims = NAMES.map(n => { const r = SHAPES[n]; let d = 0, rn = 0; for (let bb = 25; bb < NB; bb++) { d += sm[bb] * r[bb]; rn += r[bb] * r[bb]; } return d / (nm2 * Math.sqrt(rn)); });
        const lg = sims.map(s => s * 10), mx = Math.max(...lg), ex = lg.map(v => Math.exp(v - mx)), su = ex.reduce((a, c) => a + c, 0);
        probs = st.n > 30 ? ex.map(e => e / su) : [1 / 3, 1 / 3, 1 / 3];
        const x0 = st.mlx0, y0 = st.mly0;
        if (!nar) {
          S.text("machine learning", x0, y0, { size: fs * 0.95, align: "left", color: C.accent, weight: 600, alpha: k3 });
          S.text("reads the spectrum", x0, y0 + fs * 1.0, { size: fs * 0.78, align: "left", color: C.ink, alpha: k3 });
          // a small 1-D convolutional network: spectrum in, layers, three outputs
          const ny = y0 + fs * 2.0, nx0 = x0, nx1 = b.x + b.w - fs * 0.3, lay = [7, 5, 3], cols = [nx0 + fs * 0.4, (nx0 + nx1) / 2, nx1 - fs * 0.4], gh = fs * 4.2;
          const node = (li, i) => [cols[li], ny + gh * ((i + 0.5) / lay[li])];
          for (let li = 0; li < 2; li++) for (let i = 0; i < lay[li]; i++) for (let j = 0; j < lay[li + 1]; j++) { const a = node(li, i), c = node(li + 1, j); S.line([a, c], { w: iw * 0.18, color: C.soft, alpha: k3 * 0.7 }); }
          for (let li = 0; li < 3; li++) for (let i = 0; i < lay[li]; i++) { const p = node(li, i); S.dot(p[0], p[1], iw * (li === 2 ? 0.9 : 0.6), li === 2 ? C.accent : C.ink, k3); }
          const by0 = ny + gh + fs * 1.6, bw = nx1 - x0 - fs * 6.4;
          NAMES.forEach((n, i) => {
            const y = by0 + i * fs * 1.5, pr = probs[i], best = pr === Math.max(...probs);
            S.text(n, x0, y + fs * 0.3, { size: fs * 0.78, align: "left", color: best ? C.accent : C.ink, alpha: k3 });
            const bx = x0 + fs * 4.2;
            S.rect(bx, y - fs * 0.3, bw, fs * 0.7, { w: iw * 0.3, color: C.soft, alpha: k3 });
            S.rect(bx, y - fs * 0.3, bw * pr, fs * 0.7, { w: 0, fill: best ? C.accent : C.ink, alpha: k3 });
            S.text(Math.round(pr * 100) + "%", bx + bw + fs * 0.3, y + fs * 0.3, { size: fs * 0.72, align: "left", color: C.ink, alpha: k3, italic: false });
          });
        } else {
          S.text("ML reads it:", x0, y0 + fs * 0.3, { size: fs * 0.8, align: "left", color: C.accent, weight: 600, alpha: k3 });
          const seg = (b.w - fs * 5.2) / 3;
          NAMES.forEach((n, i) => {
            const pr = probs[i], best = pr === Math.max(...probs), x = b.x + fs * 5.4 + i * seg;
            S.text(`${n} ${Math.round(pr * 100)}%`, x, y0 - fs * 0.35, { size: fs * 0.68, align: "left", color: best ? C.accent : C.ink, alpha: k3 });
            S.rect(x, y0 + fs * 0.05, seg - fs * 0.6, fs * 0.45, { w: iw * 0.3, color: C.soft, alpha: k3 });
            S.rect(x, y0 + fs * 0.05, (seg - fs * 0.6) * pr, fs * 0.45, { w: 0, fill: best ? C.accent : C.ink, alpha: k3 });
          });
        }
      }
      const main = st.peaks.reduce((a, p) => (p[1] > a[1] ? p : a));
      const cls = probs ? ` · classifier: ${NAMES[probs.indexOf(Math.max(...probs))]} ${Math.round(Math.max(...probs) * 100)}%` : "";
      return `${MOL[mol].name} · laser ${L0} nm · strongest band ${main[0]} cm⁻¹ → ${Math.round(stokesNm(L0, main[0]))} nm · ${Math.round(st.n).toLocaleString("en-AU")} shifted photons in ${Math.min(st.t, S.p.exp).toFixed(1)} s${cls}`;
    },
    code(S) {
      const L0 = +S.p.laser, m = MOL[S.p.mol], main = m.peaks.reduce((a, p) => (p[1] > a[1] ? p : a));
      return `${S.c("# Raman scattering: energy given to a vibration")}
laser = ${S.v(L0)}                 ${S.c("# nm")}
shift = ${S.v(main[0])}                ${S.c("# cm⁻¹, " + m.name + " " + (main[3] || "band"))}

for photon in beam:
    if random() < 1e-7:        ${S.c("# about 1 in 10 million")}
        k = 1e7 / laser - shift
        detect(1e7 / k)        ${S.c("# Stokes: " + Math.round(stokesNm(L0, main[0])) + " nm")}
    else:
        detect(laser)          ${S.c("# Rayleigh: same colour")}

spectrum = histogram(shifts)   ${S.c("# the fingerprint")}`;
    },
  });

  function pickPeak(peaks, R) { const s = peaks.reduce((a, p) => a + p[1], 0); let u = R() * s; for (const p of peaks) { u -= p[1]; if (u <= 0) return p; } return peaks[0]; }

  function drawMolecule(S, mol, cx, cy, R, ft, a) {
    const C = S.C, iw = S.iw, fs = S.fs;
    const atom = (x, y, lab, r) => { S.circle(x, y, r, { w: iw * 0.5, color: C.ink, fill: C.paper, alpha: a }); S.text(lab, x, y + r * 0.38, { size: r * 1.05, italic: false, alpha: a, halo: false }); };
    const bond = (p, q) => S.line([p, q], { w: iw * 0.55, color: C.ink, alpha: a });
    const w = Math.sin(ft * 9);
    if (mol === "water") {
      const d = R * (0.9 + 0.08 * w), ang = (104.5 / 2) * Math.PI / 180 * (1 + 0.06 * Math.sin(ft * 5));
      const O = [cx, cy - R * 0.3], H1 = [O[0] - d * Math.sin(ang), O[1] + d * Math.cos(ang)], H2 = [O[0] + d * Math.sin(ang), O[1] + d * Math.cos(ang)];
      bond(O, H1); bond(O, H2); atom(...O, "O", R * 0.36); atom(...H1, "H", R * 0.26); atom(...H2, "H", R * 0.26);
    } else if (mol === "ethanol") {
      const s = R * 0.56 * (1 + 0.05 * w), P = [[cx - s * 1.45, cy + s * 0.4], [cx - s * 0.35, cy - s * 0.4], [cx + s * 0.75, cy + s * 0.4], [cx + s * 1.5, cy - s * 0.55]];
      bond(P[0], P[1]); bond(P[1], P[2]); bond(P[2], P[3]);
      atom(...P[0], "C", R * 0.3); atom(...P[1], "C", R * 0.3); atom(...P[2], "O", R * 0.3); atom(...P[3], "H", R * 0.21);
    } else {
      const r = R * 0.85 * (1 + 0.07 * w), pts = [];
      for (let i = 0; i < 6; i++) { const t = Math.PI / 6 + (i * Math.PI) / 3; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
      S.line(pts, { w: iw * 0.6, color: C.ink, alpha: a, close: true });
      S.circle(cx, cy, r * 0.55, { w: iw * 0.4, color: C.ink, alpha: a });
      pts.forEach(p => S.dot(p[0], p[1], iw * 0.8, C.ink, a));
    }
  }
})();
