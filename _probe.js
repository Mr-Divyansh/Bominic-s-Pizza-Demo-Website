const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname).replace(/\\/g, '/') + '/';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 360, height: 844 } })).newPage();
  await page.goto(BASE + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.category-card')];
    return cards.map(c => {
      const icon = c.querySelector('.category-card__icon');
      const label = c.children[1];
      const ir = icon.getBoundingClientRect(), lr = label.getBoundingClientRect();
      return {
        label: label.textContent.trim(),
        labelRect: [Math.round(lr.left), Math.round(lr.right), Math.round(lr.width)],
        labelText: label.innerText,
        labelWS: getComputedStyle(label).whiteSpace,
        labelWrap: getComputedStyle(label).overflowWrap,
        iconText: icon.textContent,
        iconLen: icon.textContent.length,
        iconRect: [Math.round(ir.left), Math.round(ir.right), Math.round(ir.width)],
        iconSW: icon.scrollWidth,
        cardSW: c.scrollWidth, cardCW: c.clientWidth
      };
    });
  });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
