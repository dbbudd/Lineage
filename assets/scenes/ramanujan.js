// Srinivasa Ramanujan — his 1914 series for 1/π: each term locks in ~8 more digits; a spiral closes on π.
// → the Ramanujan Machine (2021): computer search proposing new formulas such as continued fractions.
(function () {
  // π to 100 decimals (reference digits for checking only; the series values are computed exactly with BigInt)
  const PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
  const D = 90, SC = 10n ** BigInt(D);
  const PIB = BigInt(PI.replace(".", "").slice(0, D + 1));
  const isqrt = n => { let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2) + 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } };
  let ROWS = null;
  function series() {
    if (ROWS) return ROWS;
    const s2 = isqrt(2n * SC * SC);
    let sum = 0n, f4 = 1n, fk = 1n, p396 = 1n; ROWS = [];
    for (let k = 0; k < 6; k++) {
      if (k > 0) { for (let j = 4 * k - 3; j <= 4 * k; j++) f4 *= BigInt(j); fk *= BigInt(k); p396 *= 396n ** 4n; }
      sum += (f4 * BigInt(1103 + 26390 * k) * SC) / (fk ** 4n * p396);
      const inv = (2n * s2 * sum) / (9801n * SC), pi = (SC * SC) / inv;
      const str = pi.toString(), ref = PIB.toString();
      let m = 0; while (m < str.length - 2 && str[m] === ref[m]) m++;
      const good = Math.max(0, m - 1);   // matching decimal places
      let err = pi - PIB; if (err < 0n) err = -err; const es = err.toString();
      const dc = err === 0n ? D : D - (es.length - 1) - Math.log10(+(es.slice(0, 3).padEnd(3, "0")) / 100);   // -log10 |error|
      ROWS.push({ k, s: str[0] + "." + str.slice(1), good, dc });
    }
    return ROWS;
  }
  const leib = n => { let s = 0; for (let i = 0; i < n; i++) s += (i % 2 ? -4 : 4) / (2 * i + 1); return s; };
  const lgood = v => Math.max(0, Math.floor(-Math.log10(Math.abs(v - Math.PI))));
  const lcont = v => Math.max(0, -Math.log10(Math.abs(v - Math.PI)));
  const cfv = n => { let x = 2 * n + 3; for (let j = n; j >= 1; j--) x = 2 * j + 1 + (j * (j + 2)) / x; return x; };

  Lineage.scene({
    params: [
      { id: "terms", label: "Terms of the series", type: "range", min: 1, max: 6, step: 1, value: 5, fmt: v => v + (v > 1 ? " terms" : " term") },
      { id: "leib", label: "Compare the slow Leibniz series", type: "toggle", value: true },
      { id: "speed", label: "Speed", type: "range", min: 0, max: 2, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
    ],
    actions: [{ label: "Replay terms", run(S) { S.st.start = null; } }],
    init(S) { series(); S.st.start = null; },
    reset(S) { S.st.start = null; },
    onParam(S, id) { if (id === "terms") S.st.start = null; },
    layout(S) {
      const b = S.box, st = S.st, wide = b.w / b.h > 1.15;
      st.wide = wide;
      if (!wide) {
        st.fy = b.y + b.h * 0.05;
        st.R = Math.min(b.w * 0.22, b.h * 0.2); st.c = [b.x + b.w * 0.26, b.y + b.h * 0.34];
        st.cf = { x: b.x + b.w * 0.55, y: b.y + b.h * 0.17, w: b.w * 0.45, h: b.h * 0.36 };
        st.rows = { x: b.x + b.w * 0.02, y: b.y + b.h * 0.66, w: b.w * 0.97, h: b.h * 0.32, max: 48 };
      } else {
        st.fy = b.y + b.h * 0.06;
        st.R = Math.min(b.w * 0.15, b.h * 0.2); st.c = [b.x + b.w * 0.18, b.y + b.h * 0.36];
        st.cf = { x: b.x + b.w * 0.44, y: b.y + b.h * 0.15, w: b.w * 0.56, h: b.h * 0.38 };
        st.rows = { x: b.x, y: b.y + b.h * 0.64, w: b.w, h: b.h * 0.36, max: 30 };
      }
    },
    entry(S) { const { c, R } = S.st; return [c[0] - R * 1.08, c[1]]; },
    draw(S, k, ft) {
      const st = S.st, C = S.C, iw = S.iw, fs = S.fs, ctx = S.ctx, R = st.R, [cx, cy] = st.c, rows = series();
      const k1 = S.ease(k / 0.3), k2 = S.ease((k - 0.25) / 0.4), k3 = S.ease((k - 0.62) / 0.38);
      const N = S.p.terms | 0;
      if (st.start == null) st.start = ft;
      const shown = k2 > 0 ? Math.min(N, 1 + Math.floor((ft - st.start) / 1.3)) : 0;
      const fprog = Math.min(1, ((ft - st.start) % 1.3) / 0.6);
      // ---- formula ----
      const fsz = st.wide ? fs * 0.8 : fs * 0.95;
      S.text("1/π  =  (2√2 / 9801) · Σₖ (4k)! (1103 + 26390k) / ((k!)⁴ 396⁴ᵏ)", S.box.x + S.box.w * (st.wide ? 0.5 : 0.5), st.fy + fsz, { size: fsz, color: C.ink, italic: false, alpha: k1 });
      // ---- spiral of accuracy: radius = digits still wrong ----
      const Dm = 48, rad = d => R * 0.12 + R * 0.88 * (1 - Math.min(d, Dm) / Dm), rot = ft * 0.12;
      for (let d = 8; d < Dm; d += 8) S.circle(cx, cy, rad(d), { color: C.soft, w: iw * 0.3, alpha: 0.5 * k1, dash: [2, 4] });
      S.circle(cx, cy, rad(0), { color: C.soft, w: iw * 0.35, alpha: 0.8 * k1 });
      S.text("π", cx, cy + fs * 0.35, { size: fs * 1.1, color: C.accent, weight: 600, italic: false, alpha: k1 });
      if (!st.wide) {
        S.text("0 digits", cx, cy - rad(0) - fs * 0.4, { size: fs * 0.75, color: C.soft, alpha: k1 });
        S.text("rings: every 8 digits", cx, cy + rad(0) + fs * 1.2, { size: fs * 0.75, color: C.soft, alpha: k1 });
      }
      const spiralPts = (goods, step) => {
        const pts = [];
        for (let i = 0; i < goods.length - 1; i++) for (let j = 0; j <= 12; j++) {
          const u = j / 12, d = goods[i] + (goods[i + 1] - goods[i]) * u, a = rot + (i + u) * step;
          pts.push([cx + rad(d) * Math.cos(a), cy + rad(d) * Math.sin(a)]);
        }
        return pts;
      };
      // Leibniz: same number of terms, barely moves inward
      let lg = 0;
      if (S.p.leib && k2 > 0) {
        const g = [0]; for (let n = 1; n <= shown; n++) g.push(lcont(leib(n)));
        lg = lgood(leib(shown));
        const pts = spiralPts(g, 1.15);
        S.line(pts, { color: C.ink, w: iw * 0.55, alpha: k2, dash: [iw, iw * 1.4] });
        g.forEach((d, i) => { if (i) { const a = rot + i * 1.15; S.dot(cx + rad(d) * Math.cos(a), cy + rad(d) * Math.sin(a), iw * 0.8, C.ink, k2); } });
        const la = rot + (g.length - 1) * 1.15, lr = rad(g[g.length - 1]) + fs * 0.9;
        if (g.length > 1) S.text("Leibniz", cx + lr * Math.cos(la), cy + lr * Math.sin(la) + fs * 0.3, { size: fs * 0.75, color: C.ink, alpha: k2 });
      }
      if (k2 > 0) {
        const g = [0]; for (let n = 1; n <= shown; n++) g.push(rows[n - 1].dc);
        // the newest term slides in
        if (g.length > 1 && shown < N + 1) { const last = g.length - 1; g[last] = g[last - 1] + (g[last] - g[last - 1]) * S.ease(fprog); }
        const pts = spiralPts(g, 1.15);
        S.line(pts, { color: C.accent, w: iw * 0.95, alpha: k2 });
        g.forEach((d, i) => { if (i) { const a = rot + i * 1.15; S.dot(cx + rad(d) * Math.cos(a), cy + rad(d) * Math.sin(a), iw * 1.0, C.accent, k2); } });
        const a0 = rot; S.dot(cx + rad(0) * Math.cos(a0), cy + rad(0) * Math.sin(a0), iw * 0.8, C.ink, k2);
      }
      // ---- digit rows ----
      const rw = st.rows, lh = Math.min(rw.h / 6.6, fs * 1.25), msz = Math.min(fs * 0.8, (rw.w * 0.82) / (rw.max + 2) / 0.6);
      ctx.save(); ctx.font = `400 ${msz.toFixed(1)}px "IBM Plex Mono", monospace`; const cw = ctx.measureText("0").width; ctx.restore();
      const lx = rw.x + cw * 4.5;
      if (k2 > 0) {
        for (let n = 0; n < shown; n++) {
          const r = rows[n], y = rw.y + lh * (n + 0.9), show = Math.min(r.good, rw.max);
          const total = rw.max, txt = r.s.slice(0, total + 2), a = n === shown - 1 ? S.ease(fprog) : 1;
          S.text(`k=${n}`, rw.x, y, { size: msz, mono: true, italic: false, align: "left", color: C.soft, alpha: k2 * a });
          S.text(txt.slice(0, show + 2), lx, y, { size: msz, mono: true, italic: false, align: "left", weight: 600, color: C.accent, alpha: k2 * a });
          S.text(txt.slice(show + 2), lx + cw * (show + 2), y, { size: msz, mono: true, italic: false, align: "left", color: C.soft, alpha: k2 * a * 0.8 });
          if (r.good > rw.max) S.text("…", lx + cw * (total + 2.3), y, { size: msz, mono: true, italic: false, align: "left", color: C.accent, alpha: k2 * a });
        }
        S.text("correct digits in colour", rw.x + rw.w, rw.y - lh * 0.15, { size: fs * 0.75, align: "right", color: C.soft, alpha: k2 });
      }
      // ---- beat 3: a Ramanujan Machine conjecture as a cascading continued fraction ----
      if (k3 > 0) {
        const cf = st.cf, sz = Math.min(fs * 0.95, cf.w / 11), dx = sz * 2.1, dy = Math.min(cf.h / 5.2, sz * 1.9);
        const nums = ["1·3", "2·4", "3·5"], dens = ["3 +", "5 +", "7 +", "9 + …"];
        S.text("4 / (π − 2)  =", cf.x, cf.y + sz * 0.3, { size: sz, color: C.accent, italic: false, align: "left", alpha: k3 });
        let x = cf.x + sz * 0.4, y = cf.y + dy * 1.15;
        for (let i = 0; i < 4; i++) {
          const kk = S.ease((k3 - i * 0.15) / 0.4);
          S.text(dens[i], x, y, { size: sz, color: C.accent, italic: false, align: "left", alpha: kk });
          if (i < 3) {
            const bx = x + sz * 1.7, bw = cf.x + cf.w - bx;
            S.text(nums[i], bx + bw * 0.08, y - sz * 0.45, { size: sz * 0.9, color: C.accent, italic: false, align: "left", alpha: kk });
            S.line([[bx, y - sz * 0.2], [bx + bw * 0.95, y - sz * 0.2]], { color: C.accent, w: iw * 0.4, alpha: kk });
          }
          x += dx; y += dy;
        }
        S.text("found by computer search, 2021", cf.x + cf.w * 0.5, cf.y + dy * 5.0, { size: fs * 0.8, color: C.soft, alpha: k3 });
      }
      const g = shown ? rows[shown - 1].good : 0;
      return `${shown} term${shown === 1 ? "" : "s"} · ${g} correct digits of π` + (S.p.leib ? ` · Leibniz after ${shown}: ${lg} digit${lg === 1 ? "" : "s"}` : "");
    },
    code(S) {
      const N = S.p.terms | 0, r = series()[N - 1];
      return `${S.c("# Ramanujan (1914): each term adds about 8 digits")}
from math import factorial as f, sqrt
s = 0
for k in range(${S.v(N)}):
    s += f(4*k) * (1103 + 26390*k) / (f(k)**4 * 396**(4*k))
pi = 9801 / (2 * sqrt(2) * s)     ${S.c("# " + r.good + " digits correct")}
${S.p.leib ? `
${S.c("# Leibniz (1674): 1 - 1/3 + 1/5 - 1/7 + ...")}
slow = 4 * sum((-1)**n / (2*n + 1) for n in range(${S.v(N)}))  ${S.c("# " + leib(N).toFixed(4))}` : ""}

${S.c("# Ramanujan Machine conjecture, value with 20 levels:")}
${S.c("# " + cfv(20).toFixed(10) + "  vs 4/(π-2) = " + (4 / (Math.PI - 2)).toFixed(10))}`;
    },
  });
})();
