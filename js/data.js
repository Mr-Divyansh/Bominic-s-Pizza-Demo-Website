const restaurants = [
	{
		id: "rest-001",
		name: "The Spice Route",
		image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
		cuisine: "North Indian",
		rating: 4.8,
		priceRange: "$$",
		deliveryTime: "25-35 min",
		description: "Fragrant curries, tandoor favourites, and family recipes from across North India.",
		location: "Indiranagar",
		featured: true
	},
	{
		id: "rest-002",
		name: "Green Bowl Co.",
		image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
		cuisine: "Healthy and Vegan",
		rating: 4.7,
		priceRange: "$$",
		deliveryTime: "20-30 min",
		description: "Colourful grain bowls, cold-pressed drinks, and nourishing plant-based plates.",
		location: "Koramangala",
		featured: true
	},
	{
		id: "rest-003",
		name: "Crust & Craft",
		image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
		cuisine: "Italian Pizza",
		rating: 4.6,
		priceRange: "$$",
		deliveryTime: "30-40 min",
		description: "Hand-stretched sourdough pizzas baked hot with seasonal ingredients and bold sauces.",
		location: "HSR Layout",
		featured: true
	},
	{
		id: "rest-004",
		name: "Burger Foundry",
		image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
		cuisine: "Burgers and American",
		rating: 4.5,
		priceRange: "$$",
		deliveryTime: "25-35 min",
		description: "Smash-grilled burgers, crisp fries, and thick shakes made for comfort-food cravings.",
		location: "Whitefield",
		featured: false
	},
	{
		id: "rest-005",
		name: "Sushi Zen",
		image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
		cuisine: "Japanese",
		rating: 4.7,
		priceRange: "$$$",
		deliveryTime: "35-45 min",
		description: "Delicate sushi, comforting ramen, and Japanese small plates prepared to order.",
		location: "Jayanagar",
		featured: false
	},
	{
		id: "rest-006",
		name: "Dosa District",
		image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
		cuisine: "South Indian",
		rating: 4.8,
		priceRange: "$",
		deliveryTime: "20-30 min",
		description: "Crisp dosas, fluffy idlis, and robust filter coffee inspired by South Indian kitchens.",
		location: "Malleshwaram",
		featured: true
	},
	{
		id: "rest-007",
		name: "Coastal Catch",
		image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=900&q=80",
		cuisine: "Coastal Seafood",
		rating: 4.4,
		priceRange: "$$$",
		deliveryTime: "35-45 min",
		description: "Fresh seafood, coastal masalas, and rice dishes with a breezy Konkan influence.",
		location: "Marathahalli",
		featured: false
	},
	{
		id: "rest-008",
		name: "The Sweet Room",
		image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
		cuisine: "Desserts and Bakery",
		rating: 4.6,
		priceRange: "$$",
		deliveryTime: "20-30 min",
		description: "Small-batch cakes, baked treats, and indulgent desserts for every sweet occasion.",
		location: "Sadashivanagar",
		featured: false
	}
];

