// Nikola Tesla — rotating magnetic field → phasor → AC sine wave → rotary position embedding (RoPE)
Lineage.scene({
  params: [
    { id: "theta", label: "θ: turn per word", type: "range", min: 0.15, max: 1.2, step: 0.01, value: 0.62, fmt: v => v.toFixed(2) + " rad" },
    { id: "speed", label: "Field speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    { id: "words", label: "Sentence (up to 8 words)", type: "text", value: "position is just a rotation" },
  ],
  layout(S) {
    const { P, box, narrow, W, H } = S;
    const c = P.head, r = 0.2 * P.s;
    const vp = narrow ? [W * 0.94, H * 0.05] : [box.x + box.w, c[1] - H * 0.02];
    let d = [vp[0] - c[0], vp[1] - c[1]]; const dl = Math.hypot(d[0], d[1]); d = [d[0] / dl, d[1] / dl];
    const n = [-d[1], d[0]], Sx = [c[0] + d[0] * r * 1.18, c[1] + d[1] * r * 1.18];
    const a0 = Math.atan2(-d[1], -d[0]) + 0.9;
    Object.assign(S.st, { c, r, vp, d, n, S0: Sx, a0 });
  },
  entry(S) { const { c, r, a0 } = S.st; return [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)]; },
  draw(S, k, ft) {
    const { c, r, d, n, vp, S0, a0 } = S.st, iw = S.iw, C = S.C, ctx = S.ctx;
    const K = 3.2, scr = u => (1 - 1 / (1 + K * u)) / (1 - 1 / (1 + K)), sc = u => 1 / (1 + K * u);
    const base = u => { const f = scr(u); return [S0[0] + (vp[0] - S0[0]) * f, S0[1] + (vp[1] - S0[1]) * f]; };
    const ph = ft * 1.4;
    const kh = S.ease(k / 0.35), kw = S.ease((k - 0.3) / 0.45), kr = S.ease((k - 0.6) / 0.4);
    // One travelling wave, one phase rule: phase(u) = ωt − κu. Words sit at evenly spaced depths Δu,
    // so neighbouring words differ by κΔu. Choose κ so that κΔu = θ + 2πj (j whole turns, purely so the
    // wave shows ~6 cycles): every arrow is then exactly m·θ apart (mod 2π) AND its tip height equals the wave.
    const words = String(S.p.words).trim().split(/\s+/).filter(Boolean).slice(0, 8);
    const M = Math.max(1, words.length), du = 0.92 / (M + 0.4), th = S.p.theta;
    const j = Math.max(0, Math.round((6 * 2 * Math.PI * du - th) / (2 * Math.PI)));
    const kwav = (th + 2 * Math.PI * j) / du;
    // halo: the rotating field, with the three phases of a polyphase supply
    S.circle(c[0], c[1], r, { w: iw * 0.85, a0, a1: a0 + kh * Math.PI * 2 });
    for (let j = 0; j < 3; j++) { const a = ph + (j * 2 * Math.PI) / 3; S.line([c, [c[0] + r * 0.82 * Math.cos(a), c[1] + r * 0.82 * Math.sin(a)]], { w: iw * 0.45, alpha: 0.35 * kh }); }
    if (kw > 0) {
      const ax = Math.cos(ph), ay = Math.sin(ph);
      const tip = [c[0] + r * (ax * d[0] + ay * n[0]), c[1] + r * (ax * d[1] + ay * n[1])];
      S.line([c, tip], { w: iw * 1.15 }); S.dot(tip[0], tip[1], iw * 1.5);
      S.line([tip, [S0[0] + n[0] * r * ay, S0[1] + n[1] * r * ay]], { w: iw * 0.55, dash: [iw * 1.6, iw * 1.8], alpha: 0.7 });
      S.line([S0, vp], { w: iw * 0.4, alpha: 0.35 });
      const N = 420, wp = [];
      for (let i = 0; i <= N; i++) { const u = (kw * i) / N, b = base(u), A = r * sc(u) * Math.sin(ph - kwav * u); wp.push([b[0] + n[0] * A, b[1] + n[1] * A, u]); }
      const col = S.mix(C.accent, C.paper, 0.45 * kr);
      for (let j = 0; j < wp.length - 1; j += 14) S.line(wp.slice(j, j + 15), { w: Math.max(0.8, iw * 1.25 * Math.sqrt(sc(wp[j][2]))), color: col });
      S.dot(vp[0], vp[1], iw * 1.2);
    }
    let rel = "";
    if (kr > 0 && words.length) {
      const hi = [Math.min(1, M - 1), M - 1];
      for (let m = 0; m < M; m++) {
        const u = (m + 0.6) * du, b = base(u), kk = sc(u);
        const ang = ph - kwav * u, len = r * kk;                    // same angle and radius as the wave at this depth
        const ex = b[0] + len * (Math.cos(ang) * d[0] + Math.sin(ang) * n[0]), ey = b[1] + len * (Math.cos(ang) * d[1] + Math.sin(ang) * n[1]);
        const wy = [b[0] + n[0] * len * Math.sin(ang), b[1] + n[1] * len * Math.sin(ang)];   // the wave's point at this depth
        const isHi = m === hi[0] || m === hi[1], col = isHi ? C.accent : C.ink;
        S.line([[ex, ey], wy], { w: iw * 0.45, dash: [iw * 1.2, iw * 1.4], color: col, alpha: 0.6 * kr });   // tip height = wave height
        S.arrow(b[0], b[1], ex, ey, { w: Math.max(1.4, iw * (isHi ? 1.35 : 1) * Math.sqrt(kk)), color: col, alpha: kr });
        S.dot(b[0], b[1], Math.max(2.2, iw * 1.3 * Math.sqrt(kk)), col, kr);
        S.dot(wy[0], wy[1], Math.max(1.8, iw * 0.9 * Math.sqrt(kk)), col, kr);
        const fsz = Math.max(12, S.fs * 1.3 * (0.6 + 0.4 * kk)), off = r * kk + fsz * 1.1;
        S.text(words[m], b[0] - n[0] * off * 0.2, b[1] + off, { size: fsz, color: col, weight: isHi ? 500 : 400, alpha: kr });
      }
      const gap = (hi[1] - hi[0]) * th;
      rel = `“${words[hi[0]]}” → “${words[hi[1]]}”: ${hi[1] - hi[0]}θ = ${gap.toFixed(2)} rad, constant while the field spins`;
    }
    return rel;
  },
  code(S) {
    const words = String(S.p.words).trim().split(/\s+/).filter(Boolean).slice(0, 8);
    return `${S.c("# rotary position embedding, one 2-D slice")}
θ = ${S.v(S.p.theta.toFixed(2))}
words = [${words.map(w => `"${w.replace(/</g, "")}"`).join(", ")}]

for m, word in enumerate(words):
    angle = ω*t - m*θ      ${S.c("# the field turns them all together")}
    q[m] = rotate(q[m], angle)
    ${S.c("# height of each arrow = the AC wave: sin(ωt − mθ)")}
${S.c("# gap between words m and n is always (n − m)·θ")}`;
  },
});
