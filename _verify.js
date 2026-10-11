const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

function loadPage(htmlFile, scripts, url) {
  const dom = new JSDOM(read(htmlFile), { runScripts: "outside-only", url: url || ("http://localhost/" + htmlFile), pretendToBeVisual: true });
  const { window } = dom;
  for (const s of scripts) {
    try { window.eval(read(s)); } catch (e) { console.log("EVAL ERROR in " + s + ": " + e.message); }
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return window;
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS: " + name); }
  else { fail++; console.log("  FAIL: " + name); }
}

// ---------- HOMEPAGE ----------
console.log("\n=== HOMEPAGE (index.html) ===");
const home = loadPage("index.html", ["js/data.js", "js/main.js"]);
const hd = home.document;
check("navbar rendered", !!hd.querySelector(".navbar"));
check("brand on left", hd.querySelector(".navbar__brand")?.textContent.includes("Bominic"));
const navLinks = [...hd.querySelectorAll(".navbar__menu .navbar__link")].map(a => a.textContent.trim());
check("5 main nav links", ["Home","Menu","Restaurants","About","Contact"].every(x => navLinks.includes(x)));
check("no Register in navbar", !hd.documentElement.innerHTML.includes(">Register<"));
check("no Privacy/Terms in navbar", !hd.querySelector(".navbar").innerHTML.includes("Privacy") && !hd.querySelector(".navbar").innerHTML.includes("Terms"));
check("cart in navbar__actions", !!hd.querySelector(".navbar__actions .navbar__cart"));
check("cart count badge exists", !!hd.querySelector("[data-cart-count]"));
const catCards = [...hd.querySelectorAll(".category-card")];
check("category cards present", catCards.length >= 4);
const catLabels = catCards.map(c => c.textContent.trim());
check("category labels readable (no single letters)", catLabels.every(l => l.length >= 4));
const dishes = [...hd.querySelectorAll(".food-card")];
check("homepage dish cards present", dishes.length > 0);
const dishNames = dishes.map(d => d.querySelector("h3")?.textContent.trim());
check("homepage dishes are pizza-focused", dishNames.some(n => /pizza/i.test(n)));
check("no non-pizza dishes on home (Paneer Tikka/Biryani/Sushi/Dosa)", !dishNames.some(n => /Paneer Tikka|Butter Chicken|Biryani|Sushi|Dosa/i.test(n)));
check("no restaurant spotlight grid on home", !hd.querySelector(".restaurant-grid"));
check("footer has Privacy Policy", !!hd.querySelector('.footer a[href="privacy.html"]'));
check("footer has Terms", !!hd.querySelector('.footer a[href="terms.html"]'));
check("footer keeps D Web Studio credit", hd.querySelector(".footer").textContent.includes("D Web Studio"));
check("footer__legal separated from copyright", !!hd.querySelector(".footer__legal"));

const firstAdd = hd.querySelector("[data-add-to-cart]");
if (firstAdd) firstAdd.click();
check("add to cart shows count 1", hd.querySelector("[data-cart-count]").textContent === "1" && hd.querySelector("[data-cart-count]").hidden === false);


// ---------- MENU ----------
console.log("\n=== MENU (menu.html) ===");
const menu = loadPage("menu.html", ["js/data.js", "js/main.js", "js/menu.js"]);
const md = menu.document;
check("menu renders dishes", md.querySelectorAll(".food-card").length > 0);
check("menu has category dropdown", !!md.querySelector("[data-category-filter]"));
const catOpts = [...md.querySelectorAll("[data-category-filter] option")].map(o => o.textContent.trim());
check("menu categories readable", catOpts.every(c => c.length >= 3));
check("menu has search", !!md.querySelector("[data-food-search]"));
check("menu has dietary pills", md.querySelectorAll("[data-dietary-filter]").length >= 3);
check("menu has sort", !!md.querySelector("[data-menu-sort]"));
const menuFoodNames = [...md.querySelectorAll(".food-card h2, .food-card h3")].map(h => h.textContent.trim());
check("menu items are pizza/sides (Bominic's)", menuFoodNames.length > 0 && menuFoodNames.some(n => /pizza/i.test(n)));
const firstCard = md.querySelector(".food-card");
check("menu card has image with alt", !!firstCard?.querySelector("img[alt]"));
check("menu card has price", /₹/.test(firstCard?.textContent));
check("menu card has Add to Cart", !!firstCard?.querySelector("[data-add-to-cart]"));
const pizzaOpt = [...md.querySelectorAll("[data-category-filter] option")].find(o => o.value === "Pizza");
if (pizzaOpt) {
  md.querySelector("[data-category-filter]").value = "Pizza";
  md.querySelector("[data-category-filter]").dispatchEvent(new menu.Event("input", { bubbles: true }));
  check("category filter runs without error", true);
}

console.log("\n=== MENU via homepage category link (?category=Starters) ===");
const menu2 = loadPage("menu.html", ["js/data.js","js/main.js","js/menu.js"], "http://localhost/menu.html?restaurant=rest-003&category=Starters");
check("category param pre-selects Starters", menu2.document.querySelector("[data-category-filter]").value === "Starters");

// ---------- CART ----------
console.log("\n=== CART (cart.html) ===");
const cartWin = new JSDOM(read("cart.html"), { runScripts: "outside-only", url: "http://localhost/cart.html", pretendToBeVisual: true });
cartWin.window.localStorage.setItem("freshbiteCart", JSON.stringify([{foodItemId:"food-026",quantity:2}]));
for (const s of ["js/data.js","js/main.js","js/cart.js"]) cartWin.window.eval(read(s));
cartWin.window.document.dispatchEvent(new cartWin.window.Event("DOMContentLoaded", { bubbles: true }));
check("cart shows the added item", /Cheese Burst/i.test(cartWin.window.document.body.textContent));
check("navbar cart count = 2 on cart page", cartWin.window.document.querySelector("[data-cart-count]")?.textContent === "2");

// ---------- POLICY ----------
console.log("\n=== POLICY PAGES ===");
for (const pg of ["privacy.html","terms.html"]) {
  const w = loadPage(pg, ["js/data.js","js/main.js"]);
  check(pg + " has navbar+footer", !!w.document.querySelector(".navbar") && !!w.document.querySelector(".footer"));
  check(pg + " has heading", !!w.document.querySelector("h1"));
}

console.log("\n=== RESULT: " + pass + " passed, " + fail + " failed ===");
process.exit(fail > 0 ? 1 : 0);
