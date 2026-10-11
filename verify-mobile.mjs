import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = (p) => `file://${path.join(__dirname, p).replace(/\\/g, "/")}`;

const results = [];
let failures = 0;
const check = (name, pass, detail = "") => {
	if (!pass) failures += 1;
	results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();

/* ---------- 1. Remember-me checkbox ---------- */
for (const [w, h, label] of [[320, 640, "320px"], [390, 844, "390px"], [768, 1024, "768px"]]) {
	const ctx = await browser.newContext({ viewport: { width: w, height: h } });
	const page = await ctx.newPage();
	await page.goto(base("login.html"));
	await page.waitForSelector(".form__checkbox input[type=checkbox]");
	const cb = page.locator(".form__checkbox input[type=checkbox]");
	const box = await cb.boundingBox();
	check(`login checkbox rendered size @${label}`, !!box && box.width >= 17 && box.width <= 23,
		box ? `${Math.round(box.width)}x${Math.round(box.height)}` : "not rendered");
	const cs = await page.locator(".form__checkbox").evaluate((el) => {
		const s = getComputedStyle(el);
		return { display: s.display, alignItems: s.alignItems, minHeight: s.minHeight };
	});
	check(`remember-me row is flex + centred @${label}`, cs.display === "inline-flex" && cs.alignItems === "center", JSON.stringify(cs));
	check(`remember-me tap target >=44px @${label}`, parseFloat(cs.minHeight) >= 44, cs.minHeight);
	const labelBox = await page.locator(".form__checkbox").boundingBox();
	const sameLine = !!box && !!labelBox && box.y >= labelBox.y - 1 &&
		box.y + box.height <= labelBox.y + labelBox.height + 1;
	check(`checkbox vertically centred in row @${label}`, sameLine);
	await page.locator(".form__checkbox").click({ position: { x: 110, y: 22 } });
	check(`clicking label toggles checkbox @${label}`, await cb.isChecked());
	await cb.click();
	check(`checkbox still directly clickable @${label}`, !(await cb.isChecked()));
	await ctx.close();
}
/* ---------- 2. Drawer ---------- */
{
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
	const page = await ctx.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(String(e)));
	page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
	await page.goto(base("index.html"));
	await page.waitForSelector("[data-drawer]", { state: "attached" });

	const toggle = page.locator("[data-menu-toggle]");
	const drawer = page.locator("[data-drawer]");
	check("hamburger is a real button", (await toggle.evaluate((e) => e.tagName)) === "BUTTON");
	check("hamburger accessible name", (await toggle.getAttribute("aria-label")) === "Open navigation menu");
	check("hamburger aria-expanded=false when closed", (await toggle.getAttribute("aria-expanded")) === "false");
	check("hamburger aria-controls points at drawer id", (await toggle.getAttribute("aria-controls")) === (await drawer.getAttribute("id")));
	check("drawer id is unique", (await page.locator("#bominics-drawer").count()) === 1);
	check("single cart link inside drawer", (await page.locator("[data-drawer] .navbar__cart").count()) === 1);

	const closedBox = await drawer.boundingBox();
	check("closed drawer off-screen to the right", closedBox.x >= 389, `x=${Math.round(closedBox.x)}`);

	await toggle.click();
	await page.waitForTimeout(420);
	const openBox = await drawer.boundingBox();
	check("open drawer flush at right edge", Math.abs(openBox.x + openBox.width - 390) <= 2, `x=${Math.round(openBox.x)} w=${Math.round(openBox.width)}`);
	check("drawer width 80-88% viewport, max 360px", openBox.width > 390 * 0.79 && openBox.width <= 360, `${Math.round(openBox.width)}px`);
	check("drawer fits inside viewport", openBox.x >= 0 && openBox.y >= 0 && openBox.y + openBox.height <= 845);
	check("drawer transition uses transform", (await drawer.evaluate((e) => getComputedStyle(e).transitionProperty)).includes("transform"));
	check("aria-expanded=true when open", (await toggle.getAttribute("aria-expanded")) === "true");
	check("focus moved into drawer", await page.evaluate(() => !!(document.activeElement && document.activeElement.closest("[data-drawer]"))));
	check("body scroll locked", await page.evaluate(() => document.body.classList.contains("navbar-drawer-open")));
	check("scrim visible", await page.locator("[data-drawer-scrim]").isVisible());

	const drawerLinks = await drawer.locator(".navbar__drawer__group").nth(0).locator("a.navbar__link").allInnerTexts();
	check("upper nav = Home, Menu, Restaurants, About, Contact",
		JSON.stringify(drawerLinks) === JSON.stringify(["Home", "Menu", "Restaurants", "About", "Contact"]), JSON.stringify(drawerLinks));

	const accountGroup = drawer.locator(".navbar__drawer__group").nth(1);
	check("Login inside drawer", (await accountGroup.getByText("Login", { exact: true }).count()) === 1);
	check("Cart inside drawer", (await accountGroup.getByText(/^\s*Cart/).count()) === 1);
	const navBottom = await drawer.locator(".navbar__drawer__group").nth(0).boundingBox();
	const acctTop = await accountGroup.boundingBox();
	check("account section below nav links", acctTop.y > navBottom.y, `navBottom=${Math.round(navBottom.y + navBottom.height)} acctTop=${Math.round(acctTop.y)}`);
	check("account group visually separated", await accountGroup.evaluate((e) => getComputedStyle(e).borderTopWidth !== "0px"));
	check("no Login/Cart duplicates outside drawer on mobile", (await page.locator(".navbar__inner .navbar__cart").count()) === 0);

	const heights = await drawer.locator("a, button").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
	check("all drawer links/buttons >=44px tall", heights.every((t) => t >= 44), JSON.stringify(heights.map(Math.round)));

	await page.keyboard.press("Tab");
	check("focus contained while drawer open", await page.evaluate(() => !!(document.activeElement && document.activeElement.closest("[data-drawer]"))));

	await page.keyboard.press("Escape");
	await page.waitForTimeout(420);
	check("Escape closes drawer", !(await drawer.evaluate((e) => e.classList.contains("is-open"))));
	check("focus returned to hamburger", await page.evaluate(() => document.activeElement === document.querySelector("[data-menu-toggle]")));
	check("body scroll restored", !(await page.evaluate(() => document.body.classList.contains("navbar-drawer-open"))));
	check("closed drawer links not focusable", !(await drawer.locator("a").first().evaluate((e) => getComputedStyle(e).visibility !== "hidden")));

	await toggle.click();
	await page.waitForTimeout(400);
	await page.locator("[data-drawer-scrim]").click({ position: { x: 10, y: 400 } });
	await page.waitForTimeout(420);
	check("backdrop click closes drawer", !(await drawer.evaluate((e) => e.classList.contains("is-open"))));

	await toggle.click();
	await page.waitForTimeout(400);
	await page.locator("[data-drawer-close]").click();
	await page.waitForTimeout(420);
	check("close button closes drawer", !(await drawer.evaluate((e) => e.classList.contains("is-open"))));

	await toggle.click();
	await page.waitForTimeout(400);
	await drawer.getByText("Menu", { exact: true }).first().click();
	await page.waitForTimeout(400);
	check("selecting a link navigates to menu.html", page.url().endsWith("menu.html"), page.url());
	check("drawer closed on the new page", !(await page.locator("[data-drawer]").evaluate((e) => e.classList.contains("is-open"))));
	check("scroll unlocked on the new page", !(await page.evaluate(() => document.body.classList.contains("navbar-drawer-open"))));

	await page.goto(base("index.html"));
	await page.waitForSelector("[data-drawer]", { state: "attached" });
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	check("no horizontal overflow @390px", overflow <= 0, `${overflow}px`);
	check("no console/page errors on index", errors.length === 0, errors.join(" | "));
	await ctx.close();
}

