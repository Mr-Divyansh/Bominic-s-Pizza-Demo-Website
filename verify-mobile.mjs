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
const scrollW = () => document.documentElement.scrollWidth - window.innerWidth;
const inside = (el) => !!(document.activeElement && el && el.contains(document.activeElement));

const browser = await chromium.launch();

/* ---------- 1. Remember-me checkbox ---------- */
for (const [w, h, label] of [[320, 640, "320px"], [390, 844, "390px"], [768, 1024, "768px"]]) {
	const ctx = await browser.newContext({ viewport: { width: w, height: h } });
	const page = await ctx.newPage();
	await page.goto(base("login.html"));
	await page.waitForSelector(".form__checkbox input[type=checkbox]");
	const cb = page.locator(".form__checkbox input[type=checkbox]");
	const box = await cb.boundingBox();
	check(`checkbox rendered 18-22px @${label}`, !!box && box.width >= 17 && box.width <= 23, box ? `${Math.round(box.width)}x${Math.round(box.height)}` : "not rendered");
	const row = await page.locator(".form__checkbox").evaluate((e) => {
		const s = getComputedStyle(e);
		return { display: s.display, alignItems: s.alignItems, minHeight: s.minHeight };
	});
	check(`remember-me row flex + vertically centred @${label}`, (row.display === "flex" || row.display === "inline-flex") && row.alignItems === "center", JSON.stringify(row));
	check(`remember-me tap target >=44px @${label}`, parseFloat(row.minHeight) >= 44, row.minHeight);
	const rowBox = await page.locator(".form__checkbox").boundingBox();
	check(`checkbox same line as label @${label}`, !!box && !!rowBox && box.y >= rowBox.y - 1 && box.y + box.height <= rowBox.y + rowBox.height + 1);
	check(`checkbox vertically centred @${label}`, !!box && !!rowBox && Math.abs((box.y + box.height / 2) - (rowBox.y + rowBox.height / 2)) <= 2);
	const frame = await cb.evaluate((e) => { const s = getComputedStyle(e); return { border: s.borderTopWidth, padding: s.paddingLeft, width: s.width }; });
	check(`no oversized checkbox outline/padding @${label}`, parseFloat(frame.border) <= 2 && frame.padding === "0px" && parseFloat(frame.width) <= 23, JSON.stringify(frame));
	await page.locator(".form__checkbox").click({ position: { x: 120, y: 22 } });
	check(`clicking the label toggles the checkbox @${label}`, await cb.isChecked());
	await cb.click();
	check(`checkbox itself still clickable @${label}`, !(await cb.isChecked()));
	const authBox = await page.locator("[data-auth-form] .auth-card, form").first().boundingBox();
	check(`login card width preserved @${label}`, authBox.width > w * 0.6, `${Math.round(authBox.width)}px`);
	check(`no horizontal overflow on login @${label}`, (await page.evaluate(scrollW)) <= 0);
	await ctx.close();
}
/* ---------- 2. Mobile navigation drawer ---------- */
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
	const handle = await drawer.elementHandle();
	const openNow = () => drawer.evaluate((e) => e.classList.contains("is-open"));
	check("hamburger is a real <button>", (await toggle.evaluate((e) => e.tagName)) === "BUTTON");
	check("hamburger accessible name", (await toggle.getAttribute("aria-label")) === "Open navigation menu");
	check("hamburger aria-expanded=false when closed", (await toggle.getAttribute("aria-expanded")) === "false");
	check("hamburger aria-controls -> drawer id", (await toggle.getAttribute("aria-controls")) === (await drawer.getAttribute("id")));
	check("drawer id unique", (await page.locator("#bominics-drawer").count()) === 1);
	check("drawer has dialog semantics", (await drawer.getAttribute("role")) === "dialog" && (await drawer.getAttribute("aria-modal")) === "true");

	const closed = await drawer.boundingBox();
	check("closed drawer off-screen to the right", closed.x >= 389, `x=${Math.round(closed.x)}`);
	check("closed drawer not visibly on screen", 390 - closed.x <= closed.width * 0.05, `visible=${Math.round(390 - closed.x)}px`);

	await toggle.click();
	await page.waitForTimeout(420);
	const open = await drawer.boundingBox();
	check("open drawer flush against right edge", Math.abs(open.x + open.width - 390) <= 2, `x=${Math.round(open.x)}`);
	check("drawer width 80-88% viewport, max 360px", open.width > 390 * 0.79 && open.width <= 360, `${Math.round(open.width)}px`);
	check("drawer stays inside viewport", open.x >= 0 && open.y >= 0 && open.y + open.height <= 845);
	check("drawer transition is transform-based", (await drawer.evaluate((e) => getComputedStyle(e).transitionProperty)).includes("transform"));
	const tdur = await drawer.evaluate((e) => getComputedStyle(e).transitionDuration);
	check("drawer transition 220-300ms", parseFloat(tdur) >= 0.2 && parseFloat(tdur) <= 0.32, tdur);
	check("aria-expanded=true when open", (await toggle.getAttribute("aria-expanded")) === "true");
	check("drawer aria-hidden=false when open", (await drawer.getAttribute("aria-hidden")) === "false");
	check("focus moved into drawer", await page.evaluate(inside, handle));
	check("body scroll locked", await page.evaluate(() => document.body.classList.contains("navbar-drawer-open")));
	check("backdrop visible", await page.locator("[data-drawer-scrim]").isVisible());
	check("close button present", await page.locator("[data-drawer-close]").isVisible());

	const navLinks = await drawer.locator(".navbar__drawer__group").first().locator("a.navbar__link").allInnerTexts();
	check("upper nav = Home, Menu, Restaurants, About, Contact", JSON.stringify(navLinks) === JSON.stringify(["Home", "Menu", "Restaurants", "About", "Contact"]), JSON.stringify(navLinks));

	const acct = drawer.locator(".navbar__drawer__group").nth(1);
	check("Login inside drawer", (await acct.getByText("Login", { exact: true }).count()) === 1);
	check("Cart inside drawer", (await acct.getByText(/^\s*Cart/).count()) === 1);
	const navBox = await drawer.locator(".navbar__drawer__group").first().boundingBox();
	const acctBox = await acct.boundingBox();
	check("account section below nav links", acctBox.y > navBox.y, `navBottom=${Math.round(navBox.y + navBox.height)} acctTop=${Math.round(acctBox.y)}`);
	check("account section separated by divider", await acct.evaluate((e) => getComputedStyle(e).borderTopWidth !== "0px" || parseFloat(getComputedStyle(e).paddingTop) >= 16));
	check("no Login/Cart duplicated outside drawer", (await page.locator(".navbar__inner .navbar__cart").count()) === 0);

	const heights = await drawer.locator("a, button").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
	check("all drawer targets >=44px", heights.length > 0 && heights.every((t) => t >= 44), JSON.stringify(heights.map(Math.round)));

	await page.keyboard.press("Tab");
	check("focus contained while open (Tab)", await page.evaluate(inside, handle));
	await page.keyboard.press("Shift+Tab");
	check("focus contained while open (Shift+Tab)", await page.evaluate(inside, handle));

	await page.keyboard.press("Escape");
	await page.waitForTimeout(420);
	check("Escape closes drawer", !(await openNow()));
	check("focus returned to hamburger", await page.evaluate(() => document.activeElement === document.querySelector("[data-menu-toggle]")));
	check("body scroll restored", !(await page.evaluate(() => document.body.classList.contains("navbar-drawer-open"))));
	check("backdrop hidden after close", !(await page.locator("[data-drawer-scrim]").isVisible()));
	check("closed drawer links not focusable", !(await drawer.locator("a").first().evaluate((e) => getComputedStyle(e).visibility !== "hidden")));

	await toggle.click();
	await page.waitForTimeout(420);
	await page.locator("[data-drawer-scrim]").click({ position: { x: 8, y: 420 } });
	await page.waitForTimeout(420);
	check("backdrop click closes drawer", !(await openNow()));

	await toggle.click();
	await page.waitForTimeout(420);
	await page.locator("[data-drawer-close]").click();
	await page.waitForTimeout(420);
	check("close button closes drawer", !(await openNow()));

	await toggle.click();
	await page.waitForTimeout(420);
	await drawer.locator('a[href^="menu.html"]').first().click();
	await page.waitForFunction(() => location.pathname.endsWith("menu.html"));
	check("drawer closed after link navigation", !(await openNow()));
	check("link navigates to menu.html", page.url().includes("menu.html"), page.url());
	check("body scroll unlocked on new page", !(await page.evaluate(() => document.body.classList.contains("navbar-drawer-open"))));

	await page.goto(base("index.html"));
	const ov = await page.evaluate(scrollW);
	check("no horizontal overflow @390px", ov <= 0, `${ov}px`);
	check("no console/page errors on index", errors.length === 0, errors.join(" | "));
	await ctx.close();
}

