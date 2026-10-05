// Hedy Lamarr & George Antheil — frequency hopping (patent 1942): matching piano-roll hop patterns beat a jammer → seeded pseudo-random sequences in today's wireless
Lineage.scene({
  params: [
    { id: "hopping", label: "Frequency hopping on", type: "toggle", value: true },
    { id: "N", label: "Number of channels", type: "range", min: 2, max: 88, step: 1, value: 12, fmt: v => String(v) },
    { id: "speed", label: "Hop rate", type: "range", min: 0.2, max: 3, step: 0.05, value: 1, fmt: v => (v * 3).toFixed(1) + " hops/s" },
  ],
  MSG: "TURN LEFT TEN DEGREES · ",
  init(S) { S.st.jam = null; S.st.t0 = 0; },
  reset(S) { S.st.t0 = 0; },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15;
    const g = side ? { x: b.x + b.w * 0.17, y: b.y + b.h * 0.08, w: b.w * 0.6, h: b.h * 0.5 } : { x: b.x + b.w * 0.2, y: b.y + b.h * 0.06, w: b.w * 0.59, h: b.h * 0.52 };
    const msgY = side ? b.y + b.h * 0.7 : b.y + b.h * 0.72;
    const ai = side ? { x: b.x, y: b.y + b.h * 0.84, w: b.w, h: b.h * 0.16 } : { x: b.x, y: b.y + b.h * 0.84, w: b.w, h: b.h * 0.16 };
    Object.assign(S.st, { side, g, msgY, ai });
  },
  entry(S) { const { g } = S.st, rw = Math.min((g.w / 14) * 2.2, (g.x - S.box.x) * 0.55), rx = S.box.x + (g.x - S.box.x) * (S.narrow ? 0.45 : 0.58) - rw / 2; return [rx, S.narrow ? g.y + g.h : g.y]; },
  hop(s, N) { // the shared "roll": a seeded pseudo-random channel for slot s
    let a = (s * 2654435761 + 1942 * 40503) >>> 0; a ^= a >>> 15; a = Math.imul(a, 2246822519) >>> 0; a ^= a >>> 13; a = Math.imul(a, 3266489917) >>> 0; a ^= a >>> 16;
    return (a >>> 0) % N;
  },
  chan(S, s) { const N = S.p.N | 0; return S.p.hopping ? this.hop(s, N) : this.jamCh(S); },
  jamCh(S) { const N = S.p.N | 0; return S.st.jam == null ? Math.floor(N * 0.4) : Math.min(N - 1, S.st.jam); },
  pointer(S, type, x, y) {
    if (type !== "down" && type !== "drag") return;
    const { g } = S.st, N = S.p.N | 0;
    if (x < g.x - 10 || x > g.x + g.w + 10 || y < g.y || y > g.y + g.h) return;
    S.st.jam = Math.max(0, Math.min(N - 1, Math.floor(((g.y + g.h - y) / g.h) * N)));
  },
  draw(S, k, ft) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx;
    const { g, msgY, ai, side } = st, N = S.p.N | 0, M = this.MSG;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    const lf = fs * (side ? 0.78 : 0.88);
    const rate = 3, tt = ft * rate, sNow = Math.floor(tt), frac = tt - sNow;
    const cols = 14, cw = g.w / cols, rh = g.h / N, J = this.jamCh(S);
    const rowY = c => g.y + g.h - (c + 0.5) * rh;
    // ---- the airwaves: a time × frequency grid ----
    S.rect(g.x, g.y, g.w * k1, g.h, { color: C.ink, w: iw * 0.5 });
    if (N <= 30) for (let c = 1; c < N; c++) S.line([[g.x, g.y + c * rh], [g.x + g.w * k1, g.y + c * rh]], { w: 0.7, color: C.soft, alpha: 0.3 * k1 });
    S.text("frequency ↑", g.x - lf * 0.4, g.y - lf * 0.5, { size: lf * 0.85, align: "left", color: C.soft, alpha: k1 });
    S.text("time →", g.x + g.w, g.y + g.h + lf * 1.15, { size: lf * 0.85, align: "right", color: C.soft, alpha: k1 });
    S.text(`${N} channels`, g.x, g.y + g.h + lf * 1.15, { size: lf * 0.85, align: "left", color: C.soft, alpha: k1 });
    // jammer: noise blasted on one channel
    const jy = rowY(J), jh = Math.max(rh, 5);
    ctx.save(); ctx.beginPath(); ctx.rect(g.x, jy - jh / 2, g.w * k1, jh); ctx.clip();
    for (let x = g.x - jh; x < g.x + g.w; x += 5) S.line([[x, jy + jh / 2], [x + jh, jy - jh / 2]], { w: 1.2, color: C.ink, alpha: 0.55 * k1 });
    ctx.restore();
    S.line([[g.x + g.w, jy], [g.x + g.w + lf * 0.6, jy]], { w: iw * 0.4, color: C.ink, alpha: k1 });
    S.text("jammer", g.x + g.w + lf * 0.8, jy + lf * 0.32, { size: lf * 0.9, align: "left", alpha: k1, weight: 500 });
    // ---- the hop staircase: each slot sits on the roll's channel ----
    let got = 0, lost = 0;
    if (k2 > 0) {
      const pts = [];
      for (let i = -1; i <= cols; i++) {
        const s = sNow - cols + 1 + i, x0 = g.x + (i + 1 - frac) * cw, x1 = x0 + cw;
        const c = this.chan(S, s), y = rowY(c), jam = c === J;
        const xa = Math.max(g.x, x0), xb = Math.min(g.x + g.w * k2, x1);
        if (xb <= xa) continue;
        pts.push([xa, y], [xb, y]);
        if (jam) { const xm = (xa + xb) / 2, r = Math.min(cw * 0.25, lf * 0.45); S.line([[xm - r, y - r], [xm + r, y + r]], { w: iw * 0.55, color: C.ink, alpha: k2 }); S.line([[xm - r, y + r], [xm + r, y - r]], { w: iw * 0.55, color: C.ink, alpha: k2 }); }
      }
      S.line(pts, { w: iw * 0.9, color: C.accent, alpha: k2 });
    }
    // ---- transmitter and receiver, each reading the same punched roll ----
    const ends = [[S.box.x + (g.x - S.box.x) * (side ? 0.45 : 0.58), "transmitter"], [g.x + g.w + (S.box.x + S.box.w - g.x - g.w) * 0.5, "receiver"]];
    const rw = Math.min(cw * 2.2, (g.x - S.box.x) * 0.55);
    ends.forEach(([cx, name], e) => {
      const rx = cx - rw / 2;
      // roll: the next few hops shown as holes in a paper strip
      S.rect(rx, g.y, rw, g.h, { color: C.ink, w: iw * 0.45, alpha: k1 });
      const headX = rx + rw * 0.2, hw = rw * 0.13, hh = Math.max(2.5, Math.min(rh * 0.6, lf * 0.6));
      for (let i = 0; i < 5; i++) {
        const s = sNow + i, yy = rowY(this.hop(s, N)), hx = headX + rw * 0.2 * (i - frac);
        if (hx < rx + hw * 0.6 || hx > rx + rw - hw * 0.6) continue;
        S.rect(hx - hw / 2, yy - hh / 2, hw, hh, { color: C.ink, fill: S.p.hopping ? C.ink : C.soft, w: 0, alpha: k1 * (S.p.hopping ? (i === 0 ? 1 : 0.75) : 0.3) });
      }
      // reading head: picks the channel for this hop
      const hy = S.p.hopping ? rowY(this.hop(sNow, N)) : rowY(J);
      S.line([[headX, g.y + 2], [headX, g.y + g.h - 2]], { w: iw * 0.35, color: C.accent, alpha: k1 * 0.6 });
      S.line([[e ? rx + rw : rx, hy], [e ? rx + rw + lf * 0.5 : rx - lf * 0.5, hy]], { w: iw * 0.6, color: C.accent, alpha: k1 });
      // antenna
      const ay = g.y + g.h + lf * (side ? 2.6 : 3.0);
      S.line([[cx, ay + lf * 1.3], [cx, ay]], { w: iw * 0.5, color: C.ink, alpha: k1 });
      S.line([[cx - lf * 0.45, ay - lf * 0.5], [cx, ay], [cx + lf * 0.45, ay - lf * 0.5]], { w: iw * 0.5, color: C.ink, alpha: k1 });
      S.text(name, cx, ay + lf * 2.4, { size: lf * 0.85, alpha: k1 });
    });
    S.text("same roll", ends[0][0], g.y - lf * 0.5, { size: lf * 0.8, color: C.soft, alpha: k1 });
    S.text("same roll", ends[1][0], g.y - lf * 0.5, { size: lf * 0.8, color: C.soft, alpha: k1 });
    // ---- the message: one letter per hop ----
    if (k2 > 0) {
      const L = side ? 14 : 22, mf = Math.min(lf * 1.05, (g.w * 1.1) / L / 0.62), x0 = g.x + g.w / 2 - (L * mf * 0.62) / 2;
      S.text("received:", x0 - mf * 0.5, msgY, { size: lf * 0.85, align: "right", color: C.soft, alpha: k2 });
      for (let i = 0; i < L; i++) {
        const s = sNow - L + 1 + i; if (s < 0) continue;
        const jam = this.chan(S, s) === J, ch = M[((s % M.length) + M.length) % M.length];
        if (jam) lost++; else got++;
        S.text(jam ? "×" : ch, x0 + (i + 0.5) * mf * 0.62, msgY, { size: mf, mono: true, italic: false, halo: false, color: jam ? C.soft : C.ink, alpha: k2 * (i === L - 1 ? Math.min(1, frac * 3) : 1) });
      }
    }
    // ---- the shared pseudo-random sequence, then and now ----
    if (k3 > 0) {
      const { x, y, w, h } = ai, af = fs * (side ? 0.78 : 0.9);
      const seq = []; for (let i = 0; i < (side ? 7 : 10); i++) seq.push(this.hop(sNow + i, 79));
      S.text(`seed 1942 → ${seq.join(", ")} …`, x + w * 0.5, y + af * 0.3, { size: af, mono: true, italic: false, color: C.accent, alpha: k3 });
      S.text(side ? "Bluetooth: 79 channels, 1,600 hops a second" : "Same seed, same sequence at both ends. Bluetooth hops 1,600 times a second", x + w * 0.5, y + af * 1.65, { size: af * 0.9, color: C.accent, alpha: k3 });
      S.text(side ? "carrying data to and from AI services" : "across 79 channels, carrying data between devices and AI services.", x + w * 0.5, y + af * 2.75, { size: af * 0.9, color: C.accent, alpha: k3 });
    }
    const tot = got + lost;
    return S.p.hopping ? `hopping over ${N} channels · ${got} of ${tot} letters got through · the jammer hits about 1 hop in ${N}` : `no hopping · jammer sits on our channel · ${got} of ${tot} letters got through`;
  },
  code(S) {
    const N = S.p.N | 0;
    return `${S.c("# frequency hopping with a shared pattern")}
channels = ${S.v(N)}
roll = Random(seed=1942)   ${S.c("# same roll in both ends")}
hopping = ${S.v(S.p.hopping ? "True" : "False")}

for letter in message:
    ch = roll.randint(0, channels - 1) if hopping else ${this.jamCh(S)}
    transmitter.send(letter, channel=ch)
    receiver.listen(channel=ch)  ${S.c("# in step with the sender")}
    if ch == jammer_channel:
        letter_lost()           ${S.c("# about 1 in " + (S.p.hopping ? N : 1))}`;
  },
});
