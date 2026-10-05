# Rewrite brief: make the live-card text informational

Each card page opens with a "thesis" under the person's name and a 3-step "Where the line goes" list
(data/live/<slug>.json). Right now much of it narrates the drawing ("The pen draws…", "Watch the…",
"Click a cell…"). Rewrite so it **informs from the very first sentence**: what the person did, why it
mattered, and how it leads to today's AI. Facts only, no narration of the animation.

Rules
- **thesis** (25–45 words): state plainly what the person achieved, then the link to modern AI.
  Example for von Neumann: "John von Neumann designed the stored-program computer: a processor and a memory
  that hold both instructions and data, so a machine can switch tasks just by loading a new program.
  Nearly every computer that trains AI still follows his 1945 blueprint."
- **story** keeps 3 steps with the same structure {tag, title, text}; 40–60 words each.
  1. Their work: what, when, how (a year as the tag).
  2. The idea: explain the concept itself clearly, as a teacher would (tag can stay a short phrase, e.g. "the idea", "how it works").
  3. The line to AI: the specific, true connection (a year or "today" as the tag).
- Banned in thesis and story: "the pen", "the line", "draws", "watch", "click", "drag", "slider", "scene",
  "here", "you can see", "on screen", "below/above", "try". No second-person instructions at all.
- Keep every fact consistent with the card in data/<suit>.json and with what the current text already says;
  if you add a fact, be sure it is correct (check with a web search if unsure). British/Australian spelling,
  high-school reading level, no em-dash asides.
- Leave "hint" unchanged (it is the remix instruction and may stay second-person).
- Keep valid JSON (UTF-8, `ensure_ascii=False`, indent 1). Check with python3 that each file still parses.
