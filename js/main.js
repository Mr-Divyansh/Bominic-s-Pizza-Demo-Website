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
	const count = getCartItemCount();
	document.querySelectorAll("[data-cart-count]").forEach((countElement) => {
		countElement.textContent = count;
		countElement.hidden = count === 0;
		const cartLink = countElement.closest("a");
		if (cartLink) cartLink.setAttribute("aria-label", count === 0 ? "View cart" : `View cart, ${count} item${count === 1 ? "" : "s"}`);
	});
}

function announceStatus(message) {
	const statusRegion = document.getElementById("site-status");
	if (!statusRegion) return;
	statusRegion.textContent = "";
	window.setTimeout(() => { statusRegion.textContent = message; }, 60);
}

function renderNavbar() {
	const navbarMount = document.querySelector("[data-navbar]");
	if (!navbarMount) return;

	const accountEntry = isUserLoggedIn()
		? '<a class="navbar__link" href="account.html">Account</a><button class="navbar__link navbar__logout" type="button" data-logout>Logout</button>'
		: '<a class="navbar__link" href="login.html">Login</a>';

	const primaryLinks = `
				<a class="navbar__link" href="index.html">Home</a>
				<a class="navbar__link" href="menu.html?restaurant=rest-003">Menu</a>
				<a class="navbar__link" href="restaurants.html">Restaurants</a>
				<a class="navbar__link" href="about.html">About</a>
				<a class="navbar__link" href="contact.html">Contact</a>`;

	const cartLink = '<a class="navbar__link navbar__cart" href="cart.html" aria-label="View cart">Cart <span class="badge" data-cart-count hidden>0</span></a>';

	/* The account block is rendered once and *moved* into the drawer on mobile,
	   so a duplicate Login/Cart never appears outside the drawer. */
	const accountLinks = `<div class="navbar__actions">
				${accountEntry}
				${cartLink}
			</div>`;

	navbarMount.setAttribute("role", "banner");
	navbarMount.innerHTML = `
		<a class="skip-link" href="#main-content">Skip to main content</a>
		<div id="site-status" class="sr-only" role="status"></div>
		<nav class="navbar" aria-label="Primary navigation">
			<div class="container navbar__inner">
				<a class="navbar__brand" href="index.html" aria-label="Bominic's Pizza home">Bominic's Pizza</a>
				<button class="navbar__toggle" type="button" aria-expanded="false" aria-controls="bominics-drawer" data-menu-toggle aria-label="Open navigation menu">
				</button>
				<div class="navbar__menu" id="bominics-menu" data-menu>${primaryLinks}
				</div>
				${accountLinks}
			</div>
		</nav>
		<button class="navbar__scrim" type="button" tabindex="-1" aria-label="Close navigation menu" aria-hidden="true" data-drawer-scrim></button>
		<div class="navbar__drawer" id="bominics-drawer" data-drawer role="dialog" aria-modal="true" aria-label="Navigation menu" aria-hidden="true" tabindex="-1">
			<div class="navbar__drawer__head">
				<h2 class="navbar__drawer__title">Menu</h2>
				<button class="navbar__drawer__close" type="button" data-drawer-close aria-label="Close navigation menu">&#x2715;</button>
			</div>
			<nav class="navbar__drawer__group" aria-label="Pages">${primaryLinks}
			</nav>
			<div class="navbar__drawer__group" aria-label="Your account" data-drawer-account>
				<span class="navbar__drawer__group-label" aria-hidden="true">Your account</span>
			</div>
		</div>`;

	const drawer = navbarMount.querySelector("[data-drawer]");
	const scrim = navbarMount.querySelector("[data-drawer-scrim]");
	const drawerCloseButton = navbarMount.querySelector("[data-drawer-close]");
	const menuToggle = navbarMount.querySelector("[data-menu-toggle]");
	const accountBlock = navbarMount.querySelector(".navbar__actions");
	const navbarInner = navbarMount.querySelector(".navbar__inner");
	const drawerAccountGroup = drawer.querySelector("[data-drawer-account]");
	const currentPage = window.location.pathname.split("/").pop() || "index.html";
	navbarMount.querySelectorAll(".navbar__link").forEach((link) => {
		const linkPage = (link.getAttribute("href") || "").split("?")[0];
		if (linkPage === currentPage) link.setAttribute("aria-current", "page");
	});

	/* Below 64rem the single account block lives inside the drawer; at desktop it
	   returns to the navbar. A duplicate Login/Cart never exists at any width. */
	function syncAccountPlacement() {
		const isMobile = window.matchMedia("(max-width: 63.99rem)").matches;
		const inDrawer = accountBlock.parentElement === drawerAccountGroup;
		if (isMobile && !inDrawer) drawerAccountGroup.appendChild(accountBlock);
		else if (!isMobile && inDrawer) navbarInner.appendChild(accountBlock);
	}

	syncAccountPlacement();
	window.addEventListener("resize", syncAccountPlacement);

	function isDrawerOpen() {
		return drawer.classList.contains("is-open");
	}

	function setDrawerOpen(shouldOpen) {
		drawer.classList.toggle("is-open", shouldOpen);
		scrim.classList.toggle("is-open", shouldOpen);
		drawer.setAttribute("aria-hidden", String(!shouldOpen));
		scrim.setAttribute("aria-hidden", String(!shouldOpen));
		menuToggle.setAttribute("aria-expanded", String(shouldOpen));
		menuToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
		document.body.classList.toggle("navbar-drawer-open", shouldOpen);
		if (shouldOpen) {
			/* The closed drawer carries `visibility: hidden`, so focus() is a
			   no-op until the browser has recalculated style for the open state.
			   Wait one frame before moving focus in. */
			window.requestAnimationFrame(() => {
				if (!isDrawerOpen()) return;
				const initialFocus = drawer.querySelector("[data-drawer-close]") || drawer;
				if (typeof initialFocus.focus === "function") initialFocus.focus({ preventScroll: true });
			});
		} else {
			menuToggle.focus();
		}
	}

	menuToggle.addEventListener("click", () => {
		setDrawerOpen(!isDrawerOpen());
	});

	drawerCloseButton.addEventListener("click", () => setDrawerOpen(false));
	scrim.addEventListener("click", () => setDrawerOpen(false));

	/* Selecting any drawer link (including the account and cart entries) closes it. */
	drawer.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => setDrawerOpen(false));
	});

	document.addEventListener("keydown", (event) => {
		if (!isDrawerOpen()) return;
		if (event.key === "Escape") {
			setDrawerOpen(false);
			return;
		}
		if (event.key !== "Tab") return;
		const focusable = drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && (document.activeElement === first || document.activeElement === drawer)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	});

	window.addEventListener("resize", () => {
		if (isDrawerOpen() && window.innerWidth >= 1024) setDrawerOpen(false);
	});

	const logoutButtons = navbarMount.querySelectorAll("[data-logout]");
	logoutButtons.forEach((logoutButton) => {
		logoutButton.addEventListener("click", () => {
			if (typeof logoutUser === "function") logoutUser();
			else {
				localStorage.removeItem("freshbiteUser");
				localStorage.removeItem("currentUser");
			}
			window.location.href = "index.html";
		});
	});

	updateCartCount();
}

