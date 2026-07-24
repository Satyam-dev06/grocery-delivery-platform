const pageEl = document.getElementById("orderDetailsPage");

// ─── Status Flow (ordered stages) ───
const statusFlow = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const statusColors = {
  "Pending":           { bg: "#FFF3E0", color: "#E65100", icon: "\u23F3" },
  "Confirmed":         { bg: "#E3F2FD", color: "#1565C0", icon: "\u2705" },
  "Packed":            { bg: "#F3E5F5", color: "#7B1FA2", icon: "\U0001f4e6" },
  "Out for Delivery":  { bg: "#E0F7FA", color: "#00838F", icon: "\U0001f69a" },
  "Delivered":         { bg: "#E8F5E9", color: "#2E7D32", icon: "\U0001f389" },
  "Cancelled":         { bg: "#FFEBEE", color: "#C62828", icon: "\u274C" },
};

function formatPrice(amount) {
  return "\u20B9" + (amount || 0).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Build Status Timeline ───
function buildTimeline(currentStatus) {
  if (currentStatus === "Cancelled") {
    return (
      '<div class="timeline">' +
      '<div class="timeline-step active cancelled">' +
      '<span class="timeline-icon">\u274C</span>' +
      '<span class="timeline-label">Cancelled</span>' +
      "</div>" +
      "</div>"
    );
  }

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1) return "";

  let html = '<div class="timeline">';

  statusFlow.forEach(function (status, index) {
    const info = statusColors[status] || { bg: "#eee", color: "#666", icon: "\u2022" };
    const isActive = index <= currentIndex;
    const isCurrent = index === currentIndex;

    html +=
      '<div class="timeline-step ' +
      (isActive ? "active" : "") +
      " " +
      (isCurrent ? "current" : "") +
      '">' +
      '<span class="timeline-dot" style="background:' +
      (isActive ? info.color : "#ddd") +
      '"></span>' +
      '<span class="timeline-icon">' +
      info.icon +
      "</span>" +
      '<span class="timeline-label" style="color:' +
      (isActive ? info.color : "#999") +
      ";font-weight:" +
      (isCurrent ? "bold" : "normal") +
      '">' +
      status +
      "</span>" +
      "</div>";

    if (index < statusFlow.length - 1) {
      html +=
        '<div class="timeline-line" style="background:' +
        (index < currentIndex ? info.color : "#ddd") +
        '"></div>';
    }
  });

  html += "</div>";
  return html;
}

// ─── Load Order Details ───
(async function loadOrderDetails() {
  if (!pageEl) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    pageEl.innerHTML =
      '<div class="empty-state"><h3>\u26A0\uFE0F No Order ID</h3><p>Please select an order from <a href="orders.html" style="color:#2E7D32;font-weight:bold;">My Orders</a>.</p></div>';
    return;
  }

  if (!isLoggedIn()) {
    pageEl.innerHTML =
      '<div class="empty-state"><h3>\U0001f512 Please Login</h3><p><a href="login.html" style="color:#2E7D32;font-weight:bold;">Login</a> to view order details.</p></div>';
    return;
  }

  pageEl.innerHTML =
    '<div class="loading-spinner" style="text-align:center;padding:60px;"><div style="width:40px;height:40px;border:4px solid #ddd;border-top-color:#2E7D32;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 20px;"></div><p style="color:#999;">Loading order...</p></div>';

  try {
    const order = await fetchOrderById(orderId);
    renderOrder(order);
  } catch (e) {
    pageEl.innerHTML =
      '<div class="empty-state"><h3>\u26A0\uFE0F Error</h3><p>' +
      e.message +
      '</p><a href="orders.html" class="shop-btn" style="display:inline-block;margin-top:20px;text-decoration:none;">\u2190 Back to Orders</a></div>';
  }
})();

// ─── Render Order ───
function renderOrder(order) {
  const statusInfo = statusColors[order.orderStatus] || { bg: "#eee", color: "#666", icon: "\u2022" };
  const addr = order.deliveryAddress || {};
  const items = order.items || [];

  let itemsHtml = "";
  items.forEach(function (item) {
    itemsHtml +=
      "<tr>" +
      '<td class="item-info">' +
      (item.image ? '<img src="' + item.image + '" alt="' + item.name + '" class="item-thumb" onerror="this.style.display=\'none\'">' : "") +
      "<span>" + (item.name || "Product") + "</span>" +
      "</td>" +
      "<td>" + item.quantity + "</td>" +
      "<td>" + formatPrice(item.priceAtPurchase) + "</td>" +
      "<td><strong>" + formatPrice(item.priceAtPurchase * item.quantity) + "</strong></td>" +
      "</tr>";
  });

  const timelineHtml = buildTimeline(order.orderStatus);

  const html =
    '<div class="order-details-header">' +
    "<h2>\U0001f4c4 Order Details</h2>" +
    '<span class="order-id-large">#' +
    (order._id ? order._id.slice(-8).toUpperCase() : "N/A") +
    "</span>" +
    '<span class="status-badge" style="background:' +
    statusInfo.bg +
    ";color:" +
    statusInfo.color +
    ";font-size:16px;padding:8px 20px;">" +
    statusInfo.icon +
    " " +
    order.orderStatus +
    "</span>" +
    "</div>" +

    '<div class="order-section"><h3>\U0001f4cd Order Timeline</h3>' +
    timelineHtml +
    "</div>" +

    '<div class="order-section">' +
    "<h3>\U0001f4cd Delivery Address</h3>" +
    '<div class="address-detail-card">' +
    "<p><strong>" + (addr.fullName || "N/A") + "</strong></p>" +
    "<p>" + addr.addressLine1 + (addr.addressLine2 ? ", " + addr.addressLine2 : "") + "</p>" +
    "<p>" + addr.city + ", " + addr.state + " - " + addr.pincode + "</p>" +
    (addr.landmark ? "<p>Near: " + addr.landmark + "</p>" : "") +
    "<p>\U0001f4de " + (addr.phone || "N/A") + "</p>" +
    "</div>" +
    "</div>" +

    '<div class="order-section">' +
    "<h3>\U0001f6d2 Items (" + order.totalItems + ")</h3>" +
    '<div class="items-table-wrapper">' +
    '<table class="items-table">' +
    "<thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>" +
    "<tbody>" + itemsHtml + "</tbody>" +
    "</table>" +
    "</div>" +
    "</div>" +

    '<div class="order-section">' +
    "<h3>\U0001f4b0 Payment Summary</h3>" +
    '<div class="payment-detail-card">' +
    '<div class="summary-row"><span>Total Items</span><span><strong>' + order.totalItems + "</strong></span></div>" +
    '<div class="summary-row"><span>Total Amount</span><span class="total-amount">' + formatPrice(order.totalAmount) + "</span></div>" +
    '<div class="summary-row"><span>Payment Method</span><span>' + (order.paymentMethod || "Cash on Delivery") + "</span></div>" +
    '<div class="summary-row"><span>Payment Status</span><span style="color:' + (order.paymentStatus === "Paid" ? "#2E7D32" : order.paymentStatus === "Failed" ? "#C62828" : "#E65100") + ";font-weight:bold;">" + (order.paymentStatus || "Pending") + "</span></div>" +
    '<div class="summary-row"><span>Order Date</span><span>' + formatDate(order.orderedAt || order.createdAt) + "</span></div>" +
    "</div>" +
    "</div>" +

    '<div style="text-align:center;margin-top:30px;">' +
    '<a href="orders.html" class="shop-btn" style="display:inline-block;text-decoration:none;">\u2190 Back to Orders</a>' +
    "</div>";

  pageEl.innerHTML = html;
}
