import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = (p) => `file://${path.join(__dirname, p).replace(/\\/g, "/")}`;
const browser = await chromium.launch();

for (const [w, h] of [[320, 640], [390, 844]]) {
	const ctx = await browser.newContext({ viewport: { width: w, height: h } });
	const page = await ctx.newPage();
	await page.goto(base("index.html"));
	await page.waitForSelector(".category-card");
	console.log(`\n=== home ${w} ===`);
	console.log("grid:", await page.locator(".category-grid").evaluate((e) => { const s = getComputedStyle(e); return { cols: s.gridTemplateColumns, colGap: s.columnGap, rowGap: s.rowGap }; }));
	console.log("cards:", JSON.stringify(await page.locator(".category-card").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width) }; }))));
	await page.goto(base("menu.html"));
	await page.waitForSelector(".food-card");
	console.log(`\n=== menu ${w} ===`);
	console.log("menu-filters present:", await page.evaluate(() => { const f = document.querySelector(".menu-filters"); if (!f) return "MISSING"; const g = f.nextElementSibling; return { cls: f.className, mb: getComputedStyle(f).marginBottom, next: g && g.className, gridMt: g && getComputedStyle(g).marginTop }; }));
	console.log("pills:", await page.locator(".filter-pills").evaluate((e) => { const s = getComputedStyle(e); return { cols: s.gridTemplateColumns, colGap: s.columnGap, rowGap: s.rowGap }; }));
	const pills = await page.locator(".filter-pills .button").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight }; }));
	console.log("pill boxes:", JSON.stringify(pills, null, 1));
	const cardEl = page.locator(".food-card").first();
	await cardEl.scrollIntoViewIfNeeded();
	const card = await cardEl.boundingBox();
	console.log("first card top:", card && Math.round(card.top), " pills max bottom:", Math.max(...pills.map((p) => p.b)));
	await ctx.close();
}
await browser.close();
