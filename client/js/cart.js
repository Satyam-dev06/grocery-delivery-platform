/* ============================================
   GroceryHub — Cart Module (Redesigned)
   ============================================ */

// ─── DOM References ───
var cartItems = document.getElementById("cartItems");
var cartContainer = document.getElementById("cartContainer");
var emptyCart = document.getElementById("emptyCart");
var cartLoading = document.getElementById("cartLoading");
var cartCount = document.getElementById("cartCount");
var cartItemCount = document.getElementById("cartItemCount");

// Order summary elements
var osSubtotal = document.getElementById("osSubtotal");
var osSavings = document.getElementById("osSavings");
var osSavingsRow = document.getElementById("osSavingsRow");
var osCouponRow = document.getElementById("osCouponRow");
var osCouponDiscount = document.getElementById("osCouponDiscount");
var osDelivery = document.getElementById("osDelivery");
var osPlatformFee = document.getElementById("osPlatformFee");
var osTax = document.getElementById("osTax");
var osGrandTotal = document.getElementById("osGrandTotal");

// Saved items
var savedForLaterSection = document.getElementById("savedForLaterSection");
var savedItems = document.getElementById("savedItems");
var savedCount = document.getElementById("savedCount");

// Coupon state
var appliedCoupon = null;

// ─── State ───
var cart = [];
var savedList = JSON.parse(localStorage.getItem("cart_saved")) || [];
var pendingRemoveId = null;

// ─── Toast (safe version, no async leak) ───
function showToast(message, type) {
  type = type || "info";
  try {
    var toast = document.getElementById("toast");
    if (toast) {
      var icons = { error: "❌ ", success: "✅ ", warning: "⚠️ ", info: "ℹ️ " };
      toast.innerHTML = (icons[type] || "ℹ️ ") + " " + message;
      toast.className = "show toast-" + type;
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function () { toast.className = ""; }, 2500);
      return;
    }
  } catch (e) {
    // Silently fail — toast is non-critical
  }
  // Fallback for environments where toast element doesn't exist
  if (typeof console !== "undefined") {
    console.log("[Cart] " + message);
  }
}

// ─── Extract Product ID ───
function getItemId(item) {
  if (item.product && typeof item.product === "object" && item.product._id) return item.product._id;
  if (item.product && typeof item.product === "string") return item.product;
  return item._id || item.id;
}

// ─── Find Item in Cart ───
function findCartItem(id) {
  return cart.find(function (p) { return getItemId(p) === id; });
}

// ─── Get Full Product Info from Cart Item ───
function getProductInfo(item) {
  var p = item.product || item;
  return {
    id: getItemId(item),
    name: p.name || "Product",
    price: p.price || 0,
    oldPrice: p.oldPrice || 0,
    image: p.image || "",
    brand: p.brand || "",
    category: p.category || "",
    rating: p.rating || 0,
    stock: p.stock !== undefined ? p.stock : true,
    quantity: item.quantity || 1,
  };
}

// ─── Render Stars ───
function renderStars(rating) {
  var html = "";
  for (var s = 0; s < 5; s++) {
    html += s < rating
      ? '<i class="fas fa-star"></i>'
      : '<i class="far fa-star"></i>';
  }
  return html;
}

