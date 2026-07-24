const ordersContainer = document.getElementById("ordersContainer");

// ─── Status Color Map ───
const statusColors = {
  "Pending":        { bg: "#FFF3E0", color: "#E65100", label: "⏳ Pending" },
  "Confirmed":      { bg: "#E3F2FD", color: "#1565C0", label: "✅ Confirmed" },
  "Packed":         { bg: "#F3E5F5", color: "#7B1FA2", label: "📦 Packed" },
  "Out for Delivery": { bg: "#E0F7FA", color: "#00838F", label: "🚚 Out for Delivery" },
  "Delivered":      { bg: "#E8F5E9", color: "#2E7D32", label: "🎉 Delivered" },
  "Cancelled":      { bg: "#FFEBEE", color: "#C62828", label: "❌ Cancelled" },
};

const paymentStatusColors = {
  "Pending": { color: "#E65100", label: "Pending" },
  "Paid":    { color: "#2E7D32", label: "Paid ✅" },
  "Failed":  { color: "#C62828", label: "Failed ❌" },
};

// ─── Format Date ───
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Format Price ───
function formatPrice(amount) {
  return "₹" + (amount || 0).toLocaleString("en-IN");
}

// ─── Cancel Order ───
async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    await cancelOrderAPI(orderId);
    showToast("Order cancelled successfully");
    loadOrders(); // Reload the list
  } catch (e) {
    showToast("Error: " + e.message);
  }
}

// ─── Toast ───
function showToast(msg) {
  let toast = document.getElementById("orderToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "orderToast";
    toast.style.cssText =
      "position:fixed;bottom:30px;right:30px;background:#333;color:white;padding:16px 24px;border-radius:10px;font-weight:bold;z-index:9999;opacity:0;transform:translateY(30px);transition:0.4s;box-shadow:0 10px 30px rgba(0,0,0,0.2);";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(30px)";
  }, 2500);
}

// ─── Load Orders ───
async function loadOrders() {
  if (!ordersContainer) return;

  if (!isLoggedIn()) {
    ordersContainer.innerHTML =
      '<div class="empty-state"><h3>🔒 Please Login</h3><p><a href="login.html" style="color:#2E7D32;font-weight:bold;">Login</a> to view your orders.</p></div>';
    return;
  }

  try {
    const orders = await fetchOrders();

    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML =
        '<div class="empty-state"><h3>🍃 No Orders Yet</h3><p>Looks like you haven\'t placed any orders yet.</p><a href="index.html" class="shop-btn" style="display:inline-block;margin-top:20px;text-decoration:none;">Start Shopping</a></div>';
      return;
    }

    let html = "";
    orders.forEach(function (order) {
      const statusInfo = statusColors[order.orderStatus] || { bg: "#eee", color: "#666", label: order.orderStatus };
      const payInfo = paymentStatusColors[order.paymentStatus] || { color: "#666", label: order.paymentStatus };
      const cancellable = order.orderStatus === "Pending" || order.orderStatus === "Confirmed";

      // Build product names summary from items
      let productsHtml = "";
      if (order.items && order.items.length > 0) {
        productsHtml = order.items.map(function (item) {
          return item.name + " x" + item.quantity;
        }).join(", ");
      }

      html +=
        '\n      <div class="order-card">\n' +
        '        <div class="order-card-header">\n' +
        '          <div>\n' +
        '            <span class="order-id">#' +
        (order._id ? order._id.slice(-8).toUpperCase() : "N/A") +
        '</span>\n' +
        '            <span class="order-date">' +
        formatDate(order.orderedAt || order.createdAt) +
        '</span>\n' +
        "          </div>\n" +
        '          <span class="status-badge" style="background:' +
        statusInfo.bg +
        ";color:" +
        statusInfo.color +
        '">' +
        statusInfo.label +
        "</span>\n" +
        "        </div>\n" +
        '        <div class="order-card-body">\n' +
        '          <div class="order-products">\n' +
        '            <span class="order-meta">📦 ' +
        (order.totalItems || 0) +
        " item" +
        (order.totalItems !== 1 ? "s" : "") +
        "</span>\n" +
        '            <span class="order-items-list">' +
        productsHtml +
        "</span>\n" +
        "          </div>\n" +
        '          <div class="order-payment-info">\n' +
        '            <span class="order-meta">💳 ' +
        payInfo.label +
        "</span>\n" +
        '            <span class="order-meta">' +
        (order.paymentMethod || "Cash on Delivery") +
        "</span>\n" +
        "          </div>\n" +
        '          <span class="order-total">' +
        formatPrice(order.totalAmount) +
        "</span>\n" +
        "        </div>\n" +
        '        <div class="order-card-actions">\n' +
        '          <button class="view-btn" onclick="window.location.href=\'order-details.html?id=' +
        order._id +
        '\'">👁️ View Details</button>\n' +
        (cancellable
          ? '<button class="cancel-btn" onclick="cancelOrder(\'' + order._id + '\')">❌ Cancel</button>'
          : "") +
        "        </div>\n" +
        "      </div>";
    });

    ordersContainer.innerHTML = html;
  } catch (e) {
    ordersContainer.innerHTML =
      '<div class="empty-state"><h3>⚠️ Error Loading Orders</h3><p>' +
      e.message +
      '</p><button class="shop-btn" onclick="loadOrders()" style="margin-top:20px;">Retry</button></div>';
  }
}

// ─── Init ───
loadOrders();
