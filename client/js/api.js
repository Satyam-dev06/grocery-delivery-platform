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

/**
 * Normalize cart items from API format to flat format.
 *
 * API format:  { product: { _id, name, price, image, ... }, quantity }
 * Flat format: { _id, id, name, price, image, quantity }
 *
 * The frontend rendering code expects flat format. This normalizer
 * converts at the API boundary so localStorage and UI always get
 * the simple flat structure.
 */
function normalizeCartItems(items) {
  if (!items || !Array.isArray(items)) return [];
  return items.map(function (item) {
    // Check if item has nested product object (API format)
    if (item.product && typeof item.product === "object" && item.product._id) {
      return {
        _id: item.product._id,
        id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        oldPrice: item.product.oldPrice || 0,
        image: item.product.image,
        stock: item.product.stock,
        rating: item.product.rating || 0,
        quantity: item.quantity,
      };
    }
    // Already flat (localStorage format from non-logged-in adds)
    return item;
  });
}

async function fetchCart() {
  try {
    const data = await apiRequest("/cart");
    if (data && data.items) data.items = normalizeCartItems(data.items);
    return data;
  } catch (e) {
    return { items: [] };
  }
}

async function addToCartAPI(productId, quantity) {
  const data = await apiRequest("/cart", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  if (data && data.items) {
    data.items = normalizeCartItems(data.items);
  }
  return data;
}

async function updateCartItemAPI(productId, quantity) {
  const data = await apiRequest("/cart/" + productId, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
  if (data && data.items) {
    data.items = normalizeCartItems(data.items);
  }
  return data;
}

async function removeFromCartAPI(productId) {
  const data = await apiRequest("/cart/" + productId, {
    method: "DELETE",
  });
  if (data && data.items) {
    data.items = normalizeCartItems(data.items);
  }
  return data;
}

async function clearCartAPI() {
  const data = await apiRequest("/cart", {
    method: "DELETE",
  });
  if (data && data.items) {
    data.items = normalizeCartItems(data.items);
  }
  return data;
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
