const cartItems = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");

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

// Render cart items
function renderCart() {
  if (!cartItems) return;
  cartItems.innerHTML = "";
  if (cart.length === 0) {
    cartItems.innerHTML = '<h2>Your Cart is Empty</h2>';
    if (totalPrice) totalPrice.textContent = "0";
    updateCartBadge();
    return;
  }
  let total = 0;
  cart.forEach(function (product) {
    total += product.price * product.quantity;
    const id = product._id || product.product || product.id;
    cartItems.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity('${id}')">-</button>
          <span>${product.quantity}</span>
          <button onclick="increaseQuantity('${id}')">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem('${id}')">Remove</button>
      </div>`;
  });
  if (totalPrice) totalPrice.textContent = total;
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = cart.length;
}

async function increaseQuantity(id) {
  if (isLoggedIn()) {
    try {
      const item = cart.find(function (p) { return (p._id || p.product || p.id) === id; });
      if (item) {
        const updated = await updateCartItemAPI(id, item.quantity + 1);
        cart = updated.items || [];
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    const item = cart.find(function (p) { return (p._id || p.product || p.id) === id; });
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
      const item = cart.find(function (p) { return (p._id || p.product || p.id) === id; });
      if (item && item.quantity > 1) {
        const updated = await updateCartItemAPI(id, item.quantity - 1);
        cart = updated.items || [];
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    const item = cart.find(function (p) { return (p._id || p.product || p.id) === id; });
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
      renderCart();
    } catch (e) { showToast("Error: " + e.message); }
  } else {
    cart = cart.filter(function (p) { return (p._id || p.product || p.id) !== id; });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
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
