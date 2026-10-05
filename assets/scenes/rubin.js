// Rick Rubin (Joker) — The Way of Code style generative art: a calm field of grass swaying in wind,
// drawn as one continuous line; remix by "prompt" (a toy keyword reader) or a gentle random "vibe" → vibe coding
Lineage.scene({
  params: [
    { id: "chaos", label: "calm ↔ chaos", type: "range", min: 0, max: 1, step: 0.01, value: 0.22, fmt: v => v < 0.2 ? "calm" : v < 0.5 ? "restless" : v < 0.8 ? "wild" : "chaos" },
    { id: "density", label: "Density", type: "range", min: 6, max: 30, step: 1, value: 18, fmt: v => v + " blades per row" },
    { id: "wind", label: "Wind", type: "range", min: -1, max: 1, step: 0.01, value: 0.35, fmt: v => (v < -0.05 ? "← " : v > 0.05 ? "→ " : "") + Math.abs(v).toFixed(2) },
    { id: "prompt", label: "Describe a change, then press Enter", type: "text", value: "grass in a gentle breeze", maxlength: 80,
      enter(S, inp) { Lineage._rubinHear && Lineage._rubinHear(S, inp.value); } },
  ],
  actions: [{ label: "Vibe", run(S) { Lineage._rubinVibe && Lineage._rubinVibe(S); } }],
  setP(id, v) { const el = document.getElementById("p-" + id); if (el) { el.value = v; el.dispatchEvent(new Event("input")); } },
  init(S) {
    const self = this; S.st.seed = 0.7; S.st.heard = ""; S.st.shown = String(S.p.prompt);
    Lineage._rubinVibe = S2 => {
      const r = Math.random, cl = (v, a, b) => Math.max(a, Math.min(b, v));
      self.setP("chaos", cl(S2.p.chaos + (r() - 0.5) * 0.24, 0, 1).toFixed(2));
      self.setP("wind", cl(S2.p.wind + (r() - 0.5) * 0.4, -1, 1).toFixed(2));
      self.setP("density", Math.round(cl(S2.p.density + (r() - 0.5) * 6, 6, 30)));
      S2.st.seed = r() * 10; S2.st.heard = "vibe: a gentle nudge"; S2.st.shown = "just a little different";
    };
    Lineage._rubinHear = (S2, text) => {
      // a toy: real vibe coding sends your words to a language model; here we only spot a few words
      const t = String(text || "").toLowerCase(), got = [], cl = (v, a, b) => Math.max(a, Math.min(b, v));
      let c = S2.p.chaos, w = S2.p.wind, d = S2.p.density;
      if (/calm|still|gentle|quiet|soft|peace/.test(t)) { c -= 0.2; w *= 0.6; got.push("calmer"); }
      if (/wild|chaos|storm|rough|angry|energ|gust/.test(t)) { c += 0.25; w += Math.sign(w || 1) * 0.25; got.push("wilder"); }
      if (/dense|denser|thick|more|lush|full/.test(t)) { d += 5; got.push("denser"); }
      if (/sparse|less|fewer|thin|empty|minimal/.test(t)) { d -= 5; got.push("sparser"); }
      if (/left|west/.test(t)) { w = -Math.abs(w || 0.4); got.push("wind left"); }
      if (/right|east/.test(t)) { w = Math.abs(w || 0.4); got.push("wind right"); }
      if (/no wind|windless|still air/.test(t)) { w = 0; got.push("no wind"); }
      else if (/wind|breeze|blow/.test(t) && !got.length) { w = cl(w + Math.sign(w || 1) * 0.2, -1, 1); got.push("windier"); }
      self.setP("chaos", cl(c, 0, 1).toFixed(2)); self.setP("wind", cl(w, -1, 1).toFixed(2)); self.setP("density", Math.round(cl(d, 6, 30)));
      S2.st.heard = got.length ? "heard: " + got.join(", ") : "not sure what that means: try calmer, wilder, denser";
      S2.st.shown = String(text || "").trim().slice(0, 48) || "…";
    };
  },
  layout(S) {
    const { box, narrow } = S, st = S.st, fs = S.fs;
    st.fx = box.x + box.w * 0.06; st.fw = box.w * 0.88;
    st.fy = box.y + box.h * (narrow ? 0.27 : 0.25); st.fh = box.h * (narrow ? 0.6 : 0.62);
  },
  entry(S) { const st = S.st; return [st.fx - S.iw, st.fy + st.fh]; },
  draw(S, k, ft) {
    const st = S.st, C = S.C, iw = S.iw, fs = S.fs, lab = Math.max(12, fs * 0.85);
    const kA = S.ease(k / 0.4), kB = S.ease((k - 0.3) / 0.4), kC = S.ease((k - 0.66) / 0.34);
    const cols = Math.round(S.p.density), rows = Math.max(5, Math.round(cols * 0.5 * (st.fh / st.fw) * 1.7));
    const ch = S.p.chaos, wind = S.p.wind, sd = st.seed, t = ft;
    const gx = st.fw / (cols - 1), gy = st.fh / rows, L = gy * 1.55;
    // one continuous line: from the bottom row up, along each row (alternating direction), up every blade and back down
    const pts = [];
    for (let rr = 0; rr < rows; rr++) {
      const r = rows - 1 - rr, y0 = st.fy + (r + 1) * gy;
      for (let j = 0; j < cols; j++) {
        const c = rr % 2 ? cols - 1 - j : j, x = st.fx + c * gx;
        const u = c / cols, v = r / rows, y = y0 + Math.sin(u * 6.3 + r * 1.7 + sd) * gy * 0.16;
        const sway = Math.sin(t * 1.3 + u * 5 + v * 2 + sd) * 0.2 + Math.sin(t * 0.7 + u * 2.3 + sd * 2) * 0.12; // calm breathing
        const noise = Math.sin(u * 13.1 + t * 2.9 + sd * 5) * Math.cos(v * 11.7 - t * 2.1) + Math.sin(u * 27 - v * 19 + t * 4.3 + sd);
        const a = wind * 0.8 + sway * (1 - ch * 0.5) + noise * ch * 0.95;
        const len = L * (0.7 + 0.3 * Math.sin(u * 7 + v * 5 + sd * 3));
        const m = [x + Math.sin(a * 0.45) * len * 0.5, y - Math.cos(a * 0.45) * len * 0.5];
        const tip = [m[0] + Math.sin(a) * len * 0.5, m[1] - Math.cos(a) * len * 0.5];
        pts.push([x, y], m, tip, m, [x, y]);
      }
    }
    const nShow = Math.max(2, Math.round(pts.length * kA));
    S.line(pts.slice(0, nShow), { w: Math.max(0.9, iw * 0.34), color: C.ink });
    if (kA < 1) { const p = pts[nShow - 1]; S.dot(p[0], p[1], iw * 0.9, C.ink); }
    // the idea and the AI beat: a sentence in plain words becomes the art
    if (kB > 0) {
      const q = "“" + st.shown + "”", tx = S.box.x + S.box.w / 2, ty = S.box.y + S.box.h * (S.narrow ? 0.15 : 0.15);
      S.text(q, tx, ty, { size: lab * (S.narrow ? 1.0 : 1.2), color: kC > 0 ? C.accent : C.ink, alpha: kB });
      S.arrow(tx, ty + lab * 0.7, tx, st.fy - lab * 0.4, { w: iw * 0.5, color: kC > 0 ? C.accent : C.soft, alpha: kB });
      if (st.heard) S.text(st.heard, tx, st.fy + st.fh + lab * 1.6, { size: lab * 0.85, color: C.soft, alpha: kB, italic: false, mono: true });
    }
    if (kC > 0) {
      const tx = S.box.x + S.box.w / 2, ty = S.box.y + S.box.h * (S.narrow ? 0.15 : 0.15);
      S.text("vibe coding: say what you want, judge it by feel", tx, ty - lab * 1.7, { size: lab * 0.9, color: C.accent, alpha: kC });
    }
    const mood = ch < 0.2 ? "calm" : ch < 0.5 ? "restless" : ch < 0.8 ? "wild" : "chaos";
    return `one line, ${rows * cols} blades · ${mood} · wind ${wind < 0 ? "←" : "→"} ${Math.abs(wind).toFixed(2)}`;
  },
  code(S) {
    const cols = Math.round(S.p.density);
    return `${S.c("# one line through a field of grass")}
for row in range(rows):
    for x in along(row, ${S.v(cols)} blades):          ${S.c("# back and forth")}
        a = ${S.v(S.p.wind.toFixed(2))}*0.75 + breathe(x, t) + ${S.v(S.p.chaos.toFixed(2))}*noise(x, t)
        line_to(x)                     ${S.c("# down to the root")}
        line_to(x + sin(a), up(cos(a)))  ${S.c("# up the blade")}
        line_to(x)                     ${S.c("# and back")}

${S.c("# a toy reads a few words; vibe coding gives")}
${S.c("# your whole sentence to an AI that rewrites this")}`;
  },
});
