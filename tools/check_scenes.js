// Headless check of live cards: node tools/check_scenes.js slug1 slug2 ...  (needs playwright)
// Writes tools/out/check-<slug>.png (stage only, after the animation settles) and prints any errors.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const slugs = process.argv.slice(2); const root = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  const b = await chromium.launch();
  for (const slug of slugs) {
    for (const [tag, w] of [['desk', 1280], ['phone', 400]]) {
      const p = await b.newPage({ viewport: { width: w, height: 1000 } });
      const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await p.goto('file://' + path.join(root, 'cards', slug, 'index.html'));
      await p.waitForTimeout(tag === 'desk' ? 12500 : 11500);
      const el = await p.$('.lv-stage');
      if (el) await el.screenshot({ path: path.join(__dirname, 'out', `check-${slug}-${tag}.png`) });
      const ro = await p.evaluate(() => (document.querySelector('[data-readout]') || {}).textContent || '');
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      console.log(JSON.stringify({ slug, tag, ok: !errs.length && sw <= w, scrollWidth: sw, readout: ro, errors: errs }));
      await p.close();
    }
  }
  await b.close();
})();