// ─── Render Cart Items ───
function renderCart() {
  if (!cartItems) return;

  if (cart.length === 0) {
    showEmptyCart();
    return;
  }

  cartContainer.style.display = "flex";
  emptyCart.style.display = "none";
  if (cartLoading) cartLoading.style.display = "none";

  cartItems.innerHTML = "";
  var subtotal = 0;
  var totalSavings = 0;
  var count = 0;

  cart.forEach(function (item) {
    var p = getProductInfo(item);
    var lineTotal = p.price * p.quantity;
    subtotal += lineTotal;
    count += p.quantity;

    var discount = 0;
    if (p.oldPrice && p.oldPrice > p.price) {
      discount = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
      totalSavings += (p.oldPrice - p.price) * p.quantity;
    }

    var stockClass = p.stock ? "in-stock" : "out-of-stock";
    var stockText = p.stock ? "In Stock" : "Out of Stock";

    cartItems.innerHTML +=
      '<div class="cart-item-card" data-id="' + p.id + '">' +
        '<a href="product-details.html?id=' + p.id + '" class="cart-item-img-link">' +
          '<div class="cart-item-img-wrap">' +
            '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
          '</div>' +
        '</a>' +
        '<div class="cart-item-body">' +
          '<div class="cart-item-top">' +
            '<div class="cart-item-info">' +
              '<a href="product-details.html?id=' + p.id + '" class="cart-item-name">' + p.name + '</a>' +
              (p.brand ? '<span class="cart-item-brand">' + p.brand + '</span>' : '') +
              (p.category ? '<span class="cart-item-category">' + p.category + '</span>' : '') +
              '<div class="cart-item-meta">' +
                '<span class="cart-item-rating">' + renderStars(Math.round(p.rating || 0)) + '</span>' +
                '<span class="cart-item-stock ' + stockClass + '">' +
                  (p.stock ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>') +
                  ' ' + stockText +
                '</span>' +
              '</div>' +
              '<div class="cart-item-pricing">' +
                '<span class="cart-item-price">₹' + p.price + '</span>' +
                (discount > 0 ? '<span class="cart-item-old-price">₹' + p.oldPrice + '</span>' : '') +
                (discount > 0 ? '<span class="cart-item-discount">' + discount + '% OFF</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="cart-item-total">₹' + lineTotal + '</div>' +
          '</div>' +
          '<div class="cart-item-actions">' +
            '<div class="cart-qty-controls">' +
              '<button class="cart-qty-btn cart-qty-minus" onclick="decreaseQuantity(\'' + p.id + '\')" ' + (p.quantity <= 1 ? 'disabled' : '') + ' aria-label="Decrease quantity">' +
                '<i class="fas fa-minus"></i>' +
              '</button>' +
              '<span class="cart-qty-value">' + p.quantity + '</span>' +
              '<button class="cart-qty-btn cart-qty-plus" onclick="increaseQuantity(\'' + p.id + '\')" aria-label="Increase quantity">' +
                '<i class="fas fa-plus"></i>' +
              '</button>' +
            '</div>' +
            '<div class="cart-item-action-btns">' +
              '<button class="cart-action-btn cart-save-btn" onclick="saveForLater(\'' + p.id + '\')" aria-label="Save for later">' +
                '<i class="far fa-bookmark"></i> Save' +
              '</button>' +
              '<button class="cart-action-btn cart-remove-btn" onclick="confirmRemove(\'' + p.id + '\', \'' + escapeJsStr(p.name) + '\')" aria-label="Remove item">' +
                '<i class="fas fa-trash-alt"></i> Remove' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  });

  // Update header count
  if (cartItemCount) cartItemCount.textContent = count + " item" + (count !== 1 ? "s" : "");

  // Update order summary
  updateOrderSummary(subtotal, totalSavings, count);

  // Show saved section
  renderSavedItems();
  updateCartBadge();
}

// ─── Update Order Summary ───
function updateOrderSummary(subtotal, savings, count) {
  if (osSubtotal) osSubtotal.textContent = subtotal;

  // Savings
  if (savings > 0) {
    osSavingsRow.style.display = "flex";
    if (osSavings) osSavings.textContent = savings;
  } else {
    osSavingsRow.style.display = "none";
  }

  // Coupon discount
  var couponDiscount = 0;
  if (appliedCoupon && appliedCoupon.valid) {
    couponDiscount = appliedCoupon.discount;
    osCouponRow.style.display = "flex";
    if (osCouponDiscount) osCouponDiscount.textContent = couponDiscount;
  } else {
    osCouponRow.style.display = "none";
  }

  // Delivery
  var delivery = subtotal >= 199 ? 0 : 29;
  if (osDelivery) {
    osDelivery.textContent = delivery === 0 ? "FREE" : "₹" + delivery;
    osDelivery.style.color = delivery === 0 ? "var(--success)" : "var(--text-secondary)";
    if (delivery > 0) {
      osDelivery.innerHTML = '₹' + delivery + ' <span style="font-size:11px;color:var(--danger);">(Add ₹' + (199 - subtotal) + ' more)</span>';
    }
  }

  // Platform fee
  var platformFee = 3;
  if (osPlatformFee) osPlatformFee.textContent = platformFee;

  // Tax (estimated 5% of subtotal)
  var tax = Math.round(subtotal * 0.05);
  if (osTax) osTax.textContent = tax;

  // Grand total
  var grandTotal = subtotal - savings - couponDiscount + delivery + platformFee + tax;
  if (grandTotal < 0) grandTotal = 0;
  if (osGrandTotal) osGrandTotal.textContent = grandTotal;

  // Enable/disable checkout button
  var checkoutBtn = document.getElementById("osCheckoutBtn");
  if (checkoutBtn) {
    if (count === 0 || grandTotal === 0) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = "0.5";
      checkoutBtn.style.cursor = "not-allowed";
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = "1";
      checkoutBtn.style.cursor = "pointer";
    }
  }
}

// ─── Quantity Controls ───
async function increaseQuantity(id) {
  if (isLoggedIn()) {
    try {
      var item = findCartItem(id);
      if (item) {
        var updated = await updateCartItemAPI(id, item.quantity + 1);
        cart = updated.items || [];
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message, "error"); }
  } else {
    var item = findCartItem(id);
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
      var item = findCartItem(id);
      if (item && item.quantity > 1) {
        var updated = await updateCartItemAPI(id, item.quantity - 1);
        cart = updated.items || [];
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      }
    } catch (e) { showToast("Error: " + e.message, "error"); }
  } else {
    var item = findCartItem(id);
    if (item && item.quantity > 1) {
      item.quantity--;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  }
}

// ─── Remove with Confirmation ───
function confirmRemove(id, name) {
  pendingRemoveId = id;
  var nameEl = document.getElementById("removeItemName");
  if (nameEl) nameEl.textContent = name || "this item";
  document.getElementById("removeModal").style.display = "flex";
}

function closeRemoveModal() {
  document.getElementById("removeModal").style.display = "none";
  pendingRemoveId = null;
}

document.addEventListener("DOMContentLoaded", function () {
  var confirmBtn = document.getElementById("confirmRemoveBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      if (pendingRemoveId) {
        executeRemove(pendingRemoveId);
        closeRemoveModal();
      }
    });
  }
});

