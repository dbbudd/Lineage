// Ibn al-Haytham — the camera obscura (Book of Optics): straight rays from a candle cross at a pinhole
// and form an upside-down image; bigger hole = brighter but blurrier → the image as pixels read by a CNN
Lineage.scene({
  params: [
    { id: "hole", label: "Pinhole size", type: "range", min: 0.5, max: 25, step: 0.5, value: 6, fmt: v => v.toFixed(1) + " mm" },
    { id: "depth", label: "Room depth (hole to wall)", type: "range", min: 10, max: 40, step: 1, value: 26, fmt: v => v.toFixed(0) + " cm" },
    { id: "speed", label: "Light speed (slowed!)", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  DIST: 40,   // candle to pinhole, cm
  layout(S) {
    const { box, narrow } = S, w = box.w, h = box.h;
    let o;
    if (narrow) {
      const Hx = box.x + w * 0.4, Ox = box.x + w * 0.08;
      o = { Ox, Hx, Hy: box.y + h * 0.27, pxcm: (Hx - Ox) / this.DIST, Bh: h * 0.42,
        I: { x: box.x + w * 0.34, y: box.y + h * 0.64, w: w * 0.2, h: h * 0.31 },
        K: { x: box.x + w * 0.56, y: box.y + h * 0.64, w: w * 0.44, h: h * 0.31 } };
    } else {
      const Hx = box.x + w * 0.33, Ox = box.x + w * 0.06;
      o = { Ox, Hx, Hy: box.y + h * 0.3, pxcm: (Hx - Ox) / this.DIST, Bh: h * 0.4,
        I: { x: box.x + w * 0.74, y: box.y + h * 0.1, w: w * 0.22, h: h * 0.4 },
        K: { x: box.x + w * 0.3, y: box.y + h * 0.64, w: w * 0.7, h: h * 0.3 } };
    }
    o.cw = o.pxcm * 6; o.cTop = 4; o.cBot = 20; o.fC = -3.6; o.fR = 5; o.fW = 2.6; // candle geometry in cm (y down from axis)
    Object.assign(S.st, o);
  },
  entry(S) { const { Ox, Hy, pxcm } = S.st; return [Ox - pxcm * 3, Hy + pxcm * 12]; },
  // brightness of the candle seen face-on, at (x, y) cm from the axis (y down)
  bright(st, x, y, fl) {
    const fy = (y - st.fC * fl) / (st.fR * fl), fx = x / st.fW;
    if (fx * fx + fy * fy * (fy < 0 ? 0.55 : 1.6) < 1) return 1;
    if (y > st.cTop && y < st.cBot && Math.abs(x) < 3) return 0.3 + 0.12 * (1 - Math.abs(x) / 3);
    if (y > st.cBot && y < st.cBot + 1.2 && Math.abs(x) < 6.6) return 0.15;
    return 0;
  },
  // image on the back wall at (X, Y) cm: average over the pinhole's blur spot
  image(st, X, Y, m, spot, fl) {
    let s = 0; const ring = [[0, 0], [1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87]];
    for (const [a, b] of ring) s += this.bright(st, -(X + a * spot * 0.5) / m, -(Y + b * spot * 0.5) / m, fl);
    return s / ring.length;
  },
  draw(S, k, ft, dt) {
    const st = S.st, { Ox, Hx, Hy, pxcm, Bh, I, K } = st, iw = S.iw, C = S.C, fs = S.fs, nar = S.narrow, ctx = S.ctx;
    const k1 = S.ease(k / 0.32), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    const hole = S.p.hole, depth = S.p.depth, m = depth / this.DIST, spot = (hole / 10) * (1 + m); // spot in cm
    const fl = 1 + 0.07 * Math.sin(ft * 7.3) + 0.04 * Math.sin(ft * 12.1 + 1);
    const bright = Math.min(1, 0.15 + (hole / 7) ** 2 * 0.85);
    const Y = cm => Hy + cm * pxcm, Bx = Hx + depth * pxcm, top = Hy - Bh / 2, bot = Hy + Bh / 2, hp = Math.max(2, (hole / 10) * pxcm);

    // ---- the candle
    const cx = Ox, cw = st.cw / 2;
    S.line([[cx - cw, Y(st.cBot)], [cx - cw, Y(st.cTop)], [cx + cw, Y(st.cTop)], [cx + cw, Y(st.cBot)]], { w: iw * 0.8, color: C.ink, alpha: k1 });
    S.line([[cx - cw * 2.2, Y(st.cBot)], [cx + cw * 2.2, Y(st.cBot)]], { w: iw * 0.8, color: C.ink, alpha: k1 });
    const fpts = Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * 6.283, s = Math.sin(a), c = Math.cos(a); const ry = st.fR * fl * (c < 0 ? 1.35 : 0.8); return [cx + s * st.fW * pxcm * (c < 0 ? 0.75 : 1), Y(st.fC * fl - c * ry)]; });
    S.line(fpts, { w: iw * 0.8, color: C.ink, close: true, alpha: k1 });
    S.line([[cx, Y(st.cTop)], [cx, Y(st.cTop - 1.3)]], { w: iw * 0.6, color: C.ink, alpha: k1 });
    for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j - 2.5) * 0.45, r0 = st.fR * pxcm * 1.5, r1 = r0 + pxcm * 2.2 * (0.8 + 0.2 * Math.sin(ft * 5 + j)); S.line([[cx + Math.cos(a) * r0, Y(st.fC) + Math.sin(a) * r0], [cx + Math.cos(a) * r1, Y(st.fC) + Math.sin(a) * r1]], { w: iw * 0.4, color: C.soft, alpha: k1 }); }
    S.text("candle", cx, Y(st.cBot) + fs * 1.3, { size: fs * (nar ? 0.8 : 0.95), alpha: k1 });

    // ---- the dark room with a pinhole
    ctx.save(); ctx.globalAlpha = 0.09 * k1; ctx.fillStyle = C.ink; ctx.fillRect(Hx, top, Bx - Hx, Bh); ctx.restore();
    S.line([[Hx, Hy - hp / 2], [Hx, top], [Bx, top], [Bx, bot], [Hx, bot], [Hx, Hy + hp / 2]], { w: iw * 0.95, color: C.ink, alpha: k1 });
    S.text("pinhole", Hx, top - fs * 0.5, { size: fs * (nar ? 0.8 : 0.9), alpha: k1 });
    S.text("dark room", (Hx + Bx) / 2, bot + fs * 1.25, { size: fs * (nar ? 0.8 : 0.9), color: C.soft, alpha: k1 });

    // ---- straight rays through the hole
    const srcs = [[st.fC * fl - st.fR * fl * 1.35, 1], [st.fC * fl, 0.75], [st.cBot, 0.55]];
    if (k2 > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(Ox - fs, top - fs * 3, Bx - Ox + fs * 1.2, Bh + fs * 6); ctx.clip();
      for (const [yo, a] of srcs) {
        const yi = -yo * m;
        S.line([[Ox, Y(yo)], [Hx, Hy], [Bx, Y(yi)]], { w: iw * 0.6, color: C.accent, alpha: k2 * a });
        // the cone through the edges of the hole: this is the blur
        for (const e of [-1, 1]) { const ye = (e * hole) / 20; S.line([[Ox, Y(yo)], [Hx, Hy + ye * pxcm], [Bx, Y(ye + (ye - yo) * m)]], { w: iw * 0.3, color: C.accent, alpha: k2 * a * 0.45 }); }
        // light travelling: a dot running along each ray
        const u = (ft * 0.45 + a) % 1, L1 = Math.hypot(Hx - Ox, Hy - Y(yo)), L2 = Math.hypot(Bx - Hx, Y(yi) - Hy), d = u * (L1 + L2);
        const p = d < L1 ? [Ox + (Hx - Ox) * (d / L1), Y(yo) + (Hy - Y(yo)) * (d / L1)] : [Hx + (Bx - Hx) * ((d - L1) / L2), Hy + (Y(yi) - Hy) * ((d - L1) / L2)];
        S.dot(p[0], p[1], iw * 0.9, C.accent, k2 * a);
      }
      ctx.restore();
      // the image on the back wall, seen side-on: a bright, smeared strip
      const yA = -srcs[0][0] * m, yB = -st.cBot * m, sp = spot * pxcm / 2;
      S.line([[Bx - iw * 1.3, Math.max(top, Y(yB) - sp)], [Bx - iw * 1.3, Math.min(bot, Y(yA) + sp)]], { w: iw * 1.5, color: C.accent, alpha: k2 * bright });
      if (!nar) S.text("upside-down image", Bx + fs * 0.4, Y(yA) + fs * 0.3, { size: fs * 0.85, align: "left", color: C.accent, alpha: k2 });
    }

    // ---- the back wall seen face-on
    let fill = "";
    if (k2 > 0) {
      const cmPx = I.h / 32, Y0 = -4, nX = nar ? 24 : 36;
      const coarse = k3 > 0.5, gx = nar ? 8 : 12, gy = Math.round(gx * I.h / I.w), sub = Math.max(2, Math.round(nX / gx));
      // fine image first; coarse pixels are averages of it (as a sensor would collect)
      const FX = gx * sub, FY = gy * sub, fcw = I.w / FX, fch = I.h / FY, fine = new Float32Array(FX * FY);
      for (let j = 0; j < FY; j++) for (let i = 0; i < FX; i++) {
        const X = ((i + 0.5) * fcw - I.w / 2) / cmPx, Yc = ((j + 0.5) * fch - I.h / 2) / cmPx + Y0;
        fine[j * FX + i] = this.image(st, X, Yc, m, spot, fl) * bright;
      }
      const NX = coarse ? gx : FX, NY = coarse ? gy : FY, cwp = I.w / NX, chp = I.h / NY, px = [];
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        if (!coarse) { px.push(fine[j * FX + i]); continue; }
        let a = 0; for (let b = 0; b < sub; b++) for (let c = 0; c < sub; c++) a += fine[(j * sub + b) * FX + i * sub + c];
        px.push(a / (sub * sub));
      }
      ctx.save(); ctx.globalAlpha = k2; ctx.fillStyle = S.mix(C.ink, C.paper, 0.12); ctx.fillRect(I.x, I.y, I.w, I.h);
      ctx.fillStyle = C.paper;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const v = px[j * NX + i]; if (v > 0.01) { ctx.globalAlpha = k2 * Math.min(1, v); ctx.fillRect(I.x + i * cwp, I.y + j * chp, cwp + 0.5, chp + 0.5); } }
      ctx.restore();
      if (coarse) {
        ctx.save(); ctx.strokeStyle = C.accent; ctx.globalAlpha = 0.55 * k3; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i <= NX; i++) { ctx.moveTo(I.x + i * cwp, I.y); ctx.lineTo(I.x + i * cwp, I.y + I.h); }
        for (let j = 0; j <= NY; j++) { ctx.moveTo(I.x, I.y + j * chp); ctx.lineTo(I.x + I.w, I.y + j * chp); }
        ctx.stroke(); ctx.restore();
        st.px = { v: px, NX, NY };
      }
      S.rect(I.x, I.y, I.w, I.h, { w: iw * 0.6, color: C.ink, alpha: k2 });
      S.text(coarse ? "as pixels" : nar ? "back wall" : "back wall, face-on", I.x + I.w / 2, I.y - fs * 0.5, { size: fs * (nar ? 0.75 : 0.9), color: coarse ? C.accent : C.ink, alpha: k2 });
      if (!nar) { const yA = Y(-srcs[0][0] * m); S.line([[Bx + iw * 2, Hy], [I.x - iw * 3, I.y + I.h / 2]], { w: iw * 0.35, color: C.soft, dash: [iw, iw * 1.4], alpha: k2 }); }
      fill = `image ${(m * 24).toFixed(0)} cm tall · blur spot ${(spot * 10).toFixed(1)} mm · brightness ${Math.round(bright * 100)}%`;
    }

    // ---- a convolutional network reads the pixels
    if (k3 > 0.5 && st.px) {
      const a = S.ease((k3 - 0.5) / 0.5), { v, NX, NY } = st.px, cwp = I.w / NX, chp = I.h / NY;
      const ker = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const FX = NX - 2, FY = NY - 2, cells = FX * FY, cur = Math.floor((ft * 9) % cells), ci = cur % FX, cj = Math.floor(cur / FX);
      // sliding 3×3 window on the pixels
      S.rect(I.x + ci * cwp, I.y + cj * chp, cwp * 3, chp * 3, { w: iw * 0.8, color: C.accent, alpha: a });
      // feature map: response of a vertical-edge filter
      const fmH = K.h * 0.82, fcs = Math.min(fmH / FY, (K.w * 0.3) / FX), fx0 = nar ? K.x + K.w * 0.04 : K.x + K.w * 0.12, fy0 = K.y + (K.h - fcs * FY) / 2 + fs * 0.3;
      ctx.save(); ctx.fillStyle = C.accent;
      for (let j = 0; j < FY; j++) for (let i = 0; i < FX; i++) {
        let s = 0; for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) s += ker[b][c] * v[(j + b) * NX + i + c];
        const idx = j * FX + i, on = idx <= cur || st.fmDone;
        if (on) { ctx.globalAlpha = a * Math.min(1, Math.abs(s) / 2.2); ctx.fillRect(fx0 + i * fcs, fy0 + j * fcs, fcs - 0.6, fcs - 0.6); }
      }
      ctx.restore();
      if (cur === cells - 1) st.fmDone = true;
      S.rect(fx0, fy0, fcs * FX, fcs * FY, { w: iw * 0.5, color: C.accent, alpha: a });
      S.text(nar ? "edge filter" : "feature map (edge filter)", fx0 + (fcs * FX) / 2, fy0 - fs * 0.45, { size: fs * (nar ? 0.72 : 0.85), color: C.accent, alpha: a });
      // link the window to its output cell
      if (!nar) S.line([[I.x + (ci + 1.5) * cwp, I.y + (cj + 3) * chp], [fx0 + (ci + 0.5) * fcs, fy0 + (cj + 0.5) * fcs]], { w: iw * 0.35, color: C.accent, alpha: 0.6 * a });
      // more layers → a label
      const lx = fx0 + fcs * FX + fs * 0.8, ly = fy0 + (fcs * FY) / 2;
      let ox = lx + fs * 0.4;
      if (!nar) { for (let j = 0; j < 3; j++) S.rect(lx + j * fs * 0.55, ly - fcs * FY * 0.32 + j * fs * 0.3, fcs * FX * 0.35, fcs * FY * 0.64 - j * fs * 0.6, { w: iw * 0.45, color: C.accent, alpha: a * (0.9 - j * 0.2) }); ox = lx + fcs * FX * 0.35 + fs * 1.6; }
      S.arrow(ox - fs * 0.4, ly, ox + fs * 0.7, ly, { w: iw * 0.6, color: C.accent, alpha: a });
      S.text("“candle”", ox + fs * 0.95, ly + fs * 0.32, { size: fs * (nar ? 0.85 : 1.05), align: "left", color: C.accent, weight: 500, alpha: a });
      S.text(nar ? "CNN" : "convolutional neural network", nar ? ox + fs * 2.4 : lx + fs * 2.4, ly + (nar ? fs * 1.6 : fcs * FY * 0.5 + fs * 1.5), { size: fs * (nar ? 0.8 : 0.95), color: C.accent, alpha: a });
    } else st.fmDone = false;
    return fill || "light travels in straight lines";
  },
  code(S) {
    const m = S.p.depth / this.DIST, spot = (S.p.hole / 10) * (1 + m);
    return `${S.c("# camera obscura: light runs in straight lines")}
hole  = ${S.v(S.p.hole.toFixed(1))}          ${S.c("# mm")}
depth = ${S.v(S.p.depth.toFixed(0))}           ${S.c("# cm, pinhole to back wall")}
dist  = ${this.DIST}           ${S.c("# cm, candle to pinhole")}

m = depth / dist             ${S.c(`# = ${m.toFixed(2)}`)}
for (x, y) in candle_points:
    image[-x*m, -y*m] += light(x, y)   ${S.c("# minus: upside down")}
spot = hole * (1 + m)        ${S.c(`# blur = ${(spot * 10).toFixed(1)} mm`)}
brightness ∝ hole ** 2

${S.c("# a CNN slides small filters over the pixels")}
feature[i, j] = sum(kernel * pixels[i:i+3, j:j+3])`;
  },
});