/* ---------- 3. Menu filter spacing ---------- */
{
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const page = await ctx.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(String(e)));
	page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
	await page.goto(base("menu.html"));
	await page.waitForSelector(".food-card");

	for (const [w, h, label] of [[320, 640, "320px"], [360, 740, "360px"], [390, 844, "390px"], [430, 932, "430px"]]) {
		await page.setViewportSize({ width: w, height: h });
		await page.waitForTimeout(200);
		const pills = await page.locator(".filter-pills").evaluate((e) => {
			const s = getComputedStyle(e);
			return { display: s.display, cols: s.gridTemplateColumns, gap: s.columnGap, rowGap: s.rowGap };
		});
		check(`filter pills use grid w/ explicit gap @${label}`, pills.display === "grid" && parseFloat(pills.gap) > 0 && parseFloat(pills.rowGap) > 0, JSON.stringify(pills));
		check(`filter pills are a balanced 2-col grid @${label}`, pills.cols.trim().split(/\s+/).length === 2, pills.cols);

		const pillBoxes = await page.locator(".filter-pills .button").evaluateAll((els) => els.map((e) => {
			const r = e.getBoundingClientRect();
			return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) };
		}));
		check(`all 4 filters render @${label}`, pillBoxes.length === 4);
		check(`filter buttons have equal height @${label}`, new Set(pillBoxes.map((b) => b.h)).size === 1, JSON.stringify(pillBoxes.map((b) => b.h)));
		check(`filter touch targets >=44px @${label}`, pillBoxes.every((b) => b.h >= 44));
		check(`filter labels not clipped @${label}`, await page.locator(".filter-pills .button").evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)));
		check(`filters aligned 2 rows of 2 @${label}`, pillBoxes[0].t === pillBoxes[1].t && pillBoxes[2].t === pillBoxes[3].t && pillBoxes[2].t > pillBoxes[0].b, JSON.stringify(pillBoxes.map((b) => b.t)));

		const pillsBottom = Math.max(...pillBoxes.map((b) => b.b));
		const cardTop = await page.locator(".food-card").first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
		const pillsTopAbs = await page.locator(".filter-pills").evaluate((e) => e.getBoundingClientRect().bottom + window.scrollY);
		check(`clear gap between filters and first food card @${label}`, cardTop - pillsTopAbs >= 32, `${Math.round(cardTop - pillsTopAbs)}px (pillsBottom=${Math.round(pillsBottom)})`);

		const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		check(`no horizontal overflow on menu @${label}`, of <= 0, `${of}px`);
	}

	const before = await page.locator(".food-card").count();
	const veg = page.locator("[data-dietary-filter][data-dietary=Veg]");
	await veg.click();
	await page.mouse.move(0, 0);
	await page.waitForTimeout(250);
	const after = await page.locator(".food-card").count();
	check("dietary filter still filters", after > 0 && after <= before, `${before} -> ${after}`);
	check("aria-pressed updated on Veg", (await veg.getAttribute("aria-pressed")) === "true");
	check("aria-pressed released on All", (await page.locator("[data-dietary-filter][data-dietary='']").getAttribute("aria-pressed")) === "false");
	const activeBg = await veg.evaluate((e) => getComputedStyle(e).backgroundColor);
	check("selected state is the red accent", activeBg === "rgb(193, 39, 45)", activeBg);
	const idleBg = await page.locator("[data-dietary-filter][data-dietary=Vegan]").evaluate((e) => getComputedStyle(e).backgroundColor);
	check("unselected state is neutral surface", idleBg === "rgb(255, 255, 255)", idleBg);
	await page.locator("[data-dietary-filter][data-dietary='']").click();
	await page.waitForTimeout(250);
	check("count restored after clearing filter", (await page.locator(".food-card").count()) === before);

	await page.locator("[data-food-search]").fill("pizza");
	await page.waitForTimeout(300);
	const searched = await page.locator(".food-card").count();
	check("search still works", searched > 0 && searched <= before, `${searched}`);
	const countText = await page.locator("[data-menu-result-count]").innerText();
	check("item-count live region updates", /\d/.test(countText), countText);
	await page.locator("[data-food-search]").fill("");
	await page.waitForTimeout(250);
	await page.locator("[data-category-filter]").selectOption({ index: 1 });
	await page.waitForTimeout(300);
	check("category filter still works", (await page.locator(".food-card").count()) > 0);
	await page.locator("[data-category-filter]").selectOption("");
	await page.waitForTimeout(250);
	await page.locator("[data-menu-sort]").selectOption("price-asc");
	await page.waitForTimeout(300);
	const nums = (await page.locator(".food-card__price").allInnerTexts()).map((p) => Number(p.replace(/[^\d]/g, "")));
	check("sort low->high works", nums.length > 1 && nums.every((n, i) => i === 0 || nums[i - 1] <= n), JSON.stringify(nums));
	await page.locator("[data-menu-sort]").selectOption("rating-desc");
	await page.waitForTimeout(300);
	check("sort by rating works", (await page.locator(".food-card").count()) === before);
	check("no console errors on menu", errors.length === 0, errors.join(" | "));
	await ctx.close();
}