/* ---------- 3. Menu dietary filter spacing ---------- */
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
		await page.waitForTimeout(220);
		const pills = await page.locator(".filter-pills").evaluate((e) => {
			const s = getComputedStyle(e);
			return { display: s.display, cols: s.gridTemplateColumns, gap: s.columnGap, rowGap: s.rowGap };
		});
		check(`filter pills grid w/ explicit gap @${label}`, pills.display === "grid" && parseFloat(pills.gap) > 0 && parseFloat(pills.rowGap) > 0, JSON.stringify(pills));
		check(`filter pills balanced 2-col grid @${label}`, pills.cols.trim().split(/\s+/).length === 2, pills.cols);

		const pb = await page.locator(".filter-pills .button").evaluateAll((els) => els.map((e) => {
			const r = e.getBoundingClientRect();
			return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) };
		}));
		check(`all 4 filters render @${label}`, pb.length === 4, `${pb.length}`);
		check(`filter buttons equal height @${label}`, new Set(pb.map((b) => b.h)).size === 1, JSON.stringify(pb.map((b) => b.h)));
		check(`filter touch targets >=44px @${label}`, pb.every((b) => b.h >= 44), JSON.stringify(pb.map((b) => b.h)));
		check(`filter labels not clipped @${label}`, await page.locator(".filter-pills .button").evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)));
		check(`filters laid out 2 rows of 2 @${label}`, pb[0].t === pb[1].t && pb[2].t === pb[3].t && pb[2].t > pb[0].b, JSON.stringify(pb.map((b) => b.t)));

		const pillsBottom = Math.max(...pb.map((b) => b.b));
		const cardTop = (await page.locator(".food-card").first().boundingBox()).y;
		const gapPx = cardTop - pillsBottom;
		check(`clear gap filters -> first food card @${label}`, Number.isFinite(gapPx) && gapPx >= 31, `${gapPx.toFixed(1)}px`);

		const ov = await page.evaluate(scrollW);
		check(`no horizontal overflow on menu @${label}`, ov <= 0, `${ov}px`);
	}

	const before = await page.locator(".food-card").count();
	const veg = page.locator("[data-dietary-filter][data-dietary=Veg]");
	await veg.click();
	await page.waitForTimeout(280);
	const after = await page.locator(".food-card").count();
	check("dietary filter still filters", after > 0 && after <= before, `${before} -> ${after}`);
	check("aria-pressed=true on Veg", (await veg.getAttribute("aria-pressed")) === "true");
	check("aria-pressed=false on All", (await page.locator("[data-dietary-filter][data-dietary='']").getAttribute("aria-pressed")) === "false");
	check("selected pill uses the red accent", ["rgb(193, 39, 45)", "rgb(147, 27, 32)"].includes(await veg.evaluate((e) => getComputedStyle(e).backgroundColor)), await veg.evaluate((e) => getComputedStyle(e).backgroundColor));
	check("unselected state is neutral", (await page.locator("[data-dietary-filter][data-dietary=Vegan]").evaluate((e) => getComputedStyle(e).backgroundColor)) === "rgb(255, 255, 255)");
	await page.locator("[data-dietary-filter][data-dietary='']").click();
	await page.waitForTimeout(280);
	check("count restored after clearing filter", (await page.locator(".food-card").count()) === before);

	await page.locator("[data-food-search]").fill("pizza");
	await page.waitForTimeout(320);
	const searched = await page.locator(".food-card").count();
	check("search still works", searched > 0 && searched <= before, `${searched}`);
	check("item-count live region updates", /\d/.test(await page.locator("[data-menu-result-count]").innerText()));
	await page.locator("[data-food-search]").fill("");
	await page.waitForTimeout(280);
	await page.locator("[data-category-filter]").selectOption({ index: 1 });
	await page.waitForTimeout(320);
	check("category filter still works", (await page.locator(".food-card").count()) > 0);
	await page.locator("[data-category-filter]").selectOption("");
	await page.waitForTimeout(280);
	await page.locator("[data-menu-sort]").selectOption("price-asc");
	await page.waitForTimeout(320);
	const nums = (await page.locator(".food-card__price").allInnerTexts()).map((p) => Number(p.replace(/[^\d]/g, "")));
	check("sort low->high works", nums.length > 1 && nums.every((n, i) => i === 0 || nums[i - 1] <= n), JSON.stringify(nums));
	await page.locator("[data-menu-sort]").selectOption("rating-desc");
	await page.waitForTimeout(320);
	check("sort by rating works", (await page.locator(".food-card").count()) === before);
	check("no console errors on menu", errors.length === 0, errors.join(" | "));
	await ctx.close();
}

