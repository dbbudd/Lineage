// John von Neumann — stored-program computer (EDVAC report, 1945): fetch–decode–execute over one bus → the von Neumann bottleneck → AI chips with memory beside compute
Lineage.scene({
  params: [
    { id: "prog", label: "Program in memory", type: "select", value: "sum", options: [{ value: "sum", label: "Add up a list" }, { value: "mul", label: "Multiply by repeated adding (loop)" }] },
    { id: "speed", label: "Clock speed", type: "range", min: 0, max: 3, step: 0.05, value: 1, fmt: v => v.toFixed(2) + "×" },
  ],
  PROGS: {
    sum: { code: [["LOAD", 10], ["ADD", 11], ["ADD", 12], ["ADD", 13], ["STORE", 15], ["HALT", 0]], data: { 10: 3, 11: 1, 12: 4, 13: 2 }, edit: [10, 11, 12, 13] },
    mul: { code: [["LOAD", 15], ["ADD", 10], ["STORE", 15], ["LOAD", 11], ["SUB", 12], ["STORE", 11], ["JNZ", 0], ["HALT", 0]], data: { 10: 6, 11: 3, 12: 1 }, edit: [10, 11] },
  },
  init(S) { S.st.userData = {}; this.boot(S); },
  reset(S) { this.boot(S); },
  onParam(S, id) { if (id === "prog") { S.st.userData = {}; this.boot(S); } },
  boot(S) {
    const P = this.PROGS[S.p.prog] || this.PROGS.sum, mem = new Array(16).fill(0);
    P.code.forEach((ins, i) => (mem[i] = ins.slice()));
    for (const a in P.data) mem[a] = a in S.st.userData ? S.st.userData[a] : P.data[a];
    Object.assign(S.st, { mem, pc: 0, acc: 0, ir: null, halted: false, ct: 0, trips: 0, wait: 0, hi: -1, ran: 0 });
  },
  layout(S) {
    const b = S.box, side = b.w > b.h * 1.15;
    const cpu = side ? { x: b.x, y: b.y + b.h * 0.08, w: b.w * 0.29, h: b.h * 0.6 } : { x: b.x + b.w * 0.02, y: b.y + b.h * 0.08, w: b.w * 0.3, h: b.h * 0.5 };
    const mem = side ? { x: b.x + b.w * 0.62, y: b.y + b.h * 0.02, w: b.w * 0.38, h: b.h * 0.72 } : { x: b.x + b.w * 0.64, y: b.y + b.h * 0.02, w: b.w * 0.35, h: b.h * 0.62 };
    const rows = 8, cw = mem.w / 2, ch = mem.h / rows;
    const cells = [...Array(16)].map((_, a) => ({ x: mem.x + (a >= 8 ? cw : 0), y: mem.y + (a % 8) * ch, w: cw, h: ch }));
    const busY = cpu.y + cpu.h * 0.5, bus = [cpu.x + cpu.w, mem.x];
    const ai = side ? { x: b.x, y: b.y + b.h * 0.8, w: b.w, h: b.h * 0.2 } : { x: b.x, y: b.y + b.h * 0.72, w: b.w, h: b.h * 0.27 };
    Object.assign(S.st, { side, cpu, memR: mem, cells, busY, bus, ai, rows });
  },
  entry(S) { const { cpu } = S.st; return S.narrow ? [cpu.x, cpu.y + cpu.h] : [cpu.x, cpu.y]; },
  tripsOf(ins) { return ins[0] === "HALT" || ins[0] === "JNZ" ? 2 : 4; },
  apply(S) {
    const st = S.st, ins = st.mem[st.pc];
    if (!Array.isArray(ins)) { st.halted = true; return; }
    const [op, a] = ins; st.trips += this.tripsOf(ins); st.ran++;
    st.pc++;
    if (op === "LOAD") st.acc = st.mem[a];
    else if (op === "ADD") st.acc += st.mem[a];
    else if (op === "SUB") st.acc -= st.mem[a];
    else if (op === "STORE") st.mem[a] = st.acc;
    else if (op === "JNZ") { if (st.acc !== 0) st.pc = a; }
    else if (op === "HALT") { st.halted = true; st.pc--; }
    if (st.pc > 15) st.halted = true;
  },
  pointer(S, type, x, y) {
    if (type !== "down") return;
    const st = S.st, P = this.PROGS[S.p.prog] || this.PROGS.sum;
    for (const a of P.edit) {
      const c = st.cells[a];
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        const cur = a in st.userData ? st.userData[a] : P.data[a];
        st.userData[a] = S.p.prog === "mul" && a === 11 ? (cur % 9) + 1 : (cur + 1) % 10;
        this.boot(S); return;
      }
    }
  },
  draw(S, k, ft, dt) {
    const st = S.st, iw = S.iw, C = S.C, fs = S.fs;
    const { cpu, memR, cells, busY, bus, ai, side } = st;
    const k1 = S.ease(k / 0.4), k2 = S.ease((k - 0.3) / 0.4), k3 = S.ease((k - 0.65) / 0.35);
    const Tc = 2.4, sdt = (dt || 0) * (S.p.speed ?? 1) * (k > 0.3 ? 1 : 0);
    if (st.halted) { st.wait += sdt; if (st.wait > 3) this.boot(S); }
    else { st.ct += sdt / Tc; if (st.ct >= 1) { st.ct = 0; this.apply(S); } }
    const u = st.halted ? 1 : st.ct, ins = Array.isArray(st.mem[st.pc]) ? st.mem[st.pc] : ["HALT", 0], [op, ad] = ins;
    const memOp = op === "LOAD" || op === "ADD" || op === "SUB" || op === "STORE";
    const P = this.PROGS[S.p.prog] || this.PROGS.sum, nCode = P.code.length;
    // ---- memory: one store for program and data ----
    const mf = Math.min(fs * 0.85, cells[0].h * 0.5, cells[0].w * 0.13);
    let hiCell = -1;
    if (!st.halted && k2 > 0) { if (u < 0.32) hiCell = st.pc; else if (memOp && u > 0.42) hiCell = ad; }
    for (let a = 0; a < 16; a++) {
      const c = cells[a], v = st.mem[a], isCode = Array.isArray(v), isHi = a === hiCell;
      const al = k1 * Math.min(1, Math.max(0, k1 * 16 - a * 0.6));
      if (al <= 0) continue;
      S.rect(c.x, c.y, c.w, c.h, { color: C.ink, w: iw * 0.35, alpha: al });
      if (isHi) S.rect(c.x + 2, c.y + 2, c.w - 4, c.h - 4, { color: C.accent, w: iw * 0.7, alpha: al });
      S.text(String(a), c.x + mf * 0.35, c.y + c.h * 0.5 + mf * 0.32, { size: mf * 0.75, mono: true, italic: false, align: "left", color: C.soft, alpha: al, halo: false });
      const txt = isCode ? (v[0] === "HALT" ? "HALT" : `${v[0]} ${v[1]}`) : a >= nCode ? String(v) : "";
      const editable = P.edit.includes(a);
      S.text(txt, c.x + c.w * 0.58, c.y + c.h * 0.5 + mf * 0.35, { size: mf, mono: true, italic: false, color: isHi ? C.accent : isCode ? C.ink : C.ink, weight: isCode ? 400 : 600, alpha: a >= nCode && !isCode && v === 0 && !editable && a !== 15 ? al * 0.3 : al, halo: false });
      if (editable && k2 > 0) S.line([[c.x + c.w * 0.42, c.y + c.h * 0.84], [c.x + c.w * 0.76, c.y + c.h * 0.84]], { w: iw * 0.3, color: C.soft, dash: [2, 3], alpha: k2 });
    }
    // brackets: program and data share the same memory
    if (k1 > 0.5) {
      const bx = memR.x + memR.w + 0, lf = fs * 0.78, al = (k1 - 0.5) * 2;
      const lab = (txt, a0, a1) => {
        const y0 = cells[a0].y + 3, y1 = cells[a1].y + cells[a1].h - 3, x = cells[a0].x - 4;
        S.line([[x + 4, y0], [x, y0], [x, y1], [x + 4, y1]], { w: iw * 0.4, color: C.soft, alpha: al });
      };
      lab("program", 0, Math.min(7, nCode - 1));
      S.text("memory: program + data", memR.x + memR.w / 2, memR.y + memR.h + lf * 1.25, { size: lf, color: C.soft, alpha: al });
    }
    // ---- processor ----
    const rf = Math.min(fs * 0.95, cpu.h * 0.08, cpu.w * 0.1);
    S.rect(cpu.x, cpu.y, cpu.w * k1, cpu.h, { color: C.ink, w: iw * 0.7 });
    if (k1 > 0.3) {
      const al = Math.min(1, (k1 - 0.3) / 0.5);
      S.text("processor", cpu.x + cpu.w / 2, cpu.y - rf * 0.55, { size: rf * 1.05, alpha: al, weight: 500 });
      const regs = [["PC", String(u > 0.3 && !st.halted && op !== "HALT" ? st.pc + 1 : st.pc)], ["IR", st.ir ? st.ir : u > 0.3 && !st.halted ? (op === "HALT" ? "HALT" : `${op} ${ad}`) : "–"], ["ACC", String(st.acc)]];
      const rx = cpu.x + cpu.w * 0.36, rw = cpu.w * 0.58, rh = cpu.h * 0.15;
      regs.forEach(([name, val], i) => {
        const ry = cpu.y + cpu.h * (0.1 + i * 0.26);
        const live = (i === 0 && (u < 0.16 || (u > 0.28 && u < 0.36))) || (i === 1 && u > 0.28 && u < 0.45) || (i === 2 && u > 0.84 && memOp && op !== "STORE");
        S.text(name, cpu.x + cpu.w * 0.06, ry + rh * 0.5 + rf * 0.33, { size: rf * 0.85, align: "left", italic: false, mono: true, color: C.soft, alpha: al });
        S.rect(rx, ry, rw, rh, { color: live ? C.accent : C.ink, w: iw * (live ? 0.7 : 0.45), alpha: al });
        if (!side) S.text(["program counter", "instruction register", "accumulator"][i], rx + rw / 2, ry + rh + rf * 0.95, { size: rf * 0.72, color: C.soft, alpha: al });
        S.text(val, rx + rw / 2, ry + rh * 0.5 + rf * 0.36, { size: rf, mono: true, italic: false, alpha: al, color: live ? C.accent : C.ink, halo: false });
      });
      const stage = st.halted ? "halted" : u < 0.3 ? "fetch" : u < 0.45 ? "decode" : "execute";
      S.text(stage, cpu.x + cpu.w / 2, cpu.y + cpu.h * 0.93, { size: rf * 0.95, color: C.accent, alpha: al * k2, weight: 500 });
    }
    // ---- the single bus, with packets travelling over it ----
    const [bx0, bx1] = bus, bw = Math.max(5, fs * 0.45);
    const busW = iw * (0.45 + 0.6 * k3);
    S.line([[bx0, busY - bw], [bx0 + (bx1 - bx0) * k1, busY - bw]], { w: busW, color: k3 > 0 ? C.accent : C.ink, alpha: 1 });
    S.line([[bx0, busY + bw], [bx0 + (bx1 - bx0) * k1, busY + bw]], { w: busW, color: k3 > 0 ? C.accent : C.ink, alpha: 1 });
    // short stubs from the bus to the memory cells column
    S.line([[bx1, memR.y + 2], [bx1, memR.y + memR.h - 2]], { w: iw * 0.5, color: C.ink, alpha: k1 });
    S.text("bus", (bx0 + bx1) / 2, busY + bw + fs * 1.2, { size: fs * 0.8, color: C.soft, alpha: k1 });
    let tripsNow = st.trips;
    if (k2 > 0 && !st.halted) {
      const pk = (txt, p, dir) => {
        if (p <= 0 || p >= 1) return;
        const e = S.ease(p), x = dir > 0 ? bx0 + (bx1 - bx0) * e : bx1 - (bx1 - bx0) * e;
        const f2 = Math.min(fs * 0.8, (bx1 - bx0) * 0.11), w2 = Math.max(f2 * 0.62 * txt.length + f2 * 0.8, f2 * 2);
        S.rect(x - w2 / 2, busY - f2 * 0.75, w2, f2 * 1.5, { color: C.accent, fill: C.paper, w: iw * 0.5, alpha: k2 });
        S.text(txt, x, busY + f2 * 0.33, { size: f2, mono: true, italic: false, color: C.accent, halo: false, alpha: k2 });
      };
      const ph = (a, b) => (u - a) / (b - a);
      pk(String(st.pc), ph(0.02, 0.15), 1);
      pk(op === "HALT" ? "HALT" : `${op} ${ad}`, ph(0.16, 0.3), -1);
      if (memOp) {
        pk(String(ad), ph(0.46, 0.62), 1);
        if (op === "STORE") pk(String(st.acc), ph(0.64, 0.82), 1); else pk(String(st.mem[ad]), ph(0.64, 0.82), -1);
      }
      tripsNow += (u > 0.15) + (u > 0.3) + (memOp ? (u > 0.62) + (u > 0.82) : 0);
    }
    // ---- the bottleneck, and the AI-chip answer ----
    if (k3 > 0) {
      const { x, y, w, h } = ai, ff = fs * (side ? 0.8 : 0.95);
      S.text("von Neumann", (bx0 + bx1) / 2, busY - bw - ff * 1.75, { size: ff * 0.9, color: C.accent, weight: 500, alpha: k3 });
      S.text("bottleneck", (bx0 + bx1) / 2, busY - bw - ff * 0.7, { size: ff * 0.9, color: C.accent, weight: 500, alpha: k3 });
      // AI accelerator: compute die ringed by stacked memory, joined by many short wires
      const s = Math.min(h * 0.62, w * 0.12), cx = x + w * (side ? 0.12 : 0.14), cy = y + h * 0.42;
      S.rect(cx - s / 2, cy - s / 2, s, s, { color: C.accent, w: iw * 0.7, alpha: k3 });
      for (let i = 1; i < 4; i++) for (let j = 1; j < 4; j++) S.rect(cx - s / 2 + (i - 0.5) * s / 4 + s * 0.02, cy - s / 2 + (j - 0.5) * s / 4 + s * 0.02, s / 5, s / 5, { color: C.accent, w: iw * 0.3, alpha: k3 * 0.7 });
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const mx = cx + sx * s * 0.95, my = cy + sy * s * 0.26;
        S.rect(mx - s * 0.18, my - s * 0.2, s * 0.36, s * 0.4, { color: C.accent, w: iw * 0.5, alpha: k3 });
        for (let q = -2; q <= 2; q++) S.line([[cx + sx * s * 0.5, my + q * s * 0.05], [mx - sx * s * 0.18, my + q * s * 0.05]], { w: iw * 0.25, color: C.accent, alpha: k3 });
      }
      const tx = cx + s * 1.35;
      if (side) {
        S.text("AI chips put memory", tx, cy - ff * 0.2, { size: ff, color: C.accent, align: "left", alpha: k3 });
        S.text("right beside compute", tx, cy + ff * 0.95, { size: ff, color: C.accent, align: "left", alpha: k3 });
      } else {
        S.text(`${tripsNow} trips over one bus for ${st.ran + (st.halted ? 0 : 1)} instructions.`, tx, cy - ff * 0.75, { size: ff, color: C.accent, align: "left", alpha: k3 });
        S.text("An AI model shuttles billions of weights this way,", tx, cy + ff * 0.5, { size: ff * 0.9, color: C.accent, align: "left", alpha: k3 });
        S.text("so AI chips stack fast memory right beside compute.", tx, cy + ff * 1.6, { size: ff * 0.9, color: C.accent, align: "left", alpha: k3 });
      }
    }
    const stage = st.halted ? `halted: result ${st.mem[15]} stored in cell 15` : `PC ${u > 0.3 && op !== "HALT" ? st.pc + 1 : st.pc} · ${u < 0.3 ? "fetch" : u < 0.45 ? "decode" : "execute"} ${op === "HALT" ? "HALT" : op + " " + ad} · ACC ${st.acc}`;
    return `${stage} · ${tripsNow} bus trips`;
  },
  code(S) {
    const P = this.PROGS[S.p.prog] || this.PROGS.sum, st = S.st;
    const data = P.edit.map(a => `${a}: ${S.v(st.mem ? st.mem[a] : P.data[a])}`).join(", ");
    return `${S.c("# stored program: code and data in one memory")}
memory = program + [${data}]  ${S.c("# click a data cell")}
pc, acc = 0, 0
while True:
    op, addr = memory[pc]          ${S.c("# fetch, over the bus")}
    pc += 1
    if op == "LOAD":  acc = memory[addr]     ${S.c("# decode, execute")}
    elif op == "ADD": acc += memory[addr]
    elif op == "SUB": acc -= memory[addr]
    elif op == "STORE": memory[addr] = acc
    elif op == "JNZ" and acc != 0: pc = addr   ${S.c("# loop")}
    elif op == "HALT": break`;
  },
});
