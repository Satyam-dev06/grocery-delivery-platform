const cartItems = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");
const totalItems = document.getElementById("totalItems");
const cartContainer = document.getElementById("cartContainer");
const emptyCart = document.getElementById("emptyCart");

let cart = [];

// Local toast (no dependency on app.js)
function showToast(message) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2000);
  } else {
    alert(message);
  }
}

// Extract product ID from cart item (handles both API populated and localStorage formats)
function getItemId(item) {
  // API populated cart: item.product is an object with _id (Mongoose serializes ObjectId to string in JSON)
  if (item.product && typeof item.product === 'object' && item.product._id) {
    return item.product._id;
  }
  // API raw cart: item.product is a string ID
  if (item.product && typeof item.product === 'string') {
    return item.product;
  }
  // localStorage flat cart: item has _id or id
  return item._id || item.id;
}

// Render cart items
function renderCart() {
  if (!cartItems) return;

  if (cart.length === 0) {
    if (cartContainer) cartContainer.style.display = "none";
    if (emptyCart) emptyCart.style.display = "block";
    cartItems.innerHTML = "";
    if (totalPrice) totalPrice.textContent = "0";
    if (totalItems) totalItems.textContent = "0";
    updateCartBadge();
    return;
  }

  if (cartContainer) cartContainer.style.display = "block";
  if (emptyCart) emptyCart.style.display = "none";

  cartItems.innerHTML = "";
  let subtotal = 0;
  let count = 0;

  cart.forEach(function (product) {
    const lineTotal = product.price * product.quantity;
    subtotal += lineTotal;
    count += product.quantity;
    const id = getItemId(product);
    cartItems.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <div class="cart-item-details">
          <h3>${product.name}</h3>
          <p class="cart-item-price">₹${product.price} × ${product.quantity}</p>
          <p class="cart-item-subtotal">Subtotal: ₹${lineTotal}</p>
        </div>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity('${id}')">−</button>
          <span>${product.quantity}</span>
          <button onclick="increaseQuantity('${id}')">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem('${id}')">✕ Remove</button>
      </div>`;
  });

  if (totalPrice) totalPrice.textContent = subtotal;
  if (totalItems) totalItems.textContent = count;
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = cart.length;
}

function findCartItem(id) {
  return cart.find(function (p) {
    return getItemId(p) === id;
  });
}

async function increaseQuantity(id) {
  if (isLoggedIn()) {
    try {
      const item = findCartItem(id);
      if (item) {
        const updated = await updateCartItemAPI(id, item.quantity + 1);
        cart = updated.items || [];
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    const item = findCartItem(id);
    if (item) {
      item.quantity++;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  }
}

async function decreaseQuantity(id) {
  if (isLoggedIn()) {
    try {
      const item = findCartItem(id);
      if (item && item.quantity > 1) {
        const updated = await updateCartItemAPI(id, item.quantity - 1);
        cart = updated.items || [];
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    const item = findCartItem(id);
    if (item && item.quantity > 1) {
      item.quantity--;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  }
}

async function removeItem(id) {
  if (isLoggedIn()) {
    try {
      const updated = await removeFromCartAPI(id);
      cart = updated.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    cart = cart.filter(function (p) { return getItemId(p) !== id; });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  }
}

async function clearCart() {
  if (isLoggedIn()) {
    try {
      await clearCartAPI();
      cart = [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Cart cleared");
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast("Cart cleared");
  }
}

// Load cart
(async function loadCart() {
  if (isLoggedIn()) {
    try {
      const data = await fetchCart();
      cart = data.items || [];
      // Sync API cart to localStorage for checkout page compatibility
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) { cart = []; }
  } else {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  }
  renderCart();
})();
