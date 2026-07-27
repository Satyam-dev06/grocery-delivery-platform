const form = document.getElementById("checkoutForm");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const checkoutMessage = document.getElementById("checkoutMessage");

// ─── Payment Method UI ───
const paymentMethodEl = document.getElementById("payment");
const codInfo = document.getElementById("codInfo");
const upiSection = document.getElementById("upiSection");
const cardSection = document.getElementById("cardSection");
const paymentExtra = document.getElementById("paymentExtra");
const payNowBtn = document.getElementById("payNowBtn");
const payNowText = document.getElementById("payNowText");
const payNowSpinner = document.getElementById("payNowSpinner");

function togglePaymentUI() {
  const method = paymentMethodEl ? paymentMethodEl.value : "Cash on Delivery";

  // Hide all sections first
  if (codInfo) codInfo.style.display = "none";
  if (upiSection) upiSection.style.display = "none";
  if (cardSection) cardSection.style.display = "none";
  if (paymentExtra) paymentExtra.style.display = "none";

  if (method === "Cash on Delivery") {
    if (codInfo) codInfo.style.display = "block";
  } else if (method === "UPI") {
    if (upiSection) upiSection.style.display = "block";
    if (paymentExtra) paymentExtra.style.display = "block";
  } else if (method === "Card") {
    if (cardSection) cardSection.style.display = "block";
    if (paymentExtra) paymentExtra.style.display = "block";
  }
}

// Listen for payment method changes
if (paymentMethodEl) {
  paymentMethodEl.addEventListener("change", togglePaymentUI);
}

// ─── Coupon State ───
let appliedCoupon = null; // { code, discount, finalTotal }

// ─── Update Order Summary ───
function updateSummary() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let productTotal = 0;
  cart.forEach(function (p) {
    const price = p.price !== undefined ? p.price : (p.product ? p.product.price : 0);
    productTotal += price * p.quantity;
  });

  const el = function (id) { return document.getElementById(id); };
  if (el("summaryTotal")) el("summaryTotal").textContent = productTotal;

  // Apply coupon discount if active
  let grandTotal = productTotal;
  if (appliedCoupon && appliedCoupon.valid) {
    // Recalculate discount in case cart changed
    grandTotal = appliedCoupon.finalTotal;
    if (el("couponDiscountRow")) el("couponDiscountRow").style.display = "block";
    if (el("couponDiscountAmount")) el("couponDiscountAmount").textContent = appliedCoupon.discount;
  } else {
    if (el("couponDiscountRow")) el("couponDiscountRow").style.display = "none";
  }

  if (el("grandTotal")) el("grandTotal").textContent = grandTotal;
}

// ─── Coupon Apply / Remove ───
function applyCouponCode() {
  const input = document.getElementById("couponInput");
  const msgEl = document.getElementById("couponMessage");
  const btn = document.getElementById("applyCouponBtn");
  if (!input || !msgEl || !btn) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    msgEl.innerHTML = '<span style="color:#E53935;"><i class="fas fa-exclamation-circle"></i> Please enter a coupon code</span>';
    return;
  }

  // Calculate cart total
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartTotal = 0;
  cart.forEach(function (p) {
    const price = p.price !== undefined ? p.price : (p.product ? p.product.price : 0);
    cartTotal += price * p.quantity;
  });

  // Show loading
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  msgEl.innerHTML = '<span style="color:#1976D2;"><i class="fas fa-spinner fa-spin"></i> Applying...</span>';

  applyCouponAPI(code, cartTotal).then(function (result) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Apply';

    if (result.valid) {
      appliedCoupon = result;
      msgEl.innerHTML = '<span style="color:#2E7D32;font-weight:600;"><i class="fas fa-check-circle"></i> ' + result.message + '</span>';
      // Show applied badge
      document.getElementById("couponFormContainer").style.display = "none";
      document.getElementById("couponAppliedContainer").style.display = "block";
      document.getElementById("appliedCouponCode").textContent = result.coupon.code;
      updateSummary();
    } else {
      appliedCoupon = null;
      msgEl.innerHTML = '<span style="color:#E53935;"><i class="fas fa-times-circle"></i> ' + result.message + '</span>';
      document.getElementById("couponFormContainer").style.display = "block";
      document.getElementById("couponAppliedContainer").style.display = "none";
    }
  }).catch(function (e) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Apply';
    appliedCoupon = null;
    msgEl.innerHTML = '<span style="color:#E53935;"><i class="fas fa-exclamation-circle"></i> Error: ' + e.message + '</span>';
  });
}

function removeCouponCode() {
  appliedCoupon = null;
  document.getElementById("couponFormContainer").style.display = "block";
  document.getElementById("couponAppliedContainer").style.display = "none";
  document.getElementById("couponMessage").innerHTML = '<span style="color:#4a5568;">Coupon removed</span>';
  document.getElementById("couponInput").value = "";
  updateSummary();
}

