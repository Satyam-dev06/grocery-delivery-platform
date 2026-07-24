const form = document.getElementById("checkoutForm");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const checkoutMessage = document.getElementById("checkoutMessage");

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
  if (el("grandTotal")) el("grandTotal").textContent = productTotal;
}

// ─── Load Saved Addresses ───
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

    listEl.innerHTML = "";
    let defaultSelected = false;

    addresses.forEach(function (addr) {
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
        ">\n          <div class=\"address-option\">\n            <strong>" +
        icon +
        " " +
        addr.fullName +
        "</strong><br>\n            " +
        addrLine +
        (addr.landmark ? " (Near: " + addr.landmark + ")" : "") +
        "\n            <br><small>" +
        addr.phone +
        "</small>\n            " +
        (isDefault ? '<span class="default-tag">\u{2B50} Default</span>' : "") +
        '\n          </div>\n        </label>';

      if (isDefault) {
        defaultSelected = true;
      }
    });

    // If no default was set, select the first address
    if (!defaultSelected && addresses.length > 0) {
      var firstRadio = document.querySelector("input[name='savedAddress']");
      if (firstRadio) firstRadio.checked = true;
    }
  } catch (e) {
    listEl.innerHTML =
      '<p style="color:#E53935;padding:20px;">Could not load addresses.</p>';
  }
}

// ─── Page Load ───
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
})();

// ─── Place Order ───
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Your cart is empty!");
    window.location.href = "index.html";
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

  // Get payment method
  const paymentEl = document.getElementById("payment");
  const paymentMethod = paymentEl ? paymentEl.value : "Cash on Delivery";

  // Show loading state
  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    if (btnText) btnText.textContent = "Placing Order...";
    if (btnSpinner) btnSpinner.style.display = "inline-block";
  }
  if (checkoutMessage) {
    checkoutMessage.textContent = "";
  }

  try {
    await placeOrderAPI(addressId, paymentMethod);
    localStorage.removeItem("cart");
    window.location.href = "orders.html";
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
