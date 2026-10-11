const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname).replace(/\\/g, '/') + '/';
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390]) {
    const page = await (await b.newContext({ viewport: { width: w, height: 844 } })).newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const res = await page.evaluate((vw) => {
      const out = [];
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 0.5 && r.width > 0 && r.height > 0) {
          const cs = getComputedStyle(el);
          out.push({ sel: el.tagName + '.' + (el.className || '').toString().slice(0, 40), right: Math.round(r.right), w: Math.round(r.width), pos: cs.position, overflowParentHidden: !!el.parentElement && el.parentElement.scrollWidth > el.parentElement.clientWidth });
        }
      });
      return out.slice(0, 25);
    }, w);
    console.log('=== width ' + w + 'px ===');
    res.forEach(r => console.log(JSON.stringify(r)));
    await page.close();
  }
  await b.close();
})();
