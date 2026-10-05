// Joseph-Marie Jacquard — punched-card loom (1804): each card's holes lift warp threads for one row → the fabric grows row by row → the pattern as a grid of 1s and 0s, like image data for AI
Lineage.scene({
  params: [
    { id: "preset", label: "Card deck", type: "select", value: "diamond", options: [{ value: "diamond", label: "Diamond" }, { value: "heart", label: "Heart" }, { value: "twill", label: "Twill (diagonal)" }, { value: "check", label: "Chequerboard" }, { value: "letter", label: "Letter J" }] },
    { id: "speed", label: "Weaving speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  W: 16,
  make(name) {
    const W = 16, rows = [];
    const heart = ["................", "...111....111...", "..11111..11111..", ".11111111111111.", ".11111111111111.", ".11111111111111.", "..111111111111..", "...1111111111...", "....11111111....", ".....111111.....", "......1111......", ".......11.......", "................", "................", "................", "................"];
    const J = ["................", "....11111111....", "....11111111....", "........11......", "........11......", "........11......", "........11......", "........11......", "........11......", "...11...11......", "...11...11......", "....11111.......", ".....111........", "................", "................", "................"];
    for (let y = 0; y < W; y++) {
      const r = [];
      for (let x = 0; x < W; x++) {
        let v = false;
        if (name === "diamond") { const d = Math.abs(x - 7.5) + Math.abs(y - 7.5); v = Math.floor(d) % 4 < 2; }
        else if (name === "twill") v = (x + y) % 4 < 2;
        else if (name === "check") v = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
        else if (name === "heart") v = heart[y][x] === "1";
        else v = J[y][x] === "1";
        r.push(v);
      }
      rows.push(r);
    }
    return rows;
  },
  init(S) { S.st.cards = this.make(S.p.preset); S.st.tt = 12 * 1.6; },
  reset(S) { S.st.tt = 12 * 1.6; },
  onParam(S, id) { if (id === "preset") { S.st.cards = this.make(S.p.preset); S.st.tt = 12 * 1.6; } },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15, W = this.W;
    const L = side ? { x: b.x + b.w * 0.02, w: b.w * 0.56 } : { x: b.x + b.w * 0.04, w: b.w * 0.58 };
    const maxR = side ? 10 : 16, cell = Math.min(L.w / W, (side ? b.h * 0.92 : b.h * 0.92) / (maxR + 11.5));
    const lx = L.x + (L.w - cell * W) / 2;
    const cardY = b.y + b.h * (side ? 0.1 : 0.08), cardH = cell * 1.5;
    const threadTop = cardY + cardH + cell * 0.8, threadBot = threadTop + cell * 4.5;
    const fabY = threadBot + cell * 0.6;
    const bin = side ? { x: b.x + b.w * 0.62, y: b.y + b.h * 0.08, w: b.w * 0.37, h: b.h * 0.86 } : { x: b.x + b.w * 0.68, y: b.y + b.h * 0.06, w: b.w * 0.31, h: b.h * 0.88 };
    Object.assign(S.st, { maxR, side, cell, lx, cardY, cardH, threadTop, threadBot, fabY, bin });
  },
  entry(S) { const { lx, cardY, cardH, cell, fabY, maxR } = S.st; return S.narrow ? [lx - cell * 0.3, fabY + cell * maxR] : [lx - cell * 0.6, cardY + cardH * 0.5]; },
  pointer(S, type, x, y) {
    if (type !== "down") return;
    const st = S.st, W = this.W, { lx, cell, cardY, cardH } = st;
    if (y < cardY - 4 || y > cardY + cardH + 4 || x < lx || x > lx + cell * W) return;
    const i = Math.min(W - 1, Math.floor((x - lx) / cell)), n = Math.floor(st.tt / 1.6);
    const row = st.cards[n % W]; row[i] = !row[i];
  },
  draw(S, k, ft, dt) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs, W = this.W;
    const { cell, lx, cardY, cardH, threadTop, threadBot, fabY, bin, side, cards, maxR } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    const lf = fs * (side ? 0.78 : 0.88);
    st.tt += (dt || 0) * (S.p.speed ?? 1) * (k > 0.3 ? 1 : 0);
    const T = 1.6, n = Math.floor(st.tt / T), u = st.tt / T - n, card = cards[n % W];
    const lift = S.ease((u - 0.15) / 0.2) * (1 - S.ease((u - 0.88) / 0.12));
    // ---- the chain of cards: upcoming cards fan up behind the current one ----
    const cw = cell * W;
    for (let q = 3; q >= 1; q--) {
      const yy = cardY - q * cell * 0.55;
      S.line([[lx + q * cell * 0.3, yy], [lx + cw - q * cell * 0.3, yy]], { w: iw * 0.4, color: C.soft, alpha: k1 * (1 - q * 0.2) });
    }
    S.rect(lx, cardY, cw * k1, cardH, { color: C.ink, w: iw * 0.55, fill: C.paper });
    if (k1 > 0.5) for (let i = 0; i < W; i++) {
      const cx = lx + (i + 0.5) * cell, cy = cardY + cardH * 0.5, rr = cell * 0.27;
      if (card[i]) S.dot(cx, cy, rr, C.ink, k1); else S.circle(cx, cy, rr * 0.35, { w: 0.8, color: C.soft, alpha: k1 * 0.6 });
    }
    S.text(side ? "punched card: click a hole" : "punched card: click a hole to punch or fill it", lx + cw / 2, cardY - cell * 2.1 - lf * 0.2, { size: lf * 0.85, alpha: k1 });
    // ---- hooks and warp threads: lifted threads pass over the weft, the rest lie under it ----
    const thread = (i, over) => {
      const x = lx + (i + 0.5) * cell, up = card[i] ? lift : 0;
      if (!!card[i] && lift > 0.3 !== over) return;
      S.line([[x, cardY + cardH + up * cell * 0.4], [x, threadTop - up * cell * 0.5]], { w: iw * (up > 0.3 ? 0.5 : 0.3), color: up > 0.3 ? C.ink : C.soft, alpha: k1 * 0.9 });
      S.line([[x, threadTop - up * cell * 0.5], [x, threadBot]], { w: iw * (up > 0.3 ? 0.65 : 0.35), color: up > 0.3 ? C.ink : C.soft, alpha: k1 });
    };
    for (let i = 0; i < W; i++) thread(i, false);
    // the shuttle carrying the weft through the open shed
    if (k2 > 0) {
      const sp = Math.max(0, Math.min(1, (u - 0.38) / 0.45)), sy = threadTop + (threadBot - threadTop) * 0.62;
      const sx = lx - cell + (cw + cell * 2) * S.ease(sp);
      if (sp > 0 && sp < 1) {
        S.line([[lx - cell, sy], [sx, sy]], { w: iw * 0.45, color: C.accent, alpha: k2 });
        S.line([[sx - cell * 0.9, sy], [sx - cell * 0.4, sy - cell * 0.3], [sx + cell * 0.6, sy - cell * 0.3], [sx + cell * 0.9, sy], [sx + cell * 0.6, sy + cell * 0.3], [sx - cell * 0.4, sy + cell * 0.3]], { w: iw * 0.5, color: C.ink, close: true, fill: C.paper, alpha: k2 });
      }
      if (!side) S.text("shuttle", lx - cell * 1.2, sy + lf * 0.3, { size: lf * 0.8, align: "right", color: C.soft, alpha: k2 });
      if (!side) S.text("warp threads", lx + cw + cell * 0.6, threadTop + (threadBot - threadTop) * 0.4, { size: lf * 0.75, align: "left", color: C.soft, alpha: k2 });
    }
    for (let i = 0; i < W; i++) thread(i, true);
    // ---- the woven fabric: newest row at the top ----
    const rowsDone = n + (u > 0.85 ? 1 : 0);
    S.line([[lx - cell * 0.3, fabY - cell * 0.2], [lx + cw + cell * 0.3, fabY - cell * 0.2]], { w: iw * 0.7, color: C.ink, alpha: k1 });
    if (k1 > 0.6 && !side) S.text(side ? "cloth" : "the cloth grows, one card per row", lx + cw / 2, fabY + cell * maxR + lf * 1.2, { size: lf * 0.85, alpha: k1 });
    for (let r = 0; r < Math.min(rowsDone, maxR); r++) {
      const cn = rowsDone - 1 - r, row = cards[cn % W], y = fabY + r * cell;
      for (let i = 0; i < W; i++) {
        const x = lx + i * cell;
        if (row[i]) S.rect(x + cell * 0.08, y + cell * 0.06, cell * 0.84, cell * 0.88, { fill: C.ink, w: 0, alpha: k1 * 0.85 });
        else S.line([[x + cell * 0.1, y + cell * 0.5], [x + cell * 0.9, y + cell * 0.5]], { w: 0.9, color: C.soft, alpha: k1 * 0.7 });
      }
    }
    // ---- the same rows as binary data ----
    if (k3 > 0) {
      const { x, y, w, h } = bin, bf = Math.min(lf * 0.95, (w / 17) / 0.62, cell * 0.95);
      S.text(side ? "rows as data" : "rows as data", x + w / 2, y + lf * 0.2, { size: lf * 0.9, color: C.accent, weight: 500, alpha: k3 });
      const curY = cardY + cardH * 0.5 + bf * 0.35;
      S.text(card.map(b => (b ? "1" : "0")).join(""), x + w / 2, curY, { size: bf, mono: true, italic: false, color: C.accent, alpha: k3, halo: false });
      for (let r = 0; r < Math.min(rowsDone, maxR); r++) {
        const row = cards[(rowsDone - 1 - r) % W];
        S.text(row.map(b => (b ? "1" : "0")).join(""), x + w / 2, fabY + r * cell + cell * 0.5 + bf * 0.35, { size: bf, mono: true, italic: false, color: C.accent, alpha: k3 * (1 - r / (maxR + 4)), halo: false });
      }
      const ty = fabY + cell * maxR + lf * 1.2;
      S.text(side ? "like the pixels an" : "the same 1s and 0s", x + w / 2, ty, { size: lf * 0.8, color: C.accent, alpha: k3 });
      S.text(side ? "image AI reads" : "an image AI reads as pixels", x + w / 2, ty + lf * 1.05, { size: lf * 0.8, color: C.accent, alpha: k3 });
    }
    const holes = card.filter(Boolean).length;
    return `card ${(n % W) + 1} of ${W} · ${holes} holes lift ${holes} of ${W} threads · ${rowsDone} rows woven`;
  },
  code(S) {
    const st = S.st, W = this.W, n = Math.floor((st.tt || 0) / 1.6), cards = st.cards || this.make("diamond");
    const bits = r => r.map(b => (b ? "1" : "0")).join("");
    return `${S.c("# Jacquard loom: one punched card per row")}
cards = [
    "${S.v(bits(cards[n % W]))}",   ${S.c("# card " + ((n % W) + 1) + ", hole = 1")}
    "${bits(cards[(n + 1) % W])}",
    ...                       ${S.c("# " + W + " cards, then repeat")}
]
for card in cycle(cards):
    for i, hole in enumerate(card):
        if hole == "1": warp[i].lift()   ${S.c("# hook goes through")}
    throw_shuttle()                       ${S.c("# weft under lifted threads")}
    cloth.append(card)                    ${S.c("# a row of pixels")}`;
  },
});
