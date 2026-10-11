const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname).replace(/\\/g, '/') + '/';
const pages = ['index.html','menu.html?restaurant=rest-003','product.html?food=food-007','cart.html','checkout.html','about.html','contact.html','privacy.html','terms.html','restaurants.html','account.html','login.html','register.html'];
const widths = [360, 390, 768, 1024, 1280];
const issues = []; let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; issues.push('FAIL: ' + m); } };

(async () => {
  const browser = await chromium.launch();
  for (const p of pages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', r => { const u = r.url(); if (!u.startsWith('data:')) errors.push('REQFAIL: ' + u.slice(0, 90)); });
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(400);
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(120);
      const ov = await page.evaluate(() => {
        const de = document.documentElement; const off = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > de.clientWidth + 2 && r.width > 0 && getComputedStyle(el).overflowX === 'visible')
            off.push(el.tagName + '.' + (el.className||'').toString().slice(0,25) + ' w=' + Math.round(r.width));
        });
        return { sw: de.scrollWidth, cw: de.clientWidth, off: off.slice(0,3) };
      });
      if (ov.sw > ov.cw + 2) { fail++; issues.push(`OVERFLOW ${p} @${w} sw=${ov.sw} cw=${ov.cw} ${JSON.stringify(ov.off)}`); }
      else pass++;
    }
    if (errors.length) { fail++; issues.push('CONSOLE ' + p + ': ' + errors.slice(0,3).join(' | ')); } else pass++;
    await ctx.close();
  }
  console.log('DONE part1 (page/overflow/console). pass=' + pass + ' fail=' + fail);
  require('fs').writeFileSync('_audit_result.json', JSON.stringify({ pass, fail, issues }));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
