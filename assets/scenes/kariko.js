// Katalin Karikó — a ribosome reads mRNA codon by codon and strings amino acids into a protein;
// plain uridine (U) trips the cell's immune sensors, pseudouridine (Ψ) slips past → codon choice searched by LinearDesign (2023)
(function () {
  // the standard genetic code (RNA codons, first base U C A G, then second, then third)
  const B = "UCAG", AA = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  const CODE = {}; let n = 0;
  for (const a of B) for (const b of B) for (const c of B) CODE[a + b + c] = AA[n++];
  const THREE = { A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", Q: "Gln", E: "Glu", G: "Gly", H: "His", I: "Ile", L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val", "*": "stop" };
  const SYN = {}; for (const k in CODE) (SYN[CODE[k]] = SYN[CODE[k]] || []).push(k);
  // the first 20 amino acids of the SARS-CoV-2 spike protein, the target of the mRNA vaccines
  const PROT = "MFVFLVLLPLVSSQCVNLTT";
  const AS_WRITTEN = "AUG UUU GUU UUU CUU GUU UUA UUG CCA CUA GUC UCU AGU CAG UGU GUU AAU CUU ACA ACC".split(" ");
  const GC_RICH = "AUG UUC GUG UUC CUG GUG CUG CUG CCC CUG GUG AGC AGC CAG UGC GUG AAC CUG ACC ACC".split(" ");

  function build(S) {
    const st = S.st, nAA = Math.round(S.p.len), opt = S.p.codons === "gc";
    const cod = (opt ? GC_RICH : AS_WRITTEN).slice(0, nAA).concat([opt ? "UGA" : "UAA"]);
    const r = S.rng(5), pct = S.p.mod / 100;
    // each uridine gets a fixed random threshold so the same U's stay modified as the slider moves
    st.letters = []; let u = 0, plain = 0;
    cod.forEach((c, ci) => { for (let j = 0; j < 3; j++) { const ch = c[j], isU = ch === "U"; let psi = false; if (isU) { u++; psi = r() < pct; if (!psi) plain++; } else r(); st.letters.push({ ch, isU, psi, ci }); } });
    st.cod = cod; st.nAA = nAA; st.nU = u; st.nPlain = plain;
    st.alarmT = u ? plain / u : 0;
    // how many different mRNAs spell this protein
    let lg = 0; for (let i = 0; i < nAA; i++) lg += Math.log10(SYN[PROT[i]].length); lg += Math.log10(3);
    st.ways = lg;
    if (st.c > cod.length) st.c = 0;
  }
  const fmtBig = lg => { if (lg < 6) return Math.round(Math.pow(10, lg)).toLocaleString("en-AU"); const e = Math.floor(lg); return (Math.pow(10, lg - e)).toFixed(1) + " × 10^" + e; };
  const sup = s => s.replace(/\^(\d+)/, (m, d) => d.split("").map(x => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+x]).join(""));

  function ellipse(S, x, y, rx, ry, o) {
    const ctx = S.ctx; ctx.save(); ctx.strokeStyle = o.color; ctx.lineWidth = o.w; if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } ctx.stroke(); ctx.restore();
  }

  // a serpentine path for the growing chain, walking away from the ribosome's exit
  function chainPts(S, ex, ey, m, sp) {
    const b = S.box, st = S.st, pts = [], left = b.x + sp * 0.8, right = b.x + b.w - sp * 0.8, top = st.chainTop;
    let x = ex, y = ey - sp * 0.9, dir = -1, row = 0;
    for (let i = 0; i < m; i++) {
      pts.push([x, y]);
      const nx = x + dir * sp;
      if ((dir < 0 && nx < left) || (dir > 0 && nx > right)) { y -= sp * 1.05; dir = -dir; row++; if (y < top) y = top; }
      else x = nx;
      if (i === 0) y -= sp * 0.25;
    }
    return pts;
  }

  Lineage.scene({
    params: [
      { id: "mod", label: "Uridines modified to Ψ", type: "range", min: 0, max: 100, step: 1, value: 50, fmt: v => Math.round(v) + "%" },
      { id: "len", label: "Strand length (amino acids)", type: "range", min: 6, max: 20, step: 1, value: 12, fmt: v => String(Math.round(v)) },
      { id: "codons", label: "Codon choice", type: "select", value: "as", options: [{ value: "as", label: "U-rich (as in nature)" }, { value: "gc", label: "GC-rich (optimised)" }] },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { Object.assign(S.st, { c: 0, alarm: 0.25, made: 0, hold: 0, rel: null }); build(S); },
    reset(S) { Object.assign(S.st, { c: 0, made: 0, hold: 0, rel: null }); },
    onParam(S, id) { build(S); if (id === "len" || id === "codons") { S.st.c = 0; S.st.rel = null; } },
    layout(S) {
      const b = S.box, nar = S.narrow, fs = S.fs, st = S.st;
      const Nv = nar ? 6.6 : 9.5, cwid = b.w / Nv, lc = cwid / 3.45, lf = Math.min(lc * 0.95, fs * 1.15);
      const sy = b.y + b.h * (nar ? 0.43 : 0.42);
      const sp = Math.min(fs * (nar ? 1.6 : 2.1), cwid * 0.6);
      const senY = sy + cwid * (nar ? 0.68 : 0.92), mY = senY + fs * (nar ? 2.75 : 3.3);
      Object.assign(st, { cwid, lc, lf, sy, sp, chainTop: b.y + sp * 0.6, senY, mY, aiY: mY + fs * (nar ? 1.95 : 3.2) });
    },
    entry(S) { return [S.box.x + S.iw, S.st.sy]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, b = S.box, nar = S.narrow;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const { cwid, lc, lf, sy, sp, cod } = st, nC = cod.length;
      // ---- dynamics: the alarm settles towards the share of plain U; it slows translation
      const sdt = dt * S.p.speed;
      st.alarm += (st.alarmT - st.alarm) * Math.min(1, sdt * 1.5);
      const out = 1 - 0.8 * st.alarm;
      if (k > 0.2 && sdt > 0) {
        if (st.hold > 0) { st.hold -= sdt; if (st.hold <= 0) { st.c = 0; } }
        else {
          st.c += sdt * 1.6 * out;
          if (st.c >= nC) { st.c = nC; st.hold = 1.1; st.made++; st.rel = { t: 0, n: st.nAA }; }
        }
      }
      if (st.rel) { st.rel.t += dt; if (st.rel.t > 2) st.rel = null; }
      const ci = Math.min(nC - 1, Math.floor(st.c)), frac = st.c - Math.floor(st.c);
      // camera follows the ribosome along a long strand
      const totalW = nC * cwid, viewW = b.w - cwid * 0.2;
      const ribU = st.hold > 0 ? (nC - 0.5) * cwid : (st.c) * cwid;
      const cam = Math.max(0, Math.min(Math.max(0, totalW - viewW), ribU - viewW * 0.45));
      const x0 = b.x + cwid * 0.1 - cam;
      const lx = (ci, j) => x0 + ci * cwid + (j + 0.5) * lc + cwid * 0.05;
      const vis = x => Math.max(0, Math.min(1, Math.min(x - b.x, b.x + b.w - x) / (cwid * 0.4)));
      // ---- beat 1: the mRNA strand
      const reveal = b.x + b.w * k1 * 1.05;
      const sx1 = Math.min(b.x + b.w, x0 + totalW), sx0 = Math.max(b.x, x0);
      S.line([[sx0, sy + lf * 0.75], [Math.min(sx1, reveal), sy + lf * 0.75]], { w: iw * 0.7, color: C.ink, alpha: k1 });
      S.text("5′", sx0 - fs * 0.1, sy + lf * 0.75 + fs * 1.0, { size: fs * 0.7, color: C.soft, align: "left", alpha: k1 * (x0 > b.x - 2 ? 1 : 0) });
      S.text("mRNA", b.x + b.w - fs * 0.2, sy + lf * 0.75 + fs * 1.15, { size: fs * 0.8, color: C.soft, align: "right", alpha: k1 });
      const hlU = S.mix(C.accent, C.paper, 0.82);
      st.letters.forEach((L, i) => {
        const j = i % 3, x = lx(L.ci, j); if (x > reveal) return;
        const a = vis(x) * k1; if (a < 0.02) return;
        if (L.psi && k2 > 0) S.circle(x, sy - lf * 0.05, lc * 0.46, { w: 0, fill: hlU, alpha: a * k2 });
        const ch = L.isU && L.psi ? (k2 > 0.05 ? "Ψ" : "U") : L.ch;
        S.text(ch, x, sy, { size: lf, mono: !(L.isU && L.psi && k2 > 0.05), italic: false, weight: L.isU ? 600 : 400, color: L.psi && k2 > 0.05 ? C.accent : C.ink, baseline: "middle", alpha: a, halo: false });
        if (j === 0) S.line([[x - lc * 0.45, sy + lf * 0.75], [x - lc * 0.45, sy + lf * 0.5]], { w: iw * 0.35, color: C.ink, alpha: a * 0.6 });
      });
      // ribosome: large and small subunits clamped around the codon being read
      const ry = sy, ribX = x0 + (st.hold > 0 ? nC - 0.5 : ci + 0.5) * cwid, a1 = k1;
      ellipse(S, ribX, ry - cwid * 0.3, cwid * 0.8, cwid * 0.42, { w: iw * 0.85, color: C.ink, alpha: a1 });
      ellipse(S, ribX, ry + cwid * 0.32, cwid * 0.62, cwid * 0.2, { w: iw * 0.7, color: C.ink, alpha: a1 });
      S.rect(ribX - cwid * 0.47, ry - lf * 0.62, cwid * 0.94, lf * 1.24, { w: iw * 0.55, color: C.accent, alpha: a1 });
      const codon = cod[ci], aa = CODE[codon];
      S.text("ribosome", ribX + cwid * 0.68, ry + cwid * 0.5, { size: fs * 0.75, color: C.soft, align: "left", alpha: a1 });
      // the codon letters again on top of the ribosome so the read is clear
      for (let j = 0; j < 3; j++) { const L = st.letters[ci * 3 + j], x = lx(ci, j); const ch = L.isU && L.psi && k2 > 0.05 ? "Ψ" : L.ch;
        S.text(ch, x, sy, { size: lf, mono: ch !== "Ψ", italic: false, weight: 600, color: L.psi && k2 > 0.05 ? C.accent : C.ink, baseline: "middle", alpha: a1, halo: false }); }
      const lblX = Math.min(ribX + cwid * 0.72, b.x + b.w - fs * 4.2);
      S.text(aa === "*" ? `${codon} → stop` : `${codon} → ${THREE[aa]}`, lblX, ry - cwid * 0.66, { size: fs * 1.0, color: C.accent, weight: 600, align: "left", alpha: a1 });
      // the growing protein chain
      const built = st.hold > 0 ? st.nAA : Math.min(st.nAA, ci + (frac > 0.55 ? 1 : 0));
      const ex = ribX, ey = ry - cwid * 0.72;
      const drawChain = (pts, m, a, dy) => {
        if (m > 1) S.line(pts.slice(0, m).map(p => [p[0], p[1] + dy]), { w: iw * 0.6, color: C.ink, alpha: a });
        for (let i = 0; i < m; i++) { const p = pts[i], idx = m - 1 - i;
          S.circle(p[0], p[1] + dy, sp * 0.44, { w: iw * 0.55, color: C.ink, fill: C.paper, alpha: a });
          S.text(THREE[PROT[idx]], p[0], p[1] + dy, { size: Math.min(fs * 0.62, sp * 0.36), italic: false, baseline: "middle", alpha: a, halo: false, color: C.ink }); }
      };
      if (st.rel && st.hold <= 0) { const t = st.rel.t, pts = chainPts(S, ex, ey, st.rel.n, sp); drawChain(pts, st.rel.n, k1 * (1 - t / 2), -t * sp * 1.2); }
      if (built > 0) { const pts = chainPts(S, ex, ey, built, sp); S.line([[ex, ey], pts[0]], { w: iw * 0.6, color: C.ink, alpha: k1 }); drawChain(pts, built, k1, 0); }
      if (st.hold > 0) S.text(`protein ${st.made} released`, ribX - cwid * 0.2, st.chainTop - sp * 0.1, { size: fs * 0.9, color: C.accent, weight: 600, alpha: k1, align: "right" });
      // ---- beat 2: immune sensors sniff plain U; Ψ slips past
      if (k2 > 0) {
        const nS = nar ? 4 : 5, sY = st.senY;
        for (let s = 0; s < nS; s++) {
          const x = b.x + b.w * (s + 0.5) / nS;
          // plain U's near this sensor
          let near = 0, tot = 0;
          st.letters.forEach((L, i) => { if (!L.isU) return; const lxx = lx(L.ci, i % 3); if (Math.abs(lxx - x) < cwid * 1.2 && lxx > b.x && lxx < b.x + b.w) { tot++; if (!L.psi) near++; } });
          const hot = near > 0 ? Math.min(1, 0.45 + near * 0.2) : 0;
          // a Y-shaped receptor
          const h = fs * (nar ? 0.85 : 1.1), col = hot ? C.ink : C.soft;
          S.line([[x, sY + h], [x, sY + h * 0.35]], { w: iw * (hot ? 0.8 : 0.5), color: col, alpha: k2 });
          S.line([[x - h * 0.4, sY - h * 0.1], [x, sY + h * 0.35], [x + h * 0.4, sY - h * 0.1]], { w: iw * (hot ? 0.8 : 0.5), color: col, alpha: k2 });
          if (hot) {
            const ph = (ft * 1.1 + s * 0.37) % 1;
            for (let q = 0; q < 2; q++) { const pp = (ph + q * 0.5) % 1; S.circle(x, sY + h * 0.2, h * (0.5 + pp * 1.2), { w: iw * 0.5, color: C.ink, alpha: k2 * hot * (1 - pp), a0: Math.PI * 0.15, a1: Math.PI * 0.85 }); }
            S.text("!", x + h * 0.75, sY + h * 0.55, { size: fs * 1.0, italic: false, weight: 700, color: C.ink, alpha: k2 * hot, baseline: "middle" });
          } else if (tot) S.text("quiet", x, sY + h * 1.75, { size: fs * 0.68, color: C.accent, alpha: k2 * 0.9 });
        }
        if (!nar) S.text("immune sensors", b.x, st.senY - fs * 0.5, { size: fs * 0.78, color: C.soft, align: "left", alpha: k2 });
        // meters
        const mY = st.mY, mw = nar ? b.w * 0.27 : b.w * 0.24, gapM = nar ? b.w * 0.5 : b.w * 0.5, lab = nar ? fs * 0.72 : fs * 0.8;
        const bar = (x, label, v, col) => {
          S.text(label, x, mY - fs * 0.35, { size: lab, align: "left", color: col, alpha: k2 });
          S.rect(x, mY, mw, fs * 0.55, { w: iw * 0.4, color: C.soft, alpha: k2 });
          S.rect(x, mY, mw * v * k2, fs * 0.55, { w: 0, fill: col, alpha: k2 });
          S.text(Math.round(v * 100) + "%", x + mw + fs * 0.35, mY + fs * 0.5, { size: lab, align: "left", color: col, alpha: k2, italic: false });
        };
        bar(b.x, "immune alarm", st.alarm, C.ink);
        bar(b.x + gapM, "protein output", out, C.accent);
      }
      // ---- beat 3: many codons spell each amino acid → search the choices (LinearDesign)
      if (k3 > 0) {
        const y0 = st.aiY, y1 = b.y + b.h, m = Math.min(st.nAA, nar ? 10 : 14);
        S.text(nar ? `2023 · ${sup(fmtBig(st.ways))} ways to spell it` : "2023 · LinearDesign searches the codon choices", b.x, y0, { size: fs * (nar ? 0.85 : 0.95), color: C.accent, align: "left", weight: 600, alpha: k3 });
        const gx0 = b.x + fs * 0.5, gx1 = b.x + b.w * (nar ? 0.84 : 0.6), gy0 = y0 + fs * (nar ? 0.65 : 0.85), gy1 = y1 - fs * (nar ? 0.3 : 0.4);
        const dx = (gx1 - gx0) / Math.max(1, m - 1), rows = 6, dy = (gy1 - gy0) / (rows - 1);
        const pathA = [], pathB = [], cur = S.p.codons === "gc" ? GC_RICH : AS_WRITTEN;
        for (let i = 0; i < m; i++) {
          const syn = SYN[PROT[i]], x = gx0 + i * dx;
          syn.forEach((c, r) => S.dot(x, gy0 + r * dy, Math.max(1.6, iw * 0.45), C.soft, k3));
          pathA.push([x, gy0 + syn.indexOf(AS_WRITTEN[i]) * dy]); pathB.push([x, gy0 + syn.indexOf(GC_RICH[i]) * dy]);
        }
        const isGC = S.p.codons === "gc";
        S.line(isGC ? pathA : pathB, { w: iw * 0.45, color: C.soft, alpha: k3 * 0.9, dash: [iw, iw] });
        const prog = Math.max(2, Math.ceil(m * Math.min(1, ((ft * 0.25) % 1.3))));
        const pth = isGC ? pathB : pathA;
        S.line(pth.slice(0, prog), { w: iw * 0.8, color: C.accent, alpha: k3 });
        const endA = pathA[m - 1], endB = pathB[m - 1], lsz = fs * (nar ? 0.62 : 0.72);
        if (!nar || !isGC) S.text("U-rich", endA[0] + fs * 0.45, endA[1] + lsz * 0.35, { size: lsz, align: "left", color: isGC ? C.soft : C.accent, alpha: k3 });
        if (!nar || isGC) S.text("GC-rich", endB[0] + fs * 0.45, endB[1] + lsz * 0.35, { size: lsz, align: "left", color: isGC ? C.accent : C.soft, alpha: k3 });
        pth.slice(0, prog).forEach(p => S.dot(p[0], p[1], Math.max(2.4, iw * 0.7), C.accent, k3));
        const tx = nar ? b.x : gx1 + fs * 4.2;
        if (!nar) {
          S.text("dots: codons for each", tx, gy0 + fs * 0.4, { size: fs * 0.72, color: C.soft, align: "left", alpha: k3 });
          S.text("amino acid (1 to 6)", tx, gy0 + fs * 1.3, { size: fs * 0.72, color: C.soft, align: "left", alpha: k3 });
          S.text(sup(fmtBig(st.ways)), tx, gy0 + fs * 3.0, { size: fs * 1.15, color: C.accent, align: "left", weight: 600, alpha: k3 });
          S.text(`mRNAs spell these ${st.nAA}`, tx, gy0 + fs * 4.0, { size: fs * 0.75, color: C.ink, align: "left", alpha: k3 });
          S.text("amino acids", tx, gy0 + fs * 4.85, { size: fs * 0.75, color: C.ink, align: "left", alpha: k3 });
        }
      }
      return `${cod[ci]} → ${aa === "*" ? "stop" : THREE[aa]} · ${built}/${st.nAA} amino acids · ${st.nU - st.nPlain} of ${st.nU} U → Ψ · alarm ${Math.round(st.alarm * 100)}% · output ${Math.round(out * 100)}% · ${st.made} protein${st.made === 1 ? "" : "s"} made`;
    },
    code(S) {
      const st = S.st, show = st.cod.slice(0, 5).join(" ");
      return `${S.c("# translation: read three letters, add one amino acid")}
mrna = "${S.v(show)} ..."
modified = ${S.v(Math.round(S.p.mod) + "%")}     ${S.c("# U swapped for Ψ")}
protein = []
for codon in triplets(mrna):
    aa = genetic_code[codon]     ${S.c("# Ψ reads just like U")}
    if aa == "stop": break
    protein.append(aa)

${S.c("# conceptual: sensors react to plain U")}
alarm = ${S.v(st.nPlain)} / ${S.v(st.nU)}              ${S.c("# plain U / all U")}
output = 1 - 0.8 * alarm         ${S.c("# = " + Math.round((1 - 0.8 * (st.nU ? st.nPlain / st.nU : 0)) * 100) + "%")}`;
    },
  });
})();
