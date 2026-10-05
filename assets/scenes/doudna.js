// Jennifer Doudna — CRISPR-Cas9 as search-and-cut: a 20-letter guide checks DNA only next to an NGG PAM,
// matching letters light up, a full match cuts both strands → AI-designed editor OpenCRISPR-1 (Profluent, 2025)
(function () {
  const L = 200, DEFAULT = "CTGACCTAGTCGGAATCCAG", BASES = "ACGT";
  const COMP = { A: "T", T: "A", C: "G", G: "C" };

  function makeGenome(S) {
    const rnd = S.rng(7);
    const g = [];
    for (let i = 0; i < L; i++) g.push(BASES[Math.floor(rnd() * 4)]);
    const put = (at, s) => { for (let i = 0; i < s.length; i++) g[at + i] = s[i]; };
    // an exact copy with no PAM after it (Cas9 never checks it)
    put(0, DEFAULT + "TCA");
    // the real target: protospacer + TGG
    put(23, DEFAULT + "TGG");
    // an off-target near-match: 2 mismatches far from the PAM, then AGG
    const off = DEFAULT.split(""); off[1] = "A"; off[4] = "T"; put(120, off.join("") + "AGG");
    return g;
  }

  function cleanGuide(S) {
    const raw = String(S.p.guide ?? "");
    const up = raw.toUpperCase().replace(/U/g, "T");
    const kept = up.replace(/[^ACGT]/g, "");
    const dropped = up.replace(/\s/g, "").length - kept.length;
    const g = [];
    for (let i = 0; i < 20; i++) g.push(kept[i] || null);
    S.st.guide = g; S.st.gLen = Math.min(20, kept.length); S.st.gDropped = dropped; S.st.gExtra = Math.max(0, kept.length - 20);
    // stretches that match within the allowed mismatches (with or without a PAM), for the "no PAM, ignored" note
    const G = S.st.genome, allow = S.p.mm, hits = [];
    for (let i = 0; i + 20 <= L; i++) {
      let mm = 0; for (let j = 0; j < 20 && mm <= allow; j++) if (g[j] !== G[i + j]) mm++;
      if (mm <= allow) hits.push({ i, pam: i + 22 < L && G[i + 21] === "G" && G[i + 22] === "G" });
    }
    S.st.hits = hits;
  }
  const isPam = (G, i) => i + 22 < L && G[i + 21] === "G" && G[i + 22] === "G";

  function startCheck(S, i) {
    const st = S.st, G = st.genome;
    st.phase = "check"; st.site = i; st.pos = i; st.r = 0; st.t = 0;
    st.match = st.guide.map((b, j) => b !== null && b === G[i + j]);
  }

  function advance(S, dt) {
    const st = S.st, G = st.genome;
    if (dt <= 0) return;
    if (st.phase === "move") {
      st.pos += dt * 6;
      while (st.pos >= st.next) {
        if (st.next > L - 23) { st.pos = 0; st.next = 0; st.fade = 1; st.cuts = []; break; }
        if (isPam(G, st.next)) { startCheck(S, st.next); return; }
        st.next++;
      }
    } else if (st.phase === "check") {
      st.r = Math.min(20, st.r + dt * 16);
      const n = Math.floor(st.r); let mm = 0;
      for (let j = 20 - n; j < 20; j++) if (!st.match[j]) mm++;
      st.mm = mm;
      if (mm > S.p.mm) { st.phase = "reject"; st.t = 0; st.last = { site: st.site, ok: false, n, mm }; }
      else if (n >= 20) { st.phase = "cut"; st.t = 0; st.last = { site: st.site, ok: true, n: 20, mm }; st.cuts.push({ i: st.site, mm }); }
    } else if (st.phase === "reject") {
      st.t += dt; if (st.t > 0.45) { st.phase = "move"; st.next = st.site + 1; }
    } else if (st.phase === "cut") {
      st.t += dt; if (st.t > 3.4) { st.phase = "move"; st.next = st.site + 1; }
    }
    if (st.fade > 0) st.fade = Math.max(0, st.fade - dt * 1.5);
  }

  function resetScan(S) { Object.assign(S.st, { pos: 0, next: 0, phase: "move", r: 0, t: 0, mm: 0, cuts: [], last: null, fade: 0, match: [] }); }

  Lineage.scene({
    params: [
      { id: "guide", label: "Guide sequence (20 letters: A, C, G, T)", type: "text", value: DEFAULT, maxlength: 30 },
      { id: "mm", label: "Mismatches allowed", type: "range", min: 0, max: 3, step: 1, value: 0, fmt: v => String(v) },
      { id: "speed", label: "Scan speed", type: "range", min: 0, max: 2.5, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { S.st.genome = makeGenome(S); resetScan(S); cleanGuide(S); },
    reset(S) { resetScan(S); },
    onParam(S, id) {
      const st = S.st;
      cleanGuide(S);
      if (id === "guide" || id === "mm") {
        st.cuts = [];
        if (st.phase === "check" || st.phase === "reject") startCheck(S, st.site);
        else if (st.phase === "cut") { st.phase = "move"; st.next = st.site + 1; }
      }
    },
    layout(S) {
      const b = S.box, nar = S.narrow, fs = S.fs, st = S.st;
      const N = nar ? 26 : 31, cw = b.w / N, c0 = nar ? 1.5 : Math.floor((N - 23) / 2);
      const lf = Math.min(cw * 0.8, fs * 1.1), rg = cw * (nar ? 1.25 : 1.35);
      const ovY = b.y + fs * (nar ? 1.55 : 1.7);
      const gy = b.y + b.h * (nar ? 0.28 : 0.26);
      const ty = gy + rg * 1.75, by = ty + rg;
      const noteY = by + rg * 1.25, scoreY = by + rg * (nar ? 2.45 : 2.75);
      const aiY0 = b.y + b.h * (nar ? 0.68 : 0.6);
      Object.assign(st, { N, cw, c0, lf, rg, ovY, gy, ty, by, noteY, scoreY, aiY0, ox0: b.x + (nar ? fs * 0.2 : fs * 4.6), ox1: b.x + b.w - fs * 0.4 });
    },
    entry(S) { const st = S.st; return [S.box.x + S.iw, (st.ty + st.by) / 2]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, b = S.box, G = st.genome;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      if (k > 0.15) advance(S, dt * S.p.speed);
      const { cw, c0, lf, rg, gy, ty, by, N } = st;
      const colX = c => b.x + (c + 0.5) * cw;
      const hl = S.mix(C.accent, C.paper, 0.8), cutting = st.phase === "cut";
      const cutK = cutting ? S.ease(Math.min(1, st.t / 0.5)) * (st.t > 2.9 ? 1 - S.ease((st.t - 2.9) / 0.5) : 1) : 0;
      const gap = cw * 0.9 * cutK;
      const pos = st.pos, first = Math.floor(pos - c0) - 1;
      // ---- beat 1: the long DNA double strand scrolls through Cas9
      const fadeA = 1 - st.fade;
      const cutCol = c0 + 17; // between letters 17 and 18: three letters before the PAM
      const xOf = i => { const c = i - pos + c0; return colX(c) + (cutting && i >= st.site + 17 ? gap : 0); };
      const winA = x => { const u = (x - b.x) / b.w; return Math.max(0, Math.min(1, Math.min(u, 1 - u) / 0.06)); };
      // backbones
      const xl = b.x + cw * 0.1, xr = b.x + b.w - cw * 0.1, cxCut = colX(cutCol - 0.5) + (cutting ? gap / 2 : 0);
      for (const [yy, sg] of [[ty - rg * 0.48, -1], [by + rg * 0.48, 1]]) {
        if (cutting && cutK > 0.02) {
          S.line([[xl, yy], [xl + (cxCut - gap / 2 - xl) * k1, yy]], { w: iw * 0.6, color: C.ink, alpha: k1 });
          S.line([[cxCut + gap / 2, yy], [xr, yy]], { w: iw * 0.6, color: C.ink, alpha: k1 });
        } else S.line([[xl, yy], [xl + (xr - xl) * k1, yy]], { w: iw * 0.6, color: C.ink, alpha: k1 });
      }
      S.text("5′", xl - fs * 0.05, ty - rg * 0.75, { size: fs * 0.7, color: C.soft, align: "left", alpha: k1 });
      S.text("3′", xr, ty - rg * 0.75, { size: fs * 0.7, color: C.soft, align: "right", alpha: k1 });
      S.text("3′", xl - fs * 0.05, by + rg * 0.62 + fs * 0.6, { size: fs * 0.7, color: C.soft, align: "left", alpha: k1 });
      S.text("5′", xr, by + rg * 0.62 + fs * 0.6, { size: fs * 0.7, color: C.soft, align: "right", alpha: k1 });
      const inWin = i => st.phase !== "move" && i >= st.site && i < st.site + 20;
      for (let i = Math.max(0, first); i < Math.min(L, first + N + 3); i++) {
        const x = xOf(i); if (x < b.x - cw || x > b.x + b.w + cw) continue;
        const a = winA(x) * k1 * fadeA; if (a <= 0.01) continue;
        if ((x - b.x) / b.w > k1 * 1.05) continue;
        const j = i - st.site, rev = inWin(i) && j >= 20 - Math.floor(st.r), m = rev && st.match[j];
        if (m) { S.rect(x - cw * 0.44, ty - rg * 0.42, cw * 0.88, rg * 0.84, { fill: hl, w: 0, alpha: a }); }
        S.line([[x, ty - rg * 0.48], [x, ty - rg * 0.3]], { w: iw * 0.3, color: C.ink, alpha: a * 0.5 });
        S.line([[x, by + rg * 0.48], [x, by + rg * 0.3]], { w: iw * 0.3, color: C.ink, alpha: a * 0.5 });
        S.line([[x, ty + rg * 0.28], [x, by - rg * 0.28]], { w: iw * 0.25, color: C.soft, alpha: a * 0.5, dash: [2, 3] });
        S.text(G[i], x, ty, { size: lf, mono: true, italic: false, weight: m ? 600 : 400, color: m ? C.accent : C.ink, baseline: "middle", alpha: a, halo: false });
        S.text(COMP[G[i]], x, by, { size: lf, mono: true, italic: false, color: C.soft, baseline: "middle", alpha: a, halo: false });
      }
      // exact copies that have no PAM: shown, but Cas9 never stops there
      st.noteOn = false;
      if (k2 > 0) for (const h of st.hits) {
        if (h.pam) continue;
        const x0 = xOf(h.i) - cw * 0.45, x1 = xOf(h.i + 19) + cw * 0.45;
        if (Math.min(b.x + b.w, x1) - Math.max(b.x, x0) < cw * 7) continue;
        st.noteOn = true;
        const ya = st.noteY, nt = S.narrow ? "same letters, no NGG after: never checked" : "same letters, but no NGG after them: never checked", hw = nt.length * fs * (S.narrow ? 0.17 : 0.2);
        S.line([[Math.max(b.x, x0), ya], [Math.min(b.x + b.w, x1), ya]], { w: iw * 0.5, color: C.soft, dash: [iw * 1.2, iw], alpha: k2 * fadeA });
        S.text(nt, Math.max(b.x + hw, Math.min(b.x + b.w - hw, (x0 + x1) / 2)), ya + fs * 1.05,
          { size: fs * (S.narrow ? 0.72 : 0.8), color: C.ink, alpha: k2 * fadeA });
      }
      // Cas9 clamp with the guide inside
      const cx0 = colX(c0) - cw * 0.62, cx1 = colX(c0 + 22) + cw * 0.62 + gap, top = gy - rg * 0.95, bot = by + rg * 0.62;
      const rr = cw * 0.9;
      ctxRound(S, cx0, top, cx1 - cx0, bot - top, rr, { w: iw * 0.85, color: C.ink, alpha: k1 });
      S.text(S.narrow ? "Cas9" : "Cas9 protein", cx0 + rr * 0.3, top - fs * 0.35, { size: fs * 0.95, align: "left", alpha: k1, weight: 500 });
      for (let j = 0; j < 20; j++) {
        const x = colX(c0 + j) + (cutting && j >= 17 ? gap : 0), gb = st.guide[j];
        const rev = st.phase !== "move" && j >= 20 - Math.floor(st.r), m = rev && st.match[j];
        if (gb === null) { S.rect(x - cw * 0.32, gy - rg * 0.32, cw * 0.64, rg * 0.64, { w: iw * 0.3, color: C.soft, alpha: k1 }); continue; }
        const col = m ? C.accent : rev ? C.soft : S.mix(C.accent, C.ink, 0.35);
        if (m) S.line([[x, gy + rg * 0.38], [x, ty - rg * 0.48]], { w: iw * 0.55, color: C.accent, alpha: k1 });
        S.text(gb, x, gy, { size: lf, mono: true, italic: false, weight: 600, color: col, baseline: "middle", alpha: k1, halo: false });
        if (rev && !m) S.text("×", x, gy - rg * 0.62, { size: lf * 0.9, italic: false, color: C.ink, baseline: "middle", alpha: k1 });
      }
      S.line([[colX(c0) - cw * 0.4, gy + rg * 0.42], [colX(c0 + 19) + cw * 0.4 + (cutting ? gap : 0), gy + rg * 0.42]], { w: iw * 0.35, color: C.accent, alpha: 0.6 * k1 });
      // PAM slot
      const px0 = colX(c0 + 20) - cw * 0.48 + gap, px1 = colX(c0 + 22) + cw * 0.48 + gap;
      const pamOK = st.phase !== "move" || (Math.abs(pos - Math.round(pos)) < 0.2 && isPam(G, Math.round(pos)));
      S.rect(px0, ty - rg * 0.5, px1 - px0, rg * 1.0, { w: iw * (pamOK ? 0.7 : 0.4), color: pamOK ? C.accent : C.soft, alpha: k1 });
      S.text(S.narrow ? "PAM" : pamOK ? "PAM ✓" : "PAM?", (px0 + px1) / 2, gy + rg * 0.1, { size: fs * (S.narrow ? 0.72 : 0.8), color: pamOK ? C.accent : C.soft, baseline: "middle", alpha: k1, weight: 500 });
      if (!S.narrow) S.text("NGG", (px0 + px1) / 2, gy - rg * 0.55, { size: fs * 0.62, color: C.soft, alpha: k1 * 0.9, mono: true, italic: false, baseline: "middle" });
      // the cut
      if (cutting && cutK > 0) {
        const x = cxCut;
        for (const yy of [ty, by]) {
          S.line([[x - gap / 2, yy - rg * 0.55], [x - gap / 2, yy + rg * 0.55]], { w: iw * 0.9, color: C.accent, alpha: cutK });
          S.line([[x + gap / 2, yy - rg * 0.55], [x + gap / 2, yy + rg * 0.55]], { w: iw * 0.9, color: C.accent, alpha: cutK });
        }
        const lbl = st.last && st.last.mm ? `cut (off-target, ${st.last.mm} mismatch${st.last.mm > 1 ? "es" : ""})` : "✂ both strands cut";
        S.text(lbl, Math.max(b.x + fs * 6, Math.min(b.x + b.w - fs * 6, x)), st.scoreY, { size: fs * 0.95, color: C.accent, alpha: cutK, weight: 600 });
      }
      // ---- beat 2: the scan made visible — genome overview, PAM sites, the score
      if (k2 > 0) {
        const { ox0, ox1, ovY } = st, gx = i => ox0 + (ox1 - ox0) * (i / L);
        if (!S.narrow) S.text(`genome · ${L} letters`, b.x, ovY + fs * 0.3, { size: fs * 0.75, align: "left", color: C.soft, alpha: k2 });
        S.line([[ox0, ovY], [ox0 + (ox1 - ox0) * k2, ovY]], { w: iw * 0.5, color: C.ink, alpha: k2 });
        for (let i = 0; i < L - 22; i++) if (isPam(G, i)) S.line([[gx(i + 21), ovY - fs * 0.25], [gx(i + 21), ovY + fs * 0.25]], { w: iw * 0.35, color: C.soft, alpha: k2 });
        for (const c of st.cuts) {
          S.line([[gx(c.i + 17), ovY - fs * 0.55], [gx(c.i + 17), ovY + fs * 0.55]], { w: iw * 0.8, color: C.accent, alpha: k2 });
          S.text(c.mm ? "off-target" : "cut", gx(c.i + 17), ovY - fs * 0.75, { size: fs * 0.7, color: C.accent, alpha: k2 });
        }
        const w0 = gx(pos), w1 = gx(pos + 23);
        S.rect(w0, ovY - fs * 0.35, Math.max(2, w1 - w0), fs * 0.7, { w: iw * 0.5, color: C.accent, alpha: k2 });
        if (!S.narrow) S.text("ticks: NGG sites", ox1, ovY + fs * 1.05, { size: fs * 0.68, align: "right", color: C.soft, alpha: k2 });
        // score next to the clamp
        const sy = st.scoreY;
        if (!cutting && !(S.narrow && st.noteOn)) {
          let msg;
          if (st.phase === "move") msg = "sliding: looking for NGG";
          else { const n = Math.floor(st.r), ok = st.match.slice(20 - n).filter(Boolean).length; msg = st.phase === "reject" ? `${ok} of ${n} checked match · too many mismatches, let go` : `checking from the PAM end: ${ok}/${n} match`; }
          S.text(msg, colX(c0 + 11), sy, { size: fs * 0.88, color: st.phase === "move" ? C.soft : C.ink, alpha: k2 });
        }
      }
      // ---- beat 3: AI-designed editor (protein language model → OpenCRISPR-1)
      if (k3 > 0) drawAI(S, k3, ft);
      // readout
      const gl = st.gLen < 20 ? `guide has ${st.gLen}/20 letters (gaps count as mismatches) · ` : "";
      const dr = st.gDropped ? `ignored ${st.gDropped} non-ACGT character${st.gDropped > 1 ? "s" : ""} · ` : "";
      const ex = st.gExtra ? `using first 20 letters · ` : "";
      let tail;
      if (st.phase === "move") tail = `scanning letter ${Math.floor(pos)} of ${L} · ${st.cuts.length} cut${st.cuts.length === 1 ? "" : "s"} so far`;
      else { const n = Math.floor(st.r), ok = st.match.slice(20 - n).filter(Boolean).length;
        tail = `site ${st.site}: PAM ${G[st.site + 20]}GG ✓ · ${ok}/${n} letters match` + (cutting ? ` → cut (${S.p.mm} mismatch${S.p.mm === 1 ? "" : "es"} allowed)` : st.phase === "reject" ? " → rejected" : ""); }
      return dr + ex + gl + tail;
    },
    code(S) {
      const g = (S.st.guide || []).map(x => x || "·").join("");
      return `${S.c("# Cas9's search: PAM first, then compare the guide")}
guide = "${S.v(g)}"
max_mismatch = ${S.v(S.p.mm)}

for i in range(len(genome) - 23):
    if genome[i+21 : i+23] != "GG":     ${S.c("# no NGG PAM: skip")}
        continue
    site = genome[i : i+20]
    mismatches = sum(a != b for a, b in zip(guide, site))
    if mismatches <= max_mismatch:
        cut(i + 17)                     ${S.c("# both strands, 3 before PAM")}`;
    },
  });

  function ctxRound(S, x, y, w, h, r, o) {
    const ctx = S.ctx; ctx.save(); ctx.strokeStyle = o.color; ctx.lineWidth = o.w; if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } ctx.stroke(); ctx.restore();
  }

  function drawAI(S, k3, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, b = S.box, nar = S.narrow;
    const y0 = st.aiY0, y1 = b.y + b.h, h = y1 - y0;
    S.line([[b.x, y0], [b.x + b.w * k3, y0]], { w: iw * 0.3, color: C.soft, alpha: 0.6 });
    const ty = y0 + fs * 1.25;
    S.text(nar ? "2025 · an AI-designed editor" : "2025 · an editor designed by AI", b.x, ty, { size: fs * 1.0, align: "left", color: C.accent, alpha: k3, weight: 600 });
    const cy = y0 + h * (nar ? 0.56 : 0.52), rnd = S.rng(11);
    // left: natural CRISPR proteins
    const lx0 = b.x, lx1 = b.x + b.w * 0.24, bead = Math.max(2, iw * 0.55);
    for (let r = 0; r < 4; r++) {
      const yy = cy - fs * 1.3 + r * fs * 0.85, pts = [];
      for (let i = 0; i <= 12; i++) pts.push([lx0 + (lx1 - lx0) * i / 12, yy + Math.sin(i * 1.3 + r) * fs * 0.12]);
      S.line(pts, { w: iw * 0.35, color: C.soft, alpha: k3 });
      pts.forEach((p, i) => i % 2 || S.dot(p[0], p[1], bead * 0.8, C.soft, k3));
    }
    S.text(nar ? "natural Cas9s" : "natural CRISPR proteins", (lx0 + lx1) / 2, cy + fs * 2.4, { size: fs * 0.75, color: C.ink, alpha: k3 });
    // model
    const mx0 = b.x + b.w * 0.3, mx1 = b.x + b.w * 0.56, mh = fs * 2.8;
    S.arrow(lx1 + fs * 0.25, cy, mx0 - fs * 0.25, cy, { w: iw * 0.6, color: C.ink, alpha: k3 });
    ctxRound(S, mx0, cy - mh / 2, mx1 - mx0, mh, fs * 0.5, { w: iw * 0.7, color: C.accent, alpha: k3 });
    S.text("protein", (mx0 + mx1) / 2, cy - fs * 0.15, { size: fs * 0.82, color: C.accent, alpha: k3, weight: 500 });
    S.text("language model", (mx0 + mx1) / 2, cy + fs * 0.85, { size: fs * 0.82, color: C.accent, alpha: k3, weight: 500 });
    // right: the generated chain, written bead by bead
    const rx0 = mx1 + b.w * 0.06, rx1 = b.x + b.w - fs * 0.2, nB = nar ? 14 : 22;
    S.arrow(mx1 + fs * 0.25, cy, rx0 - fs * 0.25, cy, { w: iw * 0.6, color: C.accent, alpha: k3 });
    const cyc = (ft * 0.18) % 1, shown = Math.min(nB, Math.floor((cyc / 0.7) * nB) + 1);
    const pts = []; for (let i = 0; i < nB; i++) pts.push([rx0 + (rx1 - rx0) * i / (nB - 1), cy + Math.sin(i * 0.9) * fs * 0.45]);
    S.line(pts.slice(0, shown), { w: iw * 0.6, color: C.ink, alpha: k3 });
    for (let i = 0; i < shown; i++) { const changed = rnd() < 0.35; S.dot(pts[i][0], pts[i][1], bead * (changed ? 1.25 : 0.9), changed ? C.accent : C.ink, k3); }
    S.text("OpenCRISPR-1 (AI-designed)", (rx0 + rx1) / 2, cy + fs * 2.0, { size: fs * (nar ? 0.78 : 0.88), color: C.accent, alpha: k3, weight: 600 });
    S.text(nar ? "hundreds of changes from Cas9" : "● hundreds of changes from natural Cas9", (rx0 + rx1) / 2, cy + fs * 3.0, { size: fs * 0.7, color: C.soft, alpha: k3 });
  }
})();
