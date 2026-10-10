const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 799;
const TAX_RATE = 0.05;

let appliedCoupon = null;

function getCartProduct(item) {
	const productId = item.foodItemId || item.id;
	return foodItems.find((foodItem) => foodItem.id === productId);
}

function formatCurrency(amount) {
	return `₹${Math.round(amount)}`;
}

function getCartLines() {
	return getStoredCart().map((item) => ({
		...item,
		product: getCartProduct(item),
		quantity: Math.max(1, Number(item.quantity) || 1)
	})).filter((line) => line.product);
}

function calculateCartTotals(lines) {
	const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
	let discount = 0;
	if (appliedCoupon && subtotal >= appliedCoupon.minimumOrder) {
		discount = appliedCoupon.discountType === "percentage"
			? Math.min(subtotal * appliedCoupon.discountValue / 100, appliedCoupon.maximumDiscount)
			: appliedCoupon.discountValue;
	}
	const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
	const tax = Math.max(0, (subtotal - discount) * TAX_RATE);
	return { subtotal, deliveryFee, discount, tax, total: subtotal - discount + deliveryFee + tax };
}

function saveCart(lines) {
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines.map((line) => ({ foodItemId: line.product.id, quantity: line.quantity }))));
	updateCartCount();
}

function renderCartLine(line, restaurantLookup) {
	const restaurant = restaurantLookup.get(line.product.restaurantId);
	return `
		<article class="card cart-line"><img class="card__image cart-line__image" src="${line.product.image}" alt="${escapeHtml(line.product.name)}" loading="lazy"><div class="card__body cart-line__body"><div><h2>${escapeHtml(line.product.name)}</h2><p>${restaurant ? escapeHtml(restaurant.name) : "FreshBite kitchen"}</p><span class="food-card__price">${formatCurrency(line.product.price)} each</span></div><div class="cart-line__controls"><label class="form__label" for="quantity-${line.product.id}">Quantity</label><div class="quantity-control"><button class="button button--secondary button--small" type="button" data-decrease="${line.product.id}" aria-label="Decrease ${escapeHtml(line.product.name)} quantity">−</button><input id="quantity-${line.product.id}" class="cart-quantity" type="number" min="1" max="20" value="${line.quantity}" data-quantity-input="${line.product.id}" aria-label="${escapeHtml(line.product.name)} quantity"><button class="button button--secondary button--small" type="button" data-increase="${line.product.id}" aria-label="Increase ${escapeHtml(line.product.name)} quantity">+</button></div><strong>${formatCurrency(line.product.price * line.quantity)}</strong><button class="button button--ghost button--small" type="button" data-remove="${line.product.id}">Remove</button></div></div></article>`;
}

function renderCartSummary(totals) {
	return `<aside class="card cart-summary"><div class="card__body"><h2>Order summary</h2><dl class="summary-list"><div><dt>Subtotal</dt><dd>${formatCurrency(totals.subtotal)}</dd></div><div><dt>Delivery fee</dt><dd>${totals.deliveryFee === 0 && totals.subtotal > 0 ? "FREE" : formatCurrency(totals.deliveryFee)}</dd></div><div><dt>Discount</dt><dd>-${formatCurrency(totals.discount)}</dd></div><div><dt>Tax</dt><dd>${formatCurrency(totals.tax)}</dd></div><div class="summary-list__total"><dt>Grand total</dt><dd>${formatCurrency(totals.total)}</dd></div></dl><a class="button cart-summary__checkout" href="checkout.html" data-checkout>Proceed to Checkout</a></div></aside>`;
}

function renderEmptyCart(pageMount) {
	pageMount.innerHTML = `<section class="section"><div class="container"><div class="alert alert--info"><div><h1>Your cart is feeling light</h1><p>Add a dish from one of our local kitchens and it will appear here.</p><a class="button" href="restaurants.html">Continue Shopping</a></div></div></div></section>`;
}

