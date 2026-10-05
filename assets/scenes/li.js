// Fei-Fei Li — ImageNet: a WordNet tree of categories filled by crowd workers' labels → 14 million images → the ImageNet challenge error falling, with AlexNet's 2012 leap
(function () {
  const NARROW = S => S.narrow || S.box.w < 480, FS = S => (S.narrow ? S.fs : S.fs * Math.max(0.74, Math.min(1, S.box.w / 620)));
  // ILSVRC classification winners, top-5 error (%)
  const RES = [[2010, 28.2, "NEC-UIUC"], [2011, 25.8, "XRCE"], [2012, 15.3, "AlexNet (SuperVision)"], [2013, 11.7, "Clarifai"],
    [2014, 6.7, "GoogLeNet"], [2015, 3.57, "ResNet"], [2016, 2.99, "Trimps-Soushen"], [2017, 2.25, "SENet"]];
  const HUMAN = 5.1;
  // a corner of the WordNet hierarchy
  const TREE = { name: "entity", kids: [
    { name: "animal", kids: [
      { name: "mammal", kids: [
        { name: "dog", kids: [{ name: "husky", icon: "dog" }, { name: "beagle", icon: "dog2" }, { name: "dalmatian", icon: "dog3" }] },
        { name: "cat", kids: [{ name: "tabby", icon: "cat" }] }] },
      { name: "bird", kids: [{ name: "owl", icon: "bird" }] }] },
    { name: "artefact", kids: [{ name: "vehicle", kids: [{ name: "sports car", icon: "car" }] }] }] };

  function icon(S, kind, x, y, s, col, a) {
    const L = (p, o = {}) => S.line(p, { w: Math.max(1, s * 0.07), color: col, alpha: a, ...o });
    const C = (cx, cy, r, o = {}) => S.circle(cx, cy, r, { w: Math.max(1, s * 0.07), color: col, alpha: a, ...o });
    if (kind.startsWith("dog")) {
      C(x, y + s * 0.05, s * 0.28);
      L([[x - s * 0.24, y - s * 0.12], [x - s * 0.4, y + s * 0.2]]); L([[x + s * 0.24, y - s * 0.12], [x + s * 0.4, y + s * 0.2]]);
      S.dot(x, y + s * 0.12, s * 0.06, col, a);
      if (kind === "dog3") { S.dot(x - s * 0.12, y - s * 0.06, s * 0.04, col, a); S.dot(x + s * 0.14, y + s * 0.0, s * 0.035, col, a); }
      if (kind === "dog2") L([[x - s * 0.1, y + s * 0.22], [x + s * 0.1, y + s * 0.22]]);
    } else if (kind === "cat") {
      C(x, y + s * 0.06, s * 0.26);
      L([[x - s * 0.24, y - s * 0.02], [x - s * 0.2, y - s * 0.32], [x - s * 0.04, y - s * 0.18]]); L([[x + s * 0.24, y - s * 0.02], [x + s * 0.2, y - s * 0.32], [x + s * 0.04, y - s * 0.18]]);
      L([[x - s * 0.36, y + s * 0.1], [x - s * 0.12, y + s * 0.12]]); L([[x + s * 0.36, y + s * 0.1], [x + s * 0.12, y + s * 0.12]]);
    } else if (kind === "bird") {
      C(x, y + s * 0.04, s * 0.27);
      C(x - s * 0.1, y - s * 0.02, s * 0.07); C(x + s * 0.1, y - s * 0.02, s * 0.07);
      L([[x - s * 0.04, y + s * 0.1], [x, y + s * 0.18], [x + s * 0.04, y + s * 0.1]]);
    } else {
      L([[x - s * 0.38, y + s * 0.12], [x - s * 0.38, y], [x - s * 0.18, y - s * 0.02], [x - s * 0.05, y - s * 0.16], [x + s * 0.2, y - s * 0.16], [x + s * 0.3, y], [x + s * 0.4, y + s * 0.02], [x + s * 0.4, y + s * 0.12], [x - s * 0.38, y + s * 0.12]]);
      C(x - s * 0.2, y + s * 0.14, s * 0.08, { fill: S.C.paper }); C(x + s * 0.22, y + s * 0.14, s * 0.08, { fill: S.C.paper });
    }
  }
  function worker(S, x, y, s, a) {
    S.circle(x, y - s * 0.32, s * 0.18, { w: Math.max(1, s * 0.08), color: S.C.ink, alpha: a });
    S.circle(x, y + s * 0.25, s * 0.32, { w: Math.max(1, s * 0.08), color: S.C.ink, alpha: a, a0: Math.PI, a1: Math.PI * 2 });
  }

  Lineage.scene({
    params: [
      { id: "year", label: "ImageNet challenge year", type: "range", min: 2010, max: 2017, step: 1, value: 2017, fmt: v => String(v) },
      { id: "human", label: "Show human error (≈5%)", type: "toggle", value: true },
      { id: "speed", label: "Labelling speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    layout(S) {
      const B = S.box, n = NARROW(S), fs = FS(S);
      // tree geometry: leaves evenly spaced, parents centred on children
      const nodes = [], leaves = [];
      const walk = (t, d, par) => { const nd = { t, d, par, kids: [] }; nodes.push(nd); if (par) par.kids.push(nd); if (t.kids) t.kids.forEach(c => walk(c, d + 1, nd)); else leaves.push(nd); return nd; };
      walk(TREE, 0, null);
      const treeTop = B.y + fs * (n ? 1.8 : 2.2), treeH = B.h * (n ? 0.34 : 0.36), rowH = treeH / (leaves.length - 1);
      const tx0 = B.x + fs * (n ? 1.8 : 2.4), leafX = B.x + B.w * (n ? 0.6 : 0.6), maxD = 4;
      leaves.forEach((l, i) => { l.y = treeTop + i * rowH; });
      const setY = nd => { if (nd.kids.length) { nd.kids.forEach(setY); nd.y = nd.kids.reduce((a, c) => a + c.y, 0) / nd.kids.length; } };
      setY(nodes[0]);
      nodes.forEach(nd => { nd.x = nd.kids.length ? tx0 + (leafX - tx0) * (nd.d / maxD) : leafX; });
      const pileX = leafX + B.w * (n ? 0.2 : 0.17);
      const workY = treeTop + treeH + fs * (n ? 1.9 : 2.6);
      const chartTop = workY + fs * (n ? 2.4 : 3.4), chartBot = B.y + B.h - fs * (n ? 1.3 : 1.7);
      Object.assign(S.st, { nodes, leaves, rowH, treeTop, treeH, leafX, pileX, workY, chartTop, chartBot });
    },
    entry(S) { const r = S.st.nodes[0]; return [r.x - FS(S) * 0.6, r.y]; },
    draw(S, k, ft) {
      const B = S.box, C = S.C, iw = S.iw, fs = FS(S), st = S.st, n = NARROW(S);
      const { nodes, leaves, rowH, leafX, pileX, workY } = st;
      const k1 = S.ease(k / 0.35), k2 = S.ease((k - 0.2) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      // 1. the category tree
      S.text("WordNet categories", B.x, B.y + fs * 0.9, { size: fs * 0.95, align: "left", color: C.ink, alpha: k1 });
      nodes.forEach(nd => {
        const a = Math.max(0, Math.min(1, k1 * 5 - nd.d)); if (a <= 0) return;
        if (nd.par) { const p = nd.par, mx = (p.x + nd.x) / 2; S.line([[p.x + fs * 0.25, p.y], [mx, p.y], [mx, nd.y], [nd.x - fs * 0.25, nd.y]], { w: iw * 0.42, color: C.ink, alpha: a * 0.8 }); }
        const leaf = !nd.kids.length;
        S.dot(nd.x, nd.y, iw * (leaf ? 0.8 : 0.7), leaf ? C.accent : C.ink, a);
        const lab = nd.t.name, sz = fs * (n ? 0.7 : 0.8);
        if (leaf) S.text(lab, nd.x + fs * 0.5, nd.y + sz * 0.33, { size: sz, align: "left", color: C.ink, alpha: a });
        else if (!nd.par) S.text(lab, nd.x, nd.y + sz * 1.35, { size: sz * 0.95, color: C.soft, alpha: a });
        else S.text(lab, nd.x, nd.y - sz * 0.55, { size: sz * 0.95, color: C.soft, alpha: a });
      });
      // 2. images labelled by crowd workers, flying into their category
      const CYC = 1.25, cyc = Math.floor(ft / CYC), u = (ft / CYC) % 1;
      const thumb = Math.min(fs * (n ? 1.5 : 1.9), rowH * 1.25);
      if (k2 > 0) {
        // piles beside each leaf
        leaves.forEach((l, i) => {
          const cnt = Math.min(n ? 4 : 6, 1 + Math.floor((cyc + i * 3) / 6) % (n ? 5 : 7));
          for (let j = cnt - 1; j >= 0; j--) {
            const x = pileX + j * thumb * 0.28, y = l.y;
            S.rect(x - thumb * 0.42, y - thumb * 0.36, thumb * 0.84, thumb * 0.72, { color: C.ink, w: iw * 0.32, alpha: k2 * (j ? 0.45 : 0.9), fill: C.paper });
          }
          icon(S, l.t.icon, pileX, l.y, thumb * 0.78, C.ink, k2);
        });
        // the workers and the image they are judging
        const wx = B.x + fs * (n ? 0.8 : 1.4), wy = workY, ws = fs * (n ? 1.0 : 1.2);
        const li = (cyc * 5) % leaves.length, L = leaves[li];
        for (let w = 0; w < 3; w++) {
          const x = wx + w * ws * 1.3; worker(S, x, wy, ws, k2);
          if (u > 0.2 + w * 0.12 && u < 0.85) S.text("✓", x, wy - ws * 0.65, { size: fs * 0.85, color: C.accent, weight: 600, italic: false, alpha: k2 });
        }
        const qx = wx + ws * 4.2, qy = wy - ws * 0.1;
        const fly = S.ease(Math.max(0, (u - 0.6) / 0.4));
        const ix = qx + (pileX - qx) * fly, iy = qy + (L.y - qy) * fly, sc = 1 - 0.3 * fly;
        S.rect(ix - thumb * 0.42 * sc, iy - thumb * 0.36 * sc, thumb * 0.84 * sc, thumb * 0.72 * sc, { color: C.accent, w: iw * 0.5, alpha: k2, fill: C.paper });
        icon(S, L.t.icon, ix, iy, thumb * 0.78 * sc, C.accent, k2);
        if (fly < 0.05) S.text(`“${L.t.name}”?`, qx + thumb * 0.6, qy + fs * 0.3, { size: fs * 0.8, align: "left", color: C.ink, alpha: k2 });
        // counts grow towards the real totals
        const g = S.ease(Math.min(1, (k - 0.2) / 0.5)), imgs = Math.round(14197122 * (1 - Math.pow(1 - g, 3))), cats = Math.round(21841 * (1 - Math.pow(1 - g, 3)));
        const cx = B.x + B.w, cy = workY - fs * (n ? 0.35 : 0.5);
        S.text(`${imgs.toLocaleString("en-GB")} images`, cx, cy, { size: fs * (n ? 0.9 : 1.05), align: "right", color: C.ink, weight: 500, alpha: k2 });
        S.text(`${cats.toLocaleString("en-GB")} categories`, cx, cy + fs * (n ? 1.05 : 1.25), { size: fs * (n ? 0.8 : 0.9), align: "right", color: C.ink, alpha: k2 });
        if (!n) S.text("labelled by nearly 50,000 crowd workers in 167 countries", wx - fs * 0.6, wy + ws * 1.05 + fs * 0.4, { size: fs * 0.72, align: "left", color: C.soft, alpha: k2 });
      }
      // 3. the ImageNet challenge: top-5 error by year, with AlexNet's 2012 leap
      const yr = +S.p.year;
      if (k3 > 0) {
        const x0 = B.x + fs * 2.0, x1 = B.x + B.w - fs * 0.6, y0 = st.chartBot, y1 = st.chartTop, ym = 30;
        const X = y => x0 + (x1 - x0) * (y - 2010) / 7, Y = e => y0 - (y0 - y1) * e / ym;
        S.line([[x0, y1], [x0, y0], [x1, y0]], { w: iw * 0.4, color: C.soft, alpha: k3 });
        (n ? [0, 30] : [0, 10, 20, 30]).forEach(e => S.text(e + "%", x0 - fs * 0.4, Y(e) + fs * 0.3, { size: fs * 0.7, align: "right", color: C.soft, alpha: k3 }));
        S.text("top-5 error, ImageNet challenge", x0 + fs * 0.4, y1 - fs * (n ? 0.2 : 0.4), { size: fs * 0.78, align: "left", color: C.soft, alpha: k3 });
        RES.forEach(([y], i) => { if (!n || i % 2 === 0) S.text(String(y), X(y), y0 + fs * 1.0, { size: fs * 0.68, color: y === yr ? C.accent : C.soft, weight: y === yr ? 600 : 400, alpha: k3 }); });
        if (S.p.human) {
          S.line([[x0, Y(HUMAN)], [x1, Y(HUMAN)]], { w: iw * 0.4, color: C.ink, dash: [iw, iw * 1.8], alpha: 0.7 * k3 });
          S.text("human ≈ 5.1%", x0 + fs * 0.5, Y(HUMAN) - fs * 0.35, { size: fs * 0.72, align: "left", color: C.ink, alpha: k3 });
        }
        const shown = RES.filter(r => r[0] <= yr), reveal = Math.min(shown.length, 1 + (shown.length - 1) * k3);
        for (let i = 1; i < shown.length; i++) {
          if (i > reveal) break;
          const f = Math.min(1, reveal - i + 1), a = shown[i - 1], b = shown[i];
          const p = [X(a[0]), Y(a[1])], q = [X(a[0] + (b[0] - a[0]) * f), Y(a[1] + (b[1] - a[1]) * f)];
          const leap = b[0] === 2012;
          S.line([p, q], { w: iw * (leap ? 1.3 : 0.7), color: leap ? C.accent : C.ink, alpha: k3 });
        }
        shown.forEach(([y, e], i) => { if (i <= reveal) { const on = y === yr; S.dot(X(y), Y(e), iw * (on ? 1.5 : y >= 2012 ? 1.0 : 0.9), y >= 2012 ? C.accent : C.ink, k3); } });
        if (yr >= 2012) {
          const ax = X(2012), ay = Y(15.3);
          S.text(n ? "2012 AlexNet" : "2012: AlexNet, a deep network on GPUs", ax + fs * 0.6, ay - fs * 0.3, { size: fs * (n ? 0.78 : 0.86), align: "left", color: C.accent, weight: 500, alpha: k3 });
          if (!n) S.text("big labelled data + deep nets = the deep learning boom", ax + fs * 0.6, ay + fs * 0.95, { size: fs * 0.78, align: "left", color: C.accent, alpha: k3 });
        }
        const cur = RES.find(r => r[0] === yr);
        if (cur && yr !== 2012) S.text(`${cur[1]}%`, X(yr) + (yr > 2015 ? -fs * 0.5 : fs * 0.5), Y(cur[1]) - fs * 0.5, { size: fs * 0.8, align: yr > 2015 ? "right" : "left", color: C.accent, alpha: k3 });
      }
      const cur = RES.find(r => r[0] === yr), prev = RES.find(r => r[0] === yr - 1);
      return `${yr} winner: ${cur[2]} · top-5 error ${cur[1]}%${prev ? ` (${(prev[1] - cur[1]).toFixed(1)} points better than ${yr - 1})` : ""}${cur[1] < HUMAN ? " · below the ≈5.1% human estimate" : ""} · ImageNet: 14,197,122 images in 21,841 categories`;
    },
    code(S) {
      const yr = +S.p.year, cur = RES.find(r => r[0] === yr);
      return `${S.c("# ImageNet Large Scale Visual Recognition Challenge")}
train = imagenet.subset(classes=1000)    ${S.c("# about 1.2 million labelled photos")}
model = ${S.v(cur[2].split(" ")[0])}                ${S.c("# winner in " + yr)}
model.fit(train)
errors = 0
for photo, label in test_set:
    guesses = model.top5(photo)          ${S.c("# its five best guesses")}
    errors += label not in guesses
print(errors / len(test_set))            ${S.c("# " + cur[1] + "%")}`;
    },
  });
})();
