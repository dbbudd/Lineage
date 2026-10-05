# Lineage print files

- `cards/` — one PDF per card face, 69 × 94 mm (63 × 88 mm poker card + 3 mm bleed on every side), named by card.
- `card-back.pdf` — the shared card back, same size.
- `deck/Lineage-full-deck.pdf` — all 54 faces in suit and rank order (Science, Technology, Engineering, Mathematics, then the two wild cards), with the back as the last page.

Regenerate faces with `python3 tools/make_cards.py`, then rebuild the full deck by running the same command again
(or `pdfunite print/cards/*.pdf print/card-back.pdf print/deck/Lineage-full-deck.pdf` in your preferred order).
