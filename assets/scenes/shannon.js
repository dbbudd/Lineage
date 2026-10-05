// Claude Shannon — n-gram approximations to English (1948) → entropy in bits → cross-entropy loss of next-token prediction
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  // a plain English passage (written for this card) that the models learn their statistics from
  const PASSAGE = `the most important thing about a message is that the person at the other end does not yet know what it says.
if you could guess every letter before it arrived there would be no reason to send it at all. so the amount of
information in a message is really a measure of surprise. when the next letter is easy to predict it tells you very
little, and when it is hard to predict it tells you a great deal. english is full of patterns. after the letter q
there is almost always a u, after a full stop there is usually a space and a new sentence, and the word the turns up
again and again. these habits make the language easier to read and easier to hear over a noisy line, but they also
mean that much of what we write could be left out without losing the meaning. a careful engineer can use this fact.
if the patterns are known in advance, the sender and the receiver can agree on a shorter code, giving short signals
to common letters and longer signals to rare ones, just as the telegraph operators did with their dots and dashes.
the same idea tells us how fast we can send messages through a wire or through the air when the signal is mixed with
noise. there is a limit, and no clever trick can beat it, but with good codes we can come as close to that limit as we
like. to find out how predictable english really is, we can play a simple game. one person thinks of a sentence and
the other tries to guess it one letter at a time. at the start of a word the guesses are often wrong, but near the end
of a long word they are nearly always right. counting the guesses gives a number for the surprise of each letter, and
the average over a whole book is the entropy of the language. it turns out to be close to one bit for every letter,
which means that english is about three quarters predictable. a machine that has read enough text can play the same
game, and the better it plays the less it is surprised by what comes next. that is all there is to it, and yet from
this one small idea came the codes that carry our phone calls, our pictures and our music across the world.`;
  const AL = "abcdefghijklmnopqrstuvwxyz ";
  const TEXT = PASSAGE.toLowerCase().replace(/[^a-z]+/g, " ").replace(/\s+/g, " ");
  // Shannon 1951, 27-letter alphabet: F0..F3 in bits per letter, and ~1 bit from long-context guessing
  const F = [4.76, 4.03, 3.32, 3.1];
  const NAMES = ["order 0: every letter equally likely", "order 1: letters by frequency", "order 2: each letter from the one before", "order 3: each letter from the two before"];
  const TICK = 0.12;

  const tables = [];
  for (let n = 1; n <= 3; n++) {
    const T = new Map();
    for (let i = n - 1; i < TEXT.length; i++) {
      const ctx = TEXT.slice(i - (n - 1), i), ch = TEXT[i];
      let row = T.get(ctx); if (!row) T.set(ctx, (row = new Float64Array(27)));
      row[AL.indexOf(ch)]++;
    }
    tables[n] = T;
  }
  function dist(order, hist, temp) {
    let row = null;
    if (order === 0) row = new Float64Array(27).fill(1);
    else for (let n = order; n >= 1 && !row; n--) { const c = hist.slice(hist.length - (n - 1)); if (hist.length >= n - 1) row = tables[n].get(n === 1 ? "" : c) || null; }
    if (!row) row = tables[1].get("");
    let p = Array.from(row), s = p.reduce((a, b) => a + b, 0);
    p = p.map(v => v / s);
    const raw = p.slice();
    if (Math.abs(temp - 1) > 1e-3) { p = p.map(v => (v > 0 ? Math.pow(v, 1 / temp) : 0)); s = p.reduce((a, b) => a + b, 0); p = p.map(v => v / s); }
    let H = 0; for (const v of p) if (v > 0) H -= v * Math.log2(v);
    return { p, raw, H };
  }

  function fresh(S) {
    const st = S.st;
    st.txt = ""; st.rnd = S.rng(1948 + (+S.p.order) * 7); st.next = st.ft || 0; st.last = null; st.picked = -1; st.surp = 0;
    st.sumS = 0; st.nS = 0;
  }
  function emit(S) {
    const st = S.st, o = +S.p.order, d = dist(o, st.txt, +S.p.temp);
    let r = st.rnd(), i = 0; for (; i < 26; i++) { r -= d.p[i]; if (r <= 0) break; }
    if (st.txt.endsWith(" ") && i === 26) { i = AL.indexOf("e"); }
    st.last = d; st.picked = i; st.surp = -Math.log2(Math.max(1e-9, d.p[i]));
    st.sumS += st.surp; st.nS++;
    st.txt += AL[i];
    st.ctxNow = o > 1 ? st.txt.slice(-(o - 1)) : "";
  }

  Lineage.scene({
    params: [
      { id: "order", label: "Order (letters of context + 1)", type: "range", min: 0, max: 3, step: 1, value: 3, fmt: v => ["0 · random", "1 · frequency", "2 · digram", "3 · trigram"][v] },
      { id: "temp", label: "Temperature", type: "range", min: 0.2, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) },
      { id: "speed", label: "Typing speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    init(S) { fresh(S); },
    reset(S) { fresh(S); },
    onParam(S, id) { if (id === "order") fresh(S); },
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      const tsz = fs * (n ? 0.86 : 1.0), cw = tsz * 0.6;
      const cols = Math.max(12, Math.floor((B.w - fs * 0.6) / cw) - 1), lines = n ? 2 : 4;
      const textY = B.y + fs * 2.4, lh = tsz * 1.45;
      const barTop = textY + lh * (lines - 1) + fs * (n ? 1.6 : 2.4);
      const barH = B.h * (S.narrow ? 0.17 : 0.25), barBase = barTop + barH;
      const chartTop = barBase + fs * (n ? 2.4 : 3.6), chartBot = (S.narrow ? Math.max(B.y + B.h * 0.84, S.P.y0 + fs * 0.6) : B.y + B.h) - fs * (n ? 1.2 : 1.8);
      Object.assign(S.st, { tsz, cw, cols, lines, textY, lh, barTop, barH, barBase, chartTop, chartBot });
    },
    entry(S) { return [S.box.x - S.fs * 0.2, S.st.textY - S.st.tsz * 0.3]; },
    draw(S, k, ft) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S), o = +S.p.order;
      st.ft = ft;
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.35), k3 = S.ease((k - 0.65) / 0.35);
      if (k1 <= 0.3) st.next = ft;
      let guard = 0;
      while (ft >= st.next && guard++ < 40) { emit(S); st.next += TICK; }
      if (ft - st.next > 2) st.next = ft;
      // 1. generated text, Shannon-style
      S.text(NAMES[o], B.x, B.y + fs * 0.9, { size: fs * 1.05, align: "left", color: C.ink, alpha: k1 });
      const perLine = st.cols;
      if (st.txt.length > perLine * (st.lines + 4)) st.txt = st.txt.slice(perLine * 4);
      const all = st.txt, lastStart = Math.floor(Math.max(0, all.length - 1) / perLine) * perLine;
      const start = Math.max(0, lastStart - (st.lines - 1) * perLine), ln = [];
      for (let i = start; i < all.length; i += perLine) ln.push(all.slice(i, i + perLine));
      const ctxLen = o > 1 ? o - 1 : 0;
      ln.forEach((s, li) => {
        const y = st.textY + li * st.lh, last = li === ln.length - 1;
        S.text(last ? s.slice(0, s.length - 1 - ctxLen) : s, B.x + fs * 0.6, y, { size: st.tsz, align: "left", mono: true, italic: false, color: C.ink, alpha: k1 * (0.55 + 0.45 * (li + 1) / ln.length) });
        if (last && s.length) {
          const cx = B.x + fs * 0.6 + Math.max(0, s.length - 1 - ctxLen) * st.cw;
          const c = s.slice(Math.max(0, s.length - 1 - ctxLen), s.length - 1), nx = s.slice(-1);
          if (c) { S.text(c.replace(/ /g, "␣"), cx, y, { size: st.tsz, align: "left", mono: true, italic: false, color: C.accent, alpha: k1 });
            S.line([[cx, y + st.tsz * 0.3], [cx + c.length * st.cw, y + st.tsz * 0.3]], { w: iw * 0.5, color: C.accent, alpha: k1 }); }
          S.text(nx, cx + c.length * st.cw, y, { size: st.tsz, align: "left", mono: true, italic: false, color: C.accent, weight: 600, alpha: k1 });
          const ex = cx + (c.length + 1) * st.cw + 2;
          if ((ft * 2.5) % 1 < 0.6) S.line([[ex, y - st.tsz * 0.8], [ex, y + st.tsz * 0.15]], { w: iw * 0.5, color: C.ink, alpha: k1 });
        }
      });
      // 2. probability bars for the letter just chosen
      const d = st.last;
      if (d && k2 > 0) {
        const pk = st.picked, base = st.barBase, Hb = st.barH;
        let idx = AL.split("").map((_, i) => i);
        if (n) idx = idx.sort((a, b) => d.p[b] - d.p[a]).slice(0, 12);
        const m = idx.length, gap = B.w / m, bw = Math.max(3, gap * 0.56);
        const pmax = Math.max(0.12, ...d.p);
        S.line([[B.x, base], [B.x + B.w, base]], { w: iw * 0.4, color: C.soft, alpha: k2 });
        idx.forEach((i, j) => {
          const x = B.x + gap * (j + 0.5), h = (d.p[i] / pmax) * Math.max(4, Hb - bw * 0.6 - fs * 0.3) * k2, on = i === pk;
          if (h > 0.5) S.line([[x, base - bw * 0.5], [x, base - bw * 0.5 - h]], { w: bw, color: on ? C.accent : C.ink, alpha: on ? 1 : 0.55, });
          S.text(AL[i] === " " ? "␣" : AL[i], x, base + fs * 0.95, { size: fs * (n ? 0.78 : 0.8), mono: true, italic: false, color: on ? C.accent : C.ink, weight: on ? 600 : 400, alpha: k2 });
        });
        const ctxTxt = o <= 1 ? (o === 0 ? "no context" : "no context, just frequency") : `after “${(st.ctxNow != null ? st.txt.slice(-(o), -1) : "").replace(/ /g, "␣")}”`;
        S.text(`p(next letter), ${ctxTxt}`, B.x, st.barTop - fs * 0.5, { size: fs * 0.9, align: "left", color: C.soft, alpha: k2 });
        S.text(`H = ${d.H.toFixed(2)} bits`, B.x + B.w, st.barTop - fs * 0.5, { size: fs * 1.05, align: "right", color: C.accent, weight: 500, alpha: k2 });
      }
      // 3. entropy per letter (Shannon 1951) → cross-entropy loss of a language model
      if (k3 > 0 || k2 > 0.6) {
        const ka = Math.max(k3, (k2 - 0.6) / 0.4 * 0.0001);
        const x0 = B.x + fs * 1.8, x1 = B.x + B.w - fs * 0.4, y0 = st.chartBot, y1 = st.chartTop, ymax = 5;
        const X = u => x0 + (x1 - x0) * u, Y = b => y0 - (y0 - y1) * (b / ymax);
        const al = S.ease((k - 0.55) / 0.3);
        S.line([[x0, y1], [x0, y0], [x1, y0]], { w: iw * 0.4, color: C.soft, alpha: al });
        (n ? [0, 4] : [0, 2, 4]).forEach(b => S.text(String(b), x0 - fs * 0.5, Y(b) + fs * 0.3, { size: fs * 0.75, align: "right", color: C.soft, alpha: al }));
        S.text("bits per letter", x0 + fs * 0.3, y1 - fs * 0.35, { size: fs * 0.8, align: "left", color: C.soft, alpha: al });
        const us = [0.04, 0.17, 0.3, 0.43];
        const pts = F.map((f, i) => [X(us[i]), Y(f)]);
        S.line(pts, { w: iw * 0.7, color: C.ink, alpha: al });
        pts.forEach((p, i) => {
          const on = i === o; S.dot(p[0], p[1], on ? iw * 1.5 : iw * 0.9, on ? C.accent : C.ink, al);
          S.text("F" + i, p[0], y0 + fs * 1.0, { size: fs * 0.75, color: on ? C.accent : C.soft, alpha: al });
          if (on && !n) S.text(F[i].toFixed(2), p[0] + fs * 0.5, p[1] - fs * 0.55, { size: fs * 0.85, align: "left", color: C.accent, alpha: al });
        });
        if (k3 > 0) {
          // more context, less surprise: Shannon's guessing game gives about 1 bit; models are trained to push this down
          const ue = 0.97, curve = [];
          for (let i = 0; i <= 40; i++) { const u = us[3] + (ue - us[3]) * (i / 40) * k3; const b = 1 + (F[3] - 1) * Math.exp(-((u - us[3]) / (ue - us[3])) * 4.2); curve.push([X(u), Y(b)]); }
          S.line(curve, { w: iw * 0.9, color: C.accent, dash: [iw * 1.4, iw * 1.4], alpha: k3 });
          S.line([[X(us[3]), Y(1)], [x1, Y(1)]], { w: iw * 0.35, color: C.soft, dash: [iw, iw * 2], alpha: k3 });
          if (!n) S.text("≈ 1 bit: Shannon's 1951 guessing game", x1, Y(1) + fs * 1.1, { size: fs * 0.78, align: "right", color: C.soft, alpha: k3 });
          const lx = X(n ? 0.47 : 0.52), ly = n ? y1 + fs * 0.2 : Y(3.7);
          S.text(n ? "language models: next token," : "language models predict the next token,", lx, ly, { size: fs * (n ? 0.82 : 0.92), align: "left", color: C.accent, alpha: k3 });
          S.text(n ? "loss = −log₂ p, in bits" : "trained on cross-entropy: −log₂ p, in bits", lx, ly + fs * 1.15, { size: fs * (n ? 0.82 : 0.92), align: "left", color: C.accent, alpha: k3 });
          if (!n) S.text("more context →", x1, y0 + fs * 1.0, { size: fs * 0.75, align: "right", color: C.soft, alpha: k3 });
        }
      }
      if (!d) return "";
      const avg = st.nS ? st.sumS / st.nS : 0;
      return `${["random", "frequency", "digram", "trigram"][o]} · H = ${d.H.toFixed(2)} bits · picked “${AL[st.picked] === " " ? "space" : AL[st.picked]}” p = ${d.p[st.picked].toFixed(2)}, surprise ${st.surp.toFixed(2)} bits · average ${avg.toFixed(2)} bits/letter`;
    },
    code(S) {
      const o = +S.p.order, T = (+S.p.temp).toFixed(2), st = S.st;
      const H = st.last ? st.last.H.toFixed(2) : "…";
      return `${S.c("# Shannon 1948: fake English from letter statistics")}
counts = count_ngrams(passage, n=${S.v(o)})
context = text[-${S.v(Math.max(0, o - 1))}:]          ${S.c(o > 1 ? "# the last " + (o - 1) + " letter" + (o > 2 ? "s" : "") : o === 1 ? "# no context, just frequency" : "# order 0: all letters equal")}
p = counts[context] / counts[context].sum()
p = p ** (1 / ${S.v(T)});  p /= p.sum()    ${S.c("# temperature")}
nxt = random.choice(alphabet, p=p)
H = -sum(p * log2(p))                ${S.c("# entropy: " + H + " bits")}
loss = -log2(p[nxt])                 ${S.c("# surprise; LLMs minimise its average")}`;
    },
  });
})();