function renderFooter() {
	const footerMount = document.querySelector("[data-footer]");
	if (!footerMount) return;

	footerMount.setAttribute("role", "contentinfo");
	footerMount.innerHTML = `
		<footer class="footer">
			<div class="container">
				<div class="footer__grid">
					<div><h2>Bominic's<span> Pizza</span></h2><p>Fresh, hot pizzas from Shop 7, HRTC Complex, Palampur.</p><p class="form__hint">Demo website — menu prices are samples.</p></div>
					<div><h3>Quick links</h3><p><a href="menu.html?restaurant=rest-003">Bominic's menu</a></p><p><a href="restaurants.html">Restaurants</a></p><p><a href="about.html">About us</a></p></div>
					<div><h3>Contact</h3><p>Shop 7, HRTC Complex, Palampur Locality, Palampur</p><p><a href="tel:+919988454540">+91 99884 54540</a></p><p><a href="contact.html">Contact us</a></p></div>
					<div><h3>Follow along</h3><p><a href="#" aria-label="Bominic's Pizza on Instagram">Instagram</a></p><p><a href="#" aria-label="Bominic's Pizza on Facebook">Facebook</a></p><p><a href="#" aria-label="Bominic's Pizza on Twitter">Twitter</a></p></div>
				</div>
				<div class="footer__bottom"><p>&copy; ${new Date().getFullYear()} Bominic's Pizza. All rights reserved. Demo website.</p><p class="footer__legal"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a></p><p class="form__hint">Developed by D Web Studio</p></div>
			</div>
		</footer>`;
}

function renderPolicyPage(pageMount, title, bodyHtml) {
	if (!pageMount) return;
	pageMount.innerHTML = `
		<section class="section" aria-labelledby="policy-title">
			<div class="container">
				<div class="section__header">
					<div>
						<span class="eyebrow">Bominic's Pizza · Demo</span>
						<h1 id="policy-title">${escapeHtml(title)}</h1>
					</div>
				</div>
				<div class="card">
					<div class="card__body">
						${bodyHtml}
					</div>
				</div>
			</div>
		</section>`;
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
	const addedItem = typeof foodItems !== "undefined" ? foodItems.find((foodItem) => foodItem.id === foodItemId) : null;
	const itemCount = getCartItemCount();
	announceStatus(`${addedItem ? addedItem.name : "Item"} added to cart. ${itemCount} item${itemCount === 1 ? "" : "s"} in cart.`);
}