const foodItems = [
	{
		id: "food-001", restaurantId: "rest-001", name: "Paneer Tikka", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=80", description: "Smoky cottage cheese with peppers and onion from the clay oven.", price: 249, category: "Starters", dietaryType: "Veg", ingredients: ["Paneer", "Bell pepper", "Onion", "Yogurt", "Tandoori spices"], calories: 320, rating: 4.8, featured: true
	},
	{
		id: "food-002", restaurantId: "rest-001", name: "Butter Chicken", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80", description: "Tender chicken in a silky tomato, butter, and fenugreek gravy.", price: 329, category: "Main Course", dietaryType: "Non-Veg", ingredients: ["Chicken", "Tomato", "Butter", "Cream", "Fenugreek"], calories: 540, rating: 4.9, featured: true
	},
	{
		id: "food-003", restaurantId: "rest-001", name: "Lucknowi Chicken Biryani", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=80", description: "Long-grain basmati layered with saffron chicken and gentle whole spices.", price: 359, category: "Biryani", dietaryType: "Non-Veg", ingredients: ["Basmati rice", "Chicken", "Saffron", "Mint", "Whole spices"], calories: 620, rating: 4.7, featured: false
	},
	{
		id: "food-004", restaurantId: "rest-002", name: "Harvest Buddha Bowl", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80", description: "Quinoa, roasted vegetables, chickpeas, greens, and lemon-tahini dressing.", price: 289, category: "Main Course", dietaryType: "Vegan", ingredients: ["Quinoa", "Chickpeas", "Broccoli", "Sweet potato", "Tahini"], calories: 410, rating: 4.8, featured: true
	},
	{
		id: "food-005", restaurantId: "rest-002", name: "Avocado Toast", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=700&q=80", description: "Sourdough toast with smashed avocado, seeds, tomato, and herbs.", price: 219, category: "Starters", dietaryType: "Vegan", ingredients: ["Sourdough", "Avocado", "Tomato", "Pumpkin seeds", "Herbs"], calories: 360, rating: 4.5, featured: false
	},
	{
		id: "food-006", restaurantId: "rest-002", name: "Mango Chia Pudding", image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=700&q=80", description: "Coconut chia pudding layered with fresh Alphonso mango.", price: 179, category: "Desserts", dietaryType: "Vegan", ingredients: ["Chia seeds", "Coconut milk", "Mango", "Maple syrup"], calories: 230, rating: 4.6, featured: false
	},
	{
		id: "food-007", restaurantId: "rest-003", name: "Margherita Sourdough Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80", description: "San Marzano tomato, fresh mozzarella, basil, and olive oil.", price: 349, category: "Pizza", dietaryType: "Veg", ingredients: ["Sourdough", "Tomato", "Mozzarella", "Basil", "Olive oil"], calories: 680, rating: 4.8, featured: true
	},
	{
		id: "food-008", restaurantId: "rest-003", name: "Truffle Mushroom Pizza", image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80", description: "Roasted mushrooms, caramelized onion, mozzarella, and truffle oil.", price: 429, category: "Pizza", dietaryType: "Veg", ingredients: ["Mushrooms", "Onion", "Mozzarella", "Truffle oil", "Thyme"], calories: 720, rating: 4.7, featured: false
	},
	{
		id: "food-009", restaurantId: "rest-003", name: "Basil Pesto Pasta", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=80", description: "Al dente penne tossed in basil pesto with cherry tomatoes.", price: 299, category: "Main Course", dietaryType: "Veg", ingredients: ["Penne", "Basil", "Pine nuts", "Parmesan", "Cherry tomato"], calories: 590, rating: 4.6, featured: false
	},
	{
		id: "food-010", restaurantId: "rest-004", name: "Classic Smash Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80", description: "Double smashed beef patties, cheddar, pickles, and house sauce.", price: 319, category: "Burgers", dietaryType: "Non-Veg", ingredients: ["Beef patty", "Cheddar", "Pickles", "Lettuce", "House sauce"], calories: 780, rating: 4.7, featured: true
	},
	{
		id: "food-011", restaurantId: "rest-004", name: "Crispy Chicken Burger", image: "https://images.unsplash.com/photo-1615297928064-24977384d0d1?auto=format&fit=crop&w=700&q=80", description: "Crunchy fried chicken, slaw, jalapeno mayo, and a toasted bun.", price: 299, category: "Burgers", dietaryType: "Non-Veg", ingredients: ["Chicken", "Cabbage", "Jalapeno", "Mayo", "Brioche bun"], calories: 690, rating: 4.5, featured: false
	},
	{
		id: "food-012", restaurantId: "rest-004", name: "Cocoa Thick Shake", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=80", description: "Rich chocolate shake topped with whipped cream and cocoa crumbs.", price: 189, category: "Beverages", dietaryType: "Veg", ingredients: ["Milk", "Cocoa", "Vanilla ice cream", "Whipped cream"], calories: 480, rating: 4.4, featured: false
	},
	{
		id: "food-013", restaurantId: "rest-005", name: "Salmon Sushi Platter", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=700&q=80", description: "Six pieces of fresh salmon nigiri and maki with soy and wasabi.", price: 599, category: "Main Course", dietaryType: "Non-Veg", ingredients: ["Salmon", "Sushi rice", "Nori", "Soy sauce", "Wasabi"], calories: 430, rating: 4.8, featured: true
	},
	{
		id: "food-014", restaurantId: "rest-005", name: "Vegetable Gyoza", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=700&q=80", description: "Pan-seared dumplings filled with cabbage, carrot, and shiitake.", price: 259, category: "Starters", dietaryType: "Vegan", ingredients: ["Cabbage", "Carrot", "Shiitake", "Gyoza wrapper", "Ginger"], calories: 290, rating: 4.6, featured: false
	},
	{
		id: "food-015", restaurantId: "rest-005", name: "Miso Ramen", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80", description: "Springy noodles in miso broth with corn, greens, and a soft egg.", price: 379, category: "Main Course", dietaryType: "Veg", ingredients: ["Noodles", "Miso", "Corn", "Spinach", "Egg"], calories: 510, rating: 4.7, featured: false
	},
	{
		id: "food-016", restaurantId: "rest-006", name: "Masala Dosa", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80", description: "Golden rice crepe filled with spiced potato, served with chutney and sambar.", price: 149, category: "Main Course", dietaryType: "Veg", ingredients: ["Rice", "Urad dal", "Potato", "Mustard seeds", "Curry leaves"], calories: 390, rating: 4.9, featured: true
	},
	{
		id: "food-017", restaurantId: "rest-006", name: "Podi Idli", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80", description: "Soft steamed idlis tossed in house podi and sesame oil.", price: 129, category: "Starters", dietaryType: "Vegan", ingredients: ["Rice", "Urad dal", "Lentil podi", "Sesame oil"], calories: 260, rating: 4.7, featured: false
	},
	{
		id: "food-018", restaurantId: "rest-006", name: "Filter Coffee", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80", description: "Strong South Indian filter coffee with frothy milk.", price: 89, category: "Beverages", dietaryType: "Veg", ingredients: ["Coffee", "Milk", "Jaggery"], calories: 110, rating: 4.8, featured: false
	},
	{
		id: "food-019", restaurantId: "rest-007", name: "Mangalorean Fish Curry", image: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=700&q=80", description: "Catch of the day simmered in tangy coconut and red chilli gravy.", price: 389, category: "Main Course", dietaryType: "Non-Veg", ingredients: ["Fish", "Coconut", "Tamarind", "Red chilli", "Curry leaves"], calories: 460, rating: 4.6, featured: true
	},
	{
		id: "food-020", restaurantId: "rest-007", name: "Prawn Ghee Roast", image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=700&q=80", description: "Juicy prawns coated in a deep, aromatic coastal masala.", price: 449, category: "Starters", dietaryType: "Non-Veg", ingredients: ["Prawns", "Ghee", "Kashmiri chilli", "Garlic", "Tamarind"], calories: 390, rating: 4.7, featured: false
	},
	{
		id: "food-021", restaurantId: "rest-007", name: "Tender Coconut Cooler", image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=700&q=80", description: "Refreshing tender coconut water blended with lime and mint.", price: 119, category: "Beverages", dietaryType: "Vegan", ingredients: ["Tender coconut", "Lime", "Mint"], calories: 70, rating: 4.5, featured: false
	},
	{
		id: "food-022", restaurantId: "rest-008", name: "Belgian Chocolate Cake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80", description: "Moist chocolate sponge layered with dark chocolate ganache.", price: 249, category: "Desserts", dietaryType: "Veg", ingredients: ["Flour", "Cocoa", "Dark chocolate", "Butter", "Eggs"], calories: 520, rating: 4.8, featured: true
	},
	{
		id: "food-023", restaurantId: "rest-008", name: "Strawberry Cheesecake", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=80", description: "Creamy baked cheesecake finished with strawberry compote.", price: 279, category: "Desserts", dietaryType: "Veg", ingredients: ["Cream cheese", "Biscuit", "Strawberry", "Sugar", "Butter"], calories: 470, rating: 4.7, featured: false
	},
	{
		id: "food-024", restaurantId: "rest-008", name: "Pistachio Baklava", image: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=700&q=80", description: "Flaky filo pastry layered with pistachio and orange blossom syrup.", price: 199, category: "Desserts", dietaryType: "Veg", ingredients: ["Filo pastry", "Pistachio", "Walnut", "Honey", "Orange blossom"], calories: 390, rating: 4.5, featured: false
	},
	{
		id: "food-025", restaurantId: "rest-008", name: "Classic Lemon Tart", image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=700&q=80", description: "Buttery pastry shell with bright lemon curd and toasted meringue.", price: 189, category: "Desserts", dietaryType: "Veg", ingredients: ["Flour", "Lemon", "Eggs", "Butter", "Sugar"], calories: 350, rating: 4.6, featured: false
	}
];

