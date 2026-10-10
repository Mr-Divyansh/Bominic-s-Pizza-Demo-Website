function findRestaurantFromQuery() {
	const restaurantQuery = new URLSearchParams(window.location.search).get("restaurant");
	if (!restaurantQuery || typeof restaurants === "undefined") return null;

	return restaurants.find((restaurant) => restaurant.id === restaurantQuery)
		|| restaurants.find((restaurant) => restaurant.id === `rest-${restaurantQuery.padStart(3, "0")}`);
}

function renderMenuFoodCard(foodItem) {
	return `
		<article class="food-card">
			<img class="food-card__image" src="${foodItem.image}" alt="${escapeHtml(foodItem.name)}" loading="lazy">
			<div class="food-card__body">
				<div class="food-card__meta"><span class="badge ${foodItem.dietaryType === "Vegan" ? "badge--success" : foodItem.dietaryType === "Non-Veg" ? "badge--warning" : ""}">${escapeHtml(foodItem.dietaryType)}</span><span class="rating" aria-label="${foodItem.rating} out of 5 stars">★ ${foodItem.rating}</span></div>
				<h2>${escapeHtml(foodItem.name)}</h2><p class="food-card__description">${escapeHtml(foodItem.description)}</p>
				<div class="food-card__actions"><span class="food-card__price">₹${foodItem.price}</span><div><button class="button button--ghost button--small wishlist-toggle" type="button" data-wishlist-toggle="${foodItem.id}" aria-pressed="${isWishlistItem(foodItem.id)}">${isWishlistItem(foodItem.id) ? "♥ Saved" : "♡ Save"}</button> <a class="button button--secondary button--small" href="product.html?food=${encodeURIComponent(foodItem.id)}">View Details</a> <button class="button button--small" type="button" data-add-to-cart="${foodItem.id}">Add to Cart</button></div></div>
			</div>
		</article>`;
}

function getMenuFilters() {
	return {
		search: document.querySelector("[data-food-search]").value.trim().toLowerCase(),
		category: document.querySelector("[data-category-filter]").value,
		dietaryType: document.querySelector("[data-dietary-filter].is-active").dataset.dietary || "",
		sort: document.querySelector("[data-menu-sort]").value
	};
}

function getFilteredMenuItems(menuItems, filters) {
	return menuItems.filter((foodItem) => {
		const searchableText = `${foodItem.name} ${foodItem.description} ${foodItem.ingredients.join(" ")}`.toLowerCase();
		return (!filters.search || searchableText.includes(filters.search))
			&& (!filters.category || foodItem.category === filters.category)
			&& (!filters.dietaryType || foodItem.dietaryType === filters.dietaryType);
	}).sort((firstItem, secondItem) => {
		if (filters.sort === "price-asc") return firstItem.price - secondItem.price;
		if (filters.sort === "price-desc") return secondItem.price - firstItem.price;
		if (filters.sort === "rating-desc") return secondItem.rating - firstItem.rating;
		return firstItem.name.localeCompare(secondItem.name);
	});
}

function updateMenuResults(menuItems) {
	const filters = getMenuFilters();
	const filteredItems = getFilteredMenuItems(menuItems, filters);
	const resultsMount = document.querySelector("[data-menu-results]");
	const emptyState = document.querySelector("[data-menu-empty]");
	document.querySelector("[data-menu-result-count]").textContent = `${filteredItems.length} dish${filteredItems.length === 1 ? "" : "es"}`;
	resultsMount.innerHTML = filteredItems.map(renderMenuFoodCard).join("");
	resultsMount.hidden = filteredItems.length === 0;
	emptyState.hidden = filteredItems.length > 0;
	resultsMount.querySelectorAll("[data-add-to-cart]").forEach((button) => button.addEventListener("click", () => {
		addToCart(button.dataset.addToCart);
		button.textContent = "Added";
		button.classList.add("button--secondary");
	}));
	resultsMount.querySelectorAll("[data-wishlist-toggle]").forEach((button) => button.addEventListener("click", () => {
		const saved = toggleWishlistItem(button.dataset.wishlistToggle);
		button.textContent = saved ? "♥ Saved" : "♡ Save";
		button.setAttribute("aria-pressed", String(saved));
	}));
}