/* ---------- 4. Category cards (mobile) + desktop navbar ---------- */
{
	for (const [w, h, label] of [[320, 640, "320px"], [360, 740, "360px"], [390, 844, "390px"], [430, 932, "430px"]]) {
		const ctx = await browser.newContext({ viewport: { width: w, height: h } });
		const page = await ctx.newPage();
		await page.goto(base("index.html"));
		await page.waitForSelector(".category-card");
		const cards = await page.locator(".category-card").evaluateAll((els) => els.map((e) => {
			const r = e.getBoundingClientRect();
			return { l: r.left, r: r.right, w: r.width, t: r.top };
		}));
		check(`all category cards inside viewport @${label}`, cards.length > 0 && cards.every((c) => c.l >= -0.5 && c.r <= w + 0.5), `${cards.length} cards`);
		check(`category cards keep 2-up mobile layout @${label}`, cards.length === 6 && cards[0].r < cards[1].l && (cards[1].l - cards[0].r) <= 32 && Math.abs(cards[0].l - cards[2].l) < 1 && cards[0].t === cards[1].t, JSON.stringify({ gap: Math.round(cards[1].l - cards[0].r), col1: [Math.round(cards[0].l), Math.round(cards[2].l)] }));
		const gap = await page.locator(".category-grid").evaluate((e) => getComputedStyle(e).columnGap);
		check(`category grid explicit gap @${label}`, parseFloat(gap) > 0, gap);
		const clipped = await page.locator(".category-card").evaluateAll((els) => els.some((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1));
		check(`no category card clipping @${label}`, !clipped);
		const ov = await page.evaluate(scrollW);
		check(`no horizontal overflow on home @${label}`, ov <= 0, `${ov}px`);
		await ctx.close();
	}

	/* 768px is a tablet width, below the site's 64rem (1024px) desktop
	   breakpoint, so the drawer + hamburger is the correct pattern there. */
	{
		const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
		const page = await ctx.newPage();
		await page.goto(base("index.html"));
		await page.waitForSelector(".navbar__menu");
		check("hamburger visible @768px (tablet)", await page.locator("[data-menu-toggle]").isVisible());
		check("drawer active @768px (tablet)", await page.locator("[data-drawer]").evaluate((e) => getComputedStyle(e).display !== "none"));
		const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		check("no horizontal overflow @768px", ov <= 0, `${ov}px`);
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
		check(`desktop Login visible @${label}`, (await page.locator('.navbar__inner .navbar__actions a[href="login.html"]').count()) === 1);
		check(`hamburger hidden @${label}`, !(await page.locator("[data-menu-toggle]").isVisible()));
		check(`drawer hidden @${label}`, !(await page.locator("[data-drawer]").isVisible()));
		check(`single cart link at desktop @${label}`, (await page.locator(".navbar__inner .navbar__cart").count()) === 1);
		const ov = await page.evaluate(scrollW);
		check(`no horizontal overflow @${label}`, ov <= 0, `${ov}px`);
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
		return page.evaluate(scrollW);
	};

	await load("cart.html", "[data-cart-page] > *");
	check("cart page renders", (await page.locator(".cart-line, .alert").count()) > 0);
	check("no horizontal overflow on cart", (await page.evaluate(scrollW)) <= 0);
	await load("checkout.html", "[data-checkout-page] > *");
	check("checkout page renders", (await page.locator("form, .alert").count()) > 0);
	check("no horizontal overflow on checkout", (await page.evaluate(scrollW)) <= 0);
	check("no blown-up radio/checkbox on checkout", await page.locator("input[type=radio], input[type=checkbox]").evaluateAll((els) => els.every((e) => e.getBoundingClientRect().width <= 32)));
	await load("account.html", "[data-account-page] > *");
	check("account page renders", (await page.locator("h1, .alert").count()) > 0);
	check("no horizontal overflow on account", (await page.evaluate(scrollW)) <= 0);
	await load("register.html", "[data-auth-form]");
	const regInputs = await page.locator("[data-auth-form] .input").count();
	check("register page renders with text inputs", regInputs >= 4, `${regInputs}`);
	const regWidths = await page.locator("[data-auth-form] .input").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
	check("register text inputs still full width", regWidths.every((b) => b > 250), JSON.stringify(regWidths.map(Math.round)));
	check("no register checkbox regressed", await page.locator("input[type=checkbox]").evaluateAll((els) => els.every((e) => e.getBoundingClientRect().width <= 32)));
	for (const [url, wait] of [["contact.html", "main > *"], ["restaurants.html", "[data-restaurants-page] > *"], ["product.html", "[data-product-page] > *"], ["about.html", "main > *"], ["privacy.html", "main > *"], ["terms.html", "main > *"]]) {
		const ov = await load(url, wait);
		check(`no horizontal overflow on ${url}`, ov <= 0, `${ov}px`);
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
	const d = await page.locator("[data-drawer]").evaluate((e) => getComputedStyle(e).transitionDuration);
	check("reduced-motion transition suppressed", parseFloat(d) <= 0.001, d);
	await ctx.close();
}

/* ---------- 7. Fresh mobile screenshots ---------- */
for (const [w, h, name] of [[390, 844, "390"], [320, 640, "320"]]) {
	const ctx = await browser.newContext({ viewport: { width: w, height: h } });
	const page = await ctx.newPage();
	await page.goto(base("index.html"));
	await page.waitForSelector(".category-card");
	await page.screenshot({ path: `screenshots/fixed_home_${name}.png`, fullPage: true });
	await page.locator("[data-menu-toggle]").click();
	await page.waitForTimeout(460);
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

