// Seymour Papert — Logo turtle geometry from editable code → total turning is a whole number of 360°s → AI tutors that ask, not tell
(function () {
  const EX = {
    star: "REPEAT 36 [FD 120 RT 170]",
    square: "REPEAT 4 [FD 100 RT 90]",
    five: "REPEAT 5 [FD 150 RT 144]",
    flower: "REPEAT 12 [REPEAT 4 [FD 60 RT 90] RT 30]",
    houses: "REPEAT 3 [REPEAT 4 [FD 40 RT 90] FD 40 RT 30 FD 40 RT 120 FD 40 RT 30 FD 40 LT 90 PU FD 20 LT 90 PD]",
  };
  const ALIAS = { FORWARD: "FD", BACK: "BK", BACKWARD: "BK", RIGHT: "RT", LEFT: "LT", PENUP: "PU", PENDOWN: "PD" };
  const MAXOPS = 6000;
  function parse(src) {
    const toks = String(src || "").toUpperCase().replace(/\[/g, " [ ").replace(/\]/g, " ] ").split(/\s+/).filter(Boolean);
    let i = 0, err = null; const ops = [];
    const num = () => { const t = toks[i]; if (t == null || !/^-?\d+(\.\d+)?$/.test(t)) { err = err || (t == null ? "NOT ENOUGH INPUTS" : `${t} IS NOT A NUMBER`); return null; } i++; return Math.max(-2000, Math.min(2000, +t)); };
    function block(depth) {
      while (i < toks.length && !err) {
        let t = toks[i]; if (t === "]") { if (depth) return; err = "UNEXPECTED ]"; return; }
        i++; t = ALIAS[t] || t;
        if (t === "FD" || t === "BK" || t === "RT" || t === "LT") { const n = num(); if (n == null) return; if (ops.length < MAXOPS) ops.push([t, n]); }
        else if (t === "PU" || t === "PD") { if (ops.length < MAXOPS) ops.push([t, 0]); }
        else if (t === "REPEAT") {
          const n = num(); if (n == null) return;
          if (toks[i] !== "[") { err = "REPEAT NEEDS [ ]"; return; } i++;
          const start = i, o0 = ops.length; block(depth + 1); if (err) return;
          if (toks[i] !== "]") { err = "MISSING ]"; return; } i++;
          const body = ops.slice(o0); ops.length = o0;
          const reps = Math.max(0, Math.min(500, Math.floor(n)));
          for (let r = 0; r < reps && ops.length < MAXOPS; r++) for (const op of body) { if (ops.length >= MAXOPS) break; ops.push(op); }
          void start;
        } else { err = `I DON'T KNOW HOW TO ${t.slice(0, 12)}`; return; }
      }
      if (depth && !err) err = "MISSING ]";
    }
    block(0);
    return { ops, err, capped: ops.length >= MAXOPS };
  }
  function run(S) {
    const st = S.st, P = parse(S.p.code);
    let x = 0, y = 0, h = 0, pen = true, turn = 0, t = 0, len = 0;
    const steps = [{ x, y, h, turn, t: 0, pen }], segs = [];
    let tl = 0, ta = 0; for (const [c, n] of P.ops) { if (c === "FD" || c === "BK") tl += Math.abs(n); if (c === "RT" || c === "LT") ta += Math.abs(n); }
    // time budget: whole program in ~8 s at speed 1, turns get a share of it
    const D = 8, wl = tl / (tl + ta * 0.15 + 1e-9);
    for (const [c, n] of P.ops) {
      let dt = 0;
      if (c === "FD" || c === "BK") { const d = c === "FD" ? n : -n, r = (h * Math.PI) / 180, nx = x + d * Math.sin(r), ny = y - d * Math.cos(r);
        segs.push({ x0: x, y0: y, x1: nx, y1: ny, pen, i: steps.length }); x = nx; y = ny; len += Math.abs(n); dt = tl ? (Math.abs(n) / tl) * D * wl : 0; }
      else if (c === "RT" || c === "LT") { const a = c === "RT" ? n : -n; h += a; turn += a; dt = ta ? (Math.abs(n) / ta) * D * (1 - wl) : 0; }
      else pen = c === "PD";
      t += dt; steps.push({ x, y, h, turn, t, pen, c, n });
    }
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0; for (const s of segs) { x0 = Math.min(x0, s.x0, s.x1); x1 = Math.max(x1, s.x0, s.x1); y0 = Math.min(y0, s.y0, s.y1); y1 = Math.max(y1, s.y0, s.y1); }
    const closed = segs.length > 1 && Math.hypot(x, y) < 0.5 + len * 1e-4;
    Object.assign(st, { P, steps, segs, bb: { x0, x1, y0, y1 }, T: t, turn, closed, len, t0: null });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function wrapText(ctx, text, maxW) { const out = []; let cur = ""; for (const w of text.split(" ")) { const tt = cur ? cur + " " + w : w; if (ctx.measureText(tt).width > maxW && cur) { out.push(cur); cur = w; } else cur = tt; } if (cur) out.push(cur); return out; }
  const deg = v => (Math.round(v * 10) / 10).toString();
  Lineage.scene({
    params: [
      { id: "code", label: "Logo program (FD, BK, RT, LT, PU, PD, REPEAT n [ ])", type: "textarea", rows: 3, value: EX.star },
      { id: "ex", label: "Or try an example", type: "select", value: "star", options: [{ value: "star", label: "36-point star" }, { value: "square", label: "square" }, { value: "five", label: "5-point star" }, { value: "flower", label: "flower of squares" }, { value: "houses", label: "three houses" }] },
      { id: "speed", label: "Turtle speed", type: "range", min: 0.2, max: 4, step: 0.1, value: 1, fmt: v => v.toFixed(1) + "×" },
    ],
    actions: [{ label: "Run again", run: S => { S.st.t0 = null; } }],
    init(S) { run(S); },
    reset(S) { S.st.t0 = null; },
    onParam(S, id) {
      if (id === "ex") { S.p.code = EX[S.p.ex] || EX.star; const ta = document.getElementById("p-code"); if (ta) ta.value = S.p.code; }
      if (id === "code" || id === "ex") run(S);
    },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const area = narrow ? { x: b.x, y: b.y + fs * 0.5, w: b.w * 0.66, h: b.h * 0.7 } : { x: b.x, y: b.y + fs * 0.8, w: b.w * 0.64, h: b.h * 0.86 };
      const dr = narrow ? Math.min(b.w * 0.13, fs * 2.4) : Math.min(b.w * 0.09, fs * 3.0);
      const dial = narrow ? { x: b.x + b.w - dr - fs * 0.3, y: b.y + dr + fs * 1.2, r: dr } : { x: b.x + b.w * 0.83, y: b.y + b.h * 0.12 + dr, r: dr };
      const tut = narrow ? { x: b.x, y: b.y + b.h * 0.76, w: b.w, h: b.h * 0.22 } : { x: b.x + b.w * 0.68, y: dial.y + dr + fs * 5.2, w: b.w * 0.32, h: b.h * 0.34 };
      Object.assign(S.st, { area, dial, tut });
    },
    entry(S) { const a = S.st.area; return [a.x, a.y + a.h * 0.5]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, nar = S.narrow, { area, dial, tut, steps, segs, bb } = st;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      if (k <= 0.05 || st.t0 == null) st.t0 = ft;
      const T = st.T, hold = 2.2, tt = T > 0 ? ((ft - st.t0) % (T + hold)) : 0, now = Math.min(tt, T);
      // fit drawing
      const pw = Math.max(bb.x1 - bb.x0, 1), ph = Math.max(bb.y1 - bb.y0, 1), sc = Math.min((area.w - fs * 2) / pw, (area.h - fs * 2) / ph, 6);
      const ox = area.x + area.w / 2 - ((bb.x0 + bb.x1) / 2) * sc, oy = area.y + area.h / 2 - ((bb.y0 + bb.y1) / 2) * sc;
      const P = (x, y) => [ox + x * sc, oy + y * sc];
      // find current step
      let lo = 0, hi = steps.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (steps[m].t <= now) lo = m; else hi = m - 1; }
      const cur = steps[lo], nxt = steps[Math.min(lo + 1, steps.length - 1)], f = nxt.t > cur.t ? (now - cur.t) / (nxt.t - cur.t) : 0;
      let tx = cur.x, ty = cur.y, th = cur.h, turn = cur.turn;
      if (lo + 1 < steps.length && T > 0) { tx = cur.x + (nxt.x - cur.x) * f; ty = cur.y + (nxt.y - cur.y) * f; th = cur.h + (nxt.h - cur.h) * f; turn = cur.turn + (nxt.turn - cur.turn) * f; }
      if (T === 0 && steps.length) { const L = steps[steps.length - 1]; tx = L.x; ty = L.y; th = L.h; turn = L.turn; }
      // trail
      ctx.save(); ctx.globalAlpha = k1; ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1.2, iw * (segs.length > 200 ? 0.45 : 0.6)); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); let started = false;
      for (const s of segs) {
        if (s.i > lo + 1 && T > 0) break;
        if (!s.pen) { started = false; continue; }
        const a = P(s.x0, s.y0), e = s.i === lo + 1 && T > 0 ? P(s.x0 + (s.x1 - s.x0) * f, s.y0 + (s.y1 - s.y0) * f) : P(s.x1, s.y1);
        if (!started) { ctx.moveTo(a[0], a[1]); started = true; } ctx.lineTo(e[0], e[1]);
      }
      ctx.stroke(); ctx.restore();
      // start mark
      const sp = P(0, 0); S.circle(sp[0], sp[1], fs * 0.25, { w: iw * 0.35, color: C.soft, alpha: k1 });
      // turtle
      const [px, py] = P(tx, ty), r = (th * Math.PI) / 180, ts = fs * 0.85, fwd = [Math.sin(r), -Math.cos(r)], side = [Math.cos(r), Math.sin(r)];
      const tip = [px + fwd[0] * ts, py + fwd[1] * ts], l = [px - fwd[0] * ts * 0.45 + side[0] * ts * 0.55, py - fwd[1] * ts * 0.45 + side[1] * ts * 0.55], rr = [px - fwd[0] * ts * 0.45 - side[0] * ts * 0.55, py - fwd[1] * ts * 0.45 - side[1] * ts * 0.55];
      S.line([tip, l, rr], { close: true, w: iw * 0.6, color: C.ink, fill: C.paper, alpha: k1 });
      S.dot(px, py, iw * 0.45, C.ink, k1);
      if (st.P.err) S.text(st.P.err, area.x + area.w / 2, area.y + area.h - fs * 0.2, { size: fs * 0.85, mono: true, italic: false, weight: 600, alpha: k1 });
      else if (!segs.length) S.text("type a program, e.g. FD 100 RT 90", area.x + area.w / 2, area.y + area.h / 2 + fs * 2, { size: fs * 0.9, color: C.soft, alpha: k1 });
      // current command
      if (cur.c && T > 0 && !nar) S.text(`${nxt.c || cur.c} ${deg(nxt.n ?? cur.n)}`, px + side[0] * ts * 1.6, py + side[1] * ts * 1.6 + fs * 0.3, { size: fs * 0.75, mono: true, italic: false, color: C.soft, alpha: k1 });
      // ---- the idea: total turning ----
      if (k2 > 0) {
        const { x, y, r: R } = dial, full = Math.floor(Math.abs(turn) / 360 + 1e-6), rem = Math.abs(turn) - full * 360, sg = turn < 0 ? -1 : 1;
        S.circle(x, y, R, { w: iw * 0.35, color: C.soft, alpha: k2 });
        const a0 = -Math.PI / 2, a1 = a0 + sg * (rem * Math.PI / 180);
        if (rem > 0.5) S.circle(x, y, R, { w: iw * 0.9, color: C.accent, alpha: k2, a0: Math.min(a0, a1), a1: Math.max(a0, a1) });
        for (let j = 0; j < Math.min(full, 40); j++) S.circle(x, y, R * (0.9 - j * Math.min(0.06, 0.55 / Math.max(full, 1))), { w: Math.max(0.6, iw * 0.25), color: C.accent, alpha: k2 * 0.55 });
        const hr = (th * Math.PI) / 180; S.arrow(x, y, x + Math.sin(hr) * R * 0.95, y - Math.cos(hr) * R * 0.95, { w: iw * 0.55, color: C.ink, alpha: k2 });
        S.text(`turned ${deg(Math.round(turn))}°`, x, y + R + fs * 1.2, { size: fs * (nar ? 0.8 : 0.95), weight: 500, color: C.accent, alpha: k2 });
        S.text(full ? `= ${full} × 360°` + (Math.round(rem) ? ` + ${deg(Math.round(rem))}°` : "") : "of 360°", x, y + R + fs * 2.3, { size: fs * (nar ? 0.72 : 0.82), color: C.accent, alpha: k2 });
        if (!nar) S.text("total turning", x, y - R - fs * 0.6, { size: fs * 0.82, color: C.soft, alpha: k2 });
        if (!nar && st.closed && now >= T) S.text("back home: a whole number of turns", x, y + R + fs * 3.5, { size: fs * 0.78, color: C.ink, alpha: k2 });
      }
      // ---- AI tutor that asks rather than tells ----
      if (k3 > 0) {
        const tot = Math.round(st.turn), m = Math.round(tot / 360), whole = Math.abs(tot - m * 360) < 0.5;
        let q;
        if (st.P.err) q = "What do you think the turtle didn't understand? Check the spelling and the brackets.";
        else if (!segs.length) q = "What's the smallest program that draws a triangle?";
        else if (st.closed && whole) q = `It turned ${Math.abs(m)} × 360° and came home. Can you predict what RT ${S.p.code.includes("144") ? 160 : 144} would draw before you run it?`;
        else if (st.closed) q = "It came home, but the turns don't add to a whole circle. Why?";
        else if (whole && m) q = `It faces the way it started (${Math.abs(m)} × 360°) but isn't home. What else would have to change?`;
        else q = `Not home yet: it turned ${tot}°. What would you change so it closes up?`;
        const s1 = fs * (nar ? 0.78 : 0.85), pad = fs * 0.55;
        ctx.save(); ctx.font = `italic 400 ${s1.toFixed(1)}px Newsreader, Georgia, serif`; const lines = wrapText(ctx, q, tut.w - pad * 2).slice(0, nar ? 2 : 6); ctx.restore();
        const bh = lines.length * s1 * 1.3 + pad * 1.2, by = tut.y + fs * 1.4;
        ctx.save(); ctx.globalAlpha = k3; rrect(ctx, tut.x, by, tut.w, bh, fs * 0.5); ctx.fillStyle = C.paper; ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = iw * 0.55; ctx.stroke(); ctx.restore();
        lines.forEach((ln, i) => S.text(ln, tut.x + pad, by + pad * 0.6 + (i + 0.85) * s1 * 1.3, { size: s1, align: "left", color: C.accent, halo: false, alpha: k3 }));
        S.text(nar ? "AI tutor: asks, doesn't tell" : "an AI tutor that asks, not tells", tut.x + fs * 0.2, tut.y + fs * 0.9, { size: fs * 0.82, align: "left", weight: 500, color: C.accent, alpha: k3 });
        if (!nar) S.text("learn by building and debugging", tut.x + fs * 0.2, by + bh + fs * 1.3, { size: fs * 0.8, align: "left", color: C.soft, alpha: k3 });
      }
      const moves = segs.length;
      if (st.P.err) return `Logo says: ${st.P.err}`;
      return `${moves} move${moves === 1 ? "" : "s"} · total turning ${deg(Math.round(st.turn))}°${st.closed ? " · path closes" : " · path open"}${st.P.capped ? " · stopped at " + MAXOPS + " commands" : ""}`;
    },
    code(S) {
      const st = S.st, src = String(S.p.code || "").replace(/\s+/g, " ").trim(), short = src.length > 38 ? src.slice(0, 36) + " …" : src;
      const m = Math.round((st.turn || 0) / 360);
      return `${S.c("# a Logo interpreter, in a few lines")}
x, y, heading = 0, 0, 0                ${S.c("# start facing up")}
def run(commands):
    for cmd, n in commands:
        if cmd == "FD":  move(n); draw_line()
        if cmd == "RT":  heading += n        ${S.c("# turn on the spot")}
        if cmd == "LT":  heading -= n
        if cmd == "REPEAT":
            for _ in range(n): run(block)
run(parse("${S.v(short.replace(/"/g, "'"))}"))
${S.c(`# ${st.segs ? st.segs.length : 0} moves, turning ${deg(Math.round(st.turn || 0))}°${Math.abs((st.turn || 0) - m * 360) < 0.5 && m ? ` = ${m} × 360°` : ""}`)}`;
    },
  });
})();