function renderInvalidMenu(pageMount) {
	pageMount.innerHTML = `
		<section class="section"><div class="container"><div class="alert alert--warning"><div><h1>We could not find that menu</h1><p>The restaurant link may be out of date or incomplete. Choose another restaurant to keep browsing.</p><a class="button" href="restaurants.html">Back to restaurants</a></div></div></div></section>`;
}

function initializeMenuPage() {
	const pageMount = document.querySelector("[data-menu-page]");
	if (!pageMount || typeof restaurants === "undefined" || typeof foodItems === "undefined") return;

	const restaurant = findRestaurantFromQuery();
	if (!restaurant) {
		renderInvalidMenu(pageMount);
		return;
	}

	const menuItems = foodItems.filter((foodItem) => foodItem.restaurantId === restaurant.id);
	const categories = [...new Set(menuItems.map((foodItem) => foodItem.category))].sort();
	pageMount.innerHTML = `
		<section class="section" aria-labelledby="menu-page-title"><div class="container"><a href="restaurants.html" class="button button--ghost button--small">← All restaurants</a><div class="section__header"><div><span class="eyebrow">Fresh from the kitchen</span><h1 id="menu-page-title">${escapeHtml(restaurant.name)}</h1><p>${escapeHtml(restaurant.description)}</p><div class="restaurant-card__meta"><span class="rating" aria-label="${restaurant.rating} out of 5 stars">★ ${restaurant.rating}</span><span>${escapeHtml(restaurant.cuisine)}</span><span>${escapeHtml(restaurant.deliveryTime)}</span><span>${escapeHtml(restaurant.location)}</span></div></div></div></div></section>
		<section class="section section--muted" aria-labelledby="menu-items-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Take your pick</span><h2 id="menu-items-title">Our menu</h2></div><span class="form__hint" data-menu-result-count aria-live="polite">Loading dishes...</span></div><form class="form" data-menu-filters role="search"><div class="form__group"><label class="form__label" for="food-search">Search this menu</label><input class="input" id="food-search" type="search" placeholder="Search dishes or ingredients" data-food-search></div><div class="restaurant-filter-grid"><div class="form__group"><label class="form__label" for="category-filter">Category</label><select class="select" id="category-filter" data-category-filter><option value="">All categories</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></div><div class="form__group"><label class="form__label" for="menu-sort">Sort by</label><select class="select" id="menu-sort" data-menu-sort><option value="name-asc">Name A-Z</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating-desc">Top rated</option></select></div></div><div class="form__group"><span class="form__label">Dietary preference</span><div class="filter-pills"><button class="button button--small is-active" type="button" data-dietary-filter data-dietary="">All</button><button class="button button--secondary button--small" type="button" data-dietary-filter data-dietary="Veg">Veg</button><button class="button button--secondary button--small" type="button" data-dietary-filter data-dietary="Non-Veg">Non-Veg</button><button class="button button--secondary button--small" type="button" data-dietary-filter data-dietary="Vegan">Vegan</button></div></div></form><div class="food-grid" data-menu-results><div class="loading">Loading dishes...</div></div><div class="alert alert--info" data-menu-empty hidden><div><strong>No dishes found</strong><p>Try a different search, category, or dietary preference.</p></div></div></div></section>`;

	pageMount.querySelectorAll("[data-menu-filters] input, [data-menu-filters] select").forEach((control) => control.addEventListener("input", () => updateMenuResults(menuItems)));
	pageMount.querySelectorAll("[data-dietary-filter]").forEach((button) => button.addEventListener("click", () => {
		pageMount.querySelectorAll("[data-dietary-filter]").forEach((dietaryButton) => {
			dietaryButton.classList.toggle("is-active", dietaryButton === button);
			dietaryButton.classList.toggle("button--secondary", dietaryButton !== button);
		});
		updateMenuResults(menuItems);
	}));
	updateMenuResults(menuItems);
}

document.addEventListener("DOMContentLoaded", initializeMenuPage);
