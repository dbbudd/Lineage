#!/usr/bin/env python3
"""
make_portraits.py — batch: Wikimedia Commons photo -> face-detected crop -> one continuous weighted line.

    cd tools && python3 make_portraits.py [slug ...]      # default: every card with a portrait file

Writes  ../data/lines/<slug>.js   (window.LINEAGE_LINE = {aspect, pts, w, wash})
and     ../data/portraits_lines.json (simplified polylines for the small cards on the index).
Settings that were tuned by hand live in portraits.json and win over the automatic crop.
Needs: opencv, scikit-image, numpy (see requirements.txt) and haarcascade_frontalface_default.xml next to this file.
"""
import json, sys, time, urllib.request, urllib.parse
from pathlib import Path
import numpy as np, cv2
import linegen, render as R

HERE = Path(__file__).resolve().parent; ROOT = HERE.parent; DATA = ROOT / "data"
UA = {"User-Agent": "LineageSTEMDeck/1.0 (education project; dbbudd@gmail.com)"}
SRC = HERE / "src"; SRC.mkdir(exist_ok=True)
(DATA / "lines").mkdir(exist_ok=True)
CASCADE = cv2.CascadeClassifier(str(HERE / "haarcascade_frontalface_default.xml"))

def get(url, tries=6):
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except Exception as e:
            print("   retry", e); time.sleep(8 * (i + 1))
    raise RuntimeError("download failed " + url)

def fetch(slug, commons_file):
    out = SRC / f"{slug}.jpg"
    if out.exists(): return out
    q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": commons_file, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": "1000"})
    info = json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))
    ii = list(info["query"]["pages"].values())[0]["imageinfo"][0]
    raw = get(ii.get("thumburl", ii["url"]).split("?")[0])
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:                                   # GIF and friends: decode with Pillow
        import io; from PIL import Image
        img = cv2.cvtColor(np.array(Image.open(io.BytesIO(raw)).convert("RGB")), cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(out), img); time.sleep(3)
    return out

def auto_cfg(path):
    img = cv2.imread(str(path)); h, w = img.shape[:2]
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    faces = CASCADE.detectMultiScale(g, 1.08, 5, minSize=(int(w * 0.06), int(w * 0.06)))
    if len(faces) == 0:
        fx, fy, fw, fh = w * 0.35, h * 0.18, w * 0.3, w * 0.36   # guess: centred head-and-shoulders
    else:
        fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])
    cx, cy = fx + fw / 2, fy + fh / 2
    x0, x1 = max(0, cx - fw * 1.7), min(w, cx + fw * 1.7)
    y0, y1 = max(0, cy - fh * 1.25), min(h, cy + fh * 2.7)
    cw, ch = x1 - x0, y1 - y0
    return {"src": str(path.relative_to(HERE)), "crop": [x0 / w, y0 / h, x1 / w, y1 / h],
            "face": [(cx - x0) / cw, (cy - y0) / ch, fw * 0.55 / cw, fh * 0.6 / ch], "grabcut": True, "hatch": True}, len(faces)

def make(slug, cfg):
    cfg = dict(cfg); cfg.setdefault("end_top", True)    # start bottom-left by the border, finish at the crown
    linegen.portrait_path(cfg); ln = linegen.portrait_path.line
    pw, ph = ln["size"]; P = ln["pts"] / pw
    data = {"aspect": round(ph / pw, 4), **({"fill": cfg["fill"]} if cfg.get("fill") else {}), "pts": P[::2].round(4).flatten().tolist(), "w": ln["widths"][::2].round(2).tolist(),
            "wash": [(R.smooth_poly(p) / pw).round(4).flatten().tolist() for p in ln["wash"]]}
    (DATA / "lines" / f"{slug}.js").write_text("window.LINEAGE_LINE=" + json.dumps(data, separators=(",", ":")) + ";\n")
    simp = cv2.approxPolyDP(P.astype(np.float32).reshape(-1, 1, 2), 0.0014, False).reshape(-1, 2)
    return {"a": round(ph / pw, 4), "p": [round(v, 3) for v in simp.flatten().tolist()]}

if __name__ == "__main__":
    deck = []
    for f in ["science", "technology", "engineering", "mathematics", "jokers"]:
        deck += json.loads((DATA / f"{f}.json").read_text())
    tuned = json.loads((HERE / "portraits.json").read_text())
    only = set(sys.argv[1:])
    mini = json.loads((DATA / "portraits_lines.json").read_text())
    report = {}
    for c in deck:
        slug = c["slug"]
        if only and slug not in only: continue
        if slug in tuned:
            cfg = dict(tuned[slug]); cfg.setdefault("hatch", True); nf = "tuned"
        else:
            pf = (c.get("portrait") or {}).get("commons_file")
            if not pf: report[slug] = "no portrait file"; continue
            try: path = fetch(slug, pf)
            except Exception as e: report[slug] = f"download failed: {e}"; continue
            cfg, nf = auto_cfg(path)
        try:
            mini[slug] = make(slug, cfg); report[slug] = f"ok (faces: {nf})"
        except Exception as e:
            report[slug] = f"line failed: {e}"
        print(slug, report[slug], flush=True)
        (DATA / "portraits_lines.json").write_text(json.dumps(mini, separators=(",", ":")))
    (HERE / "out").mkdir(exist_ok=True)
    (HERE / "out" / "portrait_report.json").write_text(json.dumps(report, indent=1))
