# Presentation verification

Original full-deck verification: 4 November 2026.

Updated 5 November 2026: the four MacBook screenshot fits and B18 wording are refreshed. Five requested steps plus their outgoing transitions on B10b, B18a and B21 were re-exported from revised source sequences. All other media remain byte-identical. All 26 browser acceptance checks passed again against the delivered local deck on 5 November. All eight updated clips have verified frame counts and final holds; Adele’s AAC audio is byte-identical. The original whole-master pixel comparison below describes the 4 November export; the revised clips are verified against the new sequence renders.

- **52 presentation steps**, plus the matching arrival loop.
- **26 browser checks passed** in Chrome/156.0.8078.80 on this Mac.
- Forward/back navigation, exact freeze frames, fullscreen, pause/resume, replay, overview, keyboard focus inside the scene, hover controls, refresh recovery, and presenter/audience synchronization were exercised.
- All five activities start with audio, seek through their middle, pause/resume, stop on exit, and hold at completion. A timer was also left running beyond the navigation clock slot.
- All 52 full-HD poster files match the independently decoded source-film boundary frames **pixel for pixel**. Every video has the expected frame count at 1920 × 1080 / 30 fps.
- All five encoded audio tracks contain sound at the start and silence in the final 100 milliseconds.
- A deliberately delayed video retains the previous freeze frame until playback is ready.
- Local launcher, paths with spaces, server reuse, port isolation and byte-range video seeking passed.
- The project-subfolder URL layout used by GitHub Pages loaded and played successfully in a local simulation.
- The film, arrival loop and final standalone composition checks passed with **zero errors and zero warnings**.
- No missing files, browser page errors or external network requests were observed. Fonts, player files and media are bundled.

The media package is about 157.5 MiB. The largest video is 47.3 MiB; all files are below GitHub's 100 MiB normal Git-file limit.

## Test scope

Chrome was automated. Safari still needs a manual check. The activities were sampled at their start, middle and end; this was not a complete two-hour live rehearsal. The package is prepared for GitHub Pages; no public repository or deployment was created.

The film source, cut list, audio edits and presenter overrides are preserved. DeepSeek is installed; all screenshot slots are complete. Old October and Keynote exports are retained.

The revised composition passes validation with zero errors/warnings. The prepared Workshop folder was tested under /Workshop/ on 5 November: all 52 steps resolve, revised holds load, DeepSeek video plays, and no external requests or missing files occur.
