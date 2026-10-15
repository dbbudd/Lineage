"""Assemble the current 54 card faces and back inside the project.

Run: python tools/assemble_deck.py (requires pypdf).
The source cards must have been rebuilt with make_cards.py first.
"""
import json
from pathlib import Path
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent.parent

def assemble():
    writer = PdfWriter()
    slugs = []
    for suit in ('science', 'technology', 'engineering', 'mathematics', 'jokers'):
        for card in json.loads((ROOT / 'data' / f'{suit}.json').read_text()):
            slugs.append(card['slug'])
            source = ROOT / 'print' / 'cards' / f'{card["slug"]}.pdf'
            reader = PdfReader(source)
            if len(reader.pages) != 1:
                raise ValueError(f'Expected one card face: {source}')
            page = reader.pages[0]
            if abs(float(page.mediabox.width) * 25.4 / 72 - 69) > .01 or abs(float(page.mediabox.height) * 25.4 / 72 - 94) > .01:
                raise ValueError(f'Unexpected print dimensions: {source}')
            writer.append(reader)
    if len(slugs) != 54 or len(set(slugs)) != 54:
        raise ValueError('Expected 54 distinct card faces')
    writer.append(ROOT / 'print' / 'card-back.pdf')
    destination = ROOT / 'print' / 'deck' / 'Lineage-full-deck.pdf'
    destination.parent.mkdir(parents=True, exist_ok=True)
    writer.write(destination)
    if len(PdfReader(destination).pages) != 55:
        raise ValueError('Expected 54 faces and one back')
    print(f'Assembled 55 pages: {destination}')
    return destination

if __name__ == '__main__':
    assemble()
