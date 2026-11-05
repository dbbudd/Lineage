# HKIS Display (Playfair Display)

The display face of the HKIS brand, used for the large type on the session page (`index.html`,
through `assets/magazine.css`). Self-hosted, so the page makes no request to a font service.

- `playfair-display-variable.woff2`: headlines, numerals and the rebuilt boards. A variable
  font, so this one file carries every weight from 400 to 900.
- `playfair-display-italic-variable.woff2`: the italic, for pull quotes.

These are the Latin subsets cached by HyperFrames when the session film was made (from Google
Fonts). They cover every character on a keyboard plus ’ “ ” — and ·, which is all the session
page's large type uses. Anything else (an en dash, an accented letter, a translated page) falls
back to Georgia for that character.

The CSS calls the family "HKIS Display" rather than the font's own name, so the subset is never
mistaken for the full font. SIL Open Font License 1.1: see `LICENSE`.
