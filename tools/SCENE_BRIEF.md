# Scene brief — Lineage live cards

Each card page (cards/<slug>/index.html) is a "live card": the person's portrait draws itself as one
continuous line, a connector warms into the suit colour, and flows into an animated, interactive
**scene that shows an example of the person's own work**, ending at the piece of modern AI it leads to.
Readers can remix it with controls, and a live code snippet shows the idea as Python-like code.

Reference implementation: `assets/scenes/tesla.js` (read it first). Engine API: header comment of `assets/live.js`.

## What you write for each card
1. `assets/scenes/<slug>.js` — one `Lineage.scene({...})` call.
2. `data/live/<slug>.json` — the page text:
```json
{ "thesis": "One or two sentences under the name: the pen draws X, becomes Y, runs on to Z. (<= 40 words)",
  "story": [ {"tag": "1905", "title": "Short title", "text": "40-60 words: the person's actual work, accurate."},
             {"tag": "the idea", "title": "...", "text": "40-60 words: how the scene shows it; what to watch."},
             {"tag": "2020", "title": "...", "text": "40-60 words: the AI link, specific and true."} ],
  "hint":  "One sentence telling readers what to change and what to notice." }
```
Tags are short (a year, or 1-2 words). British/Australian spelling. High-school reading level. No em-dash asides.
Facts must be accurate; check with a web search if unsure. Keep consistent with the card's existing text in data/<suit>.json.

## Scene rules
- **It must depict the person's real work** (their experiment, machine, theorem, algorithm, data), not a generic metaphor. Label key parts.
- **Three beats driven by `k` (0..1 reveal):** (1) their work appears and runs, (2) the idea is made visible (a curve, a count, a rule),
  (3) a final element in the accent colour shows the AI concept it leads to (like Tesla's word vectors). Use `ft` for continuous motion.
- **Remix:** 2-4 params that genuinely change the behaviour (a speed param with id `speed` is used by the engine to scale `ft`).
  Interactive pointer input (drag points, click cells, draw) is welcome where natural: implement `pointer(S, type, x, y)`.
- **Code panel:** `code(S)` returns 6-14 lines of clear Python-like code of the actual algorithm/formula, with live values via `S.v()` and comments via `S.c()`.
- **Readout:** `draw` returns a short live sentence with numbers (e.g. "half-life 3.0 s · 412 of 1000 atoms left").
- **Layout:** draw only inside `S.box` ({x,y,w,h}; on desktop it is the right ~55% of the canvas, on phones the top half), computing all sizes from `S.box`, `S.iw` (idea line weight) and `S.fs` (font size). Use `layout(S)` to precompute geometry and `entry(S)` to return the point (usually the left edge of your drawing) where the connector from the portrait arrives.
  You may also draw over the portrait using `S.P` (portrait geometry: `S.P.at(u,v)` maps portrait units to pixels; `S.P.head` is the head centre) if it helps the story, as Tesla's halo does. Keep it subtle.
- **Style:** warm paper ground (do not paint a background), lines not fills. Accent colour `S.C.accent` for the idea/AI layer, `S.C.ink` for secondary marks,
  `S.C.soft` for guides. Weights from `S.iw` (main) down to `S.iw*0.4` (guides). Text via `S.text()` (it draws a paper halo so labels stay readable), sizes `S.fs*0.8 … S.fs*1.3`.
  Bold and legible: lines, arrows and labels must not get lost.
- **Performance:** keep each frame light (< ~4 ms). Precompute in `layout`/`init`. Use `S.rng(seed)` for deterministic randomness. No external libraries, no network.
- **Robustness:** no errors at any width; handle empty/odd text input; `reset(S)` optional (called by "Draw again").

## Checking your work
```
python3 tools/build_site.py <slug> [<slug> ...]        # rebuild just your card pages
NODE_PATH=$(npm root -g) node tools/check_scenes.js <slug> [...]
```
The checker prints errors and writes `tools/out/check-<slug>-desk.png` and `-phone.png`. **Look at both screenshots with the Read tool**
and fix anything cramped, overlapping, clipped, illegible or empty. Iterate until it looks like a finished, beautiful 3Blue1Brown-style
diagram. Do not edit `assets/live.js`, `assets/lineage.css`, `tools/build_site.py` or other people's files; if the engine truly lacks
something, work around it inside your scene and mention it in your final reply.
