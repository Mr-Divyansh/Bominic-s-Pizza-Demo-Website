const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname).replace(/\\/g, '/') + '/';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 360, height: 844 } })).newPage();
  await page.goto(BASE + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const out = { docSW: document.documentElement.scrollWidth, bodySW: document.body.scrollWidth, wide: [], pseudo: [] };
    document.querySelectorAll('body *').forEach(el => {
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        const cs = getComputedStyle(el);
        out.wide.push({ sel: el.tagName + '.' + (el.className||'').toString().slice(0,45), sw: el.scrollWidth, cw: el.clientWidth, ox: cs.overflowX });
      }
      const be = getComputedStyle(el, '::before'), af = getComputedStyle(el, '::after');
      [ ['before', be], ['after', af] ].forEach(([kind, s]) => {
        if (s.content && s.content !== 'none' && (s.position === 'absolute' || s.position === 'fixed')) {
          out.pseudo.push({ sel: el.tagName + '.' + (el.className||'').toString().slice(0,45), kind, pos: s.position, right: s.right, left: s.left, w: s.width });
        }
      });
    });
    return out;
  });
  console.log(JSON.stringify(res, null, 1).slice(0, 4000));
  await b.close();
})();
