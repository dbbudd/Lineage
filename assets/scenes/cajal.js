// Santiago Ramón y Cajal — the neuron doctrine: a neuron in his ink style; signals cross synapses onto dendrites,
// sum at the cell body and, past a threshold, a spike runs one way down the axon → an artificial neuron
Lineage.scene({
  params: [
    { id: "w1", label: "Synapse A strength", type: "range", min: 0, max: 1, step: 0.01, value: 0.55, fmt: v => v.toFixed(2) },
    { id: "w2", label: "Synapse B strength", type: "range", min: 0, max: 1, step: 0.01, value: 0.4, fmt: v => v.toFixed(2) },
    { id: "w3", label: "Synapse C strength", type: "range", min: 0, max: 1, step: 0.01, value: 0.3, fmt: v => v.toFixed(2) },
    { id: "th", label: "Firing threshold", type: "range", min: 0.3, max: 2, step: 0.01, value: 1, fmt: v => v.toFixed(2) },
  ],
  RATE: 1.1, TAU: 0.8,
  W(S) { return [S.p.w1, S.p.w2, S.p.w3]; },
  init(S) { const st = S.st; st.rnd = S.rng(1906); st.V = 0; st.Vh = []; st.pulses = []; st.spikes = []; st.ap = []; st.ref = 0; st.T = 0; st.flashIn = [0, 0, 0]; st.flashOut = 0; },
  reset(S) { this.init(S); this.layout(S); },
  layout(S) {
    const { box, narrow } = S, w = box.w, h = box.h, st = S.st, r = S.rng(1852);
    const soma = [box.x + w * 0.4, box.y + h * (narrow ? 0.33 : 0.36)];
    const L0 = Math.min(w * 0.12, h * (narrow ? 0.16 : 0.14)), segs = [];
    const grow = (p, ang, len, depth, parent, tree) => {
      const e = [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len], j = (r() - 0.5) * len * 0.22;
      const m = [(p[0] + e[0]) / 2 - Math.sin(ang) * j, (p[1] + e[1]) / 2 + Math.cos(ang) * j];
      const s = { pts: [p, m, e], depth, parent, tree, kids: 0, ang }; segs.push(s); const id = segs.length - 1;
      if (depth < 3) {
        const n = depth === 0 ? 2 : r() < 0.7 ? 2 : 3;
        for (let i = 0; i < n; i++) { segs[id].kids++; grow(e, ang + (i - (n - 1) / 2) * (0.55 + r() * 0.25) + (r() - 0.5) * 0.2, len * (0.62 + r() * 0.12), depth + 1, id, tree); }
      }
    };
    [Math.PI + 0.62, Math.PI + 0.02, Math.PI - 0.6].forEach((a, t) => grow([soma[0] - L0 * 0.12 * Math.cos(a - Math.PI), soma[1]], a, L0, 0, -1, t));
    // input site on each tree: the tip farthest from the cell body
    const sites = [0, 1, 2].map(t => {
      let best = -1, bd = -1;
      segs.forEach((s, i) => { if (s.tree === t && !s.kids) { const d = Math.hypot(s.pts[2][0] - soma[0], s.pts[2][1] - soma[1]); if (d > bd) { bd = d; best = i; } } });
      const path = []; let i = best; while (i >= 0) { const p = segs[i].pts; path.push(p[2], p[1]); i = segs[i].parent; } path.push(soma);
      const tip = segs[best].pts[2], ang = segs[best].ang, gap = S.iw * 2.2, pl = Math.min(w * 0.07, L0 * 0.6);
      const k0 = [tip[0] + Math.cos(ang) * gap, tip[1] + Math.sin(ang) * gap], a0 = [k0[0] + Math.cos(ang) * pl, k0[1] + Math.sin(ang) * pl - pl * 0.3];
      return { path, tip, k0, a0, len: this.plen(path) + Math.hypot(a0[0] - k0[0], a0[1] - k0[1]) };
    });
    // axon: out of the right side of the cell body, ending in terminal branches
    const ax = [], x0 = soma[0] + L0 * 0.25, x1 = box.x + w * (narrow ? 0.86 : 0.84);
    for (let i = 0; i <= 40; i++) { const u = i / 40; ax.push([x0 + (x1 - x0) * u, soma[1] + Math.sin(u * 5.2) * L0 * 0.06 * (0.3 + u)]); }
    const end = ax[ax.length - 1], terms = [-0.5, -0.15, 0.2, 0.55].map(a => { const l = L0 * (0.35 + 0.1 * Math.abs(a)); return [end, [end[0] + Math.cos(a) * l * 0.55, end[1] + Math.sin(a) * l * 0.55 - l * 0.05], [end[0] + Math.cos(a) * l, end[1] + Math.sin(a) * l]]; });
    // artificial neuron, aligned underneath
    const ya = box.y + h * (narrow ? 0.8 : 0.79), sp = h * (narrow ? 0.1 : 0.085);
    const A = { xin: box.x + w * (narrow ? 0.1 : 0.2), ys: [ya - sp, ya, ya + sp], sum: [soma[0], ya], act: [box.x + w * 0.62, ya], out: [box.x + w * 0.86, ya], r: Math.max(8, S.fs * 0.85) };
    const Vp = narrow ? { x: box.x + w * 0.6, y: box.y + h * 0.04, w: w * 0.36, h: h * 0.15 } : { x: box.x + w * 0.6, y: box.y + h * 0.05, w: w * 0.36, h: h * 0.15 };
    Object.assign(st, { soma, L0, segs, sites, ax, axLen: this.plen(ax), terms, A, Vp });
  },
  plen(p) { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; },
  at(p, d) { for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d <= l) { const u = l ? d / l : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * u, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u]; } d -= l; } return p[p.length - 1]; },
  entry(S) { const s = S.st.sites[1]; return s ? s.a0 : [S.box.x, S.box.y + S.box.h * 0.4]; },
  draw(S, k, ft, dt) {
    const st = S.st, { soma, L0, segs, sites, ax, terms, A, Vp } = st, iw = S.iw, C = S.C, fs = S.fs, nar = S.narrow, ctx = S.ctx;
    const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.28) / 0.35), k3 = S.ease((k - 0.62) / 0.38);
    const W = this.W(S), th = S.p.th, step = dt || 0, v = Math.max(120, S.box.w * 0.55);

    // ---- simulate: random input spikes travel in, add up, leak away, and fire past threshold
    let fired = false;
    if (k > 0.3 && step > 0) {
      st.T += step;
      for (let i = 0; i < 3; i++) if (st.rnd() < this.RATE * step) { st.pulses.push({ i, d: 0 }); st.flashIn[i] = 1; }
      st.V *= Math.exp(-step / this.TAU); st.ref = Math.max(0, st.ref - step);
      st.pulses = st.pulses.filter(p => { p.d += v * step; if (p.d >= sites[p.i].len) { st.V += W[p.i]; return false; } return true; });
      if (st.V >= th && st.ref <= 0) { st.V = 0; st.ref = 0.25; st.ap.push(0); st.spikes.push(st.T); st.flashOut = 1; fired = true; }
      st.ap = st.ap.map(d => d + v * 1.6 * step).filter(d => d < st.axLen + L0 * 0.6);
      st.Vh.push([st.T, st.V, fired]); while (st.Vh.length && st.Vh[0][0] < st.T - 6) st.Vh.shift();
      st.spikes = st.spikes.filter(t => t > st.T - 10);
      st.flashIn = st.flashIn.map(f => Math.max(0, f - step * 3)); st.flashOut = Math.max(0, st.flashOut - step * 2.5);
    }

    // ---- the neuron, drawn in ink like a Golgi-stained cell
    const nShow = Math.ceil(k1 * segs.length);
    for (let i = 0; i < nShow; i++) {
      const s = segs[i], wd = Math.max(0.8, iw * (1.25 - s.depth * 0.27));
      S.line(s.pts, { w: wd, color: C.ink });
      // spines along the thinner branches
      if (s.depth >= 1) for (const u of [0.3, 0.55, 0.8]) { const p = s.pts[0], e = s.pts[2], q = [p[0] + (e[0] - p[0]) * u, p[1] + (e[1] - p[1]) * u], a = s.ang + (u > 0.5 ? 1.4 : -1.4); S.line([q, [q[0] + Math.cos(a) * iw * 1.4, q[1] + Math.sin(a) * iw * 1.4]], { w: Math.max(0.6, iw * 0.3), color: C.ink }); }
    }
    // cell body: a dark pyramidal shape, flushing in the accent colour when it fires
    const R = L0 * 0.24, body = [[soma[0] - R * 0.9, soma[1] + R * 0.55], [soma[0] - R * 0.2, soma[1] - R * 0.95], [soma[0] + R * 1.1, soma[1] - R * 0.05], [soma[0] + R * 0.5, soma[1] + R * 0.75]];
    if (k1 > 0.2) S.line(body, { close: true, fill: S.mix(C.ink, C.accent, st.flashOut), w: iw * 0.6, color: C.ink, alpha: Math.min(1, (k1 - 0.2) / 0.3) });
    const axShow = Math.max(2, Math.floor(k1 * ax.length));
    S.line(ax.slice(0, axShow), { w: iw * 0.9, color: C.ink });
    if (k1 > 0.9) for (const t of terms) { S.line(t, { w: iw * 0.55, color: C.ink }); S.circle(t[2][0], t[2][1], iw * 1.1, { w: iw * 0.5, color: C.ink }); }
    // incoming axons from other neurons, ending at a synapse (a tiny gap)
    const names = ["A", "B", "C"];
    sites.forEach((s, i) => {
      if (k1 < 0.6) return;
      const a = (k1 - 0.6) / 0.4;
      S.line([s.a0, s.k0], { w: iw * 0.5, color: C.soft, alpha: a });
      S.dot(s.k0[0], s.k0[1], iw * 1.1, S.mix(C.soft, C.accent, st.flashIn[i]), a);
      S.text(names[i], s.a0[0] - fs * 0.35, s.a0[1] + fs * 0.1, { size: fs * 0.9, align: "right", color: C.ink, italic: false, weight: 500, alpha: a });
    });
    if (k1 > 0.7) {
      const a = (k1 - 0.7) / 0.3, s0 = sites[0];
      S.text("dendrites", soma[0] - L0 * 1.15, soma[1] + L0 * (nar ? 1.65 : 1.45), { size: fs * (nar ? 0.8 : 0.95), alpha: a });
      S.text("cell body", soma[0] + R * 0.4, soma[1] + R + fs * 1.15, { size: fs * (nar ? 0.8 : 0.95), alpha: a });
      S.text("axon", (soma[0] + ax[ax.length - 1][0]) / 2 + L0 * 0.4, soma[1] - fs * 0.9, { size: fs * (nar ? 0.8 : 0.95), alpha: a });
      if (!nar) S.text("synapse", s0.k0[0] + fs * 0.5, s0.k0[1] - fs * 0.6, { size: fs * 0.8, color: C.soft, align: "left", alpha: a });
    }

    // ---- signals: in through the dendrites, out along the axon, one way only
    if (k2 > 0) {
      for (const p of st.pulses) {
        const s = sites[p.i], pre = Math.hypot(s.a0[0] - s.k0[0], s.a0[1] - s.k0[1]);
        const q = p.d < pre ? [s.a0[0] + (s.k0[0] - s.a0[0]) * (p.d / pre), s.a0[1] + (s.k0[1] - s.a0[1]) * (p.d / pre)] : this.at(s.path, p.d - pre);
        S.dot(q[0], q[1], Math.max(2, iw * (0.7 + W[p.i] * 1.2)), C.accent, k2);
      }
      for (const d of st.ap) {
        if (d <= st.axLen) { const q = this.at(ax, d); S.dot(q[0], q[1], iw * 2, C.accent, k2); S.circle(q[0], q[1], iw * 3.4, { w: iw * 0.5, color: C.accent, alpha: 0.5 * k2 }); }
        else for (const t of terms) { const q = this.at(t, d - st.axLen); S.dot(q[0], q[1], iw * 1.2, C.accent, k2); }
      }
      // direction arrow (law of dynamic polarisation)
      const e = ax[ax.length - 1], ay = soma[1] + L0 * 0.42;
      S.arrow(soma[0] + L0 * 0.6, ay, e[0] - L0 * 0.4, ay, { w: iw * 0.45, color: C.soft, alpha: k2 });
      if (!nar) S.text("signals flow one way", (soma[0] + e[0]) / 2 + L0 * 0.1, ay + fs * 1.25, { size: fs * 0.8, color: C.soft, alpha: k2 });
      // membrane voltage trace
      const px = t => Vp.x + (1 - (st.T - t) / 6) * Vp.w, ymax = Math.max(th * 1.3, 0.5), py = val => Vp.y + Vp.h - Math.min(1.15, val / ymax) * Vp.h;
      S.line([[Vp.x, Vp.y - fs * 0.2], [Vp.x, Vp.y + Vp.h], [Vp.x + Vp.w, Vp.y + Vp.h]], { w: iw * 0.45, color: C.ink, alpha: k2 });
      S.line([[Vp.x, py(th)], [Vp.x + Vp.w, py(th)]], { w: iw * 0.45, color: C.ink, dash: [iw * 1.2, iw * 1.2], alpha: 0.7 * k2 });
      if (!nar) S.text("threshold", Vp.x + Vp.w, py(th) - fs * 0.35, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
      if (st.Vh.length > 1) S.line(st.Vh.map(([t, val]) => [px(t), py(val)]), { w: iw * 0.65, color: C.ink, alpha: k2 });
      for (const [t, , f] of st.Vh) if (f) S.line([[px(t), py(th)], [px(t), Vp.y - fs * 0.15]], { w: iw * 0.7, color: C.accent, alpha: k2 });
      S.text(nar ? "charge" : "charge in the cell body", Vp.x - fs * 0.25, Vp.y + Vp.h * 0.5 + fs * 0.3, { size: fs * 0.78, align: "right", alpha: k2 });
    }

    // ---- the artificial neuron: inputs × weights → sum → threshold → output
    if (k3 > 0) {
      const a = k3, { xin, ys, sum, act, out, r } = A;
      // faint guides from each part of the drawing down to its abstraction
      S.line([[soma[0], soma[1] + R + fs * 1.6], [sum[0], sum[1] - r - fs * 0.6]], { w: iw * 0.35, color: C.accent, dash: [iw, iw * 1.5], alpha: 0.5 * a });
      ys.forEach((y, i) => {
        const on = st.flashIn[i];
        S.line([[xin + r, y], [sum[0] - r, sum[1]]], { w: Math.max(0.8, iw * (0.35 + W[i] * 1.6)), color: C.accent, alpha: a * (0.45 + 0.55 * on) });
        S.circle(xin, y, r, { w: iw * 0.7, color: C.accent, fill: on > 0.1 ? S.mix(C.paper, C.accent, on * 0.6) : null, alpha: a });
        S.text("x" + "₁₂₃"[i], xin, y + fs * 0.3, { size: fs * 0.82, italic: false, color: C.accent, alpha: a });
        const u = nar ? 0.42 : 0.4, mx = xin + r + (sum[0] - r - xin - r) * u, my = y + (sum[1] - y) * u;
        S.text((nar ? "" : "w" + "₁₂₃"[i] + "=") + W[i].toFixed(2), mx, my - fs * 0.4, { size: fs * (nar ? 0.66 : 0.78), italic: false, mono: true, color: C.ink, alpha: a });
      });
      S.circle(sum[0], sum[1], r * 1.15, { w: iw * 0.8, color: C.accent, alpha: a });
      S.text("Σ", sum[0], sum[1] + fs * 0.33, { size: fs * 1.05, italic: false, color: C.accent, alpha: a });
      S.arrow(sum[0] + r * 1.2, sum[1], act[0] - r * 1.25, act[1], { w: iw * 0.6, color: C.accent, alpha: a });
      // step activation
      const bw = r * 2.2;
      S.rect(act[0] - bw / 2, act[1] - bw / 2, bw, bw, { w: iw * 0.6, color: C.accent, alpha: a });
      S.line([[act[0] - bw * 0.38, act[1] + bw * 0.25], [act[0], act[1] + bw * 0.25], [act[0], act[1] - bw * 0.25], [act[0] + bw * 0.38, act[1] - bw * 0.25]], { w: iw * 0.6, color: C.accent, alpha: a });
      S.text(nar ? "≥ θ?" : "fires if sum ≥ θ", act[0], act[1] + bw / 2 + fs * 1.1, { size: fs * 0.78, color: C.ink, alpha: a });
      S.arrow(act[0] + bw / 2 + iw, act[1], out[0] - r * 1.1, out[1], { w: iw * 0.6, color: C.accent, alpha: a });
      S.circle(out[0], out[1], r, { w: iw * 0.7, color: C.accent, fill: st.flashOut > 0.1 ? S.mix(C.paper, C.accent, st.flashOut * 0.8) : null, alpha: a });
      S.text("y", out[0], out[1] + fs * 0.3, { size: fs * 0.85, italic: false, color: C.accent, alpha: a });
      if (nar) S.text("artificial neuron", (sum[0] + out[0]) / 2, sum[1] - r - fs * 1.5, { size: fs * 0.85, color: C.accent, weight: 500, alpha: a });
      else S.text("artificial neuron: y = step(Σ wᵢxᵢ − θ)", (xin + out[0]) / 2, ys[0] - r - fs * 0.9, { size: fs * (nar ? 0.85 : 1), color: C.accent, weight: 500, alpha: a });
    }
    const rate = st.spikes.length / Math.min(10, Math.max(1, st.T));
    return `charge ${st.V.toFixed(2)} / threshold ${th.toFixed(2)} · firing ${rate.toFixed(1)} spikes per second`;
  },
  code(S) {
    const W = this.W(S);
    return `${S.c("# Cajal's neuron, simplified as McCulloch & Pitts did (1943)")}
w = [${W.map(x => S.v(x.toFixed(2))).join(", ")}]      ${S.c("# synapse strengths A, B, C")}
θ = ${S.v(S.p.th.toFixed(2))}                    ${S.c("# firing threshold")}
V = 0

every tick:
    V *= decay                 ${S.c("# charge leaks away")}
    for i in arriving_signals:
        V += w[i]              ${S.c("# dendrites → cell body")}
    if V >= θ:
        send_spike_down_axon() ${S.c("# one direction only")}
        V = 0

${S.c("# artificial neuron: y = step(sum(w[i] * x[i]) - θ)")}`;
  },
});
