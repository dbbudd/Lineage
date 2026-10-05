# STEM deck content brief (shared by all writers)

Project: a 52-card STEM playing-card deck (+2 Jokers). Suits: Science, Technology, Engineering, Mathematics.
Each card is a famous STEM contributor drawn as one continuous line; the line flows out of the portrait
into a 3Blue1Brown-style visual of their idea, and on toward modern AI ("the line carries on").
Each card has a QR code linking to a web page about the person. You are writing that page content.

Audience: high-school students (grades 9-12) and their teachers. Clear, vivid, accurate, no hype.
Spelling: British/Australian ("colour", "organise"). Plain sentences. No em-dash asides. No emoji.
Rank order is by impact within the suit (A highest, then K, Q, J, 10 ... 2).

## Output
Write a JSON array (valid JSON, UTF-8) to the file path you are given. One object per card, in rank order:

{
  "slug": "turing",                     // lowercase surname, ascii, unique; add first name if clash
  "suit": "Technology",
  "rank": "A",                          // A K Q J 10 9 8 7 6 5 4 3 2  (Jokers: "Joker")
  "name": "Alan Turing",
  "years": "1912–1954",                 // en dash; living people: "b. 1976"; uncertain: "c. 780–c. 850"
  "born": "London, England",            // place of birth as commonly given
  "field": "Mathematics & Computer Science",
  "known_for": "max 12 words",
  "bio": "70-100 words. Who they were, context, obstacles they faced (be factual).",
  "big_idea": "60-90 words. The contribution in plain language a 15-year-old can follow. Concrete.",
  "line_to_ai": "60-90 words. A specific, technically TRUE connection from their work to modern AI. Name the AI concept (e.g. gradient descent, transformers, convolutional networks, cross-entropy loss, diffusion models, AlphaFold, GPUs). No vague 'paved the way' filler. If the link is indirect, say so honestly.",
  "line_becomes": "One sentence describing what the portrait's continuous line turns into on the card, as a precise mathematical/diagram visual (3Blue1Brown style), ending in the AI concept. E.g. 'The halo behind his head becomes a rotating phasor whose height traces an AC sine wave, which recedes into word vectors turning by m·θ (rotary position embedding).'",
  "think_about": "One open discussion question for students (ethics, creativity, or how the idea works).",
  "sources": [ {"title": "...", "url": "https://..."} ],   // 2-3 reputable links: Wikipedia, Britannica, Nobel Prize, university/museum pages. Real URLs you have checked.
  "portrait": {"commons_file": "File:....jpg", "license": "Public domain" }  // a Wikimedia Commons portrait suitable for line-tracing; prefer public domain; for living people give the CC licence; null if none found
}

## Accuracy rules (important)
- Verify every date, place, prize and claim with a web search or the person's Wikipedia page before writing it.
- Do not invent quotes. Do not include quotes at all.
- For living people, stick to well-documented facts; no speculation about private life.
- If a popular story is disputed (e.g. myths), either skip it or say it is disputed.
- Credit collaborators where a discovery was shared (e.g. Nobel co-laureates).
