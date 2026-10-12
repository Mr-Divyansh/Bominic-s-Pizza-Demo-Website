function formatRestaurantPrice(restaurant) {
	const menuItems = typeof foodItems !== "undefined" ? foodItems.filter((item) => item.restaurantId === restaurant.id) : [];
	if (menuItems.length) {
		const averagePrice = Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length);
		const priceForTwo = Math.round((averagePrice * 2) / 50) * 50;
		return `₹${priceForTwo} for two`;
	}
	const fallbackPrices = { "$": "₹400 for two", "$$": "₹700 for two", "$$$": "₹1200 for two" };
	return fallbackPrices[restaurant.priceRange] || "₹700 for two";
}

function renderRestaurantCard(restaurant) {
	const priceLabel = formatRestaurantPrice(restaurant);
	const priceBadge = restaurant.priceRange.replace(/\$/g, "₹");
	return `
		<article class="restaurant-card">
			<img class="restaurant-card__image" src="${restaurant.image}" alt="${escapeHtml(restaurant.name)} cuisine" width="800" height="500" loading="lazy">
			<div class="restaurant-card__body">
				<div class="restaurant-card__meta"><span class="badge ${restaurant.featured ? "badge--accent" : ""}">${restaurant.featured ? "Featured" : priceBadge}</span><span class="rating" aria-label="${restaurant.rating} out of 5 stars">★ ${restaurant.rating}</span></div>
				<h2>${escapeHtml(restaurant.name)}</h2>
				<p class="restaurant-card__description">${escapeHtml(restaurant.cuisine)}</p>
				<div class="restaurant-card__meta"><span>${priceLabel} · ${escapeHtml(restaurant.deliveryTime)}</span><span>${escapeHtml(restaurant.location)}</span></div>
				<a class="button button--secondary button--small" href="menu.html?restaurant=${encodeURIComponent(restaurant.id)}">View Menu</a>
			</div>
		</article>`;
}

function getRestaurantFilters() {
	return {
		search: document.querySelector("[data-restaurant-search]").value.trim().toLowerCase(),
		cuisine: document.querySelector("[data-cuisine-filter]").value,
		minimumRating: Number(document.querySelector("[data-rating-filter]").value || 0),
		priceRange: document.querySelector("[data-price-filter]").value,
		sort: document.querySelector("[data-sort-filter]").value
	};
}

function filterRestaurants(filters) {
	const filteredRestaurants = restaurants.filter((restaurant) => {
		const searchableText = `${restaurant.name} ${restaurant.cuisine} ${restaurant.location} ${restaurant.description}`.toLowerCase();
		const matchesSearch = !filters.search || searchableText.includes(filters.search);
		const matchesCuisine = !filters.cuisine || restaurant.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase());
		const matchesRating = restaurant.rating >= filters.minimumRating;
		const matchesPrice = !filters.priceRange || restaurant.priceRange === filters.priceRange;
		return matchesSearch && matchesCuisine && matchesRating && matchesPrice;
	});

	return filteredRestaurants.sort((firstRestaurant, secondRestaurant) => {
		if (filters.sort === "rating-desc") return secondRestaurant.rating - firstRestaurant.rating;
		if (filters.sort === "delivery-asc") return parseInt(firstRestaurant.deliveryTime, 10) - parseInt(secondRestaurant.deliveryTime, 10);
		return firstRestaurant.name.localeCompare(secondRestaurant.name);
	});
}

function updateRestaurantResults() {
	const resultsMount = document.querySelector("[data-restaurant-results]");
	const resultCount = document.querySelector("[data-result-count]");
	const emptyState = document.querySelector("[data-restaurant-empty]");
	const restaurantsToShow = filterRestaurants(getRestaurantFilters());

	resultCount.textContent = `${restaurantsToShow.length} restaurant${restaurantsToShow.length === 1 ? "" : "s"}`;
	resultsMount.innerHTML = restaurantsToShow.map(renderRestaurantCard).join("");
	emptyState.hidden = restaurantsToShow.length > 0;
	resultsMount.hidden = restaurantsToShow.length === 0;
}

