const CART_STORAGE_KEY = "freshbiteCart";
const WISHLIST_STORAGE_KEY = "freshbiteWishlist";

function getStoredCart() {
	try {
		const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
		return Array.isArray(cart) ? cart : [];
	} catch (error) {
		return [];
	}
}

function getCartItemCount() {
	return getStoredCart().reduce((total, item) => total + Number(item.quantity || 1), 0);
}

function getWishlistItems() {
	try {
		const wishlist = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
		return Array.isArray(wishlist) ? [...new Set(wishlist)] : [];
	} catch (error) {
		return [];
	}
}

function isWishlistItem(foodItemId) {
	return getWishlistItems().includes(foodItemId);
}

function toggleWishlistItem(foodItemId) {
	const wishlist = getWishlistItems();
	const itemIndex = wishlist.indexOf(foodItemId);
	if (itemIndex === -1) wishlist.push(foodItemId);
	else wishlist.splice(itemIndex, 1);
	localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
	return itemIndex === -1;
}

function isUserLoggedIn() {
	if (typeof isLoggedIn === "function") return isLoggedIn();
	return Boolean(localStorage.getItem("freshbiteUser") || localStorage.getItem("currentUser") || localStorage.getItem("freshbiteRememberedUser") || sessionStorage.getItem("freshbiteSessionUser"));
}

function updateCartCount() {
	document.querySelectorAll("[data-cart-count]").forEach((countElement) => {
		const count = getCartItemCount();
		countElement.textContent = count;
		countElement.hidden = count === 0;
		countElement.setAttribute("aria-label", `${count} cart item${count === 1 ? "" : "s"}`);
	});
}

function renderNavbar() {
	const navbarMount = document.querySelector("[data-navbar]");
	if (!navbarMount) return;

	const accountLink = isUserLoggedIn()
		? '<a class="navbar__link" href="account.html">Account</a><button class="navbar__link navbar__logout" type="button" data-logout>Logout</button>'
		: '<a class="navbar__link" href="login.html">Login</a><a class="navbar__link" href="register.html">Register</a>';

	navbarMount.innerHTML = `
		<nav class="navbar" aria-label="Primary navigation">
			<div class="container navbar__inner">
				<a class="navbar__brand" href="index.html" aria-label="Bominic's Pizza home">Bominic's<span> Pizza</span></a>
				<button class="navbar__toggle" type="button" aria-expanded="false" aria-controls="bominics-menu" data-menu-toggle>
					<span aria-hidden="true">&#9776;</span><span class="sr-only">Open navigation menu</span>
				</button>
				<div class="navbar__menu" id="bominics-menu" data-menu>
					<a class="navbar__link" href="index.html">Home</a>
					<a class="navbar__link" href="menu.html?restaurant=rest-003">Menu</a>
					<a class="navbar__link" href="restaurants.html">Restaurants</a>
					<a class="navbar__link" href="about.html">About</a>
					<a class="navbar__link" href="contact.html">Contact</a>
					${accountLink}
					<a class="navbar__link navbar__cart" href="cart.html">Cart <span class="badge" data-cart-count hidden>0</span></a>
				</div>
			</div>
		</nav>`;

	const menu = navbarMount.querySelector("[data-menu]");
	const menuToggle = navbarMount.querySelector("[data-menu-toggle]");
	menuToggle.addEventListener("click", () => {
		const isOpen = menu.classList.toggle("is-open");
		menuToggle.setAttribute("aria-expanded", String(isOpen));
		menuToggle.querySelector(".sr-only").textContent = isOpen ? "Close navigation menu" : "Open navigation menu";
	});

	navbarMount.querySelectorAll(".navbar__link").forEach((link) => {
		link.addEventListener("click", () => {
			menu.classList.remove("is-open");
			menuToggle.setAttribute("aria-expanded", "false");
		});
	});

	const logoutButton = navbarMount.querySelector("[data-logout]");
	if (logoutButton) {
		logoutButton.addEventListener("click", () => {
			if (typeof logoutUser === "function") logoutUser();
			else {
				localStorage.removeItem("freshbiteUser");
				localStorage.removeItem("currentUser");
			}
			window.location.href = "index.html";
		});
	}

	updateCartCount();
}

