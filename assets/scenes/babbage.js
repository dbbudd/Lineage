// Charles Babbage — Difference Engine: columns of figure wheels tabulate a polynomial by repeated addition → printed table → the Analytical Engine (store, mill, cards)
Lineage.scene({
  params: [
    { id: "a", label: "a: x² coefficient", type: "range", min: 0, max: 9, step: 1, value: 1, fmt: v => String(v) },
    { id: "b", label: "b: x coefficient", type: "range", min: 0, max: 9, step: 1, value: 1, fmt: v => String(v) },
    { id: "c", label: "c: constant", type: "range", min: 0, max: 99, step: 1, value: 41, fmt: v => String(v) },
    { id: "speed", label: "Crank speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  init(S) { S.st.tt = 0; },
  reset(S) { S.st.tt = 0; },
  onParam(S, id) { if (id !== "speed") S.st.tt = 0; },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15, fs = S.fs;
    const eng = side ? { x: b.x + b.w * 0.02, y: b.y + b.h * 0.1, w: b.w * 0.56, h: b.h * 0.56 } : { x: b.x + b.w * 0.02, y: b.y + b.h * 0.07, w: b.w * 0.6, h: b.h * 0.56 };
    const tab = side ? { x: b.x + b.w * 0.66, y: b.y + b.h * 0.02, w: b.w * 0.32, h: b.h * 0.7 } : { x: b.x + b.w * 0.7, y: b.y + b.h * 0.02, w: b.w * 0.28, h: b.h * 0.66 };
    const ae = side ? { x: b.x, y: b.y + b.h * 0.83, w: b.w, h: b.h * 0.17 } : { x: b.x, y: b.y + b.h * 0.78, w: b.w, h: b.h * 0.2 };
    const ND = 5, colW = eng.w / 3;
    const wh = Math.min(eng.h / ND, colW * 0.62), ww = Math.min(colW * 0.42, wh * 1.05);
    const cols = [0, 1, 2].map(i => eng.x + colW * (i + 0.5));
    const top = eng.y + (eng.h - wh * ND) / 2;
    Object.assign(S.st, { side, eng, tab, ae, ND, wh, ww, cols, top, dsz: Math.min(wh * 0.62, fs * 1.4) });
  },
  entry(S) { const { eng, top, wh, ND } = S.st; return S.narrow ? [eng.x, top + wh * ND + wh * 0.35] : [eng.x, top - wh * 0.35]; },
  vals(S, n) {
    const a = S.p.a | 0, b = S.p.b | 0, c = S.p.c | 0, f = x => a * x * x + b * x + c;
    return [f(n), f(n + 1) - f(n), 2 * a];
  },
  draw(S, k, ft, dt) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs, ctx = S.ctx;
    const { eng, tab, ae, ND, wh, ww, cols, top, dsz, side } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    st.tt += (dt || 0) * (S.p.speed ?? 1) * (k > 0.15 ? 1 : 0);
    const T = 2, NMAX = 24;
    let n = Math.floor(st.tt / T); const u = st.tt / T - n;
    if (n >= NMAX) { st.tt = 0; n = 0; }
    const [f0, d0, e0] = this.vals(S, n), [f1, d1] = this.vals(S, n + 1);
    const dig = (v, i) => Math.floor(Math.abs(v) / Math.pow(10, i)) % 10;
    const ph = (a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
    // phases: f += Δ¹ (add, carry), then Δ¹ += Δ² (add, carry), then print
    const pA1 = ph(0.06, 0.26), pC1 = ph(0.28, 0.4), pA2 = ph(0.48, 0.68), pC2 = ph(0.7, 0.82), pPrint = ph(0.84, 0.96);
    // per-column wheel positions (fractional digits) and carry flags
    function rolled(dst, src, pa, pc) {
      const out = [], carries = [];
      for (let i = 0; i < ND; i++) {
        const d = dig(dst, i), s = dig(src, i), mid = (d + s) % 10, fin = dig(dst + src, i);
        const step1 = s, step2 = (fin - mid + 10) % 10;
        out.push(d + step1 * S.ease(pa) + step2 * S.ease(pc));
        const pw = Math.pow(10, i + 1); carries.push((dst % pw) + (src % pw) >= pw);
      }
      return { pos: out, carries };
    }
    const colF = rolled(f0, d0, pA1, pC1), colD = rolled(d0, e0, pA2, pC2);
    const colE = { pos: [...Array(ND)].map((_, i) => dig(e0, i)), carries: [] };
    const columns = [colF, colD, colE];
    const names = ["table", "1st diff.", "2nd diff."], syms = ["f(x)", "Δ¹", "Δ²"];
    // ---- frame of the engine ----
    const al = k1, y0 = top - wh * 0.35, y1 = top + wh * ND + wh * 0.35;
    S.line([[eng.x, y0], [eng.x + eng.w * k1, y0]], { w: iw * 0.6, color: C.ink });
    S.line([[eng.x + eng.w * (1 - k1), y1], [eng.x + eng.w, y1]], { w: iw * 0.6, color: C.ink });
    for (let c = 0; c < 3; c++) {
      const cx = cols[c];
      for (let i = 0; i <= ND; i++) { const ya = i === 0 ? y0 : top + wh * i - wh * 0.12, yb = i === ND ? y1 : top + wh * i + wh * 0.12; S.line([[cx, ya], [cx, yb]], { w: iw * 0.5, color: C.ink, alpha: al }); }
      const active = (c === 0 && (pA1 > 0 && pC1 < 1)) || (c === 1 && pA2 > 0 && pC2 < 1);
      for (let i = 0; i < ND; i++) {
        const wy = top + wh * (ND - 1 - i), cy = wy + wh / 2;
        // the wheel: a drum seen side-on, with its digit showing in the window
        S.line([[cx - ww / 2, wy + wh * 0.12], [cx + ww / 2, wy + wh * 0.12]], { w: iw * 0.4, color: C.ink, alpha: al });
        S.line([[cx - ww / 2, wy + wh * 0.88], [cx + ww / 2, wy + wh * 0.88]], { w: iw * 0.4, color: C.ink, alpha: al });
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx - ww / 2, cy, ww * 0.12, wh * 0.38, 0, Math.PI / 2, Math.PI * 1.5); ctx.ellipse(cx + ww / 2, cy, ww * 0.12, wh * 0.38, 0, -Math.PI / 2, Math.PI / 2);
        ctx.globalAlpha = al; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.5; ctx.stroke(); ctx.restore();
        const pos = columns[c].pos[i], d = Math.floor(pos), fr = pos - d;
        ctx.save(); ctx.beginPath(); ctx.rect(cx - ww / 2, wy + wh * 0.14, ww, wh * 0.72); ctx.clip();
        for (const [dd, off] of [[d, -fr], [d + 1, 1 - fr]]) {
          S.text(String(((dd % 10) + 10) % 10), cx, cy + dsz * 0.36 - off * wh * 0.62, { size: dsz, mono: true, italic: false, halo: false, color: active ? C.accent : C.ink, alpha: al, weight: 500 });
        }
        ctx.restore();
      }
      S.text(syms[c], cx, y0 - fs * 0.5, { size: fs * (side ? 0.95 : 1.05), alpha: al, italic: false, weight: 500 });
      S.text(names[c], cx, y1 + fs * 1.15, { size: fs * 0.8, alpha: al, color: C.soft });
    }
    // carries: little accent hooks from a wheel that passed 9 to the one above
    const carryArrows = (col, cx, pc) => {
      if (pc <= 0 || pc >= 1) return;
      for (let i = 0; i < ND - 1; i++) if (col.carries[i]) {
        const yA = top + wh * (ND - 1 - i) + wh * 0.3, yB = yA - wh * 0.6, x = cx + ww * 0.62;
        S.arrow(x, yA, x, yB, { w: iw * 0.5, head: iw * 2.2, alpha: Math.sin(pc * Math.PI) });
      }
      S.text("carry", cx + ww * 0.7, top - wh * 0.15 + wh * ND + fs * 0.1, { size: fs * 0.7, color: C.accent, align: "left", alpha: Math.sin(pc * Math.PI) });
    };
    carryArrows(colF, cols[0], pC1); carryArrows(colD, cols[1], pC2);
    // the add arrows between columns
    const addArrow = (from, to, pa, pc) => {
      const on = pa > 0 && pc < 1, ya = top - wh * 0.05;
      const xa = cols[from] - ww * 0.55, xb = cols[to] + ww * 0.6;
      if (k2 <= 0) return;
      S.arrow(xa, ya, xb, ya, { w: iw * (on ? 0.7 : 0.4), color: on ? C.accent : C.soft, alpha: k2, head: iw * 2.4 });
      S.text("+", (xa + xb) / 2, ya - fs * 0.25, { size: fs * 1.1, color: on ? C.accent : C.soft, alpha: k2, italic: false, weight: 600 });
    };
    addArrow(1, 0, pA1, pC1); addArrow(2, 1, pA2, pC2);
    // ---- the printed table, with primes marked ----
    let primes = 0, shown = 0;
    if (k2 > 0) {
      const a = S.p.a | 0, b = S.p.b | 0, c = S.p.c | 0, f = x => a * x * x + b * x + c;
      const isP = v => { if (v < 2) return false; for (let d = 2; d * d <= v; d++) if (v % d === 0) return false; return true; };
      const rh = fs * (side ? 1.05 : 1.25), maxRows = Math.max(3, Math.floor((tab.h - rh * 2.2) / rh));
      const last = n + (pPrint > 0 ? 1 : 0), first = Math.max(0, last - maxRows + 1);
      const xL = tab.x + tab.w * 0.18, xR = tab.x + tab.w * 0.78;
      S.text("x", xL, tab.y + rh, { size: fs * 0.85, color: C.soft, alpha: k2 });
      S.text("f(x)", xR, tab.y + rh, { size: fs * 0.85, color: C.soft, alpha: k2, align: "right" });
      S.line([[tab.x, tab.y + rh * 1.35], [tab.x + tab.w, tab.y + rh * 1.35]], { w: iw * 0.35, color: C.ink, alpha: k2 });
      S.line([[tab.x, tab.y], [tab.x, tab.y + tab.h]], { w: iw * 0.3, color: C.soft, alpha: k2 * 0.7 });
      S.line([[tab.x + tab.w, tab.y], [tab.x + tab.w, tab.y + tab.h]], { w: iw * 0.3, color: C.soft, alpha: k2 * 0.7 });
      for (let x = 0; x <= last; x++) if (isP(f(x))) primes++;
      for (let x = first; x <= last; x++) {
        const y = tab.y + rh * (2.3 + x - first), al2 = k2 * (x === last && pPrint > 0 ? pPrint : 1), v = f(x), p = isP(v);
        S.text(String(x), xL, y, { size: fs * 0.9, mono: true, italic: false, alpha: al2, halo: false });
        S.text(String(v % 100000), xR, y, { size: fs * 0.9, mono: true, italic: false, alpha: al2, align: "right", halo: false, color: p ? C.accent : C.ink });
        if (p) S.dot(xR + fs * 0.6, y - fs * 0.3, iw * 0.6, C.accent, al2);
      }
      shown = last + 1;
      S.text("● prime", tab.x + tab.w, tab.y + tab.h + fs * 0.9, { size: fs * 0.72, color: C.accent, align: "right", alpha: k2 });
    }
    // ---- the Analytical Engine: store + mill, fed by punched cards ----
    if (k3 > 0) {
      const { x, y, w, h } = ae, ff = fs * (side ? 0.8 : 0.9);
      const bh = Math.min(h * 0.5, ff * 2.6), by = y + h * 0.18;
      const cardsX = x + w * (side ? 0.02 : 0.12), millX = x + w * (side ? 0.27 : 0.35), storeX = x + w * (side ? 0.52 : 0.58), bw = w * (side ? 0.2 : 0.17);
      // card chain
      for (let i = 0; i < 4; i++) {
        const cx = cardsX + i * bw * 0.22, cw = bw * 0.2, cy = by + bh * 0.15;
        S.rect(cx, cy, cw, bh * 0.7, { color: C.accent, w: iw * 0.4, alpha: k3 });
        const r = S.rng(i + 3 + Math.floor(ft * 0.8));
        for (let j = 0; j < 4; j++) if (r() < 0.5) S.dot(cx + cw * 0.5, cy + bh * 0.12 + j * bh * 0.15, iw * 0.4, C.accent, k3);
      }
      S.arrow(cardsX + bw * 0.9, by + bh / 2, millX - 4, by + bh / 2, { w: iw * 0.5, alpha: k3, head: iw * 2.2 });
      S.rect(millX, by, bw, bh, { color: C.accent, w: iw * 0.6, alpha: k3 });
      S.rect(storeX, by, bw, bh, { color: C.accent, w: iw * 0.6, alpha: k3 });
      S.text("mill", millX + bw / 2, by + bh * 0.48, { size: ff, color: C.accent, weight: 500, alpha: k3 });
      S.text("processor", millX + bw / 2, by + bh * 0.48 + ff * 0.95, { size: ff * 0.75, color: C.accent, alpha: k3 });
      S.text("store", storeX + bw / 2, by + bh * 0.48, { size: ff, color: C.accent, weight: 500, alpha: k3 });
      S.text("memory", storeX + bw / 2, by + bh * 0.48 + ff * 0.95, { size: ff * 0.75, color: C.accent, alpha: k3 });
      S.arrow(millX + bw + 3, by + bh * 0.35, storeX - 3, by + bh * 0.35, { w: iw * 0.45, alpha: k3, head: iw * 2 });
      S.arrow(storeX - 3, by + bh * 0.68, millX + bw + 3, by + bh * 0.68, { w: iw * 0.45, alpha: k3, head: iw * 2 });
      S.text("cards", cardsX + bw * 0.4, by + bh + ff * 1.0, { size: ff * 0.8, color: C.accent, alpha: k3 });
      const tx = storeX + bw + w * 0.03;
      if (side) {
        S.text("Analytical Engine", x + w * 0.38, y + h * 0.18 + bh + ff * 1.25, { size: ff * 0.85, color: C.accent, alpha: k3 });
        S.text("→ computers", tx, by + bh * 0.42, { size: ff * 0.85, color: C.accent, alpha: k3, align: "left" });
        S.text("that learn", tx + ff * 0.9, by + bh * 0.42 + ff, { size: ff * 0.85, color: C.accent, alpha: k3, align: "left" });
      } else {
        S.text("Analytical Engine, 1837: a design for a general-purpose computer", x + w * 0.56, by - ff * 0.6, { size: ff * 0.9, color: C.accent, alpha: k3 });
        S.text("→ every machine", tx, by + bh * 0.42, { size: ff * 0.9, color: C.accent, alpha: k3, align: "left" });
        S.text("that runs AI", tx + ff * 0.9, by + bh * 0.42 + ff * 1.05, { size: ff * 0.9, color: C.accent, alpha: k3, align: "left" });
      }
    }
    const step = u < 0.45 ? `f(${n + 1}) = ${f0} + ${d0} = ${f1}` : `next Δ¹ = ${d0} + ${e0} = ${d1}`;
    return `${step} · only additions · ${primes} of ${Math.max(1, shown)} values prime`;
  },
  code(S) {
    const a = S.p.a | 0, b = S.p.b | 0, c = S.p.c | 0;
    return `${S.c("# method of differences: a polynomial table")}
${S.c("# f(x) = " + a + "x² + " + b + "x + " + c + ", using additions only")}
f  = ${S.v(c)}          ${S.c("# f(0)")}
d1 = ${S.v(a + b)}          ${S.c("# f(1) - f(0)")}
d2 = ${S.v(2 * a)}          ${S.c("# constant for a quadratic")}

for x in range(24):
    print(x, f)
    f  = f + d1         ${S.c("# turn the table column")}
    d1 = d1 + d2        ${S.c("# turn the difference column")}`;
  },
});
