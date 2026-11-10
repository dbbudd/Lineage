# Media & Information Technology · Parent Coffee, 18 November 2026

A click-through browser presentation: 31 presenter-paced steps. Each step plays
its animation once and freezes while you talk. It is not a video.

## Present it on this Mac

1. Keep this folder together.
2. Double-click **Start Presentation.command** (needs Python 3, already present).
3. Click the window once, press **F** for full screen.
4. **Right arrow** plays the next animation and freezes it; **Left arrow** steps back.

If macOS will not open the launcher, run `python3 serve.py --open` from this
folder and use `http://127.0.0.1:4314/`.

## Controls

| Key | Action |
| --- | --- |
| → / Space | Next animation, then freeze |
| ← | Previous freeze frame |
| F | Full screen |
| K | Pause / resume |
| R | Replay this scene |
| G | Slide overview |
| P | Presenter notes and a separate audience window |
| B | Black the screen |
| ? | Help |

## Publishing

The same folder works as a static site (no build step, no dependencies). Copy it
to the `parents` folder of the Lineage repository so the closing QR —
`https://dbbudd.github.io/Lineage/parents/` — opens it. Keep `index.html`,
`composition.html`, `deck.json`, `deck.js`, `deck.css`, `frame-player.js`,
`vendor/`, `media/` and `posters/` together; paths support a project subfolder.

## Rebuilding

From the sibling `film/` folder: `python3 tools/build_parent_coffee.py` regenerates
the compositions, then `npx hyperframes@0.8.81 render --quality delivery` and
`python3 tools/build_browser_deck.py --master … --loop …` re-cut this deck.
