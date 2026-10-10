const CHECKOUT_DELIVERY_FEE = 49;
const CHECKOUT_FREE_DELIVERY_THRESHOLD = 799;
const CHECKOUT_TAX_RATE = 0.05;
const ORDERS_STORAGE_KEY = "freshbiteOrders";

function checkoutCurrency(amount) {
	return `₹${Math.round(amount)}`;
}

function getCheckoutLines() {
	return getStoredCart().map((item) => {
		const product = foodItems.find((foodItem) => foodItem.id === (item.foodItemId || item.id));
		return product ? { product, quantity: Math.max(1, Number(item.quantity) || 1) } : null;
	}).filter(Boolean);
}

function getCheckoutTotals(lines) {
	const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
	const deliveryFee = subtotal >= CHECKOUT_FREE_DELIVERY_THRESHOLD ? 0 : CHECKOUT_DELIVERY_FEE;
	const tax = subtotal * CHECKOUT_TAX_RATE;
	return { subtotal, deliveryFee, discount: 0, tax, total: subtotal + deliveryFee + tax };
}

function renderCheckoutSummary(lines, totals) {
	return `<aside class="card checkout-summary"><div class="card__body"><h2>Order summary</h2><ul class="checkout-items">${lines.map((line) => `<li><span>${escapeHtml(line.product.name)} <small>× ${line.quantity}</small></span><strong>${checkoutCurrency(line.product.price * line.quantity)}</strong></li>`).join("")}</ul><dl class="summary-list"><div><dt>Subtotal</dt><dd>${checkoutCurrency(totals.subtotal)}</dd></div><div><dt>Delivery fee</dt><dd>${totals.deliveryFee === 0 ? "FREE" : checkoutCurrency(totals.deliveryFee)}</dd></div><div><dt>Discount</dt><dd>${checkoutCurrency(totals.discount)}</dd></div><div><dt>Tax</dt><dd>${checkoutCurrency(totals.tax)}</dd></div><div class="summary-list__total"><dt>Total</dt><dd>${checkoutCurrency(totals.total)}</dd></div></dl></div></aside>`;
}

function getSavedOrders() {
	try {
		const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
		return Array.isArray(orders) ? orders : [];
	} catch (error) {
		return [];
	}
}