async function executeRemove(id) {
  if (isLoggedIn()) {
    try {
      var updated = await removeFromCartAPI(id);
      cart = updated.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Item removed from cart", "info");
    } catch (e) { showToast("Error: " + e.message, "error"); }
  } else {
    cart = cart.filter(function (p) { return getItemId(p) !== id; });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast("Item removed from cart", "info");
  }
}

// ─── Save for Later ───
function saveForLater(id) {
  // Get the item details before removing
  var item = findCartItem(id);
  if (!item) return;

  var p = getProductInfo(item);

  // Add to saved list
  var existing = savedList.findIndex(function (s) { return getItemId(s) === id; });
  if (existing === -1) {
    savedList.push({ _id: id, id: id, name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.image, quantity: 1 });
    localStorage.setItem("cart_saved", JSON.stringify(savedList));
  }

  // Remove from cart
  if (isLoggedIn()) {
    removeFromCartAPI(id).then(function (updated) {
      cart = updated.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Moved to Saved for Later", "success");
    }).catch(function () {
      // Fallback: remove locally
      cart = cart.filter(function (p) { return getItemId(p) !== id; });
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Moved to Saved for Later", "success");
    });
  } else {
    cart = cart.filter(function (p) { return getItemId(p) !== id; });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast("Moved to Saved for Later", "success");
  }
}

