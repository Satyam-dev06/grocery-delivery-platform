const form = document.getElementById("checkoutForm");
const applyCoupon = document.getElementById("applyCoupon");

let discount = 0;

// Safely get item price — handles both flat format (price directly)
// and nested API format (product: { price }) for legacy localStorage data
function getItemPrice(item) {
  if (item.price !== undefined) return item.price;
  if (item.product && item.product.price !== undefined) return item.product.price;
  return 0;
}

function updateSummary() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let productTotal = 0;
  cart.forEach(function (p) { productTotal += getItemPrice(p) * p.quantity; });
  let delivery = 25;
  const expressEl = document.getElementById("express");
  if (expressEl && expressEl.checked) delivery = 49;
  const grandTotal = productTotal + delivery - discount;
  const el = function (id) { return document.getElementById(id); };
  if (el("summaryTotal")) el("summaryTotal").textContent = productTotal;
  if (el("deliveryFee")) el("deliveryFee").textContent = delivery;
  if (el("discountAmount")) el("discountAmount").textContent = discount;
  if (el("grandTotal")) el("grandTotal").textContent = grandTotal;
}

// Fetch API cart for logged-in users, then update summary
(async function loadCheckoutCart() {
  if (isLoggedIn()) {
    try {
      const data = await fetchCart();
      if (data && data.items) {
        localStorage.setItem("cart", JSON.stringify(data.items));
      }
    } catch (e) { /* fallback to localStorage */ }
  }
  updateSummary();
})();

if (applyCoupon) {
  applyCoupon.addEventListener("click", function () {
    const coupon = document.getElementById("coupon").value.trim();
    if (coupon === "SAVE20") {
      discount = 20;
      document.getElementById("couponMessage").textContent = "Coupon Applied";
    } else {
      discount = 0;
      document.getElementById("couponMessage").textContent = "Invalid Coupon";
    }
    updateSummary();
  });
}

const expressEl = document.getElementById("express");
if (expressEl) expressEl.addEventListener("change", updateSummary);

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Your cart is empty!");
    window.location.href = "index.html";
    return;
  }

  if (!isLoggedIn()) {
    alert("Please login to place an order");
    window.location.href = "login.html";
    return;
  }

  let productTotal = 0;
  cart.forEach(function (p) { productTotal += getItemPrice(p) * p.quantity; });
  const expressEl = document.getElementById("express");
  const express = expressEl ? expressEl.checked : false;
  const delivery = express ? 49 : 25;
  const grandTotal = productTotal + delivery - discount;

  const orderData = {
    customerName: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    slot: document.getElementById("slot").value,
    payment: document.getElementById("payment").value,
    express: express,
    discount: discount,
  };

  try {
    await createOrder(orderData);
    const points = Math.floor(productTotal / 10);
    const currentPoints = Number(localStorage.getItem("points")) || 0;
    localStorage.setItem("points", currentPoints + points);
    localStorage.removeItem("cart");
    window.location.href = "order-success.html";
  } catch (error) {
    alert("Order failed: " + error.message);
  }
});
