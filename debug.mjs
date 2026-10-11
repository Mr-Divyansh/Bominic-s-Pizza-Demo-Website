import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = (p) => `file://${path.join(__dirname, p).replace(/\\/g, "/")}`;
const browser = await chromium.launch();

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(base("login.html"));
await page.waitForSelector(".form__checkbox");

console.log("--- checkbox ---");
console.log(await page.locator(".form__checkbox").evaluate((el) => {
	const s = getComputedStyle(el);
	return {
		tag: el.tagName, cls: el.className,
		display: s.display, alignItems: s.alignItems, minHeight: s.minHeight,
		box: el.getBoundingClientRect().height
	};
}));

console.log("--- drawer focus ---");
await page.goto(base("index.html"));
await page.waitForSelector("[data-drawer]");
const d = page.locator("[data-drawer]");
await page.locator("[data-menu-toggle]").click();
await page.waitForTimeout(420);
console.log("drawer:", await d.evaluate((e) => ({ cls: e.className, vis: getComputedStyle(e).visibility })));
console.log("active:", await page.evaluate(() => ({
	tag: document.activeElement?.tagName, cls: document.activeElement?.className || "",
	inDrawer: !!document.activeElement?.closest("[data-drawer]")
})));

console.log("--- navbar__inner ---");
console.log(await page.locator(".navbar__inner").evaluate((e) => ({
	html: e.innerHTML.replace(/\s+/g, " "),
	actionsDisplay: getComputedStyle(e.querySelector(".navbar__actions")).display
})));

console.log("--- exact 'Menu' text holders ---");
console.log(await page.locator("[data-drawer]").evaluate((e) =>
	[...e.querySelectorAll("*")].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim() === "Menu")).map((n) => `${n.tagName}.${n.className}`)));

await browser.close();