function renderCartPage() {
	const pageMount = document.querySelector("[data-cart-page]");
	if (!pageMount || typeof foodItems === "undefined" || typeof restaurants === "undefined") return;

	const lines = getCartLines();
	if (lines.length === 0) {
		renderEmptyCart(pageMount);
		return;
	}

	const restaurantLookup = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
	const totals = calculateCartTotals(lines);
	pageMount.innerHTML = `<section class="section" aria-labelledby="cart-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Almost there</span><h1 id="cart-title">Your cart</h1><p>${lines.length} selected dish${lines.length === 1 ? "" : "es"} ready for checkout.</p></div><a class="button button--ghost button--small" href="restaurants.html">Continue Shopping</a></div><div class="cart-layout"><div><div class="cart-lines" data-cart-lines>${lines.map((line) => renderCartLine(line, restaurantLookup)).join("")}</div><form class="form coupon-form" data-coupon-form><div class="form__group"><label class="form__label" for="coupon-code">Have a coupon?</label><div class="coupon-form__row"><input class="input" id="coupon-code" type="text" placeholder="Enter coupon code" autocomplete="off" data-coupon-input><button class="button button--secondary" type="submit">Apply coupon</button></div><p class="form__hint" data-coupon-message aria-live="polite"></p></div></form><button class="button button--ghost button--small" type="button" data-clear-cart>Clear cart</button></div><div data-cart-summary>${renderCartSummary(totals)}</div></div></div></section>`;
	attachCartEvents();
}

function refreshCartPage() {
	renderCartPage();
}

function changeQuantity(productId, amount) {
	const lines = getCartLines();
	const line = lines.find((cartLine) => cartLine.product.id === productId);
	if (!line) return;
	line.quantity = Math.min(20, Math.max(1, line.quantity + amount));
	saveCart(lines);
	refreshCartPage();
}

function removeCartItem(productId) {
	saveCart(getCartLines().filter((line) => line.product.id !== productId));
	refreshCartPage();
}

function applyCoupon() {
	const input = document.querySelector("[data-coupon-input]");
	const message = document.querySelector("[data-coupon-message]");
	const code = input.value.trim().toUpperCase();
	appliedCoupon = specialOffers.find((offer) => offer.active && offer.code === code) || null;
	if (!appliedCoupon) {
		message.textContent = "That coupon is not valid. Check the code and try again.";
		message.className = "form__hint";
		return;
	}
	const subtotal = getCartLines().reduce((total, line) => total + line.product.price * line.quantity, 0);
	if (subtotal < appliedCoupon.minimumOrder) {
		message.textContent = `Add ${formatCurrency(appliedCoupon.minimumOrder - subtotal)} more to use ${appliedCoupon.code}.`;
		appliedCoupon = null;
		return;
	}
	message.textContent = `${appliedCoupon.code} applied successfully.`;
	message.className = "form__hint alert--success";
	const totals = calculateCartTotals(getCartLines());
	document.querySelector("[data-cart-summary]").innerHTML = renderCartSummary(totals);
}

function attachCartEvents() {
	document.querySelectorAll("[data-decrease]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.decrease, -1)));
	document.querySelectorAll("[data-increase]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.increase, 1)));
	document.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => removeCartItem(button.dataset.remove)));
	document.querySelectorAll("[data-quantity-input]").forEach((input) => input.addEventListener("change", () => {
		const lines = getCartLines();
		const line = lines.find((cartLine) => cartLine.product.id === input.dataset.quantityInput);
		if (line) line.quantity = Math.min(20, Math.max(1, Number(input.value) || 1));
		saveCart(lines);
		refreshCartPage();
	}));
	document.querySelector("[data-clear-cart]").addEventListener("click", () => {
		localStorage.removeItem(CART_STORAGE_KEY);
		appliedCoupon = null;
		updateCartCount();
		refreshCartPage();
	});
	document.querySelector("[data-coupon-form]").addEventListener("submit", (event) => { event.preventDefault(); applyCoupon(); });
}

document.addEventListener("DOMContentLoaded", renderCartPage);
