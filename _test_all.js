// Full runtime smoke test with a minimal DOM mock
const store = {};
global.localStorage = { getItem:(k)=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v)}, removeItem:(k)=>{delete store[k]} };
global.sessionStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };

function el(){ const e={ children:[],attrs:{},dataset:{},_html:"",value:"",checked:false,
  classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);return this._s.has(c)},contains(c){return this._s.has(c)}},
  set innerHTML(v){this._html=v}, get innerHTML(){return this._html},
  set textContent(v){this._t=v}, get textContent(){return this._t===undefined?"":this._t},
  set hidden(v){this._h=v}, get hidden(){return this._h===undefined?false:this._h},
  setAttribute(k,v){this.attrs[k]=String(v)}, getAttribute(k){return this.attrs[k]===undefined?null:this.attrs[k]},
  removeAttribute(k){delete this.attrs[k]},
  addEventListener(){}, appendChild(c){this.children.push(c)}, querySelector(){return el()}, querySelectorAll(){return []}, closest(){return null}, focus(){}, reportValidity(){return true}, checkValidity(){return true} }; return e; }

const mounts = { "[data-navbar]":el(), "[data-footer]":el(), "[data-home]":el() };
global.document = {
  querySelector(sel){ return mounts[sel] || el(); },
  querySelectorAll(sel){ if(sel==="[data-cart-count]"){ global.__cc=[el()]; return global.__cc; } return []; },
  addEventListener(){}
};
global.window = { addEventListener(){}, location:{ search:"", href:"", pathname:"/" } };
global.isUserLoggedIn = ()=> false;

const fs = require("fs");
eval(fs.readFileSync("js/data.js","utf8"));
const mainSrc = fs.readFileSync("js/main.js","utf8").replace(/document\.addEventListener\("DOMContentLoaded"[\s\S]*$/,"");
eval(mainSrc);

let pass=0, fail=0; function check(name, cond){ if(cond){pass++;} else {fail++; console.log("  FAIL:", name);} }

console.log("NAVBAR:");
renderNavbar(); const nav = mounts["[data-navbar]"].innerHTML;
check("brand left", nav.includes("navbar__brand"));
check("5 main links", ["Home","Menu","Restaurants","About","Contact"].every(w=>nav.includes(">"+w+"<")));
check("single Login, no Register", (nav.match(/>Login</g)||[]).length===1 && !nav.includes("Register"));
check("no Privacy/Terms in nav", !nav.includes("Privacy") && !nav.includes("Terms"));
check("cart + count", nav.includes("navbar__cart") && nav.includes("data-cart-count"));

console.log("CART:");
localStorage.setItem("freshbiteCart", JSON.stringify([{foodItemId:"food-007",quantity:2},{foodItemId:"food-029",quantity:3}]));
renderNavbar(); updateCartCount();
check("cart count = 5", global.__cc[0].textContent==="5" && global.__cc[0].hidden===false);
localStorage.setItem("freshbiteCart", JSON.stringify([])); updateCartCount();
check("empty cart hides badge", global.__cc[0].textContent==="0" && global.__cc[0].hidden===true);

console.log("FOOTER:");
renderFooter(); const ft = mounts["[data-footer]"].innerHTML;
check("Privacy link", ft.includes('href="privacy.html"'));
check("Terms link", ft.includes('href="terms.html"'));
check("D Web Studio credit", ft.includes("D Web Studio"));

console.log("HOMEPAGE:");
renderHomePage(); const hm = mounts["[data-home]"].innerHTML;
check("no single-letter categories", !/>P<\/span>|>S<\/span>|>B<\/span>|>V<\/span>/.test(hm));
check("proper category names", hm.includes("Pizzas") && hm.includes("Starters & Sides"));
check("sample price disclaimer", hm.includes("samples"));
check("no unrelated restaurant spotlight", !hm.includes("restaurant-grid"));
check("pizza dishes shown", hm.includes("food-grid"));
check("no fabricated stats", !hm.includes(">9+<") && !hm.includes(">100%<"));

console.log("");
console.log("RESULT:", pass+" passed, "+fail+" failed");
process.exit(fail>0?1:0);
