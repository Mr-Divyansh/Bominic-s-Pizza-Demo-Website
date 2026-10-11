const fs = require("fs");
const src = fs.readFileSync("js/data.js", "utf8");
const start = src.indexOf("const foodItems");
const end = src.indexOf("const reviews");
const seg = src.slice(start, end);

// Split into individual item objects by the id: "food-XXX" markers
const items = [];
const re = /id:\s*"food-\d+"/g;
let m;
const idxs = [];
while ((m = re.exec(seg)) !== null) idxs.push(m.index);
for (let i = 0; i < idxs.length; i++) {
  const chunk = seg.slice(idxs[i], idxs[i + 1] !== undefined ? idxs[i + 1] : seg.length);
  const id = (chunk.match(/id:\s*"([^"]+)"/) || [])[1];
  const restaurantId = (chunk.match(/restaurantId:\s*"([^"]+)"/) || [])[1];
  const name = (chunk.match(/name:\s*"([^"]+)"/) || [])[1];
  const category = (chunk.match(/category:\s*"([^"]+)"/) || [])[1];
  const dietaryType = (chunk.match(/dietaryType:\s*"([^"]+)"/) || [])[1];
  const featured = chunk.includes("featured: true");
  items.push({ id, restaurantId, name, category, dietaryType, featured });
}

const rest003 = items.filter((x) => x.restaurantId === "rest-003");
console.log("TOTAL items:", items.length);
console.log("rest-003 (Bominic's) items:", rest003.length);
const cats = {};
rest003.forEach((x) => (cats[x.category] = (cats[x.category] || 0) + 1));
console.log("rest-003 categories:", JSON.stringify(cats));
console.log("rest-003 featured:", rest003.filter((x) => x.featured).map((x) => x.name));
console.log("--- rest-003 full list ---");
rest003.forEach((x) => console.log(`  ${x.id} | ${x.category} | ${x.dietaryType} | ${x.name}`));

// image/name sanity for rest-003 pizzas
console.log("--- rest-003 pizza images ---");
rest003.filter((x) => x.category === "Pizza").forEach((x) => {
  const chunk = seg.slice(seg.indexOf('"' + x.id + '"'));
  const img = (chunk.match(/image:\s*"([^"]+)"/) || [])[1];
  console.log(`  ${x.name}: ${img ? img.slice(0, 70) : "NO IMAGE"}`);
});
