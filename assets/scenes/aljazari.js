// Ismail al-Jazari — musical automaton (1206): a turning drum with pegs lifts rods that make the drummers strike → the peg pattern as a sequencer grid → a robot arm playing a learned pattern
Lineage.scene({
  params: [
    { id: "preset", label: "Peg pattern", type: "select", value: "march", options: [{ value: "march", label: "Royal march" }, { value: "steady", label: "Steady beat" }, { value: "swing", label: "Off-beat" }, { value: "rain", label: "Rolling" }, { value: "clear", label: "No pegs (draw your own)" }] },
    { id: "speed", label: "Drum speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  PRESETS: {
    march: ["x...x...x...x.x.", "..x...x...x...x.", "x.......x......."],
    steady: ["x...x...x...x...", "..x...x...x...x.", "x...............",],
    swing: ["x.....x...x.....", "...x...x...x..x.", "......x.......x."],
    rain: ["x.x.x.x.x.x.x.x.", ".x.x.x.x.x.x.x.x", "x...x...x...x..."],
    clear: ["................", "................", "................"],
  },
  NAMES: ["large drum", "small drum", "cymbals"],
  init(S) { this.load(S); },
  onParam(S, id) { if (id === "preset") this.load(S); },
  load(S) { const P = this.PRESETS[S.p.preset] || this.PRESETS.march; S.st.pegs = P.map(r => [...r].map(c => c === "x")); },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15;
    const m = side ? { x: b.x, y: b.y, w: b.w * 0.5, h: b.h } : { x: b.x, y: b.y, w: b.w * 0.62, h: b.h * 0.6 };
    const grid = side ? { x: b.x + b.w * 0.56, y: b.y + b.h * 0.1, w: b.w * 0.43, h: b.h * 0.34 } : { x: b.x + b.w * 0.16, y: b.y + b.h * 0.68, w: b.w * 0.82, h: b.h * 0.2 };
    const robot = side ? { x: b.x + b.w * 0.56, y: b.y + b.h * 0.58, w: b.w * 0.43, h: b.h * 0.4 } : { x: b.x + b.w * 0.66, y: b.y + b.h * 0.06, w: b.w * 0.33, h: b.h * 0.48 };
    const r = Math.min(m.h * (side ? 0.17 : 0.2), m.w * 0.2), dw = Math.min(m.w * 0.78, r * 4.2);
    const dx = m.x + m.w * 0.5, dy = m.y + m.h * 0.8 - r * 0.2;
    Object.assign(S.st, { side, m, grid, robot, r, dw, dx, dy });
  },
  entry(S) { const { dx, dy, dw, r } = S.st; return S.narrow ? [dx - dw / 2 - r * 0.5, dy] : [dx - dw / 2 - r * 0.2, dy - r - r * 0.7]; },
  pointer(S, type, x, y) {
    if (type !== "down") return;
    const { grid } = S.st, cw = grid.w / 16, rh = grid.h / 3;
    if (x < grid.x || x > grid.x + grid.w || y < grid.y || y > grid.y + grid.h) return;
    const i = Math.min(15, Math.floor((x - grid.x) / cw)), j = Math.min(2, Math.floor((y - grid.y) / rh));
    S.st.pegs[j][i] = !S.st.pegs[j][i];
  },
  draw(S, k, ft) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx;
    const { m, grid, robot, r, dw, dx, dy, side, pegs } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    const lf = fs * (side ? 0.78 : 0.88);
    const pos = (ft * 3.2) % 16;
    const laneX = j => dx - dw / 2 + ((j + 0.5) * dw) / 3;
    // lift: a peg approaching the top pushes the rod up; strike: the rod drops just after it passes
    const lift = [], strike = [];
    for (let j = 0; j < 3; j++) {
      let L = 0, Sk = 0;
      for (let i = 0; i < 16; i++) if (pegs[j][i]) {
        const ahead = (i - pos + 16) % 16, past = (pos - i + 16) % 16;
        if (ahead < 0.9) L = Math.max(L, 1 - ahead / 0.9);
        Sk = Math.max(Sk, Math.exp(-past * 3));
      }
      lift.push(L); strike.push(Sk);
    }
    // ---- the peg drum ----
    const al = k1;
    S.line([[dx - dw / 2, dy - r], [dx + dw / 2, dy - r]], { w: iw * 0.6, color: C.ink, alpha: al });
    S.line([[dx - dw / 2, dy + r], [dx + dw / 2, dy + r]], { w: iw * 0.6, color: C.ink, alpha: al });
    for (const sx of [-1, 1]) { ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.6; ctx.beginPath(); ctx.ellipse(dx + sx * dw / 2, dy, r * 0.22, r, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    S.line([[dx - dw / 2 - r * 0.5, dy], [dx - dw / 2 - r * 0.22, dy]], { w: iw * 0.7, color: C.ink, alpha: al });
    S.line([[dx + dw / 2 + r * 0.22, dy], [dx + dw / 2 + r * 0.5, dy]], { w: iw * 0.7, color: C.ink, alpha: al });
    // surface lines turning with the drum
    for (let i = 0; i < 16; i++) { const a = (2 * Math.PI * (i + 0.5 - pos)) / 16, aa = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); if (aa > Math.PI) continue; const y = dy - r * Math.cos(aa); S.line([[dx - dw / 2, y], [dx + dw / 2, y]], { w: 0.8, color: C.soft, alpha: al * 0.4 * Math.sin(aa) + 0.05 }); }
    // pegs on the front face
    for (let j = 0; j < 3; j++) for (let i = 0; i < 16; i++) if (pegs[j][i]) {
      const a = (((2 * Math.PI * (i - pos)) / 16) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (a > Math.PI * 1.02) continue;
      const y = dy - r * Math.cos(a), sz = Math.max(2.2, r * 0.09) * (0.6 + 0.4 * Math.sin(a) + (a < 0.3 ? 0.4 : 0));
      S.line([[laneX(j), y], [laneX(j), y - sz * 1.4 * (0.4 + Math.sin(a) * 0.6)]], { w: sz, color: C.ink, alpha: al });
    }
    S.text("peg drum", dx, dy + r + lf * 1.3, { size: lf, alpha: al });
    // ---- rods and drummers ----
    const rod = r * 0.6, figH = Math.min(r * 1.45, (dy - r - rod - m.y) * 0.85);
    for (let j = 0; j < 3; j++) {
      const x = laneX(j), up = lift[j] * r * 0.22, y0 = dy - r - 2 - up, y1 = y0 - rod;
      S.line([[x, y0], [x, y1]], { w: iw * 0.6, color: C.ink, alpha: al });
      S.line([[x - r * 0.12, y0], [x + r * 0.12, y0]], { w: iw * 0.6, color: C.ink, alpha: al });
      // the automaton: body standing on the platform, arm lifted by the rod
      const base = dy - r - rod - r * 0.1, hx = x - figH * 0.22;
      const hy = base - figH * 0.85, sh = [hx, base - figH * 0.62];
      S.line([[x - figH * 0.5, base], [x + figH * 0.5, base]], { w: iw * 0.5, color: C.ink, alpha: al });
      S.circle(hx, hy, figH * 0.13, { w: iw * 0.6, color: C.ink, alpha: al });
      S.line([[hx, hy + figH * 0.13], [hx, base - figH * 0.05]], { w: iw * 0.6, color: C.ink, alpha: al });
      S.line([[hx, base - figH * 0.05], [hx - figH * 0.12, base], [hx - figH * 0.12, base]], { w: iw * 0.5, color: C.ink, alpha: al });
      const ang = 0.45 - lift[j] * 1.3, armL = figH * 0.55;
      const handP = [sh[0] + armL * Math.cos(ang), sh[1] + armL * Math.sin(ang)];
      S.line([sh, handP], { w: iw * 0.6, color: C.ink, alpha: al });
      S.line([handP, [handP[0] + figH * 0.18, handP[1] + figH * 0.12]], { w: iw * 0.4, color: C.ink, alpha: al });
      // instrument in front of the drummer
      const ix = hx + figH * 0.62, iy = base - figH * 0.3, iwd = figH * (j === 2 ? 0.2 : 0.26 - j * 0.04);
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.5; ctx.beginPath(); ctx.ellipse(ix, iy, iwd, iwd * 0.3, j === 2 ? -0.3 : 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      if (j < 2) { S.line([[ix - iwd, iy], [ix - iwd * 0.8, base]], { w: iw * 0.4, color: C.ink, alpha: al }); S.line([[ix + iwd, iy], [ix + iwd * 0.8, base]], { w: iw * 0.4, color: C.ink, alpha: al }); }
      else S.line([[ix, iy], [ix, base]], { w: iw * 0.4, color: C.ink, alpha: al });
      // the struck note: rings spreading from the instrument
      if (strike[j] > 0.05 && k2 > 0) for (let q = 0; q < 2; q++) S.circle(ix, iy, iwd * (1.2 + q * 0.45 + (1 - strike[j]) * 0.8), { w: iw * 0.4, color: C.accent, alpha: strike[j] * k2 * (1 - q * 0.4), a0: Math.PI * 1.1, a1: Math.PI * 1.9 });
      if (!side || j !== 1) S.text(this.NAMES[j], x, base + lf * 0.05 - figH - lf * 0.4, { size: lf * 0.8, color: C.soft, alpha: al });
    }
    // ---- the drum unrolled: a sequencer you can reprogram ----
    if (k2 > 0) {
      const cw = grid.w / 16, rh = grid.h / 3;
      S.text(side ? "the drum, unrolled: click to move pegs" : "the drum's surface, unrolled: click a cell to add or remove a peg", grid.x + grid.w / 2, grid.y - lf * 0.6, { size: lf * 0.85, alpha: k2 });
      const px = grid.x + (pos / 16) * grid.w;
      S.rect(grid.x + Math.floor(pos) * cw, grid.y, cw, grid.h, { color: C.accent, w: iw * 0.5, alpha: k2 });
      for (let j = 0; j < 3; j++) {
        if (!side) S.text(this.NAMES[j], grid.x - lf * 0.5, grid.y + (j + 0.5) * rh + lf * 0.3, { size: lf * 0.8, align: "right", color: C.soft, alpha: k2 });
        for (let i = 0; i < 16; i++) {
          const cx = grid.x + (i + 0.5) * cw, cy = grid.y + (j + 0.5) * rh, rr = Math.min(cw, rh) * 0.3;
          if (pegs[j][i]) S.dot(cx, cy, rr, i === Math.floor(pos) ? C.accent : C.ink, k2);
          else S.circle(cx, cy, rr * 0.45, { w: 0.9, color: C.soft, alpha: k2 * 0.7 });
        }
      }
      for (let i = 0; i <= 16; i += 4) S.line([[grid.x + i * cw, grid.y], [grid.x + i * cw, grid.y + grid.h]], { w: i % 16 ? 0.8 : iw * 0.4, color: C.soft, alpha: k2 * 0.6 });
      S.line([[grid.x, grid.y], [grid.x + grid.w, grid.y]], { w: iw * 0.4, color: C.ink, alpha: k2 });
      S.line([[grid.x, grid.y + grid.h], [grid.x + grid.w, grid.y + grid.h]], { w: iw * 0.4, color: C.ink, alpha: k2 });
      S.line([[px, grid.y - 3], [px, grid.y + grid.h + 3]], { w: iw * 0.5, color: C.accent, alpha: k2 });
    }
    // ---- today: a robot arm playing the same pattern from a learned policy ----
    if (k3 > 0) {
      const { x, y, w, h } = robot, s1 = strike[0], l1 = lift[0];
      const base = [x + w * 0.22, y + h * 0.6], L1 = Math.min(w * 0.4, h * 0.34), L2 = L1 * 0.85;
      const q1 = -0.7 - 0.25 * l1, q2 = 1.9 - 0.65 * l1;
      const elb = [base[0] + L1 * Math.cos(q1), base[1] + L1 * Math.sin(q1)], tip = [elb[0] + L2 * Math.cos(q1 + q2), elb[1] + L2 * Math.sin(q1 + q2)];
      S.line([[base[0] - L1 * 0.35, base[1] + L1 * 0.1], [base[0] + L1 * 0.35, base[1] + L1 * 0.1]], { w: iw * 0.7, alpha: k3 });
      S.line([base, elb, tip], { w: iw * 0.9, alpha: k3 });
      S.dot(base[0], base[1], iw * 1.1, C.accent, k3); S.dot(elb[0], elb[1], iw * 0.9, C.accent, k3);
      const r0 = [-0.7, 1.9], e0 = [base[0] + L1 * Math.cos(r0[0]), base[1] + L1 * Math.sin(r0[0])];
      const dr = [e0[0] + L2 * Math.cos(r0[0] + r0[1]), e0[1] + L2 * Math.sin(r0[0] + r0[1]) + L1 * 0.12];
      ctx.save(); ctx.globalAlpha = k3; ctx.strokeStyle = C.accent; ctx.lineWidth = iw * 0.6; ctx.beginPath(); ctx.ellipse(dr[0], dr[1], L1 * 0.32, L1 * 0.1, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      // joint-angle traces over time
      const tx = x + w * 0.02, ty = y + h * 0.88, tw = w * 0.96, th = h * 0.12;
      for (const [jj, off] of [[0, 0], [1, 1]]) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const pp = pos - 6 + (i / 60) * 6; let L = 0;
          for (let s = 0; s < 16; s++) if (pegs[0][s]) { const ah = (s - pp + 32) % 16; if (ah < 0.9) L = Math.max(L, 1 - ah / 0.9); }
          pts.push([tx + (tw * i) / 60, ty + th * (off * 0.9) - th * 0.8 * L * (jj ? 1 : 0.5)]);
        }
        S.line(pts, { w: iw * 0.5, alpha: k3 * (jj ? 1 : 0.6) });
      }
      S.text("robot arm: a learned policy", x + w * 0.5, y + h * 0.08, { size: lf * 0.85, color: C.accent, alpha: k3, weight: 500 });
      S.text("pegs → code → policies learned from data", x + w * 0.5, y + h * 0.08 + lf * 1.1, { size: lf * 0.75, color: C.accent, alpha: k3 });
      S.text("joint angles", x + w, ty + th * 1.9 + lf * 0.2, { size: lf * 0.72, color: C.accent, align: "right", alpha: k3 });
    }
    const n = pegs.reduce((a, r) => a + r.filter(Boolean).length, 0);
    const hits = [0, 1, 2].filter(j => strike[j] > 0.6).map(j => this.NAMES[j]);
    return `step ${Math.floor(pos) + 1} of 16 · ${n} pegs on the drum${hits.length ? " · " + hits.join(" + ") + "!" : ""}`;
  },
  code(S) {
    const P = S.st.pegs || [[], [], []], row = r => r.map(b => (b ? "x" : ".")).join("");
    return `${S.c("# al-Jazari's peg drum: a programmable sequencer")}
pattern = {
    "large drum": "${S.v(row(P[0]))}",
    "small drum": "${S.v(row(P[1]))}",
    "cymbals":    "${S.v(row(P[2]))}",
}
for step in cycle(range(16)):        ${S.c("# the drum turns")}
    for drummer, pegs in pattern.items():
        if pegs[step] == "x":         ${S.c("# a peg lifts the rod")}
            strike(drummer)          ${S.c("# ... and the arm falls")}`;
  },
});
