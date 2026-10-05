// Margaret Hamilton — Apollo 11 priority scheduling: overload → 1202 alarm → shed low-priority jobs → land → AI fail-safes
(function () {
  const JOBS = [
    { p: 1, name: "attitude control", short: "attitude", cpu: 22 },
    { p: 2, name: "landing guidance", short: "guidance", cpu: 36 },
    { p: 3, name: "landing radar", short: "radar", cpu: 12 },
    { p: 4, name: "display update", short: "display", cpu: 10 },
    { p: 5, name: "extra display job", short: "monitor", cpu: 8, from: 6 },
  ];
  const D = 20, L = 27, T_ADD = 6;
  // the whole landing as a pure function of time t (seconds of field time)
  function sim(S, t) {
    const steal = S.p.steal, prio = S.p.prio;
    const act = j => t >= (j.from || 0);
    const loadAt = (tt, shed) => JOBS.reduce((s, j) => s + (tt >= (j.from || 0) && !shed.has(j.p) ? j.cpu : 0), 0) + steal;
    let ov = null;
    if (loadAt(0, new Set()) > 100) ov = 0; else if (loadAt(T_ADD, new Set()) > 100) ov = T_ADD;
    const shed = new Set(); let fail = null, alarm = false;
    if (ov != null) {
      alarm = t >= ov && t < ov + 2.6 && t < D;
      if (prio) {
        const plan = new Set(), worst = tt0 => loadAt(Math.max(tt0, T_ADD), plan);
        for (const p of [5, 4]) { if (worst(0) <= 100) break; plan.add(p); }
        if (t >= ov + 0.7) plan.forEach(p => shed.add(p));
        if (loadAt(ov, plan) > 100) fail = ov + 2.6; else if (worst(0) > 100) fail = T_ADD + 2.6;
      } else {
        const lo = loadAt(ov, shed); fail = ov + Math.max(1.2, Math.min(6, (0.08 * lo) / (lo - 100)));
      }
    }
    const load = JOBS.reduce((s, j) => s + (act(j) && !shed.has(j.p) ? j.cpu : 0), 0) + steal;
    const failed = fail != null && t >= fail;
    return { load, shed, ov, alarm, fail, failed, act, restart: ov != null && prio && t >= ov + 0.35 && t < ov + 0.75 };
  }
  function lander(S, x, y, s, a, col) { // Lunar Module, line drawing, centred on the ascent stage base
    const L = (pts, w) => S.line(pts.map(([u, v]) => [x + u * s, y + v * s]), { w: w ?? S.iw * 0.6, color: col, alpha: a });
    L([[-0.55, 0], [0.55, 0], [0.45, 0.45], [-0.45, 0.45], [-0.55, 0]]);
    L([[-0.42, 0], [-0.5, -0.35], [-0.2, -0.62], [0.25, -0.62], [0.5, -0.3], [0.42, 0]]);
    L([[-0.13, -0.18], [0.07, -0.18], [0.07, -0.38], [-0.13, -0.38], [-0.13, -0.18]], S.iw * 0.4);
    L([[-0.45, 0.25], [-0.85, 0.8]]); L([[0.45, 0.25], [0.85, 0.8]]); L([[-0.98, 0.8], [-0.72, 0.8]]); L([[0.72, 0.8], [0.98, 0.8]]);
    L([[0.12, -0.62], [0.12, -0.82]], S.iw * 0.35);
  }
  Lineage.scene({
    params: [
      { id: "steal", label: "Extra load (radar stealing cycles)", type: "range", min: 0, max: 40, step: 1, value: 15, fmt: v => v.toFixed(0) + "%" },
      { id: "prio", label: "Priority scheduling (Hamilton's design)", type: "toggle", value: true },
      { id: "speed", label: "Mission speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { S.st.t0 = 0; },
    reset(S) { S.st.t0 = null; },
    onParam(S, id) { if (id !== "speed") S.st.t0 = null; },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const lc = { x: b.x, y: b.y, w: b.w * (narrow ? 0.33 : 0.38), h: b.h };
      const jx = b.x + b.w * (narrow ? 0.38 : 0.45), jw = b.x + b.w - jx;
      const rh = fs * (narrow ? 1.75 : 2.15);
      const jy = b.y + (narrow ? fs * 1.6 : b.h * 0.12);
      const ground = b.y + b.h * (narrow ? 0.9 : 0.8);
      Object.assign(S.st, { lc, jx, jw, rh, jy, ground });
    },
    entry(S) { const { lc } = S.st; return [lc.x + lc.w * 0.12, lc.y + lc.h * 0.35]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, nar = S.narrow, { lc, jx, jw, rh, jy, ground } = st;
      const run = k > 0.3;
      if (st.t0 == null || !run) st.t0 = ft;
      const t = (ft - st.t0) % L;
      const tt = run ? t : 0;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      const R = sim(S, tt);
      // ---- the Moon and the descent ----
      const gx0 = lc.x + (nar ? 0 : lc.w * 0.18), gx1 = lc.x + lc.w;
      const gp = []; for (let i = 0; i <= 40; i++) { const u = i / 40; gp.push([gx0 + u * (gx1 - gx0), ground + Math.sin(u * 13) * fs * 0.12 + Math.sin(u * 31) * fs * 0.06]); }
      S.line(gp, { w: iw * 0.6, color: C.ink, alpha: k1 });
      S.circle(gx0 + lc.w * 0.12, ground + fs * 0.6, fs * 0.35, { w: iw * 0.3, color: C.soft, alpha: k1, a0: 0, a1: Math.PI });
      S.circle(gx0 + lc.w * 0.8, ground + fs * 0.8, fs * 0.25, { w: iw * 0.3, color: C.soft, alpha: k1, a0: 0, a1: Math.PI });
      const ls = Math.min(lc.w * 0.22, fs * 2.9), top = lc.y + fs * (nar ? 5.2 : 7.5), padY = ground - ls * 0.8;
      const pos = u => [lc.x + lc.w * (0.2 + 0.45 * Math.sin(u * Math.PI / 2)), top + (padY - top) * (1 - Math.pow(1 - u, 1.6))];
      // ghost of the planned path
      const pp = []; for (let i = 0; i <= 30; i++) pp.push(pos(i / 30));
      S.line(pp, { w: iw * 0.35, color: C.soft, dash: [iw, iw * 2], alpha: k1 * 0.8 });
      let u = Math.min(1, tt / D), lx, ly, flame = tt < D;
      if (R.failed) {
        const uf = Math.min(1, R.fail / D), [fx, fy] = pos(uf), dtf = tt - R.fail;
        lx = fx + dtf * lc.w * 0.03; ly = fy - Math.max(0, dtf - 0.5) * (fy - top + fs * 2) * 0.12; flame = true;
        ly = Math.max(lc.y + fs * 4.8 + ls * 0.9, ly);
      } else[lx, ly] = pos(u);
      if (flame) for (let j = -1; j <= 1; j++) S.line([[lx + j * ls * 0.12, ly + ls * 0.5], [lx + j * ls * 0.2, ly + ls * (0.85 + 0.15 * Math.sin(ft * 30 + j))]], { w: iw * 0.4, color: C.ink, alpha: k1 * 0.7 });
      lander(S, lx, ly, ls, k1, C.ink);
      const alt = R.failed ? null : 15 * Math.pow(1 - u, 1.5);
      const lab = R.failed ? "ABORT" : u >= 1 ? "landed" : `${alt < 1 ? Math.round(alt * 1000) + " m" : alt.toFixed(1) + " km"}`;
      if (nar) S.text(lab, lx, ly - ls * 1.0, { size: fs * (R.failed ? 1.0 : 0.8), weight: R.failed ? 600 : 400, alpha: k1 });
      else S.text(lab, lx + ls * 1.15, ly - ls * 0.5, { size: fs * (R.failed ? 1.05 : 0.85), align: "left", weight: R.failed ? 600 : 400, alpha: k1 });
      if (u >= 1 && !R.failed) S.text("“The Eagle has landed”", lc.x + lc.w / 2, ground + fs * 1.6, { size: fs * 0.8, color: C.soft, alpha: k1 });
      // DSKY alarm panel
      const dw = Math.min(lc.w * 0.9, fs * 6.4), dh = fs * 2.5, dx = lc.x + (lc.w - dw) / 2, dy = lc.y + fs * 0.6;
      const blink = R.alarm && Math.floor(tt * 4) % 2 === 0;
      S.rect(dx, dy, dw, dh, { w: iw * 0.5, color: C.ink, alpha: k1 });
      S.rect(dx + fs * 0.35, dy + fs * 0.5, fs * 2.1, fs * 1.5, { w: iw * 0.4, color: C.ink, fill: blink ? C.ink : null, alpha: k1 });
      S.text("PROG", dx + fs * 1.4, dy + fs * 1.6, { size: fs * 0.65, color: blink ? C.paper : C.soft, italic: false, mono: true, halo: false, alpha: k1 });
      if (R.ov != null && tt >= R.ov) S.text("1202", dx + fs * 2.5 + (dw - fs * 2.5) / 2, dy + fs * 1.65, { size: fs * 1.1, mono: true, italic: false, weight: 600, color: R.alarm ? C.ink : C.soft, alpha: k1 });
      if (!nar) S.text("guidance computer display", dx + dw / 2, dy + dh + fs * 1.0, { size: fs * 0.72, color: C.soft, alpha: k1 });
      if (R.restart) S.text("restart: keep the vital jobs", dx + dw / 2, dy + dh + fs * (nar ? 1.0 : 2.1), { size: fs * 0.8, weight: 600, alpha: k1 });
      // ---- job table ----
      if (k2 > 0) {
        const nameW = nar ? fs * 4.4 : fs * 9.2, bx = jx + nameW + fs * 0.5, bwMax = jw - nameW - fs * (nar ? 2.4 : 3.2);
        S.text(nar ? "jobs by priority" : "jobs, by priority (1 = most vital)", jx, jy - fs * (nar ? 0.5 : 1.0), { size: fs * 0.85, align: "left", color: C.soft, alpha: k2 });
        const over = R.load > 100, scale = !S.p.prio && over ? 100 / R.load : 1;
        JOBS.forEach((j, i) => {
          const y = jy + i * rh + rh * 0.62, on = R.act(j), shed = R.shed.has(j.p);
          const col = !on || shed ? C.soft : C.ink;
          S.text(String(j.p), jx + fs * 0.3, y, { size: fs * 0.9, mono: true, italic: false, color: col, alpha: k2 });
          S.text(nar ? j.short : j.name, jx + fs * 1.3, y, { size: fs * (nar ? 0.8 : 0.88), align: "left", color: col, alpha: k2 });
          if (shed) S.line([[jx + fs * 1.2, y - fs * 0.3], [jx + nameW, y - fs * 0.3]], { w: iw * 0.4, color: C.ink, alpha: k2 });
          const w = (j.cpu / 40) * bwMax, bh = rh * 0.42, by = y - bh * 0.85;
          if (!on) { S.text(j.from ? `added at ${j.from}s` : "", bx, y, { size: fs * 0.72, align: "left", color: C.soft, alpha: k2 }); return; }
          if (shed) { S.rect(bx, by, w, bh, { w: iw * 0.3, color: C.soft, alpha: k2 }); S.text("shed", bx + w + fs * 0.4, y, { size: fs * 0.8, align: "left", weight: 600, alpha: k2 }); return; }
          S.rect(bx, by, w, bh, { w: iw * 0.35, color: C.ink, alpha: k2 });
          const fillW = w * scale * (R.failed && j.p <= 3 ? 0.4 : 1);
          S.rect(bx, by, fillW, bh, { w: 0, fill: S.mix(C.ink, C.paper, 0.25), alpha: k2 * 0.85 });
          const late = scale < 1 && j.p <= 3;
          S.text(j.cpu + "%" + (late ? " late" : ""), bx + w + fs * 0.35, y, { size: fs * 0.75, align: "left", color: late ? C.ink : C.soft, weight: late ? 600 : 400, mono: true, italic: false, alpha: k2 });
        });
        // radar steal row
        const sy = jy + 5 * rh + rh * 0.62;
        S.text(nar ? "steal" : "radar steal", jx + fs * 1.3, sy, { size: fs * (nar ? 0.8 : 0.88), align: "left", color: C.ink, alpha: k2 });
        const sw = (S.p.steal / 40) * bwMax;
        S.rect(bx, sy - rh * 0.36, sw, rh * 0.42, { w: iw * 0.35, color: C.ink, alpha: k2 });
        for (let x = bx + 4; x < bx + sw; x += 6) S.line([[x, sy - rh * 0.36 + rh * 0.42], [Math.min(bx + sw, x + 5), sy - rh * 0.36]], { w: 0.8, color: C.ink, alpha: k2 * 0.6 });
        // CPU load bar
        const cy = jy + 6 * rh + fs * (nar ? 1.0 : 1.6), cw = jw - fs * (nar ? 1.2 : 2.2), ch = fs * (nar ? 0.9 : 1.2), m = 130;
        const x100 = jx + cw * (100 / m), lw = jx + cw * (Math.min(R.load, m) / m);
        S.text(`CPU load ${Math.round(R.load)}%`, jx, cy - fs * 0.4, { size: fs * 0.9, align: "left", weight: R.load > 100 ? 600 : 400, alpha: k2 });
        S.rect(jx, cy, cw, ch, { w: iw * 0.4, color: C.ink, alpha: k2 });
        S.rect(jx, cy, Math.min(lw, x100) - jx, ch, { w: 0, fill: S.mix(C.ink, C.paper, 0.3), alpha: k2 });
        if (R.load > 100) for (let x = x100 + 3; x < lw; x += 5) S.line([[x, cy + ch], [Math.min(lw, x + ch * 0.6), cy]], { w: 1.1, color: C.ink, alpha: k2 });
        S.line([[x100, cy - fs * 0.4], [x100, cy + ch + fs * 0.4]], { w: iw * 0.6, color: C.ink, alpha: k2 });
        S.text("100%", x100, cy + ch + fs * 1.25, { size: fs * 0.72, color: C.soft, alpha: k2 });
        if (R.load > 100) S.text("overload", jx + cw, cy - fs * 0.4, { size: fs * 0.8, align: "right", weight: 600, alpha: k2 });
        // ---- accent: what must never fail ----
        if (k3 > 0) {
          const y0 = jy + rh * 0.12, y1 = jy + 3 * rh + rh * 0.05, xb = jx - fs * 0.45, ok = S.p.prio && !R.failed;
          S.line([[xb + fs * 0.4, y0], [xb, y0], [xb, y1], [xb + fs * 0.4, y1]], { w: iw * 0.8, color: C.accent, alpha: k3, dash: ok ? null : [iw, iw * 1.5] });
          const ty = cy + ch + fs * (nar ? 2.6 : 3.3);
          S.text(ok ? (nar ? "vital jobs protected" : "vital jobs protected: they must never fail") : S.p.prio ? (nar ? "too much, even after shedding" : "too much load, even after shedding") : (nar ? "nothing protected the vital jobs" : "no priorities: the vital jobs starve too"), jx, ty, { size: fs * (nar ? 0.85 : 0.95), align: "left", color: C.accent, weight: 500, alpha: k3 });
          S.text(nar ? "→ AI guardrails & fallbacks" : "→ today: guardrails and safe fallbacks for AI", jx, ty + fs * 1.25, { size: fs * 0.85, align: "left", color: C.accent, alpha: k3 });
        }
      }
      const shedN = [...R.shed].sort().map(p => JOBS[p - 1].name).join(" + ");
      if (!run) return "Apollo 11 lunar module, powered descent";
      if (R.failed) return `load ${Math.round(R.load)}% · ${S.p.prio ? "too much even after shedding" : "no priorities, guidance falls behind"} · abort`;
      if (R.alarm) return `load ${Math.round(R.load)}% · 1202 alarm: the computer is overloaded`;
      return `load ${Math.round(R.load)}%${shedN ? " · shed: " + shedN : ""} · ${tt >= D ? "landed safely" : "altitude " + (15 * Math.pow(1 - tt / D, 1.5)).toFixed(1) + " km"}`;
    },
    code(S) {
      if (!S.p.prio) return `${S.c("# what if every job were equal? (not the real AGC)")}
load = sum(job.cpu for job in jobs) + radar_steal   ${S.c("# " + S.p.steal + "%")}
if load > 100:
    for job in jobs:
        job.speed = 100 / load        ${S.c("# everything slows down")}
${S.c("# landing guidance misses its 2-second deadline")}
${S.c("# → the descent can't be flown safely")}`;
      return `${S.c("# Apollo Guidance Computer executive (simplified)")}
jobs.sort(key=priority)                ${S.c("# 1 = most vital")}
load = sum(job.cpu for job in jobs) + radar_steal   ${S.c("# " + S.p.steal + "%")}

if load > 100:
    alarm(${S.v("1202")})                        ${S.c("# executive overflow")}
    restart()                          ${S.c("# rebuild from saved state")}
    while load > 100 and jobs[-1].priority > 3:
        load -= jobs.pop().cpu         ${S.c("# shed the least vital")}`;
    },
  });
})();
