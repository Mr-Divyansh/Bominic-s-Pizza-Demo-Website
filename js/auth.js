const USERS_STORAGE_KEY = "freshbiteUsers";
const SESSION_STORAGE_KEY = "freshbiteUser";
const REMEMBERED_USER_KEY = "freshbiteRememberedUser";
const SESSION_ONLY_USER_KEY = "freshbiteSessionUser";

function getRegisteredUsers() {
	try {
		const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
		return Array.isArray(users) ? users : [];
	} catch (error) {
		return [];
	}
}

function saveRegisteredUsers(users) {
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function registerUser(name, email, password, confirmPassword) {
	const normalizedEmail = email.trim().toLowerCase();
	if (!name.trim() || !normalizedEmail || !password || !confirmPassword) return { success: false, message: "Please complete every field." };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { success: false, message: "Enter a valid email address." };
	if (password.length < 6) return { success: false, message: "Password must be at least 6 characters." };
	if (password !== confirmPassword) return { success: false, message: "Passwords do not match." };

	const users = getRegisteredUsers();
	if (users.some((user) => user.email === normalizedEmail)) return { success: false, message: "An account with that email already exists." };
	const user = { id: `user-${Date.now()}`, name: name.trim(), email: normalizedEmail, password };
	users.push(user);
	saveRegisteredUsers(users);
	return { success: true, user: { id: user.id, name: user.name, email: user.email } };
}

function loginUser(email, password, rememberLogin) {
	const normalizedEmail = email.trim().toLowerCase();
	const user = getRegisteredUsers().find((registeredUser) => registeredUser.email === normalizedEmail && registeredUser.password === password);
	if (!user) return { success: false, message: "Email or password is incorrect." };

	const sessionUser = { id: user.id, name: user.name, email: user.email };
	if (rememberLogin) {
		localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(sessionUser));
		sessionStorage.removeItem(SESSION_ONLY_USER_KEY);
	} else {
		sessionStorage.setItem(SESSION_ONLY_USER_KEY, JSON.stringify(sessionUser));
		localStorage.removeItem(REMEMBERED_USER_KEY);
	}
	localStorage.removeItem(SESSION_STORAGE_KEY);
	return { success: true, user: sessionUser };
}

function getCurrentUser() {
	try {
		const currentUser = JSON.parse(localStorage.getItem(REMEMBERED_USER_KEY) || sessionStorage.getItem(SESSION_ONLY_USER_KEY) || localStorage.getItem(SESSION_STORAGE_KEY) || "null");
		return currentUser && currentUser.email ? currentUser : null;
	} catch (error) {
		return null;
	}
}

function isLoggedIn() {
	return Boolean(getCurrentUser());
}

function logoutUser() {
	localStorage.removeItem(SESSION_STORAGE_KEY);
	localStorage.removeItem(REMEMBERED_USER_KEY);
	sessionStorage.removeItem(SESSION_ONLY_USER_KEY);
}

function renderAuthPage() {
	const authMount = document.querySelector("[data-auth-page]");
	if (!authMount) return;
	const mode = authMount.dataset.authPage;
	const isRegister = mode === "register";
	authMount.innerHTML = `<section class="section"><div class="container"><div class="card auth-card"><div class="card__body"><span class="eyebrow">Bominic's Pizza account</span><h1>${isRegister ? "Create your account" : "Welcome back"}</h1><p>${isRegister ? "Save your favourites and keep every order in one place." : "Log in to see your account and order history."}</p><p class="form__hint alert alert--info">This is a frontend demo simulation. It is not secure authentication.</p><form class="form" data-auth-form novalidate>${isRegister ? `<div class="form__group"><label class="form__label" for="auth-name">Name</label><input class="input" id="auth-name" name="name" type="text" autocomplete="name" required></div>` : ""}<div class="form__group"><label class="form__label" for="auth-email">Email</label><input class="input" id="auth-email" name="email" type="email" autocomplete="email" required></div><div class="form__group"><label class="form__label" for="auth-password">Password</label><input class="input" id="auth-password" name="password" type="password" minlength="6" autocomplete="${isRegister ? "new-password" : "current-password"}" required></div>${isRegister ? `<div class="form__group"><label class="form__label" for="auth-confirm-password">Confirm password</label><input class="input" id="auth-confirm-password" name="confirmPassword" type="password" minlength="6" autocomplete="new-password" required></div>` : `<label><input type="checkbox" name="rememberLogin"> Remember me</label>`}<p class="form__hint" data-auth-message aria-live="polite"></p><button class="button" type="submit">${isRegister ? "Create account" : "Log in"}</button></form><p>${isRegister ? "Already have an account?" : "New to Bominic's?"} <a href="${isRegister ? "login.html" : "register.html"}">${isRegister ? "Log in" : "Register"}</a></p></div></div></div></section>`;

	const form = authMount.querySelector("[data-auth-form]");
	const message = authMount.querySelector("[data-auth-message]");
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		const result = isRegister
			? registerUser(form.name.value, form.email.value, form.password.value, form.confirmPassword.value)
			: loginUser(form.email.value, form.password.value, form.rememberLogin.checked);
		if (!result.success) {
			message.textContent = result.message;
			message.className = "form__hint alert--danger";
			return;
		}
		if (isRegister) {
			message.textContent = "Account created. You can now log in.";
			message.className = "form__hint alert--success";
			form.reset();
			return;
		}
		window.location.href = "account.html";
	});
}

document.addEventListener("DOMContentLoaded", renderAuthPage);
