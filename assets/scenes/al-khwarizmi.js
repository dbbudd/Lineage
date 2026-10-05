// al-Khwarizmi — completing the square with real squares (x² + 10x = 39) → the recipe → every AI model is an algorithm
(function () {
  const nf = v => { const r = Math.round(v * 100) / 100; return (Object.is(r, -0) ? 0 : r).toString(); };
  const solve = (b, c) => { const h = b / 2, sq = h * h, tot = c + sq; const side = tot >= 0 ? Math.sqrt(tot) : NaN; return { h, sq, tot, side, x: side - h }; };
  Lineage.scene({
    params: [
      { id: "b", label: "b: the roots (x² + bx = c)", type: "range", min: 1, max: 20, step: 1, value: 10, fmt: v => String(v) },
      { id: "c", label: "c: the number", type: "range", min: -30, max: 120, step: 1, value: 39, fmt: v => String(v) },
      { id: "speed", label: "Recipe speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { S.st.anim = 99; },
    reset(S) { S.st.anim = 0; },
    onParam(S, id) { if (id !== "speed") S.st.anim = 0.3; },
    layout(S) {
      const { box, narrow, fs } = S;
      // geometry on the left, the recipe on the right, the whole group centred vertically
      const gw = box.w * (narrow ? 0.5 : 0.6);
      const head = fs * (narrow ? 1.3 : 2.0), lab = fs * (narrow ? 1.5 : 2.0), foot = fs * (narrow ? 4.2 : 5.2);
      const side = Math.min(gw * 0.84, box.h - head - lab - foot - fs);
      const tot = head + lab + side + foot, y0 = box.y + Math.max(fs * 0.6, (box.h - tot) / 2);
      const top = y0 + fs, gy = y0 + head + lab;
      const gx = box.x + Math.max(fs * 1.4, (gw - side) * 0.45);
      const rx = box.x + gw + fs * (narrow ? 0.2 : 0.8), rw = box.x + box.w - rx;
      const ry = gy + side * 0.5 - fs * (narrow ? 5.6 : 7.4);
      Object.assign(S.st, { gw, side, gx, gy, rx, rw, top, ry });
    },
    entry(S) { const { gx, gy, side } = S.st; return [gx - S.fs * 0.6, gy + side * 0.5]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow;
      st.anim = Math.min(99, (st.anim ?? 99) + dt);
      const b = S.p.b, c = S.p.c, R = solve(b, c), ok = R.x > 1e-9 && isFinite(R.x);
      // local progress: the reveal, or a replay after the coefficients change
      const q = Math.min(k, st.anim / 3.4 + 0.12);
      const kA = S.ease(q / 0.15), kS = S.ease((q - 0.15) / 0.33), kC = S.ease((q - 0.5) / 0.18), kX = S.ease((q - 0.68) / 0.14), kR = S.ease((k - 0.8) / 0.2);
      // equation header
      const eq = `x² + ${b}x = ${c}`;
      S.text(eq, st.gx + st.side * 0.5, st.top, { size: fs * (nar ? 1.15 : 1.4), color: C.ink, weight: 500, alpha: kA });
      // scale: the finished square has side x + b/2 (or the corner alone if no solution)
      const L = ok ? R.side : Math.max(R.h, 1e-6), u = st.side / L / (1 + (ok ? 0.16 * (1 - kS) : 0));
      const X = ok ? R.x * u : 0, Hh = R.h * u, gap = st.side * 0.14 * (1 - kS);
      const ox = st.gx, oy = st.gy, w = iw * 1.05;
      const lab = (s, x, y, o = {}) => S.text(s, x, y, Object.assign({ size: fs * (nar ? 0.95 : 1.1), color: C.ink, baseline: "middle" }, o));
      if (ok) {
        // the square x² and two rectangles of (b/2)·x slide together into a gnomon of area c
        const sx = ox + gap * 0.5 * (1 - kS), sy = oy + gap * 0.5 * (1 - kS);
        S.rect(sx, sy, X, X, { color: C.ink, w, alpha: kA });
        if (X > fs * 1.8) lab("x²", sx + X / 2, sy + X / 2, { alpha: kA, size: fs * (nar ? 1.05 : 1.3) });
        const r1 = [ox + X + gap, oy], r2 = [ox, oy + X + gap];
        S.rect(r1[0], r1[1], Hh, X, { color: C.ink, w, alpha: kA, fill: S.mix(C.ink, C.paper, 0.93) });
        S.rect(r2[0], r2[1], X, Hh, { color: C.ink, w, alpha: kA, fill: S.mix(C.ink, C.paper, 0.93) });
        if (X > fs * 2 && Hh > fs * 1.6) {
          lab(`${nf(R.h)}x`, r1[0] + Hh / 2, r1[1] + X / 2, { alpha: kA });
          lab(`${nf(R.h)}x`, r2[0] + X / 2, r2[1] + Hh / 2, { alpha: kA });
        }
        // side labels
        const sl = fs * 0.8;
        lab("x", sx + X / 2, oy - sl, { alpha: kA, size: fs * 0.95 });
        lab(nf(R.h), r1[0] + Hh / 2, oy - sl, { alpha: kA, size: fs * 0.95 });
        lab("x", ox - sl, sy + X / 2, { alpha: kA, size: fs * 0.95 });
        lab(nf(R.h), ox - sl, r2[1] + Hh / 2, { alpha: kA, size: fs * 0.95 });
        // the gnomon has area c
        if (kS > 0.98 && kC < 0.5) lab(`together: area ${c}`, ox + (X + Hh) * 0.5, oy + X + Hh + fs * 1.1, { size: fs * 0.9, color: C.soft, alpha: 1 - kC * 2 });
        // missing corner (b/2)² drops in
        if (kC > 0) {
          const fly = (1 - kC) * Math.max(Hh, fs * 3) * 0.9, cx = ox + X + fly, cy = oy + X + fly;
          S.rect(cx, cy, Hh, Hh, { color: C.accent, w: w * 1.1, alpha: kC, fill: S.mix(C.accent, C.paper, 0.82) });
          if (Hh > fs * 1.4) lab(nf(R.sq), cx + Hh / 2, cy + Hh / 2, { color: C.accent, weight: 500, alpha: kC });
        }
        // whole square (x + b/2)²
        if (kX > 0) {
          const T = X + Hh, by = oy + T + fs * 0.75, tk = fs * 0.3;
          S.rect(ox, oy, T, T, { color: C.accent, w: iw * 0.5, alpha: kX * 0.8 });
          S.line([[ox, by], [ox + T, by]], { color: C.accent, w: iw * 0.6, alpha: kX });
          S.line([[ox, by - tk], [ox, by + tk]], { color: C.accent, w: iw * 0.6, alpha: kX });
          S.line([[ox + T, by - tk], [ox + T, by + tk]], { color: C.accent, w: iw * 0.6, alpha: kX });
          const f1 = fs * (nar ? 0.92 : 1.1);
          lab(`side: x + ${nf(R.h)} = √${nf(R.tot)} = ${nf(R.side)}`, ox + T / 2, by + f1 * 1.15, { color: C.ink, alpha: kX, size: f1 });
          lab(`x = ${nf(R.x)}`, ox + T / 2, by + f1 * 2.75, { color: C.accent, weight: 600, alpha: kX, size: fs * (nar ? 1.15 : 1.45) });
        }
      } else {
        // no positive solution: only the corner exists, and nothing can be added to reach c
        const hs = Math.min(Hh, st.side * 0.55);
        const cx = ox + st.side * 0.5 - hs * 0.5, cy = oy + st.side * 0.15;
        S.rect(cx, cy, hs, hs, { color: C.accent, w, alpha: kA, dash: [iw * 2, iw * 1.6] });
        lab(nf(R.sq), cx + hs / 2, cy + hs / 2, { color: C.accent, alpha: kA });
        const ty = cy + hs + fs * 1.4, tx = ox + st.side * 0.5;
        lab(c <= 0 ? `x² + ${b}x is never ${c} for x > 0` : "", tx, ty, { alpha: kA, size: fs * 0.95 });
        lab("no positive solution", tx, ty + fs * 1.4, { color: C.accent, weight: 600, alpha: kA });
        lab(R.tot < 0 ? `(x + ${nf(R.h)})² = ${nf(R.tot)} < 0` : "al-Khwarizmi only used positive lengths", tx, ty + fs * 2.8, { alpha: kA, size: fs * 0.85, color: C.soft });
      }
      // the recipe = an algorithm (accent layer)
      if (kR > 0) {
        const steps = [
          ["halve the roots", nf(R.h)],
          ["square the half", nf(R.sq)],
          [`add ${c}`, nf(R.tot)],
          ["take the root", isFinite(R.side) ? nf(R.side) : "none"],
          ["take away the half", isFinite(R.side) ? nf(R.x) : "—"],
        ];
        const lh = fs * (nar ? 1.35 : 1.75), x0 = st.rx, y0 = st.ry, fz = fs * (nar ? 0.82 : 1.05);
        S.text("the recipe", x0, y0, { align: "left", size: fs * (nar ? 0.95 : 1.2), color: C.accent, weight: 600, alpha: kR });
        const cur = Math.floor(ft * 0.9) % (steps.length + 2);
        steps.forEach(([s, v], i) => {
          const y = y0 + lh * (i + 1.1), on = i === cur, done = i < cur || cur >= steps.length;
          const col = on ? C.accent : C.ink, a = kR * (done || on ? 1 : 0.45);
          S.text(`${i + 1}`, x0 + fz * 0.4, y, { size: fz, color: col, alpha: a, italic: false, mono: true });
          S.text(s, x0 + fz * 1.3, y, { align: "left", size: fz, color: col, alpha: a, weight: on ? 600 : 400 });
          S.text(v, st.rx + st.rw - fz * 0.2, y, { align: "right", size: fz, color: col, alpha: a, weight: 600, italic: false });
          if (on) S.arrow(x0 - fz * 1.1, y - fz * 0.32, x0 - fz * 0.15, y - fz * 0.32, { w: iw * 0.6, color: C.accent, alpha: kR });
        });
        const yb = y0 + lh * (steps.length + 1.4);
        S.line([[x0, yb - lh * 0.45], [st.rx + st.rw, yb - lh * 0.45]], { color: C.accent, w: iw * 0.4, alpha: kR * 0.6 });
        S.text("Algoritmi → algorithm", x0, yb + fz * 0.25, { align: "left", size: fz, color: C.accent, weight: 600, alpha: kR });
        S.text("same steps, any b and c:", x0, yb + fz * 1.5, { align: "left", size: fz * 0.9, color: C.ink, alpha: kR });
        S.text("every AI model is one", x0, yb + fz * 2.6, { align: "left", size: fz * 0.9, color: C.ink, alpha: kR });
      }
      return ok ? `x² + ${b}x = ${c} → add the ${nf(R.sq)} corner → (x + ${nf(R.h)})² = ${nf(R.tot)} → x = ${nf(R.x)}`
        : `x² + ${b}x = ${c} has no positive solution`;
    },
    code(S) {
      const b = S.p.b, c = S.p.c, R = solve(b, c), ok = R.x > 1e-9 && isFinite(R.x);
      return `${S.c("# al-Khwarizmi's recipe for x² + bx = c")}
b, c = ${S.v(b)}, ${S.v(c)}
half   = b / 2          ${S.c("# " + nf(R.h))}
corner = half ** 2      ${S.c("# " + nf(R.sq) + ", the missing square")}
total  = c + corner     ${S.c("# " + nf(R.tot) + " = (x + half)²")}
${R.tot >= 0 ? `side   = sqrt(total)    ${S.c("# " + nf(R.side))}
x      = side - half    ${S.c("# " + nf(R.x) + (ok ? "" : ", not positive"))}` : `${S.c("# total < 0: no square has a negative area,")}
${S.c("# so there is no solution")}`}`;
    },
  });
})();
