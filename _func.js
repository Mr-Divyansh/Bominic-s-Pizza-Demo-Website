const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname).replace(/\\/g, '/') + '/';
const issues = []; let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; issues.push('FAIL: ' + m); } };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(400);

  const links = await page.$$eval('.navbar__menu .navbar__link', els => els.map(e => e.textContent.trim()));
  ok(JSON.stringify(links) === JSON.stringify(['Home','Menu','Restaurants','About','Contact']), 'nav links: ' + JSON.stringify(links));
  const login = await page.$$eval('.navbar__link', els => els.filter(e => e.textContent.trim() === 'Login').length);
  const reg = await page.$$eval('.navbar', els => els[0].innerHTML.includes('Register'));
  ok(login === 1 && !reg, 'one Login, no Register (login=' + login + ' reg=' + reg + ')');
  const legal = await page.$$eval('.footer', els => els[0].innerHTML.includes('privacy.html') && els[0].innerHTML.includes('terms.html'));
  ok(legal, 'footer privacy+terms links');
  const catCards = await page.$$eval('.category-card', els => els.map(e => e.textContent.trim() + '|' + e.getAttribute('href')));
  ok(catCards.length === 6 && catCards.every(c => !c.includes('undefined')), 'category cards: ' + JSON.stringify(catCards));
  await page.click('[data-add-to-cart]');
  await page.waitForTimeout(200);
  const cc = await page.$eval('[data-cart-count]', e => ({ t: e.textContent.trim(), h: e.hidden }));
  ok(cc.t === '1' && cc.h === false, 'cart count 1 after add: ' + JSON.stringify(cc));
  const toggleHidden = await page.$eval('[data-menu-toggle]', e => getComputedStyle(e).display === 'none');
  ok(toggleHidden, 'hamburger hidden desktop');
  const row = await page.evaluate(() => {
    const bt = document.querySelector('.navbar__brand').getBoundingClientRect().top;
    const lt = document.querySelector('.navbar__menu').getBoundingClientRect().top;
    const ct = document.querySelector('.navbar__cart').getBoundingClientRect().top;
    return Math.abs(bt - lt) < 40 && Math.abs(lt - ct) < 40;
  });
  ok(row, 'navbar one row desktop');

  const mctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await mp.waitForTimeout(400);
  await mp.click('[data-menu-toggle]');
  await mp.waitForTimeout(350);
  const ms = await mp.$eval('.navbar__menu', e => ({ v: getComputedStyle(e).visibility, o: e.classList.contains('is-open') }));
  const ae = await mp.$eval('[data-menu-toggle]', e => e.getAttribute('aria-expanded'));
  ok(ms.v === 'visible' && ms.o && ae === 'true', 'mobile menu opens: ' + JSON.stringify(ms) + ' aria=' + ae);

  await page.goto(BASE + 'menu.html?restaurant=rest-003', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(400);
  await page.selectOption('[data-category-filter]', 'Pizza');
  await page.waitForTimeout(250);
  const pz = await page.$$eval('.food-card__category', els => els.length > 0 && els.every(e => e.textContent.trim() === 'Pizza'));
  ok(pz, 'menu Pizza filter works');
  await page.goto(BASE + 'menu.html?restaurant=rest-003&category=Desserts', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(400);
  const dv = await page.$eval('[data-category-filter]', e => e.value);
  ok(dv === 'Desserts', 'deep-link category sets filter: ' + dv);

  await b.close();
  console.log('FUNCTIONAL: pass=' + pass + ' fail=' + fail);
  issues.forEach(i => console.log(i));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
