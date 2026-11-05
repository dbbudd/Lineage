# Stop Waiting for the Perfect App

Future of Learning · 14 November 2026

This is the browser presentation: 52 presenter-paced steps, the arrival loop,
and five illustrated activities with music. All player files and media are local.

## Present on your Mac

1. Keep this folder together. Double-click **Start Presentation.command**.
2. Click the presentation once if needed, then press **F** for full screen.
3. Press **Right arrow** to play the next animation. It freezes when finished.
4. Press **Left arrow** to return to the preceding freeze frame.

The launcher needs Python 3 (already available on the build Mac). If macOS does
not open the launcher, open Terminal in this folder and run `python3 serve.py --open`.
Use `http://127.0.0.1:4314/`; opening index.html directly from Finder is unsupported.
The server listens only on this Mac. The deck works with Wi-Fi turned off.

## Controls

| Key | Action |
| --- | --- |
| Right arrow / Space | Next animation, then freeze |
| Left arrow | Previous freeze frame |
| F | Toggle full screen |
| Escape | Leave full screen or close a dialog |
| K | Pause / resume current animation or timer |
| R | Replay the current scene from its start |
| G | Open the slide overview; choose any step |
| B | Black the screen; press B again to return |
| ? | Help |
| P | HyperFrames presenter notes and a separate audience window |

Move the pointer to reveal playback tools and HyperFrames navigation. Timer slides
start their music on entry, hold at zero, and never advance automatically. Leaving
a timer stops its sound. Back and slide-overview jumps show stills without replaying
music. Refreshing an activity restores it paused; K resumes it. If a browser blocks
audio, use the displayed **Play activity** control. The native sound control mutes
the deck. Do not mute the browser tab if you want activity music.

For notes, P opens the audience window. Use that window's full-screen control,
then return to the notes window to navigate. Audio plays from the presenter window;
the synchronized audience window stays muted to avoid playing the music twice.
For a remote session, share the audience image and include system audio.

## Add to the Lineage site

Move this entire **Workshop** folder into the Lineage site's publishing folder,
alongside the existing Lineage `index.html`. Keep the capital **W** in Workshop.
The existing Lineage homepage stays in place.

The result should look like this:

```
Lineage/
  index.html
  Workshop/
    index.html
    composition.html
    media/
    posters/
    vendor/
    ...remaining Workshop files
```

Commit and push the folder using your usual GitHub workflow. Use GitHub Desktop
or Git for the larger music videos. The existing Lineage GitHub Pages setup serves
the new subfolder too; no new site settings are needed when this is the same
publishing folder.

The workshop address will be:
https://dbbudd.github.io/Lineage/Workshop/

All presentation paths are relative, so the folder works inside the Lineage site.
No installation, build, backend, CDN or API key is needed to play it online.
For local use, double-click **Start Presentation.command** inside this folder.

This package includes the completed 5 November screenshot-fit and B18 copy fixes.
It has been prepared locally; it has not been published to GitHub.

## Source and rebuild

The editable HyperFrames film remains in the sibling `film` folder. Its current
`cuts.csv` defines the presentation order; `tools/speaker_script.py` supplies notes.
`tools/build_browser_deck.py` builds this export and `tools/browser-deck/` holds
the playback adapter, launcher, and interface templates. Existing October/Keynote
exports are preserved. The browser package is a separate export.

See `TEST-RESULTS.md` for actual verification and remaining browser test limits.

The B00 title and arrival loop include a tutorials QR and readable address: https://dbbudd.github.io/Lineage/tutorials/