function renderFooter() {
	const footerMount = document.querySelector("[data-footer]");
	if (!footerMount) return;

	footerMount.innerHTML = `
		<footer class="footer">
			<div class="container">
				<div class="footer__grid">
					<div><h2>Bominic's<span> Pizza</span></h2><p>Fresh, hot pizzas from Shop 7, HRTC Complex, Palampur.</p><p class="form__hint">Demo website — menu prices are samples.</p></div>
					<div><h3>Quick links</h3><p><a href="menu.html?restaurant=rest-003">Bominic's menu</a></p><p><a href="restaurants.html">Restaurants</a></p><p><a href="about.html">About us</a></p></div>
					<div><h3>Contact</h3><p>Shop 7, HRTC Complex, Palampur Locality, Palampur</p><p><a href="tel:+919988454540">+91 99884 54540</a></p><p><a href="contact.html">Contact us</a></p></div>
					<div><h3>Follow along</h3><p><a href="#" aria-label="Bominic's Pizza on Instagram">Instagram</a></p><p><a href="#" aria-label="Bominic's Pizza on Facebook">Facebook</a></p><p><a href="#" aria-label="Bominic's Pizza on Twitter">Twitter</a></p></div>
				</div>
				<div class="footer__bottom"><p>&copy; ${new Date().getFullYear()} Bominic's Pizza. All rights reserved. Demo website.</p><p class="form__hint">Developed by D Web Studio</p></div>
			</div>
		</footer>`;
}

function escapeHtml(value) {
	return String(value).replace(/[&<>'"]/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"'": "&#39;",
		'"': "&quot;"
	}[character]));
}

function addToCart(foodItemId) {
	const cart = getStoredCart();
	const existingItem = cart.find((item) => item.foodItemId === foodItemId || item.id === foodItemId);
	if (existingItem) {
		existingItem.quantity = Number(existingItem.quantity || 1) + 1;
	} else {
		cart.push({ foodItemId, quantity: 1 });
	}
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
	updateCartCount();
}

