# HKIS Label (Montserrat)

The label face of the HKIS brand, used for the small capitals, pills and buttons on the session
page (`index.html`, through `assets/magazine.css`). Self-hosted, so the page makes no request to
a font service. `montserrat-variable.woff2` is a variable font: one file carries every
weight from 100 to 900.

These are the Latin subsets cached by HyperFrames when the session film was made (from Google
Fonts). They cover every character on a keyboard plus ’ “ ” — and ·. Anything else falls back
to the system sans-serif for that character.

The CSS calls the family "HKIS Label" rather than the font's own name, so the subset is never
mistaken for the full font. SIL Open Font License 1.1: see `LICENSE`.
