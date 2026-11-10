# Verification — 12 November 2026

What was actually checked when this deck was built.

## Machine checks (passed)

- Master film rendered from the HyperFrames source: **233.9 s, 1920×1080, 30 fps**, 93.0 MB.
- Cut into **31 presenter steps** from `film/cuts.csv`; the clips tile the master with no gaps.
- Each exported clip asserted by the exporter: expected frame count, 1920×1080, 30 fps,
  no audio track, and under 100 MB.
- `deck.json`: 31 slides, titles and durations correct, total 234.0 s.
- Every `media/` and `posters/` path referenced by `deck.json` exists on disk.
- `composition.html` contains 31 scene frames and 31 `<video>` elements, all resolving.
- Local server answers `/__deck_health` as `parent-coffee-2026-11-18` and serves
  `index.html` and `composition.html` with HTTP 200.
- Composition source passed `hyperframes check` before rendering: 0 errors, 0 warnings.

## Not verified

- **Interactive playback was not automated in a browser.** Arrow-key stepping, full
  screen, the `G` overview, `P` presenter notes and the blackout key have not been
  exercised by a script; the player code is the same tested build used previously,
  but this cut of content has not been clicked through end to end.
- Offline behaviour (Wi-Fi off) was not re-tested for this deck.
- Safari was not tested; Chrome was the target of the earlier deck.

## Known packaging note

`media/arrival-loop.mp4` is included but nothing in `deck.js` plays it. The opening
step is the title still, which holds its last frame while the room arrives. If a
moving arrival loop is wanted, it has to be wired into the player.