function renderHomePage() {
	const homeMount = document.querySelector("[data-home]");
	if (!homeMount || typeof restaurants === "undefined" || typeof foodItems === "undefined") return;

	const featuredRestaurants = restaurants.filter((restaurant) => restaurant.id === "rest-003" || restaurant.featured).slice(0, 3);
	const featuredDishes = [
		...foodItems.filter((foodItem) => foodItem.restaurantId === "rest-003" && foodItem.featured),
		...foodItems.filter((foodItem) => foodItem.restaurantId === "rest-003" && !foodItem.featured),
		...foodItems.filter((foodItem) => foodItem.restaurantId !== "rest-003" && foodItem.featured)
	].slice(0, 6);
	const restaurantLookup = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
	const homeCategories = [
		["Pizzas", "🍕", "menu.html?restaurant=rest-003"],
		["Sides", "🍟", "menu.html?restaurant=rest-003"],
		["Beverages", "🥤", "menu.html?restaurant=rest-003"],
		["Desserts", "🍰", "menu.html?restaurant=rest-003"],
		["Veg Picks", "🌱", "menu.html?restaurant=rest-003"],
		["All Menu", "🍽", "menu.html?restaurant=rest-003"]
	];

	const restaurantCards = featuredRestaurants.map((restaurant) => `
		<article class="restaurant-card">
			<img class="restaurant-card__image" src="${restaurant.image}" alt="${escapeHtml(restaurant.name)} cuisine" loading="lazy">
			<div class="restaurant-card__body">
				<div class="restaurant-card__meta"><span class="badge badge--accent">Featured</span><span class="rating" aria-label="${restaurant.rating} out of 5 stars">★ ${restaurant.rating}</span></div>
				<h3>${escapeHtml(restaurant.name)}</h3><p class="restaurant-card__description">${escapeHtml(restaurant.cuisine)}</p>
				<div class="restaurant-card__meta"><span>${escapeHtml(restaurant.priceRange)} · ${escapeHtml(restaurant.deliveryTime)}</span><span>${escapeHtml(restaurant.location)}</span></div>
				<a class="button button--secondary button--small" href="menu.html?restaurant=${encodeURIComponent(restaurant.id)}">View Menu</a>
			</div>
		</article>`).join("");

	const dishCards = featuredDishes.map((foodItem) => {
		const restaurant = restaurantLookup.get(foodItem.restaurantId);
		return `
			<article class="food-card">
				<img class="food-card__image" src="${foodItem.image}" alt="${escapeHtml(foodItem.name)}" loading="lazy">
				<div class="food-card__body">
					<div class="food-card__meta"><span class="badge ${foodItem.dietaryType === "Vegan" ? "badge--success" : ""}">${escapeHtml(foodItem.dietaryType)}</span><span class="rating" aria-label="${foodItem.rating} out of 5 stars">★ ${foodItem.rating}</span></div>
					<h3>${escapeHtml(foodItem.name)}</h3><p class="food-card__description">${restaurant ? escapeHtml(restaurant.name) : "Bominic's Pizza"}</p>
					<div class="food-card__actions"><span class="food-card__price">₹${foodItem.price}</span><button class="button button--small" type="button" data-add-to-cart="${foodItem.id}">Add to Cart</button></div>
				</div>
			</article>`;
	}).join("");

	const offerCards = specialOffers.slice(0, 3).map((offer) => `
		<article class="offer-card"><span class="badge">${escapeHtml(offer.code)}</span><h3>${escapeHtml(offer.title)}</h3><p>${escapeHtml(offer.description)}</p><strong>${offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}</strong></article>`).join("");
	const reviewCards = reviews.slice(0, 3).map((review) => `
		<article class="review-card"><div class="rating" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div><blockquote>“${escapeHtml(review.comment)}”</blockquote><cite>${escapeHtml(review.customerName)} <span>· Verified order</span></cite></article>`).join("");

	homeMount.innerHTML = `
		<section class="hero">
			<div class="container hero__inner"><div class="hero__content"><span class="eyebrow">Bominic's Pizza · Palampur</span><h1>Hot, cheesy pizzas made fresh in Palampur.</h1><p>Explore the Bominic's demo menu, pick your favourite pizzas and sides, then check out in a few taps. Menu prices shown are samples.</p><div class="hero__actions"><a class="button" href="menu.html?restaurant=rest-003">Explore Bominic's Menu</a><a class="button button--secondary" href="contact.html">Visit or Call Us</a></div><p class="form__hint">Shop 7, HRTC Complex, Palampur · <a href="tel:+919988454540">+91 99884 54540</a></p></div><div class="hero__visual"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85" alt="Freshly baked Bominic's pizza" fetchpriority="high"><span class="hero__note"><strong>Demo Menu</strong><small>Sample prices</small></span></div></div>
		</section>
		<section class="section category-section" aria-labelledby="category-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Choose your craving</span><h2 id="category-title">What are you in the mood for?</h2></div></div><div class="category-grid">${homeCategories.map(([name, icon, url]) => `<a class="category-card" href="${url}"><span class="category-card__icon" aria-hidden="true">${icon}</span><span>${name}</span></a>`).join("")}</div></div></section>
		<section class="section section--muted" id="featured-restaurants" aria-labelledby="restaurants-title"><div class="container"><div class="section__header"><div><span class="eyebrow">From our kitchen</span><h2 id="restaurants-title">Bominic's Pizza spotlight</h2><p>Start with our Palampur kitchen, then browse more demo restaurants.</p></div><a href="restaurants.html" class="button button--ghost button--small">See all restaurants</a></div><div class="restaurant-grid">${restaurantCards}</div></div></section>
		<section class="section" aria-labelledby="dishes-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Baked fresh</span><h2 id="dishes-title">Most-loved Bominic's pizzas</h2><p>Cheesy classics, veggie favourites and sides from the demo menu.</p></div><a href="menu.html?restaurant=rest-003" class="button button--ghost button--small">Browse the menu</a></div><div class="food-grid">${dishCards}</div></div></section>
		<section class="section offers-section" aria-labelledby="offers-title"><div class="container"><div class="section__header"><div><span class="eyebrow">A little extra joy</span><h2 id="offers-title">Special offers</h2><p class="form__hint">Demo offers for illustration only.</p></div></div><div class="offer-grid">${offerCards}</div></div></section>
		<section class="section section--muted" aria-labelledby="why-title"><div class="container"><div class="section__header"><div><span class="eyebrow">The Bominic's promise</span><h2 id="why-title">Fresh from the oven, made for Palampur.</h2></div></div><div class="benefit-grid"><article><span class="benefit-icon">🍕</span><h3>Pizza-first menu</h3><p>Classic cheese, veggie and chicken pizzas with tasty sides.</p></article><article><span class="benefit-icon">🔥</span><h3>Baked fresh</h3><p>Hot, cheesy and ready to enjoy with family and friends.</p></article><article><span class="benefit-icon">🛵</span><h3>Easy ordering</h3><p>Search, filter and add pizzas to your cart in seconds.</p></article><article><span class="benefit-icon">📍</span><h3>Find us in Palampur</h3><p>Shop 7, HRTC Complex, Palampur. Call <a href="tel:+919988454540">+91 99884 54540</a>.</p></article></div></div></section>
		<section class="section" aria-labelledby="reviews-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Kind words</span><h2 id="reviews-title">What demo customers say</h2><p class="form__hint">Sample reviews for demonstration.</p></div></div><div class="review-grid">${reviewCards}</div></div></section>
		<section class="cta-section" aria-labelledby="cta-title"><div class="container cta-section__inner"><div><span class="eyebrow">Hungry?</span><h2 id="cta-title">Your next pizza craving starts here.</h2><p>Browse the Bominic's demo menu and build your order.</p></div><a class="button" href="menu.html?restaurant=rest-003">Order from Bominic's</a></div></section>`;

	homeMount.querySelectorAll("[data-add-to-cart]").forEach((button) => button.addEventListener("click", () => {
		addToCart(button.dataset.addToCart);
		button.textContent = "Added";
		button.classList.add("button--secondary");
	}));
}

function initializeFreshBite() {
	renderNavbar();
	renderFooter();
	renderHomePage();
}

document.addEventListener("DOMContentLoaded", initializeFreshBite);
window.addEventListener("storage", updateCartCount);
