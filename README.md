# Lineage: a STEM deck

52 STEM contributors and 2 wild cards, each drawn as **one continuous line**. On every card the line leaves the portrait, turns into the person's idea (drawn 3Blue1Brown-style), and runs on toward the modern AI that grew from it. Each card has a QR code that opens that person's page on this site.

Suits: **Science · Technology · Engineering · Mathematics**, ranked by impact (Ace high). Wild cards: Rick Rubin and Elon Musk.

## Site
```
index.html                 concept + all four suits to explore
cards/<slug>/index.html    one page per card (these are the QR code URLs)
assets/live.js             the live-card engine: portrait line → connector → scene, controls, code panel
assets/scenes/<slug>.js    one interactive scene per card (an example of that person's own work)
assets/cards/<slug>.svg    the finished card face (border → portrait → idea), used on the grid and card pages
data/lines/<slug>.js       each portrait as one continuous weighted line
data/live/<slug>.json      the "Where the line goes" story text, thesis and remix hint
assets/                    lineage.css, lineage.js, card-back.svg
```
It is a static site with no build step needed to view it. Turn on **GitHub Pages** (Settings → Pages → deploy from `main`, root), and each card lives at
`https://dbbudd.github.io/Lineage/cards/<slug>/`.

## Editing content
All text lives in `data/*.json`, one file per suit (plus `jokers.json`). The fields and style rules are in `data/CONTENT_BRIEF.md`. After editing, rebuild the pages:
```
python3 tools/build_site.py
# custom domain for the QR codes:
BASE_URL=https://cards.example.org/ python3 tools/build_site.py
```

## Making portraits and print files
`tools/` holds the generators (`pip install -r tools/requirements.txt`, then run them from inside `tools/`):
- `make_portraits.py`: batch-downloads each card's Commons photo, finds the face, and writes `data/lines/<slug>.js`. Hand-tuned crops in `portraits.json` override the automatic ones. Run with an OpenCV 4.x that has face detection (`opencv-python-headless==4.10.0.84`).
- `linegen.py`: photo → single continuous line (weight, hatching, shadow wash). Source photos are in `src/`.
- `SCENE_BRIEF.md` + `check_scenes.js`: how to write a card's scene, and a headless checker that screenshots it (needs Playwright).
- `cards.py`: v1 card layout (63 × 88 mm, 3 mm bleed) and suit pips.
- `card_v2.py`: v3 "line carries on" card (Tesla prototype), with a QR code to the live page.
- `render.py`, `variants.py`: variable-width line rendering and treatment comparisons.

`print/cards/<slug>.pdf` are the print-ready card faces (63 × 88 mm + 3 mm bleed); `print/card-back.pdf` is the back.
Rebuild faces with `python3 tools/make_cards.py` (the idea drawing for each card is `tools/glyphs/<slug>.py`, see `tools/GLYPH_BRIEF.md`), then `python3 tools/build_site.py`.

## Image rights
Source portraits come from Wikimedia Commons, and the licence for each one is recorded in the data files. Public-domain images are used where possible. Images of living people are usually CC BY or CC BY-SA, so their line drawings need attribution. The famous Rick Rubin "vibe coding" photo is copyrighted: draw that pose from a licensed photo, or from scratch.