const restaurantCategories = [
	{ id: "restaurant-cat-001", name: "All Restaurants", type: "restaurant", icon: "utensils" },
	{ id: "restaurant-cat-002", name: "North Indian", type: "restaurant", icon: "bowl" },
	{ id: "restaurant-cat-003", name: "South Indian", type: "restaurant", icon: "dosa" },
	{ id: "restaurant-cat-004", name: "Pizza", type: "restaurant", icon: "pizza" },
	{ id: "restaurant-cat-005", name: "Burgers", type: "restaurant", icon: "burger" },
	{ id: "restaurant-cat-006", name: "Healthy", type: "restaurant", icon: "leaf" },
	{ id: "restaurant-cat-007", name: "Desserts", type: "restaurant", icon: "cake" }
];

const foodCategories = [
	{ id: "food-cat-001", name: "All Food", type: "food" },
	{ id: "food-cat-002", name: "Starters", type: "food" },
	{ id: "food-cat-003", name: "Main Course", type: "food" },
	{ id: "food-cat-004", name: "Biryani", type: "food" },
	{ id: "food-cat-005", name: "Pizza", type: "food" },
	{ id: "food-cat-006", name: "Burgers", type: "food" },
	{ id: "food-cat-007", name: "Desserts", type: "food" },
	{ id: "food-cat-008", name: "Beverages", type: "food" }
];