function generateOrderId() {
	return `FB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function renderConfirmation(pageMount, order) {
	pageMount.innerHTML = `<section class="section"><div class="container"><div class="alert alert--success"><div><span class="eyebrow">Order confirmed</span><h1>Thanks, ${escapeHtml(order.delivery.fullName)}!</h1><p>Your order <strong>${order.id}</strong> has been placed and the kitchen is getting started.</p><p>Estimated delivery: <strong>${escapeHtml(order.deliveryTime.label)}</strong></p><div class="checkout-confirmation__actions"><button class="button" type="button" data-track-order>Track your order</button><a class="button button--secondary" href="account.html">View order history</a><a class="button button--ghost" href="restaurants.html">Order something else</a></div><div class="alert alert--info" data-tracking-message hidden><strong>Order received</strong><p>Your order is being prepared. Tracking updates will appear here as your order progresses.</p></div></div></div></div></section>`;
	pageMount.querySelector("[data-track-order]").addEventListener("click", (event) => {
		event.target.hidden = true;
		pageMount.querySelector("[data-tracking-message]").hidden = false;
	});
}

function renderEmptyCheckout(pageMount) {
	pageMount.innerHTML = `<section class="section"><div class="container"><div class="alert alert--info"><div><h1>Your checkout is waiting on your cart</h1><p>Add at least one dish before placing an order.</p><a class="button" href="restaurants.html">Continue Shopping</a></div></div></div></section>`;
}

function setScheduledDeliveryVisibility() {
	const scheduledOption = document.querySelector("[data-delivery-time=scheduled]");
	const scheduledField = document.querySelector("[data-scheduled-field]");
	const scheduledInput = document.querySelector("[data-scheduled-input]");
	const isScheduled = scheduledOption.checked;
	scheduledField.hidden = !isScheduled;
	scheduledInput.required = isScheduled;
}

function validateCheckout(form) {
	const phone = form.querySelector("[name=phone]");
	const pincode = form.querySelector("[name=pincode]");
	const payment = form.querySelector("input[name=payment]:checked");
	if (!/^\d{10}$/.test(phone.value.trim())) {
		phone.setCustomValidity("Enter a valid 10-digit phone number.");
	} else phone.setCustomValidity("");
	if (!/^\d{6}$/.test(pincode.value.trim())) {
		pincode.setCustomValidity("Enter a valid 6-digit pincode.");
	} else pincode.setCustomValidity("");
	if (!payment) {
		form.querySelector("[data-payment-message]").textContent = "Select a payment method to continue.";
		return false;
	}
	form.querySelector("[data-payment-message]").textContent = "";
	return form.checkValidity();
}

function placeOrder(pageMount, lines, totals, form) {
	const deliveryTimeInput = form.querySelector("input[name=deliveryTime]:checked");
	const scheduledInput = form.querySelector("[data-scheduled-input]");
	const deliveryTime = deliveryTimeInput.value === "asap"
		? { type: "asap", label: "ASAP (25-45 minutes)" }
		: { type: "scheduled", label: new Date(scheduledInput.value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) };
	const order = {
		id: generateOrderId(),
		createdAt: new Date().toISOString(),
		status: "Preparing",
		items: lines.map((line) => ({ foodItemId: line.product.id, name: line.product.name, price: line.product.price, quantity: line.quantity })),
		totals,
		delivery: { fullName: form.querySelector("[name=fullName]").value.trim(), phone: form.querySelector("[name=phone]").value.trim(), address: form.querySelector("[name=address]").value.trim(), city: form.querySelector("[name=city]").value.trim(), state: form.querySelector("[name=state]").value.trim(), pincode: form.querySelector("[name=pincode]").value.trim() },
		deliveryTime,
		paymentMethod: form.querySelector("input[name=payment]:checked").value,
		tracking: ["Order received", "Preparing", "Out for delivery", "Delivered"]
	};
	localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([order, ...getSavedOrders()]));
	localStorage.removeItem(CART_STORAGE_KEY);
	updateCartCount();
	renderConfirmation(pageMount, order);
}

function initializeCheckoutPage() {
	const pageMount = document.querySelector("[data-checkout-page]");
	if (!pageMount || typeof foodItems === "undefined") return;
	const lines = getCheckoutLines();
	if (lines.length === 0) {
		renderEmptyCheckout(pageMount);
		return;
	}
	const totals = getCheckoutTotals(lines);
	pageMount.innerHTML = `<section class="section" aria-labelledby="checkout-title"><div class="container"><div class="section__header"><div><span class="eyebrow">One last step</span><h1 id="checkout-title">Checkout</h1><p>Tell us where to bring your order.</p></div></div><div class="checkout-layout"><form class="form card" data-checkout-form novalidate><div class="card__body"><h2>Delivery information</h2><div class="checkout-fields"><div class="form__group"><label class="form__label" for="full-name">Full name</label><input class="input" id="full-name" name="fullName" type="text" autocomplete="name" required></div><div class="form__group"><label class="form__label" for="phone">Phone</label><input class="input" id="phone" name="phone" type="tel" inputmode="numeric" pattern="[0-9]{10}" autocomplete="tel" placeholder="10-digit number" required></div><div class="form__group checkout-field--wide"><label class="form__label" for="address">Address</label><textarea class="textarea" id="address" name="address" autocomplete="street-address" required></textarea></div><div class="form__group"><label class="form__label" for="city">City</label><input class="input" id="city" name="city" type="text" autocomplete="address-level2" required></div><div class="form__group"><label class="form__label" for="state">State</label><input class="input" id="state" name="state" type="text" autocomplete="address-level1" required></div><div class="form__group"><label class="form__label" for="pincode">Pincode</label><input class="input" id="pincode" name="pincode" type="text" inputmode="numeric" pattern="[0-9]{6}" placeholder="6-digit pincode" required></div></div><h2>Delivery time</h2><div class="choice-list"><label><input type="radio" name="deliveryTime" value="asap" checked data-delivery-time="asap"> ASAP</label><label><input type="radio" name="deliveryTime" value="scheduled" data-delivery-time="scheduled"> Schedule delivery</label></div><div class="form__group" data-scheduled-field hidden><label class="form__label" for="scheduled-time">Choose a delivery time</label><input class="input" id="scheduled-time" name="scheduledTime" type="datetime-local" data-scheduled-input></div><h2>Payment method</h2><div class="choice-list"><label><input type="radio" name="payment" value="Cash on Delivery" required> Cash on Delivery</label><label><input type="radio" name="payment" value="UPI"> UPI</label><label><input type="radio" name="payment" value="Card"> Card</label></div><p class="form__hint" data-payment-message aria-live="polite"></p><button class="button" type="submit">Place Order</button></div></form>${renderCheckoutSummary(lines, totals)}</div></div></section>`;
	const form = pageMount.querySelector("[data-checkout-form]");
	pageMount.querySelectorAll("[data-delivery-time]").forEach((input) => input.addEventListener("change", setScheduledDeliveryVisibility));
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!validateCheckout(form)) {
			form.reportValidity();
			return;
		}
		placeOrder(pageMount, lines, totals, form);
	});
}

document.addEventListener("DOMContentLoaded", initializeCheckoutPage);
