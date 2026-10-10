function getProductFromQuery() {
	const productQuery = new URLSearchParams(window.location.search).get("id")
		|| new URLSearchParams(window.location.search).get("food");
	if (!productQuery || typeof foodItems === "undefined") return null;

	const exactProduct = foodItems.find((foodItem) => foodItem.id === productQuery);
	if (exactProduct) return exactProduct;

	const numericId = Number(productQuery);
	if (!Number.isInteger(numericId)) return null;
	return foodItems.find((foodItem) => foodItem.id === `food-${String(numericId).padStart(3, "0")}`)
		|| foodItems[numericId - 101]
		|| foodItems[numericId - 1];
}

function getWishlist() {
	return getWishlistItems();
}

const SUBMITTED_REVIEWS_STORAGE_KEY = "freshbiteSubmittedReviews";

function getSubmittedReviews() {
	try {
		const submittedReviews = JSON.parse(localStorage.getItem(SUBMITTED_REVIEWS_STORAGE_KEY) || "[]");
		return Array.isArray(submittedReviews) ? submittedReviews : [];
	} catch (error) {
		return [];
	}
}

function getProductReviews(product) {
	return [...reviews.filter((review) => review.foodItemId === product.id), ...getSubmittedReviews().filter((review) => review.foodItemId === product.id)];
}

function getAverageProductRating(product) {
	const productReviews = getProductReviews(product);
	if (productReviews.length === 0) return product.rating;
	return productReviews.reduce((total, review) => total + Number(review.rating), 0) / productReviews.length;
}

function renderProductReviews(product) {
	const productReviews = getProductReviews(product);
	if (productReviews.length === 0) return "<p>No reviews yet. Be the first to share your experience.</p>";

	return productReviews.map((review) => `
		<article class="review-card"><div class="rating" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div><blockquote>“${escapeHtml(review.comment)}”</blockquote><cite>${escapeHtml(review.customerName)} <span>· ${escapeHtml(review.date)}</span></cite></article>`).join("");
}

function renderProductRatingSummary(product) {
	const averageRating = getAverageProductRating(product);
	const reviewCount = getProductReviews(product).length;
	return `<span class="rating" aria-label="${averageRating.toFixed(1)} out of 5 stars">★ ${averageRating.toFixed(1)}</span><span>${reviewCount} review${reviewCount === 1 ? "" : "s"}</span>`;
}

function submitProductReview(product, form) {
	const submittedReviews = getSubmittedReviews();
	submittedReviews.unshift({
		id: `review-${Date.now()}`,
		foodItemId: product.id,
		restaurantId: product.restaurantId,
		customerName: form.customerName.value.trim(),
		rating: Number(form.rating.value),
		comment: form.comment.value.trim(),
		date: new Date().toISOString().slice(0, 10),
		verifiedOrder: false,
		simulated: true
	});
	localStorage.setItem(SUBMITTED_REVIEWS_STORAGE_KEY, JSON.stringify(submittedReviews));
	form.reset();
	document.querySelector("[data-product-rating]").innerHTML = renderProductRatingSummary(product);
	document.querySelector("[data-product-reviews]").innerHTML = renderProductReviews(product);
	const status = document.querySelector("[data-review-status]");
	status.textContent = "Thanks for sharing. Your review was saved as a frontend simulation.";
	status.className = "form__hint alert--success";
}

function addProductToCart(product) {
	const quantity = Math.max(1, Number(document.querySelector("[data-product-quantity]").value));
	const cart = getStoredCart();
	const existingItem = cart.find((item) => item.foodItemId === product.id || item.id === product.id);
	if (existingItem) {
		existingItem.foodItemId = product.id;
		existingItem.quantity = Number(existingItem.quantity || 0) + quantity;
	} else {
		cart.push({ foodItemId: product.id, quantity });
	}
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
	updateCartCount();
	const button = document.querySelector("[data-product-add]");
	button.textContent = "Added to cart";
	button.classList.add("button--secondary");
}

function toggleWishlist(product) {
	const button = document.querySelector("[data-product-wishlist]");
	if (toggleWishlistItem(product.id)) {
		button.textContent = "♥ Saved to wishlist";
		button.classList.add("button--secondary");
	} else {
		button.textContent = "♡ Add to wishlist";
		button.classList.remove("button--secondary");
	}
}

function renderInvalidProduct(pageMount) {
	pageMount.innerHTML = `<section class="section"><div class="container"><div class="alert alert--warning"><div><h1>We could not find that dish</h1><p>The product link may be invalid or out of date. Browse the menu to find something delicious.</p><a class="button" href="restaurants.html">Explore restaurants</a></div></div></div></section>`;
}

