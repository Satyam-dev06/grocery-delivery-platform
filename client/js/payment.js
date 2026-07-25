const payBtn = document.getElementById("processPayBtn");
const payText = document.getElementById("processPayText");
const paySpinner = document.getElementById("processPaySpinner");
const payMessage = document.getElementById("payMessage");

// ─── Page Load ───
(async function loadPaymentPage() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  const method = params.get("method") || "UPI";

  if (!orderId) {
    document.getElementById("paymentPage").innerHTML = 
      '<div style="text-align:center;padding:60px;"><h3>No order specified</h3><a href="checkout.html" class="shop-btn" style="display:inline-block;margin-top:20px;text-decoration:none;">Back to Checkout</a></div>';
    return;
  }

  try {
    const order = await fetchOrderById(orderId);
    
    document.getElementById("orderIdDisplay").textContent = "Order: #" + (order._id ? order._id.slice(-8).toUpperCase() : "N/A");
    document.getElementById("amountDisplay").textContent = "\u20B9" + (order.totalAmount || 0).toLocaleString("en-IN");

    if (method === "UPI") {
      document.getElementById("methodIcon").textContent = "\uD83D\uDCF1";
      document.getElementById("payTitle").textContent = "Pay via UPI";
      document.getElementById("upiPaySection").style.display = "block";
    } else if (method === "Card") {
      document.getElementById("methodIcon").textContent = "\uD83D\uDCB3";
      document.getElementById("payTitle").textContent = "Pay via Card";
      document.getElementById("cardPaySection").style.display = "block";
    }

    // Attach payment processing
    payBtn.onclick = function() { processPayment(orderId, method); };

  } catch (e) {
    document.getElementById("paymentPage").innerHTML = 
      '<div style="text-align:center;padding:60px;"><h3>Error loading order</h3><p>' + e.message + '</p><a href="orders.html" class="shop-btn" style="display:inline-block;margin-top:20px;text-decoration:none;">My Orders</a></div>';
  }
})();

// ─── Process Payment ───
async function processPayment(orderId, method) {
  // Disable button
  payBtn.disabled = true;
  payText.textContent = "Processing Payment...";
  paySpinner.style.display = "inline-block";
  payMessage.textContent = "";

  try {
    // ── Validate card fields BEFORE calling payment API ──
    if (method === "Card") {
      const cardNum = document.getElementById("payCardNumber");
      const cardExpiry = document.getElementById("payCardExpiry");
      const cardCvv = document.getElementById("payCardCvv");
      const cardHolder = document.getElementById("payCardHolder");

      if (!cardNum || !cardNum.value || cardNum.value.replace(/\s/g, "").length < 16) {
        throw new Error("Please enter a valid 16-digit card number");
      }
      if (!cardExpiry || !cardExpiry.value) {
        throw new Error("Please enter card expiry date");
      }
      if (!cardCvv || !cardCvv.value || cardCvv.value.length < 3) {
        throw new Error("Please enter a valid CVV");
      }
      if (!cardHolder || !cardHolder.value.trim()) {
        throw new Error("Please enter card holder name");
      }
    }

    // Simulate payment processing delay
    await new Promise(function(resolve) { setTimeout(resolve, 1500); });

    // Call the payment creation API
    const result = await createPaymentAPI(orderId, method);

    // Success animation
    payText.textContent = "Payment Successful!";
    payText.style.color = "#fff";
    payBtn.style.background = "#2E7D32";
    paySpinner.style.display = "none";

    // Redirect to success page with order and payment info
    setTimeout(function() {
      window.location.href = "payment-success.html?orderId=" + orderId + "&txn=" + encodeURIComponent(result.payment.transactionId) + "&amount=" + result.payment.amount + "&method=" + encodeURIComponent(method);
    }, 800);

  } catch (error) {
    payBtn.disabled = false;
    payText.textContent = "Retry Payment";
    paySpinner.style.display = "none";
    payMessage.textContent = "Payment failed: " + error.message;
    payMessage.style.color = "#E53935";
    
    // For a real failure, redirect to failure page after showing error
    // setTimeout(function() {
    //   window.location.href = "payment-failed.html?orderId=" + orderId + "&error=" + encodeURIComponent(error.message);
    // }, 2000);
  }
}
