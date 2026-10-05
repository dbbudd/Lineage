// Chien-Shiung Wu — aligned cobalt-60 emits beta electrons opposite its spin; the mirror image disagrees → parity violation → equivariant networks
(function () {
  const ALIGN_T = 0.0025; // K: alignment P = tanh(ALIGN_T / T), a simple stand-in for nuclear polarisation
  const ASYM = 0.6;       // electron speed factor v/c in W(θ) = 1 − (v/c)·P·cos θ
  const align = T => Math.tanh(ALIGN_T / T);

  Lineage.scene({
    params: [
      { id: "logT", label: "Temperature of the cobalt", type: "range", min: -2.75, max: -0.7, step: 0.01, value: -2.52, fmt: v => (Math.pow(10, v) * 1000).toFixed(Math.pow(10, v) < 0.01 ? 1 : 0) + " mK" },
      { id: "flip", label: "Flip the magnetic field", type: "toggle", value: false },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { S.st.parts = []; S.st.cnt = [0, 0]; S.st.rng = S.rng(1957); S.st.acc = 0; S.st.tot = [0, 0]; },
    reset(S) { S.st.parts = []; S.st.cnt = [0, 0]; S.st.tot = [0, 0]; },
    onParam(S, id) { if (id !== "speed") { S.st.cnt = [0, 0]; S.st.tot = [0, 0]; } },
    layout(S) {
      const b = S.box, st = S.st, nar = S.narrow, fs = S.fs;
      const avail = b.h * (nar ? 0.67 : 0.68), pw = b.w * 0.5, mx = b.x + b.w * 0.5;
      const R = Math.max(20, Math.min(pw * 0.34, (avail - fs * 4.2) / 2.3));
      const titleY = b.y + fs * 1.0, cy = titleY + fs * 0.8 + R * 1.15;
      const botY = cy + R * 1.1, verdY = botY + fs * 1.9, topH = verdY + fs * 0.5 - b.y;
      st.g = { mx, cy, R, topH, titleY, botY, verdY, L: mx - pw * 0.5, Rx: mx + pw * 0.5, top: b.y, nr: Math.max(5, R * 0.13) };
      st.strip = { y: b.y + topH + (b.h - topH) * 0.48, h: b.h - topH };
    },
    entry(S) { const g = S.st.g; return [g.L - g.R * 0.42, g.cy + g.R * 0.33]; },
    draw(S, k, ft, dt) {
      const st = S.st, g = st.g, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, b = S.box;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const T = Math.pow(10, S.p.logT), P = align(T), spin = S.p.flip ? -1 : 1; // spin +1 = up on screen
      const cx = g.L, cy = g.cy, R = g.R, nr = g.nr;
      // ---- simulate electrons (in the real experiment's frame; the mirror panel reflects them)
      const sdt = dt * (S.p.speed ?? 1);
      if (k1 > 0.5 && sdt > 0) {
        st.acc += sdt * 55;
        while (st.acc >= 1) {
          st.acc -= 1;
          let th, guard = 0; // sample θ (from "up") with W ∝ 1 − v/c · P · cos(θ − spin axis)
          do { th = st.rng() * Math.PI * 2; guard++; } while (st.rng() * (1 + ASYM * P) > 1 - ASYM * P * spin * Math.cos(th) && guard < 40);
          st.parts.push({ th, r: nr, done: false });
        }
      }
      for (const p of st.parts) p.r += sdt * R * 1.6;
      st.cnt[0] *= Math.exp(-sdt / 10); st.cnt[1] *= Math.exp(-sdt / 10);
      for (const p of st.parts) if (!p.done && p.r >= R) {
        p.done = true; const c = Math.cos(p.th);
        if (c > 0.82) { st.cnt[0]++; st.tot[0]++; } else if (c < -0.82) { st.cnt[1]++; st.tot[1]++; }
      }
      st.parts = st.parts.filter(p => p.r < R * 1.08);
      // ---- one panel: coil, nucleus, spin, electrons, counters. m = +1 real, −1 mirror (drawn reflected about the mirror line)
      const panel = (m, alpha) => {
        const X = x => g.mx + m * (x - g.mx), ox = X(cx);
        // solenoid loops with current arrows (they reflect, so the current runs the other way in the mirror)
        for (const dy of [-0.55, 0, 0.55]) {
          const y = cy + dy * R * 0.6;
          ctx.save(); ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = C.soft; ctx.lineWidth = iw * 0.45;
          ctx.beginPath(); ctx.ellipse(ox, y, R * 0.42, R * 0.1, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          const dir = spin * m; // current direction on the front of the loop
          S.arrow(ox - dir * R * 0.12, y + R * 0.1, ox + dir * R * 0.12, y + R * 0.1, { w: iw * 0.45, color: C.soft, alpha, head: Math.max(6, iw * 2.6) });
        }
        // field and spin follow the right-hand rule from the (reflected) current, so they point the other way in the mirror
        const ax = spin * m;
        S.arrow(ox + m * R * 0.62, cy + ax * R * 0.45, ox + m * R * 0.62, cy - ax * R * 0.45, { w: iw * 0.55, color: C.soft, alpha });
        S.text("B", ox + m * (R * 0.62 + fs * 0.35), cy + fs * 0.3, { size: fs * 0.85, color: C.soft, alpha, align: m > 0 ? "left" : "right" });
        S.text("Co-60", ox - m * R * 0.48, cy - R * 0.62, { size: fs * 0.78, color: C.soft, alpha, align: m > 0 ? "right" : "left" });
        // electrons
        for (const p of st.parts) {
          const r0 = Math.max(nr, p.r - R * 0.16), sx = m * Math.sin(p.th), sy = -Math.cos(p.th);
          S.line([[ox + r0 * sx, cy + r0 * sy], [ox + p.r * sx, cy + p.r * sy]], { w: Math.max(1.4, iw * 0.55), color: C.ink, alpha: alpha * 0.8 * Math.min(1, (R * 1.08 - p.r) / (R * 0.25)) });
        }
        // nucleus with its spin
        S.circle(ox, cy, nr, { w: iw * 0.8, color: C.ink, fill: C.paper, alpha });
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.6;
        const sw = ax > 0 ? 1 : -1; // curl arrow: front of the ring moves +x for spin up in the real panel
        ctx.beginPath(); ctx.ellipse(ox, cy, nr * 2.1, nr * 0.7, 0, 0.25, Math.PI - 0.25); ctx.stroke(); ctx.restore();
        const hx = ox + m * spin * nr * 1.75; // arrow head at the front of the curl, direction set by the reflected rotation
        S.arrow(hx - m * spin * nr * 0.9, cy + nr * 0.66, hx, cy + nr * 0.4, { w: iw * 0.6, color: C.ink, alpha, head: Math.max(6, iw * 2.4) });
        S.arrow(ox, cy + ax * nr * 0.9, ox, cy - ax * nr * 3.4, { w: iw * 1.1, color: C.ink, alpha });
        S.text("spin", ox, cy - ax * nr * 3.4 + (ax > 0 ? -fs * 0.35 : fs * 0.95), { size: fs * 0.8, alpha });
        // counters above and below
        const cw = R * 0.5, chh = Math.max(4, R * 0.07);
        for (const [i, sy] of [[0, -1], [1, 1]]) {
          const y = cy + sy * R * 1.1;
          S.rect(ox - cw / 2, sy < 0 ? y - chh : y, cw, chh, { w: iw * 0.5, color: C.ink, fill: C.paper, alpha });
        }
        void sw;
      };
      if (k1 > 0) {
        panel(1, k1);
        S.text("experiment", cx, g.titleY, { size: fs * 1.0, alpha: k1 });
      }
      // ---- beat 2: the mirror and the counts
      const tot = st.cnt[0] + st.cnt[1] || 1, upF = st.cnt[0] / tot;
      const against = spin > 0 ? 1 - upF : upF; // fraction going against the spin in the real world
      if (k2 > 0) {
        S.line([[g.mx, g.top + fs * 0.2], [g.mx, g.verdY - fs * 1.2]], { w: iw * 0.5, color: C.ink, dash: [iw * 2, iw * 1.5], alpha: k2 });
        if (!S.narrow) S.text("mirror", g.mx, g.verdY - fs * 0.2, { size: fs * 0.8, color: C.soft, alpha: k2 });
        panel(-1, k2);
        S.text("mirror image", g.Rx, g.titleY, { size: fs * 1.0, alpha: k2 });
        // count bars beside each counter: real and mirror share the same up/down counts
        const bw = g.R * 0.9;
        for (const m of [1, -1]) {
          const ox = m > 0 ? cx : g.Rx;
          for (const [i, sy] of [[0, -1], [1, 1]]) {
            const y = cy + sy * g.R * 1.1 + (sy < 0 ? -g.R * 0.035 : g.R * 0.035) + fs * 0.28, f = (i ? 1 - upF : upF);
            const along = (i === 0) === ((m > 0 ? spin : -spin) > 0);
            const side = S.narrow ? -m : m;
            S.text(`${Math.round(f * 100)}% ${along ? "with spin" : "against"}`, ox + side * (g.R * 0.25 + fs * 0.3), y, { size: fs * (S.narrow ? 0.72 : 0.78), align: side > 0 ? "left" : "right", alpha: k2, weight: (m > 0) !== along ? 600 : 400 });
          }
        }
        void bw;
        // verdict
        const ok = against > 0.53, vy = g.verdY;
        if (P > 0.12 && st.tot[0] + st.tot[1] > 12) {
          S.text("✓ what cobalt does", cx, vy, { size: fs * 0.85, color: C.accent, alpha: k2 * (ok ? 1 : 0.4) });
          S.text("✗ never observed", g.Rx, vy, { size: fs * 0.85, color: C.accent, alpha: k2 * (ok ? 1 : 0.4) });
        } else {
          S.text("too warm: no alignment, no difference", g.mx, vy, { size: fs * 0.85, color: C.soft, alpha: k2 });
        }
      }
      // ---- beat 3: symmetry built into a network (equivariance)
      if (k3 > 0) {
        const Y = st.strip.y, sh = st.strip.h, x0 = b.x + b.w * 0.04, x1 = b.x + b.w * 0.96, w = x1 - x0;
        const r = Math.min(sh * 0.28, w * 0.09), ang = ft * 0.5;
        const mol = [[0, 0], [1, 0.15], [-0.55, 0.85], [-0.45, -0.9]], frc = [[0.2, 0.1], [0.7, 0.45], [-0.5, 0.3], [0.1, -0.6]];
        const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
        const drawMol = (mx, a, out) => {
          const P2 = mol.map(p => { const q = rot(p, a); return [mx + q[0] * r, Y + q[1] * r]; });
          for (let i = 1; i < P2.length; i++) S.line([P2[0], P2[i]], { w: iw * 0.6, color: C.ink, alpha: k3 });
          P2.forEach((q, i) => S.circle(q[0], q[1], Math.max(3, r * (i ? 0.13 : 0.18)), { w: iw * 0.6, color: C.ink, fill: C.paper, alpha: k3 }));
          if (out) P2.forEach((q, i) => { const f = rot(frc[i], a); S.arrow(q[0], q[1], q[0] + f[0] * r * 0.9, q[1] + f[1] * r * 0.9, { w: iw * 0.75, color: C.accent, alpha: k3, head: Math.max(6, iw * 2.4) }); });
        };
        const mA = x0 + w * 0.12, mB = x0 + w * 0.88, nx0 = x0 + w * 0.32, nx1 = x0 + w * 0.68;
        drawMol(mA, ang, false);
        if (!S.narrow) S.text("any angle in", mA, Y + r * 1.25 + fs * 0.9, { size: fs * 0.78, color: C.soft, alpha: k3 });
        // network: three columns of nodes
        const cols = [3, 4, 3], nodes = cols.map((n, c) => Array.from({ length: n }, (_, i) => [nx0 + ((c + 0.5) / 3) * (nx1 - nx0), Y + (i - (n - 1) / 2) * Math.min(sh * (S.narrow ? 0.15 : 0.2), r * 0.75)]));
        for (let c = 0; c < 2; c++) for (const a of nodes[c]) for (const q of nodes[c + 1]) S.line([a, q], { w: iw * 0.25, color: C.accent, alpha: 0.45 * k3 });
        for (const col of nodes) for (const q of col) S.circle(q[0], q[1], Math.max(3, iw * 1.1), { w: iw * 0.6, color: C.accent, fill: C.paper, alpha: k3 });
        S.arrow(mA + r * 1.2, Y, nx0 - fs * 0.2, Y, { w: iw * 0.7, color: C.accent, alpha: k3 });
        S.arrow(nx1 + fs * 0.2, Y, mB - r * 1.3, Y, { w: iw * 0.7, color: C.accent, alpha: k3 });
        S.text("equivariant network", (nx0 + nx1) / 2, Y - Math.min(sh * (S.narrow ? 0.15 : 0.2), r * 0.75) * 2 - fs * 0.4, { size: fs * 0.9, color: C.accent, alpha: k3 });
        drawMol(mB, ang, true);
        if (!S.narrow) S.text("outputs turn with it", mB, Y + r * 1.25 + fs * 0.9, { size: fs * 0.78, color: C.accent, alpha: k3 });
        if (!S.narrow) S.text("shared idea, not direct descent", (nx0 + nx1) / 2, Y + Math.min(sh * (S.narrow ? 0.15 : 0.2), r * 0.75) * 2 + fs * 1.1, { size: fs * 0.75, color: C.soft, alpha: k3 });
      }
      return `T = ${(T * 1000).toFixed(T < 0.01 ? 1 : 0)} mK · alignment ${Math.round(P * 100)}% · ${Math.round(against * 100)}% of counted electrons go against the spin (parity would need 50%)`;
    },
    code(S) {
      const T = Math.pow(10, S.p.logT), P = align(T), spin = S.p.flip ? -1 : 1;
      return `${S.c("# Wu experiment: beta decay of aligned cobalt-60")}
T = ${S.v(T.toFixed(4))}                  ${S.c("# kelvin")}
P = alignment(T)              ${S.c("# " + P.toFixed(2) + ": fraction of nuclei lined up")}
spin = ${S.v(spin > 0 ? "+1" : "-1")}                   ${S.c("# set by the field direction")}

for e in decays:
    ${S.c("# θ = angle from the spin axis")}
    weight = 1 - ${ASYM} * P * cos(θ)  ${S.c("# favours θ = 180°")}
    count(e, weight)

mirror: spin = -spin, electrons unchanged
parity_holds = (up_count == down_count)   ${S.c("# " + (P > 0.12 ? "False" : "≈ True when warm"))}`;
    },
  });
})();
