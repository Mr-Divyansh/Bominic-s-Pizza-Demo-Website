import { chromium } from "playwright";

const base = (p) => `file:///${process.cwd().replace(/\\/g, "/")}/${p}`;
const browser = await chromium.launch();

// Desktop captures
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [name, file] of [["home", "index.html"], ["restaurants", "restaurants.html"], ["about", "about.html"], ["login", "login.html"]]) {
	await desk.goto(base(file));
	await desk.waitForTimeout(600);
	await desk.screenshot({ path: `screenshots/shot_desk_${name}.png`, fullPage: true });
}

// Mobile captures
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const [name, file] of [["home", "index.html"], ["restaurants", "restaurants.html"], ["about", "about.html"]]) {
	await mob.goto(base(file));
	await mob.waitForTimeout(600);
	await mob.screenshot({ path: `screenshots/shot_mob_${name}.png`, fullPage: true });
}
// Drawer with pill buttons
await mob.goto(base("index.html"));
await mob.locator("[data-menu-toggle]").click();
await mob.waitForTimeout(400);
await mob.screenshot({ path: "screenshots/shot_mob_drawer.png" });

await browser.close();
console.log("screenshots done");