function renderHomePage() {
	const homeMount = document.querySelector("[data-home]");
	if (!homeMount || typeof restaurants === "undefined" || typeof foodItems === "undefined") return;

	const featuredDishes = [
		...foodItems.filter((foodItem) => foodItem.restaurantId === "rest-003" && foodItem.category === "Pizza" && foodItem.featured),
		...foodItems.filter((foodItem) => foodItem.restaurantId === "rest-003" && foodItem.category === "Pizza" && !foodItem.featured)
	].slice(0, 6);
	const restaurantLookup = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
	const homeCategories = [
		["Pizzas", "🍕", "menu.html?restaurant=rest-003&category=Pizza"],
		["Starters & Sides", "🍟", "menu.html?restaurant=rest-003&category=Starters"],
		["Beverages", "🥤", "menu.html?restaurant=rest-003&category=Beverages"],
		["Desserts", "🍰", "menu.html?restaurant=rest-003&category=Desserts"],
		["Vegetarian", "🌱", "menu.html?restaurant=rest-003&dietary=Veg"],
		["Full Menu", "🍽", "menu.html?restaurant=rest-003"]
	];

	const dishCards = featuredDishes.map((foodItem) => {
		const restaurant = restaurantLookup.get(foodItem.restaurantId);
		return `
			<article class="food-card">
				<img class="food-card__image" src="${foodItem.image}" alt="${escapeHtml(foodItem.name)}" width="800" height="500" loading="lazy">
				<div class="food-card__body">
					<div class="food-card__meta"><span class="badge ${foodItem.dietaryType === "Vegan" ? "badge--success" : ""}">${escapeHtml(foodItem.dietaryType)}</span><span class="rating" aria-label="${foodItem.rating} out of 5 stars">★ ${foodItem.rating}</span></div>
					<h3>${escapeHtml(foodItem.name)}</h3><p class="food-card__description">${restaurant ? escapeHtml(restaurant.name) : "Bominic's Pizza"}</p>
					<div class="food-card__actions"><span class="food-card__price">₹${foodItem.price}</span><button class="button button--secondary button--small" type="button" data-add-to-cart="${foodItem.id}">Add to Cart</button></div>
				</div>
			</article>`;
	}).join("");

	const offerCards = specialOffers.slice(0, 3).map((offer) => `
		<article class="offer-card"><span class="badge">${escapeHtml(offer.code)}</span><h3>${escapeHtml(offer.title)}</h3><p>${escapeHtml(offer.description)}</p><strong>${offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}</strong></article>`).join("");
	const reviewCards = reviews.filter((review) => review.restaurantId === "rest-003").slice(0, 3).map((review) => `
		<article class="review-card"><div class="rating" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div><blockquote>“${escapeHtml(review.comment)}”</blockquote><cite>${escapeHtml(review.customerName)} <span>· Sample review</span></cite></article>`).join("");

	homeMount.innerHTML = `
		<section class="hero">
			<div class="container hero__inner"><div class="hero__content"><span class="eyebrow">Bominic's Pizza · Palampur</span><h1>Hot, cheesy pizzas made fresh in Palampur.</h1><p>Explore the Bominic's demo menu, pick your favourite pizzas and sides, then check out in a few taps. Menu prices shown are samples.</p><div class="hero__actions"><a class="button" href="menu.html?restaurant=rest-003">Explore Bominic's Menu</a><a class="button button--secondary" href="contact.html">Visit or Call Us</a></div><p class="form__hint hero__meta"><span>Shop 7, HRTC Complex, Palampur</span><span class="hero__meta__sep" aria-hidden="true">·</span><a href="tel:+919988454540">+91 99884 54540</a></p></div><div class="hero__visual"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85" alt="Freshly baked Bominic's pizza" width="1200" height="900" fetchpriority="high"><span class="hero__note"><strong>Demo Menu</strong><small>Sample prices</small></span></div></div>
		</section>
		<section class="section category-section" aria-labelledby="category-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Choose your craving</span><h2 id="category-title">What are you in the mood for?</h2></div></div><div class="category-grid">${homeCategories.map(([name, icon, url]) => `<a class="category-card" href="${url}" data-icon="${icon}" aria-label="${escapeHtml(name)}">${name}</a>`).join("")}</div></div></section>
		<section class="section" id="featured-restaurants" aria-labelledby="dishes-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Baked fresh</span><h2 id="dishes-title">Most-loved Bominic's pizzas</h2><p>Cheesy classics, veggie favourites and sides from the demo menu. Menu prices are samples.</p></div><a href="menu.html?restaurant=rest-003" class="button button--ghost button--small">Browse the menu</a></div><div class="food-grid">${dishCards}</div></div></section>
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
	const mainElement = document.querySelector("main");
	if (mainElement) {
		if (!mainElement.id) mainElement.id = "main-content";
		mainElement.setAttribute("tabindex", "-1");
	}
	renderNavbar();
	renderFooter();
	renderHomePage();
}

document.addEventListener("DOMContentLoaded", initializeFreshBite);
window.addEventListener("storage", updateCartCount);
