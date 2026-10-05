# Glyph brief: the printed idea drawing on each card

Every card face (assets/cards/<slug>.svg and print/cards/<slug>.pdf) is one continuous line:
braided border → portrait in the suit's ink → connector → **a small drawing of the person's idea** (the "glyph").
The web page behind the QR code has the full, labelled, interactive version (assets/scenes/<slug>.js).
The glyph is the printed, glanceable version of that same scene.

Reference: tools/glyphs/tesla.py. Renderer and drawing kit: tools/make_cards.py (class G).

## Write tools/glyphs/<slug>.py
```python
def glyph(g):
    # draw with g.path / g.circle / g.dot / g.arrow / g.rect ; return the (x, y) where the portrait's line arrives
    ...
    return entry_xy
```
- Units are **millimetres** on the card. `g.box = (x, y, w, h)` is the idea area, top-right (about 30 × 22 mm).
  You may also use `g.head` (head centre) and `g.r` (head radius) to place a halo / overlay on the portrait, as Tesla does,
  but keep the face readable.
- Colours: `g.col` (suit colour, the main idea line), `g.ink` (portrait ink, for secondary marks), `g.soft` (pale suit tint).
  Line weights: `g.lw` is 0.30 mm. Main marks 0.3–0.5 mm, secondary 0.2 mm, nothing thinner than 0.14 mm.
- **No text, no numbers, no letters** (the one exception: a single large symbol that IS the idea, e.g. π or Σ, at ≥ 3 mm tall).
- **Bold and simple:** 3–12 elements, readable from arm's length on a 63 × 88 mm card. One clear shape that says the idea,
  ideally echoing the web scene (e.g. Curie: a decay curve stepping down by halves turning into a falling loss curve;
  Euler: the 4-dot, 7-edge bridges graph; Turing: a tape with a head; Darwin: a branching tree).
- Show the AI step with **one** accent element in `g.col` where natural (an arrow, a small network, a dot at the vanishing point).
- Stay inside g.box (a little overlap toward the head is fine). Don't cover the top-left index (x < 14 mm) or the name area (y > 72 mm).
- Pure Python + numpy (`g.np`, `g.math`). Deterministic (seed any randomness).

## Check
```
PNG=1 python3 tools/make_cards.py <slug> [...]
```
Then **look** at tools/out/cards/<slug>.png with the Read tool. Iterate until the glyph reads clearly at a glance, is balanced with
the portrait, and nothing collides with the portrait's face, the indices or the name block. Only create your own glyph files.