function clearRestaurantFilters() {
	document.querySelector("[data-restaurant-search]").value = "";
	document.querySelector("[data-cuisine-filter]").value = "";
	document.querySelector("[data-rating-filter]").value = "";
	document.querySelector("[data-price-filter]").value = "";
	document.querySelector("[data-sort-filter]").value = "name-asc";
	updateRestaurantResults();
}

function initializeRestaurantPage() {
	const pageMount = document.querySelector("[data-restaurants-page]");
	if (!pageMount || typeof restaurants === "undefined") return;

	const queryCuisine = new URLSearchParams(window.location.search).get("cuisine") || "";
	const cuisines = [...new Set(restaurants.map((restaurant) => restaurant.cuisine))].sort();
	pageMount.innerHTML = `
		<section class="section" aria-labelledby="restaurants-page-title">
			<div class="container">
				<div class="section__header"><div><span class="eyebrow">Bominic's Pizza first</span><h1 id="restaurants-page-title">Restaurants near you</h1><p>Start with Bominic's Pizza in Palampur, then explore more demo kitchens.</p><p class="form__hint">Bominic's: Shop 7, HRTC Complex, Palampur · <a href="tel:+919988454540">+91 99884 54540</a></p></div><a class="button" href="menu.html?restaurant=rest-003">Order from Bominic's</a></div>
				<form class="form" data-restaurant-filters role="search">
					<div class="form__group"><label class="form__label" for="restaurant-search">Search restaurants</label><input class="input" id="restaurant-search" type="search" placeholder="Try a name, cuisine, or area" data-restaurant-search></div>
					<div class="restaurant-filter-grid">
						<div class="form__group"><label class="form__label" for="cuisine-filter">Cuisine</label><select class="select" id="cuisine-filter" data-cuisine-filter><option value="">All cuisines</option>${cuisines.map((cuisine) => `<option value="${escapeHtml(cuisine)}">${escapeHtml(cuisine)}</option>`).join("")}</select></div>
						<div class="form__group"><label class="form__label" for="rating-filter">Minimum rating</label><select class="select" id="rating-filter" data-rating-filter><option value="">Any rating</option><option value="4">4.0+ stars</option><option value="4.5">4.5+ stars</option><option value="4.8">4.8+ stars</option></select></div>
						<div class="form__group"><label class="form__label" for="price-filter">Price range</label><select class="select" id="price-filter" data-price-filter><option value="">Any price</option><option value="$">₹ · Budget</option><option value="$$">₹₹ · Mid-range</option><option value="$$$">₹₹₹ · Premium</option></select></div>
						<div class="form__group"><label class="form__label" for="sort-filter">Sort by</label><select class="select" id="sort-filter" data-sort-filter><option value="name-asc">Name A-Z</option><option value="rating-desc">Top rated</option><option value="delivery-asc">Fastest delivery</option></select></div>
					</div>
					<div class="restaurant-filter-actions"><button class="button button--secondary button--small" type="button" data-clear-filters>Clear filters</button><span class="form__hint" data-result-count aria-live="polite">Loading restaurants...</span></div>
				</form>
			</div>
		</section>
		<section class="section section--muted" aria-labelledby="results-title"><div class="container"><h2 id="results-title" class="sr-only">Restaurant results</h2><div class="restaurant-grid" data-restaurant-results><div class="loading" role="status">Loading restaurants...</div></div><div class="alert alert--info" data-restaurant-empty hidden><div><strong>No restaurants found</strong><p>Try a broader search or remove one of your filters.</p><button class="button button--small" type="button" data-clear-filters>Clear filters</button></div></div></div></section>`;

	if (queryCuisine) {
		const matchingCuisine = cuisines.find((cuisine) => cuisine.toLowerCase().includes(queryCuisine.toLowerCase()));
		if (matchingCuisine) pageMount.querySelector("[data-cuisine-filter]").value = matchingCuisine;
	}

	pageMount.querySelectorAll("[data-restaurant-filters] input, [data-restaurant-filters] select").forEach((control) => control.addEventListener("input", updateRestaurantResults));
	pageMount.querySelectorAll("[data-clear-filters]").forEach((button) => button.addEventListener("click", clearRestaurantFilters));
	updateRestaurantResults();
}

document.addEventListener("DOMContentLoaded", initializeRestaurantPage);