const specialOffers = [
	{ id: "offer-001", code: "WELCOME100", title: "Welcome treat", description: "Get Rs. 100 off on your first order above Rs. 499.", discountType: "fixed", discountValue: 100, minimumOrder: 499, maximumDiscount: 100, expiresOn: "2026-12-31", active: true },
	{ id: "offer-002", code: "FRESH20", title: "FreshBite favourite", description: "Save 20% on orders above Rs. 699, up to Rs. 150.", discountType: "percentage", discountValue: 20, minimumOrder: 699, maximumDiscount: 150, expiresOn: "2026-10-31", active: true },
	{ id: "offer-003", code: "VEGGIE50", title: "Veggie celebration", description: "Get Rs. 50 off when your cart includes two vegetarian dishes.", discountType: "fixed", discountValue: 50, minimumOrder: 399, maximumDiscount: 50, expiresOn: "2026-09-30", active: true },
	{ id: "offer-004", code: "LUNCH15", title: "Lunch hour savings", description: "Enjoy 15% off between 12:00 PM and 3:00 PM.", discountType: "percentage", discountValue: 15, minimumOrder: 299, maximumDiscount: 100, expiresOn: "2026-09-15", active: true }
];

const reviews = [
	{ id: "review-001", restaurantId: "rest-001", foodItemId: "food-002", customerName: "Aarav Mehta", rating: 5, comment: "The butter chicken was rich without being too heavy, and it arrived piping hot.", date: "2026-08-18", verifiedOrder: true },
	{ id: "review-002", restaurantId: "rest-002", foodItemId: "food-004", customerName: "Nisha Rao", rating: 5, comment: "Fresh, colourful, and filling. The lemon-tahini dressing is excellent.", date: "2026-08-16", verifiedOrder: true },
	{ id: "review-003", restaurantId: "rest-003", foodItemId: "food-007", customerName: "Kabir Shah", rating: 4, comment: "Lovely crust and bright tomato flavour. A little more basil would be perfect.", date: "2026-08-12", verifiedOrder: true },
	{ id: "review-004", restaurantId: "rest-004", foodItemId: "food-010", customerName: "Meera Iyer", rating: 5, comment: "Juicy smash patties and perfectly crisp fries. Great comfort food.", date: "2026-08-10", verifiedOrder: true },
	{ id: "review-005", restaurantId: "rest-005", foodItemId: "food-015", customerName: "Rohan Das", rating: 4, comment: "The ramen broth was deeply savoury and the vegetables were fresh.", date: "2026-08-07", verifiedOrder: true },
	{ id: "review-006", restaurantId: "rest-006", foodItemId: "food-016", customerName: "Ananya Pillai", rating: 5, comment: "Crisp dosa, generous masala, and the chutney had just the right heat.", date: "2026-08-05", verifiedOrder: true },
	{ id: "review-007", restaurantId: "rest-008", foodItemId: "food-022", customerName: "Vikram Singh", rating: 5, comment: "The cake was moist, glossy, and not overly sweet. Will order again.", date: "2026-08-02", verifiedOrder: true }
];
