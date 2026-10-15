"""Reproducible, isolated reference tracing; no concurrent shared JSON writes.

Run from tools: python engineering_portraits.py path/to/slug-spec.json
Specs contain slug, reference path, crop, face, figure polygon (original-image
fractions), and optional tone seeds (original-image fractions plus tone).
The optional group field selects source/output namespaces; default: engineering.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path
import cv2
import numpy as np
from make_portraits import make

HERE = Path(__file__).resolve().parent

def run(spec):
    slug = spec['slug']
    group = spec.get('group', 'engineering')
    if group not in {'engineering', 'science', 'technology', 'mathematics'}:
        raise ValueError('Unknown portrait group: ' + group)
    original = HERE / 'src' / f'{slug}_{group}_ref.jpg'
    reference = Path(spec['reference'])
    if not reference.is_absolute():
        reference = HERE / reference
    if reference.resolve() != original.resolve():
        shutil.copyfile(reference, original)
    img = cv2.imread(str(original))
    h, w = img.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    poly = np.array(spec['figure']) * [w, h]
    cv2.fillPoly(mask, [poly.astype(np.int32)], 255)
    clean = np.where(mask[..., None] > 0, img, 255).astype(np.uint8)
    trace = HERE / 'src' / f'{slug}_{group}_trace.png'
    tone = HERE / 'src' / f'{slug}_{group}_tone.png'
    cv2.imwrite(str(trace), clean)
    cmd = [sys.executable, str(HERE / 'shade_lineart.py'), str(trace), str(tone), '--ink', '185']
    for x, y, t in spec.get('seeds', []):
        cmd += ['--seed', f'{int(x*w)},{int(y*h)},{t}']
    subprocess.run(cmd, check=True)
    crop = spec['crop']
    x0, y0, x1, y1 = crop
    cfg = dict(src=str(trace.relative_to(HERE)), tone_src=str(tone.relative_to(HERE)),
        crop=crop, face=spec['face'],
        mask_poly=[[(x-x0)/(x1-x0), (y-y0)/(y1-y0)] for x,y in spec['figure']],
        lineart=True, grabcut=False, silhouette=False, keep_fine=True,
        ink_thresh=185, width=1200, skip_ratio=60, min_face=8, min_body=40,
        rdp=0.6, smooth=5, hatch=True, hatch_band=[0,26], hatch_wmin=0,
        hatch_wmax=0.7, hatch_min_area=2400, hatch_spacing=9,
        wash_pct=44, shade_density=0.25, shade_sigma=0.03,
        w_dark=1.7, w_line=0.3, step=2, tremor=1.6, fill=0.9,
        preserve_masked_tone=True, nearest_only=True)
    cfg.update(spec.get('settings', {}))
    mini = make(slug, cfg)
    out = HERE / 'out' / group
    out.mkdir(parents=True, exist_ok=True)
    (out / f'{slug}.json').write_text(json.dumps(dict(config=cfg, mini=mini, reference=Path(spec['reference']).name), indent=2))
    (out / f'{slug}-spec.json').write_text(json.dumps(spec, indent=2))
    print('Finished', slug, flush=True)

if __name__ == '__main__':
    specs = json.loads(Path(sys.argv[1]).read_text())
    if 'slug' in specs:
        run(specs)
    else:
        for slug in sys.argv[2:] or specs:
            run(specs[slug])