function moveToCart(id) {
  var idx = savedList.findIndex(function (s) { return (s._id || s.id) === id; });
  if (idx === -1) return;

  var savedItem = savedList[idx];
  savedList.splice(idx, 1);
  localStorage.setItem("cart_saved", JSON.stringify(savedList));

  // Add to cart
  if (isLoggedIn()) {
    addToCartAPI(id, 1).then(function (updated) {
      cart = updated.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Moved back to Cart", "success");
    }).catch(function () {
      // Fallback
      cart.push({ _id: id, id: id, name: savedItem.name, price: savedItem.price, oldPrice: savedItem.oldPrice || 0, image: savedItem.image, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Moved back to Cart", "success");
    });
  } else {
    cart.push({ _id: id, id: id, name: savedItem.name, price: savedItem.price, oldPrice: savedItem.oldPrice || 0, image: savedItem.image, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast("Moved back to Cart", "success");
  }
}

function removeSaved(id) {
  savedList = savedList.filter(function (s) { return (s._id || s.id) !== id; });
  localStorage.setItem("cart_saved", JSON.stringify(savedList));
  renderSavedItems();
  showToast("Removed from Saved", "info");
}

function renderSavedItems() {
  if (!savedItems || !savedForLaterSection) return;

  if (savedList.length === 0) {
    savedForLaterSection.style.display = "none";
    return;
  }

  savedForLaterSection.style.display = "block";
  if (savedCount) savedCount.textContent = savedList.length + " item" + (savedList.length !== 1 ? "s" : "");

  savedItems.innerHTML = "";
  savedList.forEach(function (item) {
    var sid = item._id || item.id;
    savedItems.innerHTML +=
      '<div class="cart-saved-item">' +
        '<img src="' + (item.image || "") + '" alt="' + (item.name || "") + '" onerror="this.style.display=\'none\'">' +
        '<div class="csi-info">' +
          '<h4>' + (item.name || "Product") + '</h4>' +
          '<span class="csi-price">₹' + (item.price || 0) + '</span>' +
        '</div>' +
        '<div class="csi-actions">' +
          '<button class="cart-action-btn" onclick="moveToCart(\'' + sid + '\')"><i class="fas fa-cart-plus"></i> Move to Cart</button>' +
          '<button class="cart-action-btn cart-remove-btn" onclick="removeSaved(\'' + sid + '\')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>' +
      '</div>';
  });
}

// ─── Clear Cart ───
async function clearCart() {
  if (isLoggedIn()) {
    try {
      await clearCartAPI();
      cart = [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      showToast("Cart cleared", "info");
    } catch (e) { showToast("Error: " + e.message, "error"); }
  } else {
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    showToast("Cart cleared", "info");
  }
}

// ─── Empty Cart ───
function showEmptyCart() {
  cartContainer.style.display = "none";
  emptyCart.style.display = "block";
  if (cartLoading) cartLoading.style.display = "none";
  if (cartItemCount) cartItemCount.textContent = "0 items";
  if (osGrandTotal) osGrandTotal.textContent = "0";
}

// ─── Update Cart Badge ───
function updateCartBadge() {
  if (cartCount) cartCount.textContent = cart.length;
}

// ─── Load Recommended Products for Empty State ───
function loadEmptyRecommended() {
  var container = document.getElementById("emptyRecommended");
  if (!container) return;

  // Try API first, fallback to static products
  fetchProducts({ limit: 4, sort: "rating_high" }).then(function (data) {
    var prods = data.products || [];
    renderRecommended(prods, container);
  }).catch(function () {
    // Static fallback
    var staticProds = typeof products !== "undefined" ? products : [];
    renderRecommended(staticProds.slice(0, 4), container);
  });
}

function renderRecommended(prods, container) {
  if (prods.length === 0) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = "";
  prods.forEach(function (p) {
    var pid = p._id || p.id;
    container.innerHTML +=
      '<div class="cart-rec-item">' +
        '<img src="' + p.image + '" alt="' + p.name + '" onerror="this.style.display=\'none\'">' +
        '<div class="cri-info">' +
          '<h4>' + p.name + '</h4>' +
          '<span class="cri-price">₹' + p.price + '</span>' +
        '</div>' +
        '<button class="cri-add-btn" onclick="addToCartFromEmpty(\'' + pid + '\', \'' + escapeJsStr(p.name) + '\', ' + p.price + ', \'' + escapeJsStr(p.image) + '\')" aria-label="Add ' + p.name + ' to cart">' +
          '<i class="fas fa-plus"></i>' +
        '</button>' +
      '</div>';
  });
}

function addToCartFromEmpty(id, name, price, image) {
  if (isLoggedIn()) {
    addToCartAPI(id, 1).then(function (updated) {
      cart = updated.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
      showToast(name + " added to cart", "success");
      updateCartBadge();
    }).catch(function (e) {
      showToast("Error: " + e.message, "error");
    });
  } else {
    var c = JSON.parse(localStorage.getItem("cart")) || [];
    var ex = c.find(function (x) { return x._id === id || x.id === id; });
    if (ex) { ex.quantity++; } else { c.push({ _id: id, id: id, name: name, price: price, image: image, quantity: 1 }); }
    cart = c;
    localStorage.setItem("cart", JSON.stringify(c));
    showToast(name + " added to cart", "success");
    updateCartBadge();
  }
}

// ─── Coupon ───
function applyCartCoupon() {
  var input = document.getElementById("osCouponInput");
  var msgEl = document.getElementById("osCouponMsg");
  var btn = document.getElementById("osApplyCouponBtn");
  if (!input || !msgEl || !btn) return;

  var code = input.value.trim().toUpperCase();
  if (!code) {
    msgEl.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-exclamation-circle"></i> Enter a coupon code</span>';
    return;
  }

  // Calculate cart subtotal
  var subtotal = 0;
  cart.forEach(function (item) {
    var p = getProductInfo(item);
    subtotal += p.price * p.quantity;
  });

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  msgEl.innerHTML = '<span style="color:var(--info);"><i class="fas fa-spinner fa-spin"></i> Applying...</span>';

  applyCouponAPI(code, subtotal).then(function (result) {
    btn.disabled = false;
    btn.innerHTML = 'Apply';

    if (result.valid) {
      appliedCoupon = result;
      msgEl.innerHTML = '<span style="color:var(--success);font-weight:600;"><i class="fas fa-check-circle"></i> ' + result.message + '</span>';
      document.getElementById("osCouponForm").style.display = "none";
      document.getElementById("osCouponApplied").style.display = "block";
      document.getElementById("osAppliedCode").textContent = result.coupon ? result.coupon.code : code;
      renderCart();
    } else {
      appliedCoupon = null;
      msgEl.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> ' + result.message + '</span>';
    }
  }).catch(function (e) {
    btn.disabled = false;
    btn.innerHTML = 'Apply';
    appliedCoupon = null;
    msgEl.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-exclamation-circle"></i> ' + e.message + '</span>';
  });
}

function removeCartCoupon() {
  appliedCoupon = null;
  document.getElementById("osCouponForm").style.display = "block";
  document.getElementById("osCouponApplied").style.display = "none";
  document.getElementById("osCouponMsg").innerHTML = "";
  document.getElementById("osCouponInput").value = "";
  renderCart();
}

// ─── Escape helper ───
function escapeJsStr(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

// ─── Init ───
(async function loadCart() {
  // Show loading state
  if (cartLoading) cartLoading.style.display = "block";
  emptyCart.style.display = "none";
  cartContainer.style.display = "none";

  // Load cart data
  if (isLoggedIn()) {
    try {
      var data = await fetchCart();
      cart = data.items || [];
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) { cart = []; }
  } else {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  }

  // Load saved items
  savedList = JSON.parse(localStorage.getItem("cart_saved")) || [];

  // Render
  renderCart();
  loadEmptyRecommended();

  // ─── Coupon Event Listeners ───
  var applyBtn = document.getElementById("osApplyCouponBtn");
  if (applyBtn) applyBtn.addEventListener("click", applyCartCoupon);
  var couponInput = document.getElementById("osCouponInput");
  if (couponInput) {
    couponInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); applyCartCoupon(); }
    });
  }
  var removeBtn = document.getElementById("osRemoveCouponBtn");
  if (removeBtn) removeBtn.addEventListener("click", removeCartCoupon);

  // ─── Remove Modal Close on Overlay Click ───
  var modalOverlay = document.getElementById("removeModal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeRemoveModal();
    });
  }
})();