function initializeProductPage() {
	const pageMount = document.querySelector("[data-product-page]");
	if (!pageMount || typeof foodItems === "undefined" || typeof restaurants === "undefined" || typeof reviews === "undefined") return;

	const product = getProductFromQuery();
	if (!product) {
		renderInvalidProduct(pageMount);
		return;
	}

	const restaurant = restaurants.find((item) => item.id === product.restaurantId);
	const wishlistSaved = getWishlist().includes(product.id);
	pageMount.innerHTML = `
		<section class="section" aria-labelledby="product-title"><div class="container"><a class="button button--ghost button--small" href="menu.html?restaurant=${encodeURIComponent(product.restaurantId)}">← Back to menu</a><div class="card product-detail"><img class="card__image product-detail__image" src="${product.image}" alt="${escapeHtml(product.name)}" fetchpriority="high"><div class="card__body"><div class="food-card__meta"><span class="badge ${product.dietaryType === "Vegan" ? "badge--success" : product.dietaryType === "Non-Veg" ? "badge--warning" : ""}">${escapeHtml(product.dietaryType)}</span><span class="food-card__meta" data-product-rating>${renderProductRatingSummary(product)}</span></div><h1 id="product-title">${escapeHtml(product.name)}</h1><p><a href="menu.html?restaurant=${encodeURIComponent(product.restaurantId)}">${restaurant ? escapeHtml(restaurant.name) : "FreshBite restaurant"}</a></p><p>${escapeHtml(product.description)}</p><strong class="food-card__price">₹${product.price}</strong><div class="product-detail__actions"><div class="quantity-control"><label class="form__label" for="product-quantity">Quantity</label><div><button class="button button--secondary button--small" type="button" data-quantity-decrease aria-label="Decrease quantity">−</button><input id="product-quantity" data-product-quantity type="number" min="1" max="20" value="1" inputmode="numeric" aria-label="Quantity"><button class="button button--secondary button--small" type="button" data-quantity-increase aria-label="Increase quantity">+</button></div></div><button class="button" type="button" data-product-add>Add to Cart</button><button class="button button--ghost" type="button" data-product-wishlist>${wishlistSaved ? "♥ Saved to wishlist" : "♡ Add to wishlist"}</button></div></div></div></div></section>
		<section class="section section--muted" aria-labelledby="product-info-title"><div class="container"><div class="section__header"><div><span class="eyebrow">Know your meal</span><h2 id="product-info-title">Ingredients & nutrition</h2></div></div><div class="product-info-grid"><article class="card"><div class="card__body"><h3>Ingredients</h3><p>${product.ingredients.map((ingredient) => escapeHtml(ingredient)).join(" · ")}</p></div></article><article class="card"><div class="card__body"><h3>Nutritional information</h3><p><strong>${product.calories} kcal</strong> per serving</p><p class="form__hint">Nutrition values are estimates and may vary by preparation.</p></div></article></div></div></section>
		<section class="section" aria-labelledby="product-reviews-title"><div class="container"><div class="section__header"><div><span class="eyebrow">From the community</span><h2 id="product-reviews-title">Customer reviews</h2></div></div><div class="review-grid" data-product-reviews>${renderProductReviews(product)}</div><form class="form card review-form" data-review-form novalidate><div class="card__body"><h3>Share your experience</h3><p class="form__hint alert alert--info">Reviews are saved locally as a frontend simulation. They are not sent to a server.</p><div class="form__group"><label class="form__label" for="review-name">Your name</label><input class="input" id="review-name" name="customerName" type="text" required></div><div class="form__group"><label class="form__label" for="review-rating">Rating</label><select class="select" id="review-rating" name="rating" required><option value="">Choose a rating</option><option value="5">5 - Excellent</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Needs improvement</option><option value="1">1 - Poor</option></select></div><div class="form__group"><label class="form__label" for="review-comment">Review</label><textarea class="textarea" id="review-comment" name="comment" minlength="10" required></textarea></div><p class="form__hint" data-review-status aria-live="polite"></p><button class="button" type="submit">Submit simulated review</button></div></form></div></section>`;

	const quantityInput = pageMount.querySelector("[data-product-quantity]");
	pageMount.querySelector("[data-quantity-decrease]").addEventListener("click", () => { quantityInput.value = Math.max(1, Number(quantityInput.value) - 1); });
	pageMount.querySelector("[data-quantity-increase]").addEventListener("click", () => { quantityInput.value = Math.min(20, Number(quantityInput.value) + 1); });
	pageMount.querySelector("[data-product-add]").addEventListener("click", () => addProductToCart(product));
	pageMount.querySelector("[data-product-wishlist]").addEventListener("click", () => toggleWishlist(product));
	pageMount.querySelector("[data-review-form]").addEventListener("submit", (event) => {
		event.preventDefault();
		if (!event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
		submitProductReview(product, event.currentTarget);
	});
}

document.addEventListener("DOMContentLoaded", initializeProductPage);
