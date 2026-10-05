// Bayes — the billiard table of his 1763 essay: a hidden ball, more balls rolled, told only "left" or "right" → the posterior narrows (Beta) → spam filters and uncertainty in AI
(function () {
  const NS = 120;
  const pct = v => Math.round(v * 100) + "%";
  const WORDS = [["meeting", 0.25], ["free", 3.5], ["prize", 5], ["click", 2.5], ["tomorrow", 0.5], ["WIN", 6]];
  function restart(S) { const st = S.st; st.balls = []; st.timer = 0; st.rng = S.rng(1763 + Math.round(S.p.pos * 1000)); st.dL = 0; st.dR = 0; }
  function roll(S) { const st = S.st, x = 0.02 + st.rng() * 0.96, y = 0.15 + st.rng() * 0.7; st.balls.push({ x, y, left: x < S.p.pos, t: 0 }); }
  Lineage.scene({
    params: [
      { id: "pos", label: "Where the hidden ball really is", type: "range", min: 0.05, max: 0.95, step: 0.01, value: 0.62, fmt: v => pct(v) + " of the way" },
      { id: "rolls", label: "Balls to roll", type: "range", min: 0, max: 80, step: 1, value: 24, fmt: v => String(v) },
      { id: "speed", label: "Rolling speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Roll one more", run(S) { roll(S); } }],
    init(S) { restart(S); },
    reset(S) { restart(S); },
    onParam(S, id) { if (id === "pos") restart(S); if (id === "rolls" && S.st.balls.length > S.p.rolls) { S.st.balls.length = S.p.rolls; } },
    layout(S) {
      const { box, narrow, fs } = S;
      const x0 = box.x + fs * (narrow ? 0.8 : 1.4), w = box.w - fs * (narrow ? 1.6 : 2.8);
      const tT = box.y + fs * (narrow ? 1.2 : 2.2), tH = box.h * (narrow ? 0.24 : 0.3);
      const pT = tT + tH + fs * (narrow ? 3.0 : 3.6), pH = box.h * (narrow ? 0.24 : 0.28);
      const aT = pT + pH + fs * (narrow ? 2.4 : 3.6);
      Object.assign(S.st, { x0, w, tT, tH, pT, pH, aT });
    },
    entry(S) { const st = S.st; return [st.x0, st.tT + st.tH * 0.5]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, { x0, w, tT, tH, pT, pH } = st;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.28) / 0.35), k3 = S.ease((k - 0.7) / 0.3);
      const fz = fs * (nar ? 0.8 : 1), X = u => x0 + u * w;
      // roll balls over time
      if (k1 > 0.9 && dt > 0) { st.timer += dt * (S.p.speed ?? 1); if (st.timer > 0.75 && st.balls.length < S.p.rolls) { st.timer = 0; roll(S); } }
      st.balls.forEach(b => (b.t += dt * (S.p.speed ?? 1) * 1.6));
      const landed = st.balls.filter(b => b.t >= 1), L = landed.filter(b => b.left).length, R = landed.length - L;
      st.dL += (L - st.dL) * Math.min(1, dt * 6); st.dR += (R - st.dR) * Math.min(1, dt * 6);
      // 1. the table, seen from above, with the hidden ball and its line
      S.rect(X(0), tT, w, tH, { color: C.ink, w: iw * 0.9, alpha: k1 });
      S.rect(X(0) + iw * 1.6, tT + iw * 1.6, w - iw * 3.2, tH - iw * 3.2, { color: C.soft, w: iw * 0.3, alpha: k1 * 0.6 });
      const px = X(S.p.pos);
      S.line([[px, tT], [px, tT + tH]], { color: C.accent, w: iw * 0.55, dash: [iw * 1.5, iw * 1.5], alpha: k1 * 0.8 });
      S.circle(px, tT + tH * 0.5, Math.max(6, tH * 0.07), { color: C.accent, w: iw * 0.7, fill: C.paper, alpha: k1 });
      S.text("?", px, tT + tH * 0.5 + fz * 0.33, { size: fz * 0.9, color: C.accent, weight: 600, italic: false, halo: false, alpha: k1 });
      S.text(nar ? "hidden ball" : "the first ball: hidden from us", px, tT - fz * 0.55, { size: fz * 0.82, color: C.accent, alpha: k1 });
      // rolled balls: they land, we are told left or right, then they fade
      const rb = Math.max(4, tH * 0.045);
      st.balls.forEach(b => {
        const f = Math.min(1, b.t), e = 1 - Math.pow(1 - f, 3), x = X(b.x);
        const fade = b.t < 1 ? 1 : Math.max(0, 1 - (b.t - 1) * 0.9);
        if (fade > 0.02) {
          S.dot(x, b.t < 1 ? tT + tH - (tH * (1 - b.y)) * e : tT + tH * b.y, rb, C.ink, k1 * fade);
          if (b.t >= 1) S.text(b.left ? "left" : "right", x, tT + tH * b.y - rb - fz * 0.35, { size: fz * 0.8, color: C.ink, alpha: k1 * fade });
        }
      });
      // tallies on each side
      S.text(`left ${L}`, X(0) + fz * 0.5, tT + tH + fz * 1.2, { align: "left", size: fz * 0.95, color: C.ink, weight: 600, alpha: k1 });
      S.text(`right ${R}`, X(1) - fz * 0.5, tT + tH + fz * 1.2, { align: "right", size: fz * 0.95, color: C.ink, weight: 600, alpha: k1 });
      // 2. the posterior over where the hidden ball must be: Beta(left + 1, right + 1)
      const a = st.dL + 1, bb = st.dR + 1, ys = [];
      let mx = 0;
      for (let i = 0; i <= NS; i++) { const u = (i + 0.0001) / (NS + 0.0002), v = Math.exp((a - 1) * Math.log(u) + (bb - 1) * Math.log(1 - u)); ys.push(v); if (v > mx) mx = v; }
      let cum = 0; const tot = ys.reduce((s, v) => s + v, 0); let lo = 0, hi = 1;
      ys.forEach((v, i) => { const c0 = cum; cum += v / tot; if (c0 < 0.025 && cum >= 0.025) lo = i / NS; if (c0 < 0.975 && cum >= 0.975) hi = i / NS; });
      const mean = (L + 1) / (L + R + 2), base = pT + pH;
      if (k2 > 0) {
        S.line([[X(0), base], [X(1), base]], { color: C.soft, w: iw * 0.45, alpha: k2 });
        [0, 0.5, 1].forEach(u => S.text(u === 0 ? "left edge" : u === 1 ? "right edge" : "middle", X(u), base + fz * 1.1, { size: fz * 0.75, color: C.soft, align: u === 0 ? "left" : u === 1 ? "right" : "center", alpha: k2 }));
        const pts = ys.map((v, i) => [X(i / NS), base - (v / mx) * pH * 0.9]);
        // shade the 95% interval with thin hatching
        for (let i = Math.round(lo * NS); i <= Math.round(hi * NS); i += 2) S.line([[pts[i][0], base], pts[i]], { color: C.accent, w: Math.max(1, iw * 0.3), alpha: k2 * 0.3 });
        S.line(pts, { color: C.accent, w: iw * 1.1, alpha: k2 });
        S.line([[px, base], [px, pT - fz * 0.2]], { color: C.accent, w: iw * 0.45, dash: [iw * 1.5, iw * 1.5], alpha: k2 * 0.5 });
        const lab = landed.length ? `95% sure: between ${pct(lo)} and ${pct(hi)}` : "before any rolls: it could be anywhere";
        S.text("our belief about the hidden ball", X(0), pT - fz * 0.3, { align: "left", size: fz * 0.88, color: C.accent, weight: 600, alpha: k2 * (nar ? 0 : 1) });
        S.text(lab, X(1), pT - fz * 0.3, { align: "right", size: fz * 0.85, color: C.ink, alpha: k2 });
      }
      // 3. the AI layer: a naive Bayes spam filter updating word by word
      if (k3 > 0) {
        const aT = st.aT, cyc = WORDS.length + 2.5, tt = (ft * 0.8) % cyc, nW = Math.min(WORDS.length, Math.floor(tt));
        let odds = 0.3 / 0.7; for (let i = 0; i < nW; i++) odds *= WORDS[i][1];
        const pS = odds / (1 + odds);
        st.pS = st.pS == null ? pS : st.pS + (pS - st.pS) * Math.min(1, dt * 5);
        S.text(nar ? "spam filter: each word updates the belief" : "a spam filter does the same: each word updates the belief", X(0), aT, { align: "left", size: fz * 0.9, color: C.accent, weight: 600, alpha: k3 });
        let wx = X(0); const wy = aT + fz * 1.5;
        S.ctx.save(); S.ctx.font = `italic 400 ${(fz * 0.9).toFixed(1)}px Newsreader, Georgia, serif`;
        WORDS.forEach(([wd, lr], i) => {
          const on = i < nW, ww = S.ctx.measureText(wd).width;
          if (wx + ww > X(1)) return;
          S.text(wd, wx, wy, { align: "left", size: fz * 0.9, color: on ? (lr > 1 ? C.accent : C.ink) : C.soft, weight: on ? 600 : 400, alpha: k3 * (on ? 1 : 0.5) });
          if (on) S.text(lr > 1 ? "↑" : "↓", wx + ww + fz * 0.25, wy, { align: "left", size: fz * 0.85, color: lr > 1 ? C.accent : C.ink, italic: false, alpha: k3 });
          wx += ww + fz * 1.5;
        });
        S.ctx.restore();
        const by = wy + fz * 1.3, bh = fz * 0.7, bw = w * (nar ? 0.7 : 0.62);
        S.rect(X(0), by, bw, bh, { color: C.ink, w: iw * 0.45, alpha: k3 });
        S.rect(X(0), by, bw * st.pS, bh, { fill: S.mix(C.accent, C.paper, 0.3), w: 0, alpha: k3 });
        S.text(`P(spam) = ${pct(st.pS)}`, X(0) + bw + fz * 0.6, by + bh * 0.85, { align: "left", size: fz * 0.9, color: C.accent, weight: 600, italic: false, alpha: k3 });
      }
      return landed.length ? `${landed.length} rolls: ${L} left, ${R} right · best guess ${pct(mean)} · 95% between ${pct(lo)} and ${pct(hi)} · truth ${pct(S.p.pos)}`
        : "no rolls yet: every position is equally likely";
    },
    code(S) {
      const st = S.st, landed = (st.balls || []).filter(b => b.t >= 1), L = landed.filter(b => b.left).length, R = landed.length - L;
      return `${S.c("# Bayes's billiard table (published 1763)")}
hidden = random()             ${S.c("# really " + S.p.pos.toFixed(2) + ", but we can't see it")}
left = right = 0
for roll in range(${S.v(S.p.rolls)}):
    if random() < hidden: left += 1     ${S.c("# landed left of it")}
    else:                 right += 1
${S.c("# start knowing nothing (flat prior), then update:")}
belief = Beta(left + 1, right + 1)       ${S.c("# Beta(" + (L + 1) + ", " + (R + 1) + ")")}
best_guess = (left + 1) / (left + right + 2)   ${S.c("# " + ((L + 1) / (L + R + 2)).toFixed(2))}`;
    },
  });
})();
