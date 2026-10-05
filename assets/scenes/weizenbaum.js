// Joseph Weizenbaum — a working mini ELIZA (DOCTOR-style keyword rules) → how each reply is assembled → the ELIZA effect
(function () {
  const FAM = "mother|father|mum|mom|dad|sister|brother|family|parents|wife|husband";
  const RULES = [
    { key: "alike", rank: 10, show: "* alike *", re: /\balike\b/, out: ["IN WHAT WAY?", "WHAT RESEMBLANCE DO YOU SEE?"] },
    { key: "computer", rank: 8, show: "* computer *", re: /\b(computers?|machines?|robots?|ai)\b/, out: ["DO COMPUTERS WORRY YOU?", "WHY DO YOU MENTION COMPUTERS?", "WHAT DO YOU THINK MACHINES HAVE TO DO WITH YOUR PROBLEM?"] },
    { key: "always", rank: 5, show: "* always *", re: /\balways\b/, out: ["CAN YOU THINK OF A SPECIFIC EXAMPLE?", "WHEN?", "REALLY, ALWAYS?"] },
    { key: "family", rank: 5, show: "* mother|father|… *", re: new RegExp(`\\b(${FAM})\\b`), out: ["TELL ME MORE ABOUT YOUR FAMILY", "WHO ELSE IN YOUR FAMILY COMES TO MIND?", "YOUR {1}?"] },
    { key: "dream", rank: 4, show: "* dream *", re: /\bdream(s|t|ed)?\b/, out: ["WHAT DOES THAT DREAM SUGGEST TO YOU?", "DO YOU DREAM OFTEN?"] },
    { key: "i feel", rank: 4, show: "* i feel *", re: /\bi feel (.+)/, out: ["DO YOU OFTEN FEEL {1}?", "TELL ME MORE ABOUT FEELING {1}"] },
    { key: "i am", rank: 3, show: "* i am *", re: /\b(?:i am|i'm|im) (.+)/, out: ["HOW LONG HAVE YOU BEEN {1}?", "DO YOU BELIEVE IT IS NORMAL TO BE {1}?", "IS IT BECAUSE YOU ARE {1} THAT YOU CAME TO ME?"] },
    { key: "can you", rank: 3, show: "* can you *", re: /\bcan you (.+)/, out: ["YOU BELIEVE I CAN {1}, DON'T YOU?", "WHY DO YOU ASK IF I CAN {1}?"] },
    { key: "you … me", rank: 3, show: "* you * me *", re: /\byou (.+) me\b/, out: ["WHAT MAKES YOU THINK I {1} YOU?", "DOES IT PLEASE YOU TO BELIEVE I {1} YOU?"] },
    { key: "because", rank: 2, show: "* because *", re: /\bbecause\b/, out: ["IS THAT THE REAL REASON?", "WHAT OTHER REASONS COME TO MIND?"] },
    { key: "my", rank: 2, show: "* my *", re: /\bmy (.+)/, out: ["YOUR {1}", "WHY DO YOU SAY YOUR {1}?", "DOES THAT HAVE ANYTHING TO DO WITH THE FACT THAT YOUR {1}?"] },
    { key: "sorry", rank: 1, show: "* sorry *", re: /\bsorry\b/, out: ["PLEASE DON'T APOLOGISE", "APOLOGIES ARE NOT NECESSARY"] },
    { key: "hello", rank: 1, show: "* hello *", re: /\b(hello|hi|hey)\b/, out: ["HOW DO YOU DO. PLEASE STATE YOUR PROBLEM"] },
    { key: "yes / no", rank: 1, show: "yes | no", re: /\b(yes|no)\b/, out: ["YOU SEEM QUITE SURE", "WHY {1}?"] },
  ];
  const NONE = { key: "(none)", rank: 0, show: "no keyword", out: ["PLEASE GO ON", "I SEE", "WHAT DOES THAT SUGGEST TO YOU?", "CAN YOU ELABORATE ON THAT?"] };
  const REFL = { i: "you", me: "you", my: "your", am: "are", "i'm": "you're", im: "you're", myself: "yourself", you: "I", your: "my", yours: "mine", "you're": "I'm", yourself: "myself", mine: "yours", "i've": "you've", "i'd": "you'd" };
  const SEED = ["Men are all alike.", "They're always bugging us about something or other.", "Well, my boyfriend made me come here."];
  const cleanIn = s => String(s || "").toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  function reflect(frag) {
    const w = frag.split(" ").filter(Boolean).slice(0, 9), out = [], swaps = [];
    for (let i = 0; i < w.length; i++) {
      if (w[i] === "you" && w[i + 1] === "are") { out.push("I", "am"); swaps.push("you are→I am"); i++; continue; }
      const r = REFL[w[i]]; if (r) { out.push(r); swaps.push(`${w[i]}→${r.toLowerCase()}`); } else out.push(w[i]);
    }
    return { text: out.join(" "), swaps };
  }
  function eliza(st, raw) {
    const s = cleanIn(raw);
    const cands = RULES.map((r, i) => ({ r, i, m: s.match(r.re) })).filter(c => c.m).sort((a, b) => b.r.rank - a.r.rank || (a.m.index - b.m.index));
    const c = cands[0];
    const rule = c ? c.r : NONE, n = (st.count[rule.key] = (st.count[rule.key] || 0) + 1) - 1;
    let tpl = rule.out[n % rule.out.length], frag = "", refl = { text: "", swaps: [] };
    if (c && c.m[1] != null && /\{1\}/.test(tpl)) { frag = c.m[1].replace(/'$/, ""); refl = reflect(frag); }
    else if (/\{1\}/.test(tpl)) tpl = rule.out[0].includes("{1}") ? "PLEASE GO ON" : rule.out[0];
    const reply = tpl.replace("{1}", refl.text.toUpperCase());
    // which words of the raw input carry the keyword / the captured part
    const words = String(raw).trim().split(/\s+/).filter(Boolean), keyW = new Set(), capW = new Set();
    if (c) {
      const kw = (c.m[1] != null && c.m[0].endsWith(c.m[1]) && c.m[0] !== c.m[1] ? c.m[0].slice(0, c.m[0].length - c.m[1].length) : c.m[0]).trim().split(" ").map(x => x.replace(/'/g, "")), fw = frag.split(" ").filter(Boolean);
      words.forEach((w, i) => { const cw = cleanIn(w).replace(/'/g, ""); if (kw.includes(cw) && keyW.size < kw.length && !capW.has(i)) keyW.add(i); });
      if (fw.length) { const cl = words.map(w => cleanIn(w)); for (let i = 0; i + fw.length <= cl.length; i++) if (fw.every((f, j) => cl[i + j] === f)) { fw.forEach((_, j) => capW.add(i + j)); break; } }
    }
    return { reply, rule, tpl, frag, refl, keyW, capW, cands: cands.length };
  }
  function say(S, text) {
    const st = S.st; text = String(text || "").trim().slice(0, 90); if (!text) return;
    const r = eliza(st, text);
    st.msgs.forEach(m => { if (m.who === "e") m.t = 999; });
    st.msgs.push({ who: "u", text, keyW: r.keyW, capW: r.capW }); st.msgs.push({ who: "e", text: r.reply, t: 0 });
    st.last = r; if (st.msgs.length > 24) st.msgs.splice(0, st.msgs.length - 24);
  }
  function reset(S) { const st = S.st; st.msgs = []; st.count = {}; st.last = null; SEED.forEach(t => say(S, t)); st.msgs.forEach(m => { if (m.who === "e") m.t = 999; }); }
  function font(fs, mono, italic, weight) { return `${italic ? "italic " : ""}${weight || 400} ${fs.toFixed(1)}px ${mono ? '"IBM Plex Mono", monospace' : "Newsreader, Georgia, serif"}`; }
  function wrap(ctx, words, maxW) { // -> lines of [wordIndex...]
    const lines = []; let cur = [], w = 0; const sp = ctx.measureText(" ").width;
    words.forEach((wd, i) => { const ww = ctx.measureText(wd).width; if (cur.length && w + sp + ww > maxW) { lines.push(cur); cur = []; w = 0; } w += (cur.length ? sp : 0) + ww; cur.push(i); });
    if (cur.length) lines.push(cur); return lines;
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  Lineage.scene({
    params: [
      { id: "say", label: "Type to ELIZA, then press Enter", type: "text", value: "I feel nobody listens to me", maxlength: 90, enter: (S, inp) => { say(S, inp.value); inp.value = ""; S.p.say = ""; } },
      { id: "rules", label: "Show the rules", type: "toggle", value: true },
      { id: "speed", label: "Typing speed", type: "range", min: 0.2, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1) + "×" },
    ],
    actions: [{ label: "New session", run: S => reset(S) }],
    init(S) { reset(S); },
    layout(S) {
      const { box: b, narrow, fs } = S;
      const showR = S.p.rules && !narrow;
      const cw = showR ? b.w * 0.64 : b.w;
      Object.assign(S.st, { cx: b.x, cw, rx: b.x + b.w * 0.7, rw: b.w * 0.3 });
    },
    onParam(S, id) { if (id === "rules") this.layout(S); },
    entry(S) { return [S.box.x - S.fs * 0.6, S.box.y + S.box.h * (S.narrow ? 0.05 : 0.12)]; },
    draw(S, k, ft, dt) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, nar = S.narrow, b = S.box;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.3) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      const showR = S.p.rules && !nar, cx = b.x + (nar ? 0 : b.w * 0.05), cw = (showR ? b.w * 0.64 : b.w) - (cx - b.x), bb = b.y + b.h - (nar ? fs * 1.4 : 0);
      // typing
      const last = st.msgs[st.msgs.length - 1];
      if (last && last.who === "e" && last.t < 999) last.t += (dt || 0) * 28 * (S.p.speed || 1);
      // visible messages: seed revealed with k1
      const nSeed = SEED.length * 2, vis = Math.max(1, Math.ceil(k1 * nSeed));
      const msgs = st.msgs.slice(0, Math.max(vis, st.msgs.length > nSeed ? st.msgs.length : vis));
      // layout bubbles from the bottom of the chat area up
      const ufs = fs * (nar ? 0.88 : 0.95), efs = fs * (nar ? 0.74 : 0.8), pad = fs * 0.45, lh = fs * (nar ? 1.1 : 1.22);
      const asmH = k2 > 0 ? fs * (nar ? 4.3 : 5.2) : 0, accH = fs * (nar ? 2.4 : 2.8), rulesH = S.p.rules && nar ? fs * 2.6 : 0;
      const chatTop = b.y + fs * 0.4, chatBot = bb - asmH - accH - rulesH - fs * 0.8;
      const maxBW = cw * (nar ? 0.8 : 0.76);
      const laid = [];
      let y = chatBot;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i], isE = m.who === "e";
        const txt = isE ? m.text.slice(0, Math.floor(Math.min(m.t, m.text.length))) || " " : m.text;
        ctx.font = isE ? font(efs, true, false, 500) : font(ufs, false, true, 400);
        const words = txt.split(/\s+/).filter(Boolean); if (!words.length) words.push(" ");
        const lines = wrap(ctx, words, maxBW - pad * 2), bw = Math.min(maxBW, Math.max(...lines.map(l => ctx.measureText(l.map(j => words[j]).join(" ")).width)) + pad * 2);
        const bh = lines.length * lh + pad * 1.3;
        y -= bh; if (y < chatTop) break;
        laid.unshift({ m, isE, words, lines, bw, bh, y, x: isE ? cx : cx + cw - bw });
        y -= fs * 0.55;
      }
      for (const L of laid) {
        const { m, isE, words, lines, bw, bh, x } = L, ytop = L.y;
        ctx.save(); ctx.globalAlpha = k1; rrect(ctx, x, ytop, bw, bh, fs * 0.5); ctx.fillStyle = C.paper; ctx.fill();
        ctx.lineWidth = iw * (isE ? 0.55 : 0.4); ctx.strokeStyle = isE ? C.ink : C.soft; ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha = k1; ctx.font = isE ? font(efs, true, false, 500) : font(ufs, false, true, 400); ctx.fillStyle = C.ink; ctx.textBaseline = "alphabetic";
        const sp = ctx.measureText(" ").width;
        lines.forEach((ln, li) => {
          let xx = x + pad; const yy = ytop + pad * 0.65 + (li + 0.78) * lh;
          ln.forEach(j => {
            const w = ctx.measureText(words[j]).width; ctx.fillText(words[j], xx, yy);
            if (!isE && k2 > 0 && m === (st.msgs[st.msgs.length - 2])) {
              if (m.keyW.has(j)) { ctx.save(); ctx.globalAlpha = k2; ctx.strokeStyle = C.ink; ctx.lineWidth = iw * 0.6; ctx.beginPath(); ctx.moveTo(xx, yy + fs * 0.22); ctx.lineTo(xx + w, yy + fs * 0.22); ctx.stroke(); ctx.restore(); }
              else if (m.capW.has(j)) { ctx.save(); ctx.globalAlpha = k2; ctx.strokeStyle = C.ink; ctx.setLineDash([2, 3]); ctx.lineWidth = iw * 0.4; ctx.beginPath(); ctx.moveTo(xx, yy + fs * 0.22); ctx.lineTo(xx + w + sp, yy + fs * 0.22); ctx.stroke(); ctx.restore(); }
            }
            xx += w + sp;
          });
        });
        ctx.restore();
        if (isE && m === laid[laid.length - 1].m && m.t < m.text.length && Math.floor(ft * 3) % 2 === 0) S.text("▍", x + bw - pad * 0.6, ytop + bh - pad * 0.5, { size: efs, halo: false, italic: false });
      }
      if (laid.length) {
        const l0 = laid.find(L => L.isE);
        if (l0 && !nar) S.text("ELIZA", l0.x + fs * 0.3, l0.y - fs * 0.25, { size: fs * 0.72, align: "left", color: C.soft, italic: false, mono: true, alpha: k1 });
      }
      // how the reply was built
      const r = st.last;
      if (k2 > 0 && r) {
        let ay = chatBot + fs * 1.5; const ax = cx, s1 = fs * (nar ? 0.78 : 0.85);
        const kwTxt = r.rule === NONE ? "no keyword found → stock reply" : `keyword “${r.rule.key}” (rank ${r.rule.rank})${r.cands > 1 ? `, beats ${r.cands - 1} other${r.cands > 2 ? "s" : ""}` : ""}`;
        S.text("1  " + kwTxt, ax, ay, { size: s1, align: "left", alpha: k2 }); ay += fs * (nar ? 1.05 : 1.2);
        const f = r.frag ? `“${r.frag.split(" ").slice(0, nar ? 4 : 7).join(" ")}${r.frag.split(" ").length > (nar ? 4 : 7) ? " …" : ""}”` : "";
        S.text("2  " + (r.rule === NONE ? "pattern: none" : `pattern ${r.rule.show}`) + (f ? `  →  {1} = ${f}` : ""), ax, ay, { size: s1, align: "left", alpha: k2 }); ay += fs * (nar ? 1.05 : 1.2);
        if (!nar) { S.text("3  " + (r.refl.swaps.length ? `swap pronouns: ${r.refl.swaps.slice(0, 4).join(", ")}` : "no pronouns to swap"), ax, ay, { size: s1, align: "left", alpha: k2 }); ay += fs * 1.2; }
        S.text((nar ? "3  " : "4  ") + "template:", ax, ay, { size: s1, align: "left", alpha: k2 });
        ctx.save(); ctx.font = font(s1, false, true, 400); const tw = ctx.measureText((nar ? "3  " : "4  ") + "template: ").width; ctx.restore();
        S.text(r.tpl, ax + tw, ay, { size: s1 * 0.92, align: "left", mono: true, italic: false, alpha: k2 });
      }
      // rules panel
      if (k2 > 0 && S.p.rules) {
        if (!nar) {
          const rx = b.x + b.w * 0.7, rw = b.w * 0.3, rh = Math.min(fs * 1.45, (chatBot - b.y - fs * 2) / (RULES.length + 1));
          S.text("DOCTOR script (part)", rx, b.y + fs * 0.9, { size: fs * 0.85, align: "left", color: C.soft, alpha: k2 });
          [...RULES, NONE].forEach((ru, i) => {
            const yy = b.y + fs * 1.6 + (i + 0.75) * rh, hit = r && r.rule === ru;
            if (hit) S.rect(rx - fs * 0.3, yy - rh * 0.72, rw, rh * 0.95, { w: iw * 0.6, color: C.ink, alpha: k2 });
            S.text(ru.key, rx, yy, { size: Math.min(fs * 0.82, rh * 0.68), align: "left", mono: true, italic: false, weight: hit ? 600 : 400, color: hit ? C.ink : C.soft, alpha: k2 });
            S.text(String(ru.rank), rx + rw - fs * 0.8, yy, { size: Math.min(fs * 0.78, rh * 0.62), align: "right", mono: true, italic: false, color: C.soft, alpha: k2 });
          });
          S.text("rank", rx + rw - fs * 0.8, b.y + fs * 0.9, { size: fs * 0.72, align: "right", color: C.soft, alpha: k2 });
        } else {
          let xx = cx, yy = chatBot + asmH + fs * 0.95; const s2 = fs * 0.72;
          ctx.save(); ctx.font = font(s2, true, false, 400);
          for (const ru of RULES) { const w = ctx.measureText(ru.key).width + fs * 0.6; if (xx + w > cx + cw) { xx = cx; yy += fs * 1.1; } const hit = r && r.rule === ru;
            S.text(ru.key, xx, yy, { size: s2, align: "left", mono: true, italic: false, weight: hit ? 600 : 400, color: hit ? C.ink : C.soft, alpha: k2 });
            if (hit) S.line([[xx, yy + 3], [xx + w - fs * 0.6, yy + 3]], { w: iw * 0.5, color: C.ink, alpha: k2 }); xx += w; }
          ctx.restore();
        }
      }
      // the ELIZA effect
      if (k3 > 0) {
        const ty = bb - accH + fs * 0.9;
        S.text(nar ? "The ELIZA effect: it feels understood," : "The ELIZA effect: it feels like understanding, but it is only pattern matching.", cx, ty, { size: fs * (nar ? 0.85 : 0.92), align: "left", color: C.accent, weight: 500, alpha: k3 });
        S.text(nar ? "but it is only matching patterns" : "Today's chatbots are far more capable, and the effect is stronger than ever.", cx, ty + fs * 1.2, { size: fs * 0.85, align: "left", color: C.accent, alpha: k3 });
      }
      return r ? `rule “${r.rule.key}” matched · reply built from a template · ${st.msgs.length / 2} exchange${st.msgs.length === 2 ? "" : "s"}` : "";
    },
    code(S) {
      const r = S.st.last; if (!r) return "";
      const esc = x => String(x).replace(/"/g, "'");
      return `${S.c("# ELIZA (1966): keyword → pattern → template")}
words = clean(user_input)
rule = highest_rank(keywords_in(words))    ${S.c(`# "${r.rule.key}", rank ${r.rule.rank}`)}
parts = match(rule.pattern, words)         ${S.c(`# ${r.rule.show}`)}
part = swap_pronouns(parts[1])             ${S.c(r.refl.swaps.length ? "# " + r.refl.swaps.slice(0, 3).join(", ") : "# I→you, my→your, me→you")}
template = rule.next_template()            ${S.c("# cycles through the list")}
reply = template.fill(part)
${S.c("# reply:")} ${S.v('"' + esc(r.reply) + '"')}`;
    },
  });
})();