/* ---------- 4. Category cards + desktop navbar ---------- */
{
	for (const [w, h, label] of [[320, 640, "320px"], [360, 740, "360px"], [390, 844, "390px"], [430, 932, "430px"]]) {
		const ctx = await browser.newContext({ viewport: { width: w, height: h } });
		const page = await ctx.newPage();
		await page.goto(base("index.html"));
		await page.waitForSelector(".category-card");
		const cards = await page.locator(".category-card").evaluateAll((els) => els.map((e) => {
			const r = e.getBoundingClientRect();
			return { l: r.left, r: r.right, w: r.width, t: r.top, b: r.bottom };
		}));
		check(`all category cards inside viewport @${label}`, cards.every((c) => c.l >= -0.5 && c.r <= w + 0.5));
		check(`category cards keep 2-up mobile layout @${label}`,
			cards[1].l > cards[0].r && Math.abs(cards[0].t - cards[1].t) < 1 && cards[1].w === cards[0].w,
			JSON.stringify(cards.map((c) => Math.round(c.w))));
		const gap = await page.locator(".category-grid").evaluate((e) => getComputedStyle(e).columnGap);
		check(`category grid has explicit gap @${label}`, parseFloat(gap) > 0, gap);
		const clipped = await page.locator(".category-card").evaluateAll((els) => els.some((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1));
		check(`no category card clipping @${label}`, !clipped);
		const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		check(`no horizontal overflow on home @${label}`, of <= 0, `${of}px`);
		await ctx.close();
	}

	/* 768px sits below the site's 64rem (1024px) desktop breakpoint, so it
	   legitimately uses the drawer; assert the drawer works there instead. */
	{
		const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
		const page = await ctx.newPage();
		await page.goto(base("index.html"));
		await page.waitForSelector("[data-drawer]", { state: "attached" });
		check(`hamburger available @768px`, await page.locator("[data-menu-toggle]").isVisible());
		await page.locator("[data-menu-toggle]").click();
		await page.waitForTimeout(420);
		const box = await page.locator("[data-drawer]").boundingBox();
		check(`drawer opens flush right @768px`, Math.abs(box.x + box.width - 768) <= 2, `w=${Math.round(box.width)}`);
		check(`drawer capped at 360px @768px`, box.width <= 360, `${Math.round(box.width)}px`);
		check(`drawer holds Login+Cart @768px`, (await page.locator("[data-drawer] .navbar__cart").count()) === 1 && (await page.locator("[data-drawer]").getByText("Login", { exact: true }).count()) === 1);
		const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		check(`no horizontal overflow @768px`, of <= 0, `${of}px`);
		await ctx.close();
	}

	for (const [w, h, label] of [[1024, 800, "1024px"], [1440, 900, "1440px"]]) {
		const ctx = await browser.newContext({ viewport: { width: w, height: h } });
		const page = await ctx.newPage();
		await page.goto(base("index.html"));
		await page.waitForSelector(".navbar__menu");
		check(`desktop nav menu visible @${label}`, await page.locator(".navbar__menu").isVisible());
		check(`desktop nav links inline @${label}`, (await page.locator(".navbar__menu").evaluate((e) => getComputedStyle(e).flexDirection)) === "row");
		check(`desktop cart visible @${label}`, await page.locator(".navbar__inner .navbar__cart").isVisible());
		check(`hamburger hidden @${label}`, !(await page.locator("[data-menu-toggle]").isVisible()));
		check(`drawer hidden @${label}`, !(await page.locator("[data-drawer]").isVisible()));
		check(`single cart link at desktop @${label}`, (await page.locator(".navbar__inner .navbar__cart").count()) === 1);
		const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		check(`no horizontal overflow @${label}`, of <= 0, `${of}px`);
		await ctx.close();
	}
}

/* ---------- 5. Cart / checkout / account / other pages ---------- */
{
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const page = await ctx.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(String(e)));
	page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

	const load = async (url, wait) => {
		await page.goto(base(url));
		await page.waitForSelector(wait);
		return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	};

	await load("cart.html", "[data-cart-page] > *");
	check("cart page renders", (await page.locator(".cart-line, .alert").count()) > 0);
	check("no horizontal overflow on cart", await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
	await load("checkout.html", "[data-checkout-page] > *");
	check("checkout page renders", (await page.locator("form, .alert").count()) > 0);
	check("no horizontal overflow on checkout", await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
	check("no blown-up radio/checkbox on checkout", await page.locator("input[type=radio], input[type=checkbox]").evaluateAll((els) => els.every((e) => e.getBoundingClientRect().width <= 32)));
	await load("account.html", "[data-account-page] > *");
	check("account page renders", (await page.locator("h1, .alert").count()) > 0);
	check("no horizontal overflow on account", await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
	await load("register.html", "[data-auth-form]");
	const regInputs = await page.locator("[data-auth-form] .input").count();
	check("register page renders with 4 text inputs", regInputs >= 4, `${regInputs}`);
	const regWidths = await page.locator("[data-auth-form] .input").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
	check("register text inputs still full width", regWidths.every((b) => b > 250), JSON.stringify(regWidths.map(Math.round)));
	for (const [url, wait] of [["contact.html", "main > *"], ["restaurants.html", "[data-restaurants-page] > *"], ["product.html", "[data-product-page] > *"], ["about.html", "main > *"], ["privacy.html", "main > *"], ["terms.html", "main > *"]]) {
		const o = await load(url, wait);
		check(`no horizontal overflow on ${url}`, o <= 0, `${o}px`);
	}
	check("no errors across pages", errors.length === 0, errors.join(" | "));
	await ctx.close();
}
/* ---------- 6. Reduced motion ---------- */
{
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
	const page = await ctx.newPage();
	await page.goto(base("index.html"));
	await page.waitForSelector("[data-drawer]", { state: "attached" });
	await page.locator("[data-menu-toggle]").click();
	await page.waitForTimeout(150);
	check("reduced-motion: drawer still opens", await page.locator("[data-drawer]").evaluate((e) => e.classList.contains("is-open")));
	const dur = await page.locator("[data-drawer]").evaluate((e) => getComputedStyle(e).transitionDuration);
	const durMs = dur.split(",").map((d) => parseFloat(d) * 1000);
	check("reduced-motion: drawer transition suppressed", durMs.every((d) => d <= 1), dur);
	await ctx.close();
}

/* ---------- 7. Fresh screenshots ---------- */
for (const [w, h, name] of [[390, 844, "390"], [320, 640, "320"]]) {
	const ctx = await browser.newContext({ viewport: { width: w, height: h } });
	const page = await ctx.newPage();
	await page.goto(base("index.html"));
	await page.waitForSelector(".category-card");
	await page.screenshot({ path: `screenshots/fixed_home_${name}.png`, fullPage: true });
	await page.locator("[data-menu-toggle]").click();
	await page.waitForTimeout(450);
	await page.screenshot({ path: `screenshots/fixed_drawer_${name}.png` });
	await page.goto(base("login.html"));
	await page.waitForSelector(".form__checkbox");
	await page.locator(".form__checkbox").scrollIntoViewIfNeeded();
	await page.screenshot({ path: `screenshots/fixed_login_${name}.png`, fullPage: true });
	await page.goto(base("menu.html"));
	await page.waitForSelector(".food-card");
	await page.locator(".filter-pills").scrollIntoViewIfNeeded();
	await page.screenshot({ path: `screenshots/fixed_menu_${name}.png`, fullPage: true });
	await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failures}/${results.length} checks passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
