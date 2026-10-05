"""
linegen.py — turn a portrait photo into ONE continuous, unbroken line (SVG).

Pipeline
  1. crop + foreground mask (GrabCut seeded with the face box)
  2. artistic line extraction (XDoG) -> skeleton -> pixel-traced strokes
  3. importance filter: keep detail in the face, only bold gestures elsewhere
  4. order every stroke into a single tour (greedy NN + 2-opt, strokes may flip)
  5. join with gentle "pen-travel" swoops, smooth (Catmull-Rom -> cubic Bezier)
  6. optional hand tremor for a drawn feel

Usage:  python3 linegen.py config.json            (renders every portrait)
        from linegen import portrait_path         (returns SVG path d + bbox)
"""
import json, math, sys
import cv2
import numpy as np
from skimage.morphology import skeletonize

# ---------------------------------------------------------------- 1. prep
def load_crop(src, crop, width=700):
    img = cv2.imread(src)
    h, w = img.shape[:2]
    x0, y0, x1, y1 = [int(round(v)) for v in (crop[0]*w, crop[1]*h, crop[2]*w, crop[3]*h)]
    img = img[y0:y1, x0:x1]
    s = width / img.shape[1]
    return cv2.resize(img, (width, int(img.shape[0]*s)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)

def bust_region(shape, face, grow=1.0):
    h, w = shape
    cx, cy, rx, ry = face[0]*w, face[1]*h, face[2]*w*grow, face[3]*h*grow
    b = np.zeros((h, w), np.uint8)
    cv2.ellipse(b, (int(cx), int(cy - ry*0.35)), (int(rx*1.9), int(ry*2.1)), 0, 0, 360, 1, -1)
    pts = np.array([[cx-rx*1.1, cy+ry*0.7], [cx+rx*1.1, cy+ry*0.7],
                    [cx+rx*3.6, h], [cx-rx*3.6, h]], np.int32)
    cv2.fillPoly(b, [pts], 1)
    return b

def fg_mask(img, face, use_grabcut=True):
    h, w = img.shape[:2]
    if not use_grabcut:
        return bust_region((h, w), face)
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    # probable foreground: a generous bust-shaped region below/around the face
    cx, cy, rx, ry = face[0]*w, face[1]*h, face[2]*w, face[3]*h
    cv2.ellipse(mask, (int(cx), int(cy)), (int(rx*1.5), int(ry*1.45)), 0, 0, 360, cv2.GC_PR_FGD, -1)
    cv2.rectangle(mask, (int(cx-rx*3.2), int(cy+ry*0.9)), (int(cx+rx*3.2), h), cv2.GC_PR_FGD, -1)
    cv2.ellipse(mask, (int(cx), int(cy)), (int(rx*0.8), int(ry*0.85)), 0, 0, 360, cv2.GC_FGD, -1)
    mask[:4, :] = cv2.GC_BGD; mask[:, :4] = cv2.GC_BGD; mask[:, -4:] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(img, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        m = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    m &= bust_region((h, w), face, 1.15)
    # fill interior holes
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 1, -1)
    return m

def weight_map(shape, face):
    """1.0 at the face, fading to ~0 on the clothes — controls detail density."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy, rx, ry = face[0]*w, face[1]*h, face[2]*w, face[3]*h
    d = np.sqrt(((xx-cx)/rx)**2 + ((yy-cy)/ry)**2)
    return np.clip(1.25 - 0.55*d, 0, 1)

# ---------------------------------------------------------------- 2. lines
def xdog(gray, sigma=1.6, k=1.6, p=22, eps=-0.02, phi=12):
    g = gray.astype(np.float32)/255.0
    g1 = cv2.GaussianBlur(g, (0, 0), sigma)
    g2 = cv2.GaussianBlur(g, (0, 0), sigma*k)
    s = (1+p)*g1 - p*g2
    e = np.where(s >= eps, 1.0, 1.0 + np.tanh(phi*(s-eps)))
    return (e < 0.5).astype(np.uint8)  # 1 = ink

def trace_skeleton(sk):
    """Walk a 1-px skeleton into polylines (lists of (x,y))."""
    sk = sk.copy().astype(np.uint8)
    H, W = sk.shape
    nb = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    def neigh(y, x):
        return [(y+dy, x+dx) for dy, dx in nb if 0 <= y+dy < H and 0 <= x+dx < W and sk[y+dy, x+dx]]
    pts = np.argwhere(sk)
    deg = {}
    for y, x in pts:
        deg[(y, x)] = len(neigh(y, x))
    strokes = []
    def walk(start):
        path = [start]; sk[start] = 0; cur = start
        while True:
            n = neigh(*cur)
            if not n: break
            # prefer continuing straight
            if len(path) > 1:
                py, px = path[-2]; dy0, dx0 = cur[0]-py, cur[1]-px
                n.sort(key=lambda q: -((q[0]-cur[0])*dy0 + (q[1]-cur[1])*dx0))
            cur = n[0]; sk[cur] = 0; path.append(cur)
        return path
    # endpoints first, then leftovers (loops)
    for p, d in sorted(deg.items(), key=lambda kv: kv[1]):
        if sk[p] and d <= 1:
            strokes.append(walk(p))
    for y, x in np.argwhere(sk):
        if sk[y, x]:
            strokes.append(walk((y, x)))
    return [[(x, y) for y, x in s] for s in strokes]

def rdp(pts, eps):
    pts = np.asarray(pts, np.float32)
    if len(pts) < 3: return pts.astype(float)
    if np.allclose(pts[0], pts[-1]):   # closed loop: DP on a zero-length baseline collapses it
        q = cv2.approxPolyDP(pts[:-1].reshape(-1, 1, 2), eps, True).reshape(-1, 2)
        return np.vstack([q, q[:1]]).astype(float)
    return cv2.approxPolyDP(pts.reshape(-1, 1, 2), eps, False).reshape(-1, 2).astype(float)

def plen(p):
    p = np.asarray(p, float)
    return float(np.sum(np.hypot(*np.diff(p, axis=0).T))) if len(p) > 1 else 0.0

# ---------------------------------------------------------------- 4. tour
def order_strokes(strokes, start=None):
    """Greedy nearest-neighbour over stroke endpoints (strokes may reverse), then 2-opt."""
    S = [np.asarray(s, float) for s in strokes]
    n = len(S)
    used = np.zeros(n, bool)
    heads = np.array([s[0] for s in S]); tails = np.array([s[-1] for s in S])
    cur = np.array(start if start is not None else heads[np.argmin(heads[:, 1])], float)
    order = []
    for _ in range(n):
        dh = np.hypot(*(heads - cur).T); dt = np.hypot(*(tails - cur).T)
        dh[used] = dt[used] = np.inf
        i_h, i_t = int(np.argmin(dh)), int(np.argmin(dt))
        if dh[i_h] <= dt[i_t]: i, rev = i_h, False
        else: i, rev = i_t, True
        used[i] = True
        s = S[i][::-1] if rev else S[i]
        order.append(s); cur = s[-1]
    # 2-opt on the sequence (reversing a block also reverses each stroke in it)
    def gap(a, b): return math.hypot(*(b[0] - a[-1]))
    improved, it = True, 0
    while improved and it < 40:
        improved, it = False, it + 1
        for i in range(0, len(order) - 2):
            for j in range(i + 2, len(order)):
                a, b = order[i], order[i+1]
                c = order[j]; d = order[j+1] if j+1 < len(order) else None
                old = gap(a, b) + (gap(c, d) if d is not None else 0)
                new = math.hypot(*(c[-1] - a[-1])) + (math.hypot(*(d[0] - b[0])) if d is not None else 0)
                if new < old - 1e-6:
                    order[i+1:j+1] = [s[::-1] for s in order[i+1:j+1][::-1]]
                    improved = True
    return order

def route_strokes(strokes, shape, W, start, off_cost=5.0, face_penalty=14.0, tone=None, skip_ratio=3.0, kinds=None, final=None):
    """
    Order strokes AND build pen-travel between them with a geodesic search:
    travelling along ink already in the drawing is cheap (it retraces, invisibly),
    crossing blank paper is expensive — especially across the face.
    Returns one continuous polyline.
    """
    from skimage.graph import MCP_Geometric
    h, w = shape
    S = [np.asarray(s, float) for s in strokes]
    ink = np.zeros((h, w), np.uint8)
    for s in S:
        cv2.polylines(ink, [s.astype(np.int32).reshape(-1, 1, 2)], False, 1, 3)
    off = off_cost + face_penalty * W
    if tone is not None:
        # shadows are cheap highways: connectors drift through eye sockets, nose shadow,
        # under the lip — so the pen-travel itself models the face like a drawn line
        off = 1.5 + off * tone**2
    cost = np.where(ink > 0, 1.0, off).astype(np.float64)
    ends = np.array([[s[0], s[-1]] for s in S])            # n x 2 x (x,y)
    ends_i = np.clip(np.round(ends).astype(int), 0, [w-1, h-1])
    used = np.zeros(len(S), bool)
    cur = np.clip(np.round(start).astype(int), 0, [w-1, h-1])
    out = []; okind = []
    kinds = kinds if kinds is not None else [1] * len(S)
    for _ in range(len(S)):
        mcp = MCP_Geometric(cost)
        cc, _ = mcp.find_costs([(cur[1], cur[0])])
        c_head = cc[ends_i[:, 0, 1], ends_i[:, 0, 0]]
        c_tail = cc[ends_i[:, 1, 1], ends_i[:, 1, 0]]
        c_head[used] = c_tail[used] = np.inf
        ih, it = int(np.argmin(c_head)), int(np.argmin(c_tail))
        i, rev = (ih, False) if c_head[ih] <= c_tail[it] else (it, True)
        c = c_head[i] if not rev else c_tail[i]
        mid = np.clip(np.round(S[i][len(S[i])//2]).astype(int), 0, [w-1, h-1])
        value = plen(S[i]) * (1 + 6 * W[mid[1], mid[0]])
        if out and c > skip_ratio * value:
            used[i] = True          # not worth the visible detour
            continue
        tgt = ends_i[i, 1 if rev else 0]
        travel = np.array(mcp.traceback((tgt[1], tgt[0])))[:, ::-1].astype(float)
        if out and len(travel) > 1:
            out.append(travel); okind.append(np.zeros(len(travel)))
        s = S[i][::-1] if rev else S[i]
        out.append(s); okind.append(np.full(len(s), kinds[i], float))
        used[i] = True
        cur = np.clip(np.round(s[-1]).astype(int), 0, [w-1, h-1])
    if final is not None and len(final) > 1:        # finish on a chosen stroke (e.g. ending at the crown)
        mcp = MCP_Geometric(cost); mcp.find_costs([(cur[1], cur[0])])
        tgt = np.clip(np.round(final[0]).astype(int), 0, [w-1, h-1])
        travel = np.array(mcp.traceback((tgt[1], tgt[0])))[:, ::-1].astype(float)
        if len(travel) > 1: out.append(travel); okind.append(np.zeros(len(travel)))
        out.append(np.asarray(final, float)); okind.append(np.ones(len(final)))
    route_strokes.kinds = np.concatenate(okind)
    return np.vstack(out)

# ---------------------------------------------------------------- 5. join + smooth
def join(order, mask=None):
    """Concatenate strokes; pen-travel between them becomes a soft arc."""
    out = [order[0]]
    for s in order[1:]:
        a, b = out[-1][-1], s[0]
        d = math.hypot(*(b - a))
        if d > 2:
            # a light bow perpendicular to the jump makes connectors read as gesture
            m = (a + b) / 2; nrm = np.array([-(b-a)[1], (b-a)[0]]) / (d or 1)
            bow = 0.12 * d * (1 if (len(out) % 2) else -1)
            out.append(np.array([m + nrm*bow]))
        out.append(s)
    return np.vstack(out)

def resample(p, step):
    p = np.asarray(p, float)
    seg = np.hypot(*np.diff(p, axis=0).T)
    keep = np.concatenate([[True], seg > 1e-6]); p = p[keep]
    seg = np.hypot(*np.diff(p, axis=0).T)
    t = np.concatenate([[0], np.cumsum(seg)])
    u = np.arange(0, t[-1], step)
    return np.column_stack([np.interp(u, t, p[:, 0]), np.interp(u, t, p[:, 1])])

def tremor(p, amp, seed=1):
    rng = np.random.default_rng(seed)
    n = len(p)
    noise = rng.normal(0, 1, (n, 2))
    k = 9
    noise = np.column_stack([np.convolve(noise[:, i], np.ones(k)/k, 'same') for i in range(2)])
    return p + noise * amp

def to_bezier_d(p, prec=2):
    """Catmull-Rom through points -> cubic Bezier path data."""
    f = lambda v: f"{v:.{prec}f}"
    d = [f"M{f(p[0,0])},{f(p[0,1])}"]
    P = np.vstack([p[0], p, p[-1]])
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d.append(f"C{f(c1[0])},{f(c1[1])} {f(c2[0])},{f(c2[1])} {f(p2[0])},{f(p2[1])}")
    return "".join(d)

# ---------------------------------------------------------------- shadow: hatching + wash
def shadow_mask(gray, m, W, lo_pct, hi_pct, wmin, blur=2.5, min_area=150):
    g = cv2.GaussianBlur(gray, (0, 0), blur).astype(float)
    sel = (m > 0) & (W > wmin)
    if sel.sum() < 50: return np.zeros_like(m)
    lo, hi = np.percentile(g[sel], [lo_pct, hi_pct])
    sm = ((g >= lo) & (g <= hi) & sel).astype(np.uint8)
    sm = cv2.morphologyEx(sm, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    sm = cv2.morphologyEx(sm, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(sm)
    out = np.zeros_like(sm)
    core = cv2.erode(sm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    for i in range(1, n):
        blob = lab == i
        # keep only blobs with real body (no thin slivers along edges -> no scribble noise)
        if st[i, cv2.CC_STAT_AREA] >= min_area and core[blob].sum() > 0.25 * blob.sum(): out[blob] = 1
    return out

def hatch_strokes(mask, angle_deg=40, spacing=6.0, min_len=6):
    """Zig-zag hatching inside each shadow blob — each blob becomes ONE stroke the pen can travel."""
    a = math.radians(angle_deg); ca, sa = math.cos(a), math.sin(a)
    n, lab = cv2.connectedComponents(mask)
    strokes = []
    for i in range(1, n):
        ys, xs = np.nonzero(lab == i)
        u = xs*ca + ys*sa; v = -xs*sa + ys*ca
        vk = np.round(v / spacing).astype(int)
        rows = []
        for k in range(vk.min(), vk.max() + 1):
            sel = vk == k
            if sel.sum() < 2: continue
            u0, u1 = u[sel].min(), u[sel].max()
            if u1 - u0 >= min_len: rows.append((k*spacing, u0 + 1, u1 - 1))
        cur = []; prev = None
        for j, (vv, u0, u1) in enumerate(rows):
            if prev is not None and (abs(u0 - prev[1]) > 5*spacing and abs(u1 - prev[2]) > 5*spacing or vv - prev[0] > 1.5*spacing):
                if len(cur) > 3: strokes.append(np.array(cur))
                cur = []
            ends = [(u0, vv), (u1, vv)] if len(cur) % 4 == 0 else [(u1, vv), (u0, vv)]
            for (uu, vq) in ends: cur.append((uu*ca - vq*sa, uu*sa + vq*ca))
            prev = (vv, u0, u1)
        if len(cur) > 3: strokes.append(np.array(cur))
    return strokes

def mask_polys(mask, eps=1.5):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    return [cv2.approxPolyDP(c, eps, True).reshape(-1, 2).astype(float) for c in cnts if len(c) > 8]

def line_widths(path, kinds, gray, cfg):
    """Brush-like weight: dark tone = heavier, pen-travel = hairline, ends taper."""
    h, w = gray.shape
    g = cv2.GaussianBlur(gray, (0, 0), 3).astype(float) / 255.0
    ij = np.clip(np.round(path).astype(int), 0, [w-1, h-1])
    dark = 1 - g[ij[:, 1], ij[:, 0]]
    wt = np.where(kinds == 0, cfg.get("w_travel", 0.22),
         np.where(kinds == 2, cfg.get("w_hatch", 0.28) + 0.25*dark,
                  cfg.get("w_line", 0.36) + cfg.get("w_dark", 1.3) * dark**1.4))
    wt = np.convolve(np.pad(wt, 6, mode='edge'), np.ones(13)/13, 'valid')
    n = len(wt); tp = min(40, n//4)
    ramp = np.ones(n); ramp[:tp] = np.linspace(0.25, 1, tp); ramp[-tp:] = np.linspace(1, 0.15, tp)
    return wt * ramp

# ---------------------------------------------------------------- main entry
def portrait_path(cfg, debug_prefix=None):
    img = load_crop(cfg["src"], cfg["crop"], cfg.get("width", 700))
    h, w = img.shape[:2]
    face = cfg["face"]  # cx, cy, rx, ry as fractions of the crop
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if cfg.get("blur"):             # engravings / textured paintings: soften hatching before tracing
        gray = cv2.GaussianBlur(gray, (0, 0), cfg["blur"])
    gray = cv2.createCLAHE(cfg.get("clahe", 2.0), (8, 8)).apply(gray)
    gray = cv2.bilateralFilter(gray, 9, 40, 9)
    if cfg.get("mask_poly"):
        # hand-drawn silhouette (fractions of the crop): an artist's block-in of head, hair and shoulders
        pp = np.array(cfg["mask_poly"], float) * [w, h]
        for _ in range(3):                                   # Chaikin smoothing -> soft organic outline
            q = 0.75 * pp + 0.25 * np.roll(pp, -1, 0); r = 0.25 * pp + 0.75 * np.roll(pp, -1, 0)
            pp = np.empty((2 * len(q), 2)); pp[0::2] = q; pp[1::2] = r
        m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [pp.astype(np.int32)], 1)
        if cfg.get("snap"):
            # let GrabCut snap the hand-drawn block-in to the real figure edge (within a band around it)
            band = int(w * cfg.get("snap_band", 0.05))
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * band + 1, 2 * band + 1))
            inner, outer = cv2.erode(m, k), cv2.dilate(m, k)
            gm = np.full((h, w), cv2.GC_BGD, np.uint8)
            gm[outer > 0] = cv2.GC_PR_BGD; gm[m > 0] = cv2.GC_PR_FGD; gm[inner > 0] = cv2.GC_FGD
            bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
            cv2.grabCut(img, gm, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
            m = np.where((gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
            m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(m)
            if n > 1: m = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    else:
        m = fg_mask(img, face, cfg.get("grabcut", True))
    W = weight_map((h, w), face)

    # fine lines in the face, coarse lines elsewhere
    fine = xdog(gray, sigma=cfg.get("sigma_face", 1.1), p=cfg.get("p", 22))
    coarse = xdog(gray, sigma=cfg.get("sigma_body", 3.2), p=cfg.get("p", 22))
    coarse = cv2.morphologyEx(coarse, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))  # de-speckle body only
    # dark-feature blobs (brows, eyes, nostrils, mustache, lip line) — their outlines read as features
    blk, cc = cfg.get("dark", [61, 14])
    dark = cv2.adaptiveThreshold(gray, 1, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, blk, cc)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    fine = np.clip(fine + dark, 0, 1).astype(np.uint8)
    ink = np.where(W > 0.55, fine, coarse) * m
    # crisp feature edges (eyelids, nostrils, lips) inside the face only
    g2 = cv2.GaussianBlur(gray, (0, 0), cfg.get("canny_blur", 2.0))
    lo, hi = cfg.get("canny", [30, 70])
    can = (cv2.Canny(g2, lo, hi) > 0).astype(np.uint8) * (W > 0.75) * m * cfg.get("use_canny", 0)
    ink = np.clip(ink + can, 0, 1).astype(np.uint8)
    # bridge hairline gaps so features become longer, more drawable strokes
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    # silhouette edge (outline of hair/shoulders) — the Matisse contour
    sil = cv2.morphologyEx(m, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    sil[int(h*0.97):, :] = 0
    if not (cfg.get("grabcut", True) or cfg.get("mask_poly")) or not cfg.get("silhouette", True):
        sil[:] = 0
    lines = np.clip(ink + sil, 0, 1)
    if cfg.get("lineart"):
        # the reference is already a line drawing: trace its own ink, and derive shadow from line density
        raw = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lines = (raw < cfg.get("ink_thresh", 160)).astype(np.uint8)
        if not cfg.get("keep_fine"): lines = cv2.morphologyEx(lines, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        dens = cv2.GaussianBlur(lines.astype(np.float32), (0, 0), w * cfg.get("shade_sigma", 0.018))
        dens = dens / (dens.max() + 1e-6)
        # light from the upper left: add a soft core shadow down the figure's right side
        fig = cv2.morphologyEx(lines, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
        ff = fig.copy(); cv2.floodFill(ff, None, (0, 0), 2); body = (ff != 2).astype(np.uint8)
        dist = cv2.distanceTransform(body, cv2.DIST_L2, 5)
        xx = np.tile(np.linspace(0, 1, w), (h, 1))
        core = np.clip(1 - dist / (w * 0.06), 0, 1) * body * np.clip((xx - 0.45) * 2.5, 0, 1)
        tone = np.clip(1 - (cfg.get("shade_density", 0.9) * dens + cfg.get("shade_core", 0.35) * core), 0, 1)
        gray = (tone * 255).astype(np.uint8)
        if cfg.get("mask_poly"):
            body = m                                   # hand-drawn silhouette keeps the figure, drops the scenery
            dist = cv2.distanceTransform(body, cv2.DIST_L2, 5)
            core = np.clip(1 - dist / (w * 0.06), 0, 1) * body * np.clip((xx - 0.45) * 2.5, 0, 1)
            tone = np.clip(1 - (cfg.get("shade_density", 0.9) * dens * body + cfg.get("shade_core", 0.35) * core), 0, 1)
            gray = (tone * 255).astype(np.uint8)
        lines = lines * body
        m = body
    face_zone = (W > cfg.get("contour_w", 0.6)).astype(np.uint8)
    # body: centre-lines (single gestural strokes)
    sk = skeletonize((lines * (1 - face_zone)).astype(bool)).astype(np.uint8)
    strokes = trace_skeleton(sk)
    # face: blob OUTLINES — eyes, brows, nostrils, lips keep their shape
    if cfg.get("face_mode", "skeleton" if cfg.get("lineart") else "contour") == "contour":
        fz = (lines * face_zone).astype(np.uint8)
        cnts, _ = cv2.findContours(fz, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in cnts:
            c = c.reshape(-1, 2)
            if len(c) > 4:
                strokes.append([tuple(p) for p in np.vstack([c, c[:1]])])
    else:
        sk2 = skeletonize((lines * face_zone).astype(bool)).astype(np.uint8)
        strokes += trace_skeleton(sk2)

    # importance filter: long strokes everywhere, short ones only in the face
    keep = []
    min_face, min_body = cfg.get("min_face", 6), cfg.get("min_body", 60)
    for s in strokes:
        s = np.asarray(s, float)
        L = plen(s)
        mid = s[len(s)//2].astype(int)
        wv = W[min(mid[1], h-1), min(mid[0], w-1)]
        need = min_body + (min_face - min_body) * wv
        if L >= need:
            keep.append(rdp(s, cfg.get("rdp", 0.8)))
    kinds = [1] * len(keep)
    shade = np.zeros_like(m); wash = np.zeros_like(m)
    if cfg.get("hatch", False):
        shade = shadow_mask(gray, m, W, *cfg.get("hatch_band", [6, 30]), cfg.get("hatch_wmin", 0.35), min_area=cfg.get("hatch_min_area", 300))
        hs = [rdp(x, 0.8) for x in hatch_strokes(shade, cfg.get("hatch_angle", 40), cfg.get("hatch_spacing", 7.0))]
        keep += hs; kinds += [2] * len(hs)
    wash = shadow_mask(gray, m, W, 0, cfg.get("wash_pct", 28), 0.0, blur=5, min_area=400)
    final = None
    start = np.array([face[0]*w, 0.0])
    if cfg.get("end_top"):
        # start bottom-left (beside the card border) and finish at the crown, ready to flow into the idea
        start = np.array([w * cfg.get("start_u", 0.0), h * cfg.get("start_v", 1.0)])
        cand = [(i, int(np.argmin(st[:, 1]))) for i, st in enumerate(keep) if len(st) > 2]
        if cand:
            i, t = min(cand, key=lambda it: keep[it[0]][it[1], 1])
            st = keep[i]
            if t == 0:                     # top point is the stroke's start: walk it backwards to finish there
                final = st[::-1]; rest = st[:0]
            else:
                final = st[:t+1]; rest = st[t:]
            keep = keep[:i] + keep[i+1:]; kinds = kinds[:i] + kinds[i+1:]
            if len(rest) > 2: keep.append(rest); kinds.append(1)
    path = route_strokes(keep, (h, w), W, start=start, kinds=kinds, final=final,
                         off_cost=cfg.get("off_cost", 5.0), face_penalty=cfg.get("face_penalty", 14.0),
                         skip_ratio=cfg.get("skip_ratio", 3.0),
                         tone=cv2.GaussianBlur(gray, (0, 0), 4).astype(float) / 255.0)
    raw_k = route_strokes.kinds
    seg = np.hypot(*np.diff(path, axis=0).T); tcum = np.concatenate([[0], np.cumsum(seg)])
    path = resample(path, cfg.get("step", 2.0))
    ucum = np.arange(len(path)) * cfg.get("step", 2.0)
    pkinds = raw_k[np.clip(np.searchsorted(tcum, ucum, side='right') - 1, 0, len(raw_k)-1)]
    k = cfg.get("smooth", 11)
    path = cv2.GaussianBlur(path.reshape(-1, 1, 2).astype(np.float32), (1, k), 0).reshape(-1, 2)
    if cfg.get("tremor", 0):
        path = tremor(path, cfg["tremor"], seed=cfg.get("seed", 1))
    portrait_path.line = dict(pts=path.copy(), kinds=pkinds, widths=line_widths(path, pkinds, gray, cfg),
                              size=(w, h), wash=mask_polys(wash), shade=mask_polys(shade))
    path = rdp(path, 0.35)

    if debug_prefix:
        cv2.imwrite(debug_prefix + "_crop.png", img)
        cv2.imwrite(debug_prefix + "_mask.png", m*255)
        cv2.imwrite(debug_prefix + "_lines.png", 255 - lines*255)
    stats = dict(strokes=len(keep), points=len(path), length=round(plen(path)))
    return to_bezier_d(path), (w, h), stats


def standalone_svg(d, size, stroke=2.2, color="#111"):
    w, h = size
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<rect width="100%" height="100%" fill="#fff"/>'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{stroke}" '
            f'stroke-linecap="round" stroke-linejoin="round"/></svg>')


if __name__ == "__main__":
    import os
    cfgs = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "portraits.json"))
    os.makedirs("out/lines", exist_ok=True)
    only = sys.argv[2:] or list(cfgs)
    for key in only:
        d, size, st = portrait_path(cfgs[key], debug_prefix=f"out/lines/{key}")
        open(f"out/lines/{key}.svg", "w").write(standalone_svg(d, size))
        print(key, st)
