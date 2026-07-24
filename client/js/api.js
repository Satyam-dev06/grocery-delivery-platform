const API_BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

function isLoggedIn() {
  return !!getToken();
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: "Bearer " + token } : {};
}

async function apiRequest(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

// ─── Auth ───
async function registerUser(name, email, password, phone, address) {
  const data = await apiRequest("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone, address }),
  });
  if (data.token) setToken(data.token);
  return data;
}

async function loginUser(email, password) {
  const data = await apiRequest("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) setToken(data.token);
  return data;
}

async function getUserProfile() {
  return await apiRequest("/users/profile");
}

function logoutUser() {
  removeToken();
  localStorage.removeItem("cart");
  localStorage.removeItem("orders");
  window.location.href = "login.html";
}

// ─── Products ───
async function fetchProducts() {
  return await apiRequest("/products");
}

// ─── Cart ───
async function fetchCart() {
  try {
    return await apiRequest("/cart");
  } catch (e) {
    return { items: [] };
  }
}

async function addToCartAPI(productId, quantity) {
  return await apiRequest("/cart", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

async function updateCartItemAPI(productId, quantity) {
  return await apiRequest("/cart/" + productId, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

async function removeFromCartAPI(productId) {
  return await apiRequest("/cart/" + productId, {
    method: "DELETE",
  });
}

// ─── Orders ───
async function createOrder(orderData) {
  return await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

async function fetchOrders() {
  return await apiRequest("/orders");
}

// ─── Wishlist ───
async function addToWishlistAPI(productId) {
  return await apiRequest("/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

async function fetchWishlistAPI() {
  try {
    return await apiRequest("/wishlist");
  } catch (e) {
    return [];
  }
}

async function removeFromWishlistAPI(productId) {
  return await apiRequest("/wishlist/" + productId, {
    method: "DELETE",
  });
}

async function clearWishlistAPI() {
  return await apiRequest("/wishlist", {
    method: "DELETE",
  });
}
