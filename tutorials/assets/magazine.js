/* =============================================================
   MAGAZINE: the session page's three small behaviours
   -------------------------------------------------------------
   1. Copies the Aa panel's font choice onto <html data-font>, so
      the display type follows it (OpenDyslexic replaces both
      brand fonts when a reader chooses it).
   2. Draws the fern with the film's four rules (the Barnsley
      fern), applied at random to their own output, in the page's
      ink colour. Redrawn when the theme or the size changes.
   3. Draws each loop ring once, as it scrolls into view.

   Readers who ask for reduced motion get the finished drawings
   with no animation. Without this script, the page still shows a
   picture of the fern and a complete ring.
   ============================================================= */
(function () {
    'use strict';

    const root = document.documentElement;
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ===== 1. FONT CHOICE =====
    function storedFont() {
        try { return localStorage.getItem('vibe_font') || 'sans'; } catch (e) { return 'sans'; }
    }
    root.dataset.font = storedFont();
    if (typeof window.setFont === 'function') {
        const setFont = window.setFont;
        window.setFont = function (t) { setFont(t); root.dataset.font = t; };
    }

    // ===== 2. THE FERN =====
    // The film's random numbers (seeded), so this is the same fern as the film's.
    function seeded(seed) {
        return function () {
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // m maps fern units to the screen: the film's diagonal (growing up to the
    // left, as on the first board) or upright (as at the centre of the loop).
    function fernPoints(n, m) {
        const rnd = seeded(7), pts = new Float32Array(n * 2);
        let x = 0, y = 0;
        for (let i = -20; i < n; i++) {
            const r = rnd();
            let nx, ny;
            if (r < 0.01)      { nx = 0;                        ny = 0.16 * y; }
            else if (r < 0.86) { nx = 0.85 * x + 0.04 * y;      ny = -0.04 * x + 0.85 * y + 1.6; }
            else if (r < 0.93) { nx = 0.21 * x - 0.245 * y;     ny = 0.245 * x + 0.21 * y + 1.6; }
            else               { nx = -0.15 * x + 0.28 * y;     ny = 0.26 * x + 0.24 * y + 0.44; }
            x = nx; y = ny;
            if (i < 0) continue;              // the first few points settle onto the fern
            pts[2 * i] = m[0] * x + m[1] * y;
            pts[2 * i + 1] = m[2] * x + m[3] * y;
        }
        return pts;
    }

    function liveFern(holder) {
        const n = parseInt(holder.dataset.fern, 10) || 200000;
        const m = holder.dataset.fernTilt === 'upright' ? [1, 0, 0, -1] : [-0.743, -0.669, 0.669, -0.743];
        const pts = fernPoints(n, m);
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (let i = 0; i < pts.length; i += 2) {
            if (pts[i] < x0) x0 = pts[i];
            if (pts[i] > x1) x1 = pts[i];
            if (pts[i + 1] < y0) y0 = pts[i + 1];
            if (pts[i + 1] > y1) y1 = pts[i + 1];
        }

        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        holder.appendChild(canvas);
        holder.classList.add('is-live');
        let raf = 0;

        function paint(animate) {
            cancelAnimationFrame(raf);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = holder.clientWidth, h = holder.clientHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = getComputedStyle(holder).color;
            const pad = 2 * dpr;
            const s = Math.min((canvas.width - 2 * pad) / (x1 - x0), (canvas.height - 2 * pad) / (y1 - y0));
            const ox = (canvas.width - s * (x1 - x0)) / 2 - s * x0;
            const oy = (canvas.height - s * (y1 - y0)) / 2 - s * y0;
            const d = Math.max(0.7, (n < 50000 ? 1.1 : 0.8) * dpr);
            const total = pts.length / 2;
            const step = animate ? Math.ceil(total / 80) : total;   // about 1.3 s at 60 frames a second
            let i = 0;
            (function frame() {
                const end = Math.min(total, i + step);
                for (; i < end; i++) ctx.fillRect(ox + s * pts[2 * i] - d / 2, oy + s * pts[2 * i + 1] - d / 2, d, d);
                if (i < total) raf = requestAnimationFrame(frame);
            })();
        }

        let started = false;
        function start() { if (!started) { started = true; paint(!reduce); } }
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); }
            }, { threshold: 0.2 });
            io.observe(holder);
        } else {
            start();
        }
        // The ink colour follows the theme; the drawing follows the size.
        new MutationObserver(() => { if (started) paint(false); })
            .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        if ('ResizeObserver' in window) {
            let lastW = holder.clientWidth;
            new ResizeObserver(() => {
                if (!started || holder.clientWidth === lastW) return;
                lastW = holder.clientWidth;
                paint(false);
            }).observe(holder);
        }
    }

    document.querySelectorAll('[data-fern]').forEach(holder => {
        if (!holder.getContext && document.createElement('canvas').getContext) liveFern(holder);
    });

    // ===== 3. THE LOOP RING =====
    if (!reduce && 'IntersectionObserver' in window) {
        document.querySelectorAll('[data-loop]').forEach(loop => {
            loop.classList.add('will-draw');
            const io = new IntersectionObserver(entries => {
                if (entries.some(e => e.isIntersecting)) { io.disconnect(); loop.classList.add('is-drawing'); }
            }, { threshold: 0.45 });
            io.observe(loop);
        });
    }
})();
