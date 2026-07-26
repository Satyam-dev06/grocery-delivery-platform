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

/**
 * Fetch products with search, filters, sorting & pagination.
 * All params are optional.
 *
 * @param {Object} opts
 * @param {number} opts.page        - Page number (default: 1)
 * @param {number} opts.limit       - Items per page (default: 12)
 * @param {string} opts.search      - Search query
 * @param {string} opts.category    - Category filter
 * @param {string} opts.brand       - Brand filter
 * @param {number} opts.minPrice    - Minimum price
 * @param {number} opts.maxPrice    - Maximum price
 * @param {number} opts.rating      - Minimum rating
 * @param {string} opts.stock       - "in" or "out"
 * @param {string} opts.featured    - "true" to filter featured
 * @param {string} opts.trending    - "true" to filter trending
 * @param {string} opts.recommended - "true" to filter recommended
 * @param {string} opts.offers      - "true" to filter discounted items
 * @param {string} opts.sort        - Sort order
 * @returns {Promise<{products, pagination, filters}>}
 */
async function fetchProducts(opts) {
  opts = opts || {};
  var params = [];
  if (opts.page) params.push("page=" + opts.page);
  if (opts.limit) params.push("limit=" + opts.limit);
  if (opts.search) params.push("search=" + encodeURIComponent(opts.search));
  if (opts.category) params.push("category=" + encodeURIComponent(opts.category));
  if (opts.brand) params.push("brand=" + encodeURIComponent(opts.brand));
  if (opts.minPrice) params.push("minPrice=" + opts.minPrice);
  if (opts.maxPrice) params.push("maxPrice=" + opts.maxPrice);
  if (opts.rating) params.push("rating=" + opts.rating);
  if (opts.stock) params.push("stock=" + opts.stock);
  if (opts.featured) params.push("featured=" + opts.featured);
  if (opts.trending) params.push("trending=" + opts.trending);
  if (opts.recommended) params.push("recommended=" + opts.recommended);
  if (opts.offers) params.push("offers=" + opts.offers);
  if (opts.sort) params.push("sort=" + opts.sort);
  var qs = params.length > 0 ? "?" + params.join("&") : "";
  return await apiRequest("/products" + qs);
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

/**
 * Place a new order from the user's cart.
 * Sends addressId and paymentMethod — the backend reads
 * items from the cart, copies prices, and clears the cart.
 */
async function placeOrderAPI(addressId, paymentMethod) {
  return await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify({ addressId, paymentMethod }),
  });
}

/**
 * Get logged-in user's orders (summary list).
 */
async function fetchOrders() {
  return await apiRequest("/orders");
}

/**
 * Get a single order by ID with full details.
 */
async function fetchOrderById(orderId) {
  return await apiRequest("/orders/" + orderId);
}

/**
 * Cancel an order (only if Pending or Confirmed).
 */
async function cancelOrderAPI(orderId) {
  return await apiRequest("/orders/cancel/" + orderId, {
    method: "PUT",
  });
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

// ─── Address ───
async function addAddress(addressData) {
  return await apiRequest("/address", {
    method: "POST",
    body: JSON.stringify(addressData),
  });
}

async function fetchAddresses() {
  try {
    return await apiRequest("/address");
  } catch (e) {
    return [];
  }
}

async function fetchAddressById(id) {
  return await apiRequest("/address/" + id);
}

async function updateAddress(id, addressData) {
  return await apiRequest("/address/" + id, {
    method: "PUT",
    body: JSON.stringify(addressData),
  });
}

async function deleteAddress(id) {
  return await apiRequest("/address/" + id, {
    method: "DELETE",
  });
}

async function setDefaultAddress(id) {
  return await apiRequest("/address/default/" + id, {
    method: "PUT",
  });
}

// ─── Payment ───

/**
 * Create/process a payment for an existing order.
 * Used for UPI and Card payments after order creation.
 */
async function createPaymentAPI(orderId, paymentMethod) {
  return await apiRequest("/payment/create", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentMethod }),
  });
}

/**
 * Verify a payment by transaction ID.
 */
async function verifyPaymentAPI(transactionId) {
  return await apiRequest("/payment/verify", {
    method: "POST",
    body: JSON.stringify({ transactionId }),
  });
}

/**
 * Get payment details by order ID.
 */
async function fetchPaymentByOrder(orderId) {
  return await apiRequest("/payment/" + orderId);
}

// ─── Admin ───
async function adminFetchDashboard() {
  return await apiRequest("/admin/dashboard");
}

async function adminFetchUsers(page, search) {
  var params = "?page=" + (page || 1) + "&limit=20";
  if (search) params += "&search=" + encodeURIComponent(search);
  return await apiRequest("/admin/users" + params);
}

async function adminUpdateUser(id, data) {
  return await apiRequest("/admin/users/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function adminDeleteUser(id) {
  return await apiRequest("/admin/users/" + id, { method: "DELETE" });
}

async function adminFetchOrders(page, status) {
  var params = "?page=" + (page || 1) + "&limit=20";
  if (status) params += "&status=" + encodeURIComponent(status);
  return await apiRequest("/admin/orders" + params);
}

async function adminUpdateOrder(id, status) {
  return await apiRequest("/admin/orders/" + id, {
    method: "PUT",
    body: JSON.stringify({ orderStatus: status }),
  });
}

async function adminFetchPayments(page) {
  return await apiRequest("/admin/payments?page=" + (page || 1));
}

async function adminRefundPayment(orderId) {
  return await apiRequest("/admin/payments/refund/" + orderId, { method: "POST" });
}

async function adminFetchCoupons() {
  return await apiRequest("/admin/coupons");
}

async function adminCreateCoupon(data) {
  return await apiRequest("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function adminUpdateCoupon(id, data) {
  return await apiRequest("/admin/coupons/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function adminDeleteCoupon(id) {
  return await apiRequest("/admin/coupons/" + id, { method: "DELETE" });
}

async function adminFetchAnalytics() {
  return await apiRequest("/admin/analytics");
}

async function adminFetchSettings() {
  return await apiRequest("/admin/settings");
}

async function adminUpdateSettings(data) {
  return await apiRequest("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
