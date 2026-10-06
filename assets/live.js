/* Lineage live-card engine.
   One continuous line: the portrait draws itself, a connector warms into the suit colour,
   and flows into a "scene" — an interactive drawing of the person's own work.

   A scene registers itself with Lineage.scene({...}) (see assets/scenes/*.js):
     params:  [{id, label, type:'range'|'text'|'select'|'toggle', min,max,step,value, options, fmt(v)}]
     actions: [{label, run(S)}]                 extra buttons in the stage bar
     init(S)        once, after layout          (set up state on S.st)
     layout(S)      after every resize          (S.box = idea area, S.P = portrait geometry)
     entry(S)  ->   [x, y] where the connector lands (defaults to the left-middle of S.box)
     ctrl(S, from, to) -> [x, y]              optional control point that bends the connector
     draw(S, k, ft, dt) -> readout string       k: 0..1 reveal, ft: field time (speed-scaled), dt: seconds
     code(S)  ->    html for the code panel (use S.v(value) and S.c(comment))
     pointer(S, type, x, y)                     optional: 'down'|'move'|'up' in canvas pixels
     onParam(S, id) optional
   Everything a scene needs is on S: ctx, W, H, box, P, p (param values), C (colours),
   lw / iw (portrait / idea line weights), fs (base font size) and drawing helpers.
*/
(function () {
  const Lineage = (window.Lineage = window.Lineage || {});
  let SCENE = null;
  Lineage.scene = def => { SCENE = def; };

  const ease = x => (x < 0 ? 0 : x > 1 ? 1 : x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const hex = h => { h = String(h).trim();
    if (h.startsWith("rgb")) return h.replace(/[^\d,]/g, "").split(",").slice(0, 3).map(Number);
    h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`; };
  const escH = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function boot() {
    const root = document.querySelector("[data-live]");
    if (!root || !SCENE) return;
    const $ = sel => root.querySelector(sel);
    const cv = $("canvas"), ctx = cv.getContext("2d");
    const css = getComputedStyle(root);
    const C = {
      ink: css.getPropertyValue("--ink").trim() || "#3F3D39",
      soft: css.getPropertyValue("--ink-soft").trim() || "#7E7A72",
      paper: css.getPropertyValue("--paper").trim() || "#F1EDE4",
      rule: css.getPropertyValue("--rule").trim() || "#D6CEBF",
      accent: css.getPropertyValue("--suit").trim() || "#B8492A",
    };
    // the portrait is drawn in the suit's own ink (a touch deeper than the accent, so the idea layer still leads)
    C.line = mix(C.accent, C.ink, 0.18);
    const LINE = window.LINEAGE_LINE || null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ink = document.createElement("canvas"), ictx = ink.getContext("2d");
    let drawn = 0, t0 = performance.now(), paused = false, pauseAt = 0, ft = 0, last = performance.now();

    const S = { ctx, C, st: {}, p: {}, mix, ease };
    // deterministic random numbers: const r = S.rng(42); r() -> [0,1)
    S.rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    // ---------- params / controls ----------
    const bench = $("[data-controls]");
    (SCENE.params || []).forEach(pr => {
      S.p[pr.id] = pr.value;
      const id = "p-" + pr.id, row = document.createElement("div");
      row.className = "lv-ctrl";
      const fmt = pr.fmt || (v => v);
      if (pr.type === "range") {
        row.innerHTML = `<label for="${id}">${escH(pr.label)} <span></span></label><input id="${id}" type="range" min="${pr.min}" max="${pr.max}" step="${pr.step || 0.01}" value="${pr.value}">`;
        const sp = row.querySelector("span"), inp = row.querySelector("input");
        const upd = () => { S.p[pr.id] = +inp.value; sp.textContent = fmt(+inp.value); };
        inp.addEventListener("input", () => { upd(); SCENE.onParam && SCENE.onParam(S, pr.id); renderCode(); }); upd();
      } else if (pr.type === "select") {
        row.innerHTML = `<label for="${id}">${escH(pr.label)}</label><select id="${id}">${pr.options.map(o => `<option value="${escH(o.value ?? o)}">${escH(o.label ?? o)}</option>`).join("")}</select>`;
        const inp = row.querySelector("select"); inp.value = pr.value;
        inp.addEventListener("change", () => { S.p[pr.id] = inp.value; SCENE.onParam && SCENE.onParam(S, pr.id); renderCode(); });
      } else if (pr.type === "toggle") {
        row.innerHTML = `<label class="lv-tog" for="${id}"><input id="${id}" type="checkbox" ${pr.value ? "checked" : ""}> ${escH(pr.label)}</label>`;
        const inp = row.querySelector("input");
        inp.addEventListener("change", () => { S.p[pr.id] = inp.checked; SCENE.onParam && SCENE.onParam(S, pr.id); renderCode(); });
      } else if (pr.type === "textarea") {
        row.innerHTML = `<label for="${id}">${escH(pr.label)}</label><textarea id="${id}" rows="${pr.rows || 4}" spellcheck="false">${escH(pr.value)}</textarea>`;
        const inp = row.querySelector("textarea");
        inp.addEventListener("input", () => { S.p[pr.id] = inp.value; SCENE.onParam && SCENE.onParam(S, pr.id); renderCode(); });
      } else {
        row.innerHTML = `<label for="${id}">${escH(pr.label)}</label><input id="${id}" type="text" value="${escH(pr.value)}" maxlength="${pr.maxlength || 80}" autocomplete="off" spellcheck="false">`;
        const inp = row.querySelector("input");
        inp.addEventListener("input", () => { S.p[pr.id] = inp.value; SCENE.onParam && SCENE.onParam(S, pr.id); renderCode(); });
        if (pr.enter) inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); pr.enter(S, inp); renderCode(); } });
      }
      bench.appendChild(row);
    });
    const btns = $("[data-buttons]");
    (SCENE.actions || []).forEach(a => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
      b.addEventListener("click", () => { a.run(S); renderCode(); }); btns.prepend(b);
    });

    // ---------- drawing helpers ----------
    S.v = x => `<span class="v">${escH(x)}</span>`;
    S.c = x => `<span class="c">${escH(x)}</span>`;
    S.line = (pts, o = {}) => {
      if (pts.length < 2) return; ctx.save();
      ctx.strokeStyle = o.color || C.accent; ctx.lineWidth = o.w ?? S.iw; ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (o.dash) ctx.setLineDash(o.dash); if (o.alpha != null) ctx.globalAlpha = o.alpha;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (o.close) ctx.closePath(); if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } if (o.w !== 0) ctx.stroke(); ctx.restore();
    };
    S.dot = (x, y, r, color, alpha) => { ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.fillStyle = color || C.accent; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
    S.circle = (x, y, r, o = {}) => { ctx.save(); ctx.strokeStyle = o.color || C.accent; ctx.lineWidth = o.w ?? S.iw; if (o.alpha != null) ctx.globalAlpha = o.alpha; if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath(); ctx.arc(x, y, r, o.a0 || 0, o.a1 ?? Math.PI * 2); if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); } if (o.w !== 0) ctx.stroke(); ctx.restore(); };
    S.arrow = (x0, y0, x1, y1, o = {}) => {
      const w = o.w ?? S.iw, color = o.color || C.accent, hl = o.head ?? Math.max(7, w * 4.5);
      S.line([[x0, y0], [x1, y1]], { w, color, alpha: o.alpha });
      const a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * w * 0.6, y1 + Math.sin(a) * w * 0.6);
      ctx.lineTo(x1 - hl * Math.cos(a - 0.45), y1 - hl * Math.sin(a - 0.45)); ctx.lineTo(x1 - hl * Math.cos(a + 0.45), y1 - hl * Math.sin(a + 0.45));
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    S.text = (str, x, y, o = {}) => {
      const size = o.size || S.fs; ctx.save();
      ctx.font = `${o.italic === false ? "" : "italic "}${o.weight || 400} ${size.toFixed(1)}px ${o.mono ? '"IBM Plex Mono", monospace' : "Newsreader, Georgia, serif"}`;
      ctx.textAlign = o.align || "center"; ctx.textBaseline = o.baseline || "alphabetic"; if (o.alpha != null) ctx.globalAlpha = o.alpha;
      if (o.halo !== false) { ctx.lineJoin = "round"; ctx.lineWidth = size * 0.42; ctx.strokeStyle = C.paper; ctx.strokeText(str, x, y); }
      ctx.fillStyle = o.color || C.ink; ctx.fillText(str, x, y); ctx.restore();
    };
    S.rect = (x, y, w, h, o = {}) => { ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x, y, w, h); } if (o.w !== 0 && (o.color || !o.fill)) { ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = o.w ?? S.lw; ctx.strokeRect(x, y, w, h); } ctx.restore(); };
    S.inBox = (x, y) => x >= S.box.x && x <= S.box.x + S.box.w && y >= S.box.y && y <= S.box.y + S.box.h;

    // ---------- layout ----------
    let pts = [], cum = [0], wash = [], conn = [];
    function layout() {
      const w = cv.clientWidth, narrow = w < 640;
      const W = w, H = Math.round(narrow ? w * 1.45 : Math.min(w * 0.6, 700));
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink.width = W * dpr; ink.height = H * dpr; ictx.setTransform(dpr, 0, 0, dpr, 0, 0); drawn = 0;
      const asp = LINE ? LINE.aspect : 1.25;
      let s, x0, y0, box;
      if (narrow) {
        box = { x: W * 0.04, y: H * 0.03, w: W * 0.92, h: H * 0.5 };
        // portrait sits below the scene: as large as fits under the box, bottom-left
        s = Math.min(W * 0.6, (H - (box.y + box.h) - H * 0.01) / asp); x0 = W * 0.0; y0 = H - asp * s;
      } else {
        // portrait on the left, never wider than ~40% of the stage (wide photos would squeeze the scene)
        s = Math.min(H * 0.98 / asp, W * 0.4); x0 = W * 0.02; y0 = H - asp * s;
        const bx = x0 + s * 0.86; box = { x: bx, y: H * 0.05, w: W * 0.985 - bx, h: H * 0.9 };
      }
      Object.assign(S, { W, H, narrow, box, lw: Math.max(1.1, s * 0.0028), iw: Math.max(2.4, Math.min(W, 1100) * 0.0042), fs: Math.max(14, Math.min(W, 1100) * 0.017) });
      S.P = { s, x0, y0, head: [x0 + 0.47 * s, y0 + 0.2 * s], at: (u, v) => [x0 + u * s, y0 + v * s] };
      if (LINE) {
        pts = []; for (let i = 0; i < LINE.pts.length; i += 2) pts.push([x0 + LINE.pts[i] * s, y0 + LINE.pts[i + 1] * s]);
        cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        wash = (LINE.wash || []).map(a => { const q = []; for (let i = 0; i < a.length; i += 2) q.push([x0 + a[i] * s, y0 + a[i + 1] * s]); return q; });
      } else {
        // no portrait yet: a simple flowing signature line from the left edge
        pts = []; for (let i = 0; i <= 160; i++) { const u = i / 160; pts.push([x0 + s * (0.1 + 0.75 * u), y0 + asp * s * (0.55 + 0.18 * Math.sin(u * 9) * (1 - u))]); }
        cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        wash = [];
      }
      SCENE.layout && SCENE.layout(S);
      const e = pts[pts.length - 1], hs = (SCENE.entry && SCENE.entry(S)) || [box.x, box.y + box.h * 0.5];
      const mid = [(e[0] + hs[0]) / 2, (e[1] + hs[1]) / 2], ctrl = (SCENE.ctrl && SCENE.ctrl(S, e, hs)) || [mid[0], Math.min(e[1], hs[1]) - Math.abs(hs[0] - e[0]) * 0.15];
      conn = []; for (let k = 0; k <= 40; k++) { const u = k / 40, v = 1 - u; conn.push([v * v * e[0] + 2 * v * u * ctrl[0] + u * u * hs[0], v * v * e[1] + 2 * v * u * ctrl[1] + u * u * hs[1]]); }
    }

    // ---------- loop ----------
    const story = root.querySelectorAll("[data-story] li");
    const readout = $("[data-readout]");
    const Tp = LINE ? 6.5 : 1.8;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = reduce ? 99 : paused ? pauseAt : (now - t0) / 1000;
      if (!paused) ft += dt * (S.p.speed ?? 1) * (reduce ? 0.25 : 1);
      ctx.clearRect(0, 0, S.W, S.H);
      // 1. portrait
      const kp = ease(t / Tp), target = kp * cum[cum.length - 1];
      let idx = 1; while (idx < pts.length && cum[idx] <= target) idx++;
      ctx.globalAlpha = 0.13 * kp; ctx.fillStyle = C.accent;
      const ox = S.P.s * 0.01, oy = S.P.s * 0.007;
      for (const q of wash) { ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy))); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (idx < drawn) { ictx.clearRect(0, 0, S.W, S.H); drawn = 0; }
      const lb = S.P.s * 0.0075; ictx.strokeStyle = C.line; ictx.lineCap = "round"; ictx.lineJoin = "round";
      for (let i = Math.max(1, drawn); i < idx; i++) {
        ictx.lineWidth = LINE && LINE.w ? Math.max(0.35, LINE.w[i] * lb) : S.lw * 1.4;
        ictx.beginPath(); ictx.moveTo(pts[i - 1][0], pts[i - 1][1]); ictx.lineTo(pts[i][0], pts[i][1]); ictx.stroke();
      }
      drawn = Math.max(drawn, idx); ctx.drawImage(ink, 0, 0, S.W, S.H);
      if (t < Tp) { const p = pts[Math.min(idx, pts.length - 1)]; S.dot(p[0], p[1], S.lw * 1.8, C.line); }
      // 2. connector
      const kc = ease((t - Tp) / 0.9);
      if (kc > 0) { const m = Math.max(2, Math.round(kc * conn.length));
        for (let i = 1; i < m; i++) { ctx.strokeStyle = mix(C.line, C.accent, i / conn.length); ctx.lineWidth = S.lw + (S.iw - S.lw) * (i / conn.length); ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(conn[i - 1][0], conn[i - 1][1]); ctx.lineTo(conn[i][0], conn[i][1]); ctx.stroke(); } }
      // 3. the scene
      const k = ease((t - Tp - 0.8) / 2.6);
      let ro = "";
      if (k > 0) { ctx.save(); try { ro = SCENE.draw(S, k, ft, paused ? 0 : dt) || ""; } catch (err) { console.error(err); } ctx.restore(); }
      const stage = t < Tp ? 0 : k < 0.15 ? 1 : k < 0.75 ? 2 : 3;
      story.forEach((li, i) => li.classList.toggle("on", i < stage));
      readout.textContent = ro || (t < Tp ? "drawing: one unbroken line" : "");
      requestAnimationFrame(frame);
    }
    function renderCode() { const el = $("[data-code]"); if (el && SCENE.code) el.innerHTML = SCENE.code(S); }

    $("[data-again]").addEventListener("click", () => { t0 = performance.now(); ictx.clearRect(0, 0, S.W, S.H); drawn = 0; paused = false; $("[data-pause]").textContent = "Pause"; SCENE.reset && SCENE.reset(S); });
    $("[data-pause]").addEventListener("click", e => {
      if (!paused) { pauseAt = (performance.now() - t0) / 1000; paused = true; e.target.textContent = "Play"; }
      else { t0 = performance.now() - pauseAt * 1000; paused = false; e.target.textContent = "Pause"; }
    });
    if (SCENE.pointer) {
      const pos = ev => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
      let down = false;
      cv.addEventListener("pointerdown", ev => { down = true; cv.setPointerCapture(ev.pointerId); SCENE.pointer(S, "down", ...pos(ev)); renderCode(); });
      cv.addEventListener("pointermove", ev => { SCENE.pointer(S, down ? "drag" : "move", ...pos(ev)); });
      cv.addEventListener("pointerup", ev => { down = false; SCENE.pointer(S, "up", ...pos(ev)); renderCode(); });
      cv.style.touchAction = "none"; cv.style.cursor = "crosshair";
    }
    addEventListener("resize", () => { layout(); });
    layout(); SCENE.init && SCENE.init(S); renderCode(); requestAnimationFrame(frame);
    Lineage.S = S; // handy for debugging in the console
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