// ─── Load Saved Addresses (deduplicated) ───
async function loadSavedAddresses() {
  const listEl = document.getElementById("savedAddressList");
  if (!listEl) return;

  try {
    const addresses = await fetchAddresses();
    if (addresses.length === 0) {
      listEl.innerHTML =
        '<p style="color:#999;padding:20px;">No saved addresses. <a href="address.html" style="color:#2E7D32;font-weight:bold;">Add one</a> before placing an order.</p>';
      return;
    }

    // ── Deduplicate by content fields ──────────────────────
    var seen = new Set();
    var unique = [];
    addresses.forEach(function (addr) {
      var key = [
        addr.fullName || "",
        addr.phone || "",
        addr.addressLine1 || "",
        addr.addressLine2 || "",
        addr.city || "",
        addr.state || "",
        addr.pincode || "",
        addr.landmark || "",
        addr.addressType || "",
      ].join("||");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(addr);
      }
    });
    // ────────────────────────────────────────────────────────

    listEl.innerHTML = "";
    let defaultSelected = false;

    unique.forEach(function (addr) {
      const isDefault = addr.isDefault;
      const checked = isDefault ? "checked" : "";
      const typeIcon = { Home: "\u{1F3E0}", Work: "\u{1F4BC}", Other: "\u{1F4CD}" };
      const icon = typeIcon[addr.addressType] || "\u{1F4CD}";
      const addrLine =
        addr.addressLine1 +
        (addr.addressLine2 ? ", " + addr.addressLine2 : "") +
        ", " +
        addr.city +
        ", " +
        addr.state +
        " - " +
        addr.pincode;

      listEl.innerHTML +=
        '\n        <label class="address-radio ' +
        (isDefault ? "default-addr" : "") +
        '">\n          <input type="radio" name="savedAddress" value="' +
        addr._id +
        '" ' +
        checked +
        '>\n          <div class="address-option">\n            <strong>' +
        icon +
        " " +
        addr.fullName +
        "</strong><br>\n            " +
        addrLine +
        (addr.landmark ? " (Near: " + addr.landmark + ")" : "") +
        '\n            <br><small>' +
        addr.phone +
        "</small>\n            " +
        (isDefault ? '<span class="default-tag">\u{2B50} Default</span>' : "") +
        '\n          </div>\n        </label>';

      if (isDefault) {
        defaultSelected = true;
      }
    });

    // If no default was set, select the first unique address
    if (!defaultSelected && unique.length > 0) {
      var firstRadio = document.querySelector("input[name='savedAddress']");
      if (firstRadio) firstRadio.checked = true;
    }
  } catch (e) {
    listEl.innerHTML =
      '<p style="color:#E53935;padding:20px;">Could not load addresses.</p>';
  }
}  // ─── Page Load ───
(async function loadCheckout() {
  if (isLoggedIn()) {
    try {
      const data = await fetchCart();
      if (data && data.items) {
        localStorage.setItem("cart", JSON.stringify(data.items));
      }
      await loadSavedAddresses();
    } catch (e) {
      // fallback to localStorage
    }
  } else {
    document.querySelector(".checkout").innerHTML =
      '<h2>Checkout</h2><p style="text-align:center;padding:60px;">Please <a href="login.html" style="color:#2E7D32;font-weight:bold;">login</a> to checkout.</p>';
    return;
  }
  updateSummary();
  togglePaymentUI(); // Show initial payment UI based on default selection

  // ─── Coupon Event Listeners ───
  var applyBtn = document.getElementById("applyCouponBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyCouponCode);
  }
  var couponInput = document.getElementById("couponInput");
  if (couponInput) {
    couponInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCouponCode();
      }
    });
  }
  var removeBtn = document.getElementById("removeCouponBtn");
  if (removeBtn) {
    removeBtn.addEventListener("click", removeCouponCode);
  }
})();

// ─── Place Order ───
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    if (typeof window.showToast === "function") {
      window.showToast("Your cart is empty! Redirecting to shop...", "warning");
    } else {
      alert("Your cart is empty!");
    }
    setTimeout(function () { window.location.href = "index.html"; }, 1500);
    return;
  }

  // Get selected address
  const selectedRadio = document.querySelector("input[name='savedAddress']:checked");
  if (!selectedRadio) {
    if (checkoutMessage) {
      checkoutMessage.textContent = "Please select a delivery address.";
      checkoutMessage.style.color = "#E53935";
    }
    return;
  }

  const addressId = selectedRadio.value;
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "Cash on Delivery";

  // Show loading state on Place Order button
  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    if (btnText) btnText.textContent = "Creating Order...";
    if (btnSpinner) btnSpinner.style.display = "inline-block";
  }
  if (checkoutMessage) {
    checkoutMessage.textContent = "";
  }

  try {
    // Step 1: Create the order with optional coupon data
    var couponCode = appliedCoupon && appliedCoupon.valid ? appliedCoupon.coupon.code : null;
    var discountAmount = appliedCoupon && appliedCoupon.valid ? appliedCoupon.discount : 0;
    const order = await placeOrderAPI(addressId, paymentMethod, couponCode, discountAmount);
    localStorage.removeItem("cart");

    // Step 2: Handle based on payment method
    if (paymentMethod === "Cash on Delivery") {
      // COD: redirect directly to order-success
      window.location.href = "order-success.html?id=" + order._id;
    } else {
      // UPI or Card: redirect to payment processing page
      window.location.href = "payment.html?orderId=" + order._id + "&method=" + encodeURIComponent(paymentMethod);
    }
  } catch (error) {
    if (checkoutMessage) {
      checkoutMessage.textContent = "Order failed: " + error.message;
      checkoutMessage.style.color = "#E53935";
    }
    // Re-enable button
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      if (btnText) btnText.textContent = "Place Order";
      if (btnSpinner) btnSpinner.style.display = "none";
    }
  }
});
