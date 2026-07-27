/* ============================================
   GroceryHub — Order Tracking Module
   Animated timeline, Leaflet map, delivery partner
   ============================================ */

// ─── Status Flow ───
var STATUS_FLOW = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

var STATUS_META = {
  "Pending":           { color: "#FB8C00", bg: "#FFF3E0", icon: "fa-clock",        label: "Order Placed" },
  "Confirmed":         { color: "#1565C0", bg: "#E3F2FD", icon: "fa-check-circle", label: "Confirmed" },
  "Packed":            { color: "#7B1FA2", bg: "#F3E5F5", icon: "fa-box",          label: "Packed" },
  "Out for Delivery":  { color: "#00838F", bg: "#E0F7FA", icon: "fa-truck",        label: "Out for Delivery" },
  "Delivered":         { color: "#2E7D32", bg: "#E8F5E9", icon: "fa-home",         label: "Delivered" },
  "Cancelled":         { color: "#C62828", bg: "#FFEBEE", icon: "fa-ban",          label: "Cancelled" },
};

// ─── Delivery Partner Mock Data ───
var DELIVERY_PARTNERS = [
  { name: "Rahul Sharma", phone: "+91 98765 43210", vehicle: "Honda Activa", color: "#2E7D32" },
  { name: "Priya Patel",  phone: "+91 87654 32109", vehicle: "TVS Jupiter",  color: "#1565C0" },
  { name: "Amit Singh",   phone: "+91 76543 21098", vehicle: "Bajaj Platina", color: "#7B1FA2" },
  { name: "Sunita Verma", phone: "+91 65432 10987", vehicle: "Electric Scooter", color: "#00838F" },
];

// ─── State ───
var order = null;
var trackingMap = null;
var mapMarker = null;
var deliveryMarker = null;
var routeLine = null;
var deliveryPartner = null;
var simInterval = null;
var simProgress = 0;

// Indian city coordinates for mock map
var CITY_COORDS = {
  "Mumbai":      [19.0760, 72.8777],
  "Delhi":       [28.7041, 77.1025],
  "Bangalore":   [12.9716, 77.5946],
  "Hyderabad":   [17.3850, 78.4867],
  "Ahmedabad":   [23.0225, 72.5714],
  "Chennai":     [13.0827, 80.2707],
  "Kolkata":     [22.5726, 88.3639],
  "Pune":        [18.5204, 73.8567],
  "Jaipur":      [26.9124, 75.7873],
  "Lucknow":     [26.8467, 80.9462],
};

var DEFAULT_COORDS = [19.0760, 72.8777]; // Mumbai

// ─── Utilities ───
function formatPrice(amount) {
  return "₹" + (amount || 0).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function getShortId(id) {
  return id ? "#" + id.slice(-8).toUpperCase() : "#------";
}

function showToast(msg, type) {
  type = type || "info";
  try {
    var toast = document.getElementById("toast");
    if (toast) {
      var icons = { error: "❌ ", success: "✅ ", warning: "⚠️ ", info: "ℹ️ " };
      toast.innerHTML = (icons[type] || "ℹ️ ") + " " + msg;
      toast.className = "show toast-" + type;
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function () { toast.className = ""; }, 2500);
    }
  } catch (e) {}
}

// ─── Get Order Status Index ───
function getStatusIndex(status) {
  if (status === "Cancelled") return -1;
  return STATUS_FLOW.indexOf(status);
}

// ─── Get Estimated Time Based on Status ───
function getEstimatedTime(status) {
  switch (status) {
    case "Pending":           return "Order will be confirmed shortly";
    case "Confirmed":         return "Packing in progress";
    case "Packed":            return "Out for delivery soon";
    case "Out for Delivery":  return "Arriving in 20-30 minutes";
    case "Delivered":         return "Delivered successfully 🎉";
    case "Cancelled":         return "Order was cancelled";
    default:                  return "Processing...";
  }
}

// ─── Get Status Subtitle ───
function getStatusSubtitle(status) {
  var date = order ? new Date(order.orderedAt || order.createdAt) : new Date();
  var mins = Math.floor((Date.now() - date.getTime()) / 60000);
  switch (status) {
    case "Pending":           return "Placed " + (mins < 1 ? "just now" : mins + " min ago");
    case "Confirmed":         return "Preparing your items";
    case "Packed":            return "Ready for dispatch";
    case "Out for Delivery":  return "Delivery partner is on the way";
    case "Delivered":         return "Enjoy your fresh groceries!";
    case "Cancelled":         return "We're sorry, this order was cancelled";
    default:                  return "";
  }
}

// ─── Load Order ───
async function loadOrder() {
  var params = new URLSearchParams(window.location.search);
  var orderId = params.get("id");
  var loadingEl = document.getElementById("trackLoading");
  var errorEl = document.getElementById("trackError");
  var contentEl = document.getElementById("trackContent");

  if (!orderId) {
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) { errorEl.style.display = "block"; document.getElementById("trackErrorMessage").textContent = "No order ID provided. Please select an order from My Orders."; }
    return;
  }

  if (!isLoggedIn()) {
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) { errorEl.style.display = "block"; document.getElementById("trackErrorMessage").innerHTML = 'Please <a href="login.html" style="color:#2E7D32;font-weight:bold;">login</a> to track your order.'; }
    return;
  }

  try {
    order = await fetchOrderById(orderId);
    // Pick a delivery partner based on order ID
    var partnerIndex = Math.abs(hashCode(orderId)) % DELIVERY_PARTNERS.length;
    deliveryPartner = DELIVERY_PARTNERS[partnerIndex];

    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) errorEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";

    renderTracking(order);
  } catch (e) {
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) { errorEl.style.display = "block"; document.getElementById("trackErrorMessage").textContent = e.message || "Could not load order details."; }
  }
}

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// ─── Render Tracking ───
function renderTracking(orderData) {
  var status = orderData.orderStatus || "Pending";
  var addr = orderData.deliveryAddress || {};
  var items = orderData.items || [];
  var meta = STATUS_META[status] || STATUS_META["Pending"];

  // Header
  document.getElementById("trackOrderId").textContent = getShortId(orderData._id);
  document.getElementById("trackOrderDate").textContent = formatShortDate(orderData.orderedAt || orderData.createdAt);
  document.getElementById("trackEstimatedTime").textContent = getEstimatedTime(status);

  // Status bar
  document.getElementById("trackStatusIcon").innerHTML = '<i class="fas ' + meta.icon + '" style="color:' + meta.color + ';"></i>';
  document.getElementById("trackStatusTitle").textContent = status === "Delivered" ? "🎉 Delivered!" : status === "Cancelled" ? "❌ Cancelled" : meta.label;
  document.getElementById("trackStatusSubtitle").textContent = getStatusSubtitle(status);

  // Timeline
  renderTimeline(status);

  // Delivery info
  renderDeliveryPartner(status);

  // Order details
  renderOrderInfo(orderData);

  // Address
  renderAddress(addr);

  // Items
  renderItems(items);

  // Actions
  renderActions(orderData);

  // Map (delay to ensure container has layout after display:block)
  if (typeof L !== "undefined") {
    setTimeout(function () { initMap(addr); }, 150);
  }

  // Update page title
  document.title = "Order " + getShortId(orderData._id) + " | GroceryHub";
}

// ─── Render Timeline ───
function renderTimeline(currentStatus) {
  var container = document.getElementById("trackTimeline");
  if (!container) return;

  if (currentStatus === "Cancelled") {
    container.innerHTML =
      '<div class="tt-cancelled">' +
        '<div class="tt-step cancelled active">' +
          '<div class="tt-dot" style="background:#C62828;box-shadow:0 0 0 4px #FFEBEE;"></div>' +
          '<div class="tt-content">' +
            '<span class="tt-title" style="color:#C62828;">Order Cancelled</span>' +
            '<span class="tt-desc">This order has been cancelled</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    return;
  }

  var currentIndex = getStatusIndex(currentStatus);
  if (currentIndex === -1) return;

  var html = '<div class="tt-list">';
  STATUS_FLOW.forEach(function (status, index) {
    var meta = STATUS_META[status];
    var isCompleted = index < currentIndex;
    var isCurrent = index === currentIndex;
    var isFuture = index > currentIndex;

    var cls = "tt-step";
    if (isCompleted) cls += " completed";
    if (isCurrent) cls += " current";
    if (isFuture) cls += " future";

    var dotStyle = "";
    if (isCompleted) dotStyle = 'style="background:' + meta.color + ';box-shadow:0 0 0 4px ' + meta.bg + ';"';
    else if (isCurrent) dotStyle = 'style="background:' + meta.color + ';box-shadow:0 0 0 4px ' + meta.bg + ', 0 0 12px ' + meta.color + '80;"';
    else dotStyle = 'style="background:#e0e0e0;"';

    var lineClass = index < STATUS_FLOW.length - 1 ? (isFuture ? 'line-future' : (index < currentIndex ? 'line-completed' : 'line-current')) : '';

    html +=
      '<div class="' + cls + '">' +
        '<div class="tt-dot" ' + dotStyle + '>' +
          (isCompleted ? '<i class="fas fa-check"></i>' : isCurrent ? '<i class="fas ' + meta.icon + '"></i>' : '<i class="fas ' + meta.icon + '"></i>') +
        '</div>' +
        '<div class="tt-content">' +
          '<span class="tt-title">' + meta.label + '</span>' +
          '<span class="tt-desc">' + getStatusDescription(status) + '</span>' +
        '</div>' +
      '</div>';

    if (index < STATUS_FLOW.length - 1) {
      html += '<div class="tt-line ' + lineClass + '"></div>';
    }
  });
  html += '</div>';

  container.innerHTML = html;
}

function getStatusDescription(status) {
  switch (status) {
    case "Pending":           return "Your order has been placed and is awaiting confirmation";
    case "Confirmed":         return "Your order has been confirmed and we're preparing it";
    case "Packed":            return "Your items have been packed and labeled";
    case "Out for Delivery":  return "Your order is on its way to your doorstep";
    case "Delivered":         return "Your order has been delivered successfully!";
    default:                  return "";
  }
}

// ─── Render Delivery Partner ───
function renderDeliveryPartner(status) {
  var container = document.getElementById("trackDeliveryInfo");
  if (!container) return;

  var card = document.getElementById("trackDeliveryCard");

  if (status === "Delivered" || status === "Cancelled") {
    if (card) card.style.display = status === "Delivered" ? "block" : "none";
    if (status === "Delivered") {
      container.innerHTML =
        '<div class="td-delivered">' +
          '<i class="fas fa-check-circle" style="font-size:64px;color:var(--success);"></i>' +
          '<h3>Delivered!</h3>' +
          '<p>Your order was delivered by <strong>' + deliveryPartner.name + '</strong></p>' +
        '</div>';
    }
    return;
  }

  if (card) card.style.display = "block";
  container.innerHTML =
    '<div class="td-card">' +
      '<div class="td-avatar" style="background:' + deliveryPartner.color + ';">' +
        deliveryPartner.name.charAt(0) +
      '</div>' +
      '<div class="td-info">' +
        '<strong>' + deliveryPartner.name + '</strong>' +
        '<span><i class="fas fa-motorcycle"></i> ' + deliveryPartner.vehicle + '</span>' +
        '<span class="td-estimated"><i class="fas fa-clock"></i> ' + getEstimatedTime(status) + '</span>' +
      '</div>' +
      '<a href="tel:' + deliveryPartner.phone.replace(/ /g, "") + '" class="td-call-btn" aria-label="Call delivery partner">' +
        '<i class="fas fa-phone-alt"></i>' +
      '</a>' +
    '</div>';
}

// ─── Render Order Info ───
function renderOrderInfo(orderData) {
  var container = document.getElementById("trackOrderInfo");
  if (!container) return;

  var rows = [
    { label: "Order ID",     value: '<span class="mono">#' + orderData._id.slice(-8).toUpperCase() + '</span>' },
    { label: "Placed On",    value: formatDate(orderData.orderedAt || orderData.createdAt) },
    { label: "Payment",      value: orderData.paymentMethod || "Cash on Delivery" },
    { label: "Payment Status", value: getStatusBadge(orderData.paymentStatus) },
    { label: "Total Items",  value: orderData.totalItems + " item" + (orderData.totalItems !== 1 ? "s" : "") },
    { label: "Total Amount", value: '<strong style="color:var(--primary);font-size:16px;">' + formatPrice(orderData.totalAmount) + '</strong>' },
  ];

  if (orderData.couponCode) {
    rows.push({ label: "Coupon", value: '<span class="mono" style="color:var(--success);">' + orderData.couponCode + ' (−' + formatPrice(orderData.discountAmount || 0) + ')</span>' });
  }
  if (orderData.discountAmount > 0) {
    rows.push({ label: "Discount", value: '<span style="color:var(--success);">−' + formatPrice(orderData.discountAmount) + '</span>' });
  }

  container.innerHTML = "";
  rows.forEach(function (r) {
    container.innerHTML +=
      '<div class="track-info-row">' +
        '<span class="tir-label">' + r.label + '</span>' +
        '<span class="tir-value">' + r.value + '</span>' +
      '</div>';
  });
}

function getStatusBadge(status) {
  var colors = {
    "Pending": "#FB8C00",
    "Paid": "#2E7D32",
    "Failed": "#C62828",
  };
  var c = colors[status] || "#666";
  return '<span class="tk-badge" style="background:' + c + '20;color:' + c + ';border:1px solid ' + c + '40;">' + (status || "Pending") + '</span>';
}

// ─── Render Address ───
function renderAddress(addr) {
  var container = document.getElementById("trackAddress");
  if (!container || !addr) {
    container.innerHTML = '<p style="color:var(--text-muted);">No delivery address available.</p>';
    return;
  }
  container.innerHTML =
    '<div class="ta-card">' +
      '<p class="ta-name"><i class="fas fa-user"></i> ' + (addr.fullName || "Recipient") + '</p>' +
      '<p>' + addr.addressLine1 + (addr.addressLine2 ? ", " + addr.addressLine2 : "") + '</p>' +
      '<p>' + addr.city + ", " + addr.state + " - " + addr.pincode + '</p>' +
      (addr.landmark ? '<p><i class="fas fa-flag"></i> Near: ' + addr.landmark + '</p>' : "") +
      '<p class="ta-phone"><i class="fas fa-phone"></i> ' + (addr.phone || "N/A") + '</p>' +
    '</div>';
}

// ─── Render Items ───
function renderItems(items) {
  var container = document.getElementById("trackItems");
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);">No items found.</p>';
    return;
  }
  container.innerHTML = "";
  items.forEach(function (item) {
    var total = (item.priceAtPurchase || 0) * (item.quantity || 1);
    var pid = item.product || "";
    container.innerHTML +=
      '<div class="track-item">' +
        '<a href="product-details.html?id=' + pid + '" class="ti-img-link">' +
          '<div class="ti-img">' +
            (item.image ? '<img src="' + item.image + '" alt="' + item.name + '" onerror="this.style.display=\'none\'">' : '<i class="fas fa-box"></i>') +
          '</div>' +
        '</a>' +
        '<div class="ti-info">' +
          '<a href="product-details.html?id=' + pid + '" class="ti-name">' + (item.name || "Product") + '</a>' +
          '<div class="ti-meta">' +
            '<span>Qty: ' + item.quantity + '</span>' +
            '<span>₹' + (item.priceAtPurchase || 0) + ' each</span>' +
          '</div>' +
          '<span class="ti-total">' + formatPrice(total) + '</span>' +
        '</div>' +
      '</div>';
  });
}

// ─── Render Actions ───
function renderActions(orderData) {
  var container = document.getElementById("trackActions");
  if (!container) return;

  var status = orderData.orderStatus || "Pending";
  var actions = [];

  actions.push({
    icon: "fa-sync-alt",
    label: "Refresh Status",
    cls: "shop-btn-outline",
    onclick: "loadOrder()"
  });

  // Cancel button (only for Pending or Confirmed)
  if (status === "Pending" || status === "Confirmed") {
    actions.push({
      icon: "fa-ban",
      label: "Cancel Order",
      cls: "shop-btn",
      style: "background:var(--danger);",
      onclick: "cancelCurrentOrder()"
    });
  }

  // Reorder button (for Delivered or Cancelled)
  if (status === "Delivered" || status === "Cancelled") {
    actions.push({
      icon: "fa-redo",
      label: "Reorder",
      cls: "shop-btn",
      onclick: "reorderCurrent()"
    });
  }

  // Download Invoice
  actions.push({
    icon: "fa-download",
    label: "Download Invoice",
    cls: "shop-btn-outline",
    onclick: "downloadInvoice()"
  });

  // Contact Support
  actions.push({
    icon: "fa-headset",
    label: "Contact Support",
    cls: "shop-btn-outline",
    onclick: "contactSupport()"
  });

  container.innerHTML = "";
  actions.forEach(function (a) {
    container.innerHTML +=
      '<button class="' + a.cls + '" onclick="' + a.onclick + '" ' + (a.style ? 'style="' + a.style + '"' : '') + '>' +
        '<i class="fas ' + a.icon + '"></i> ' + a.label +
      '</button>';
  });

  // Back button
  container.innerHTML +=
    '<button class="shop-btn-outline" onclick="window.location.href=\'orders.html\'" style="width:100%;margin-top:10px;justify-content:center;">' +
      '<i class="fas fa-arrow-left"></i> Back to Orders' +
    '</button>';
}

// ─── Actions ───
async function cancelCurrentOrder() {
  if (!order) return;
  if (!confirm("Are you sure you want to cancel this order?")) return;
  try {
    await cancelOrderAPI(order._id);
    showToast("Order cancelled successfully", "success");
    loadOrder();
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }
}

function reorderCurrent() {
  if (!order || !order.items) return;
  // Add all items from this order to the cart
  var cart = JSON.parse(localStorage.getItem("cart")) || [];
  order.items.forEach(function (item) {
    var existing = cart.find(function (c) {
      return (c._id || c.id) === (item.product || "");
    });
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({
        _id: item.product || "",
        id: item.product || "",
        name: item.name,
        price: item.priceAtPurchase || 0,
        image: item.image || "",
        quantity: item.quantity
      });
    }
  });
  localStorage.setItem("cart", JSON.stringify(cart));
  showToast("Items added to cart! Redirecting...", "success");
  setTimeout(function () {
    window.location.href = "cart.html";
  }, 800);
}

function downloadInvoice() {
  if (!order) return;
  if (typeof window.jspdf === "undefined") {
    showToast("PDF library not loaded", "error");
    return;
  }

  var addr = order.deliveryAddress || {};
  var items = order.items || [];
  var orderId = order._id || "";
  var shortId = orderId.slice(-8).toUpperCase();
  var invoiceNo = "INV-" + shortId + "-" + Math.floor(Math.random() * 1000);
  var orderDate = new Date(order.orderedAt || order.createdAt || Date.now());
  var dateStr = orderDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  var { jsPDF } = window.jspdf;
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ─── Colors ───
  var GREEN = "#2E7D32";
  var GREEN_LIGHT = "#E8F5E9";
  var DARK = "#1a1a2e";
  var GRAY = "#666666";
  var LIGHT_GRAY = "#f5f5f5";
  var WHITE = "#ffffff";

  var pageW = 210;
  var margin = 15;
  var contentW = pageW - margin * 2;
  var y = margin;
  var colLeft = margin;
  var colRight = pageW - margin;

  // ─── Helper: Draw a filled rect ───
  function rect(x, y, w, h, color) {
    doc.setFillColor(color);
    doc.rect(x, y, w, h, "F");
  }

  // ─── Helper: Write text with optional color, size, font style ───
  function text(str, x, y, opts) {
    opts = opts || {};
    doc.setFont("helvetica", opts.style || "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(opts.color || DARK);
    if (opts.align) doc.text(str, x, y, { align: opts.align });
    else doc.text(str, x, y);
  }

  // ═══════════════════════════════════════════
  // TOP GREEN HEADER BAR
  // ═══════════════════════════════════════════
  rect(margin, y, contentW, 22, GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(WHITE);
  doc.text("GROCERYHUB", margin + 6, y + 15);
  text("TAX INVOICE", colRight - 6, y + 15, { align: "right", color: WHITE, size: 14, style: "bold" });
  y += 28;

  // ═══════════════════════════════════════════
  // INVOICE INFO — Two-column layout
  // ═══════════════════════════════════════════
  // Left: Invoice details
  text("Invoice #:", margin, y, { color: GRAY, size: 9 });
  text(invoiceNo, margin + 22, y, { color: DARK, size: 10, style: "bold" });
  y += 6;
  text("Order ID:", margin, y, { color: GRAY, size: 9 });
  text("#" + shortId, margin + 22, y, { color: DARK, size: 10, style: "bold" });
  y += 6;
  text("Date:", margin, y, { color: GRAY, size: 9 });
  text(dateStr, margin + 22, y, { color: DARK, size: 10 });
  y += 6;
  text("Payment:", margin, y, { color: GRAY, size: 9 });
  text(order.paymentMethod || "Cash on Delivery", margin + 22, y, { color: DARK, size: 10 });

  // Right: Status badges (simulated with colored text)
  var statusColor = order.orderStatus === "Delivered" ? GREEN : order.orderStatus === "Cancelled" ? "#C62828" : "#FB8C00";
  text("Order Status", colRight - 6, margin + 28, { align: "right", color: GRAY, size: 9 });
  text(order.orderStatus || "Pending", colRight - 6, margin + 28 + 6, { align: "right", color: statusColor, size: 12, style: "bold" });
  text("Payment Status", colRight - 6, margin + 28 + 14, { align: "right", color: GRAY, size: 9 });
  text(order.paymentStatus || "Pending", colRight - 6, margin + 28 + 20, { align: "right", color: order.paymentStatus === "Paid" ? GREEN : "#FB8C00", size: 12, style: "bold" });

  y = margin + 28 + 28;

  // ═══════════════════════════════════════════
  // CUSTOMER & DELIVERY SECTION
  // ═══════════════════════════════════════════
  rect(margin, y, contentW, 25, GREEN_LIGHT);
  text("DELIVER TO", margin + 4, y + 5, { color: GREEN, size: 8, style: "bold" });
  var addrLines = [];
  addrLines.push((addr.fullName || "Customer"));
  var a1 = addr.addressLine1 || "";
  if (addr.addressLine2) a1 += ", " + addr.addressLine2;
  addrLines.push(a1);
  addrLines.push((addr.city || "") + ", " + (addr.state || "") + " - " + (addr.pincode || ""));
  if (addr.phone) addrLines.push("Phone: " + addr.phone);
  addrLines.forEach(function (line, i) {
    text(line, margin + 4, y + 13 + i * 5, { color: DARK, size: 9 });
  });
  y += 30;

  // ═══════════════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════════════
  // Table header
  var tableTop = y;
  var colProduct = margin + 4;
  var colQty = colRight - 50;
  var colPrice = colRight - 28;
  var colTotal = colRight - 4;
  var rowH = 7;

  rect(margin, tableTop, contentW, rowH, GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(WHITE);
  doc.text("#", colProduct, tableTop + 5);
  doc.text("Product", colProduct + 6, tableTop + 5);
  doc.text("Qty", colQty, tableTop + 5, { align: "center" });
  doc.text("Price", colPrice, tableTop + 5, { align: "center" });
  doc.text("Total", colTotal, tableTop + 5, { align: "right" });
  y = tableTop + rowH;

  // Table rows
  items.forEach(function (item, idx) {
    var lineTotal = (item.priceAtPurchase || 0) * (item.quantity || 1);
    var bgColor = idx % 2 === 0 ? WHITE : GREEN_LIGHT;
    rect(margin, y, contentW, rowH, bgColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(DARK);
    doc.text(String(idx + 1), colProduct, y + 5);
    doc.text(item.name || "Product", colProduct + 6, y + 5);
    doc.text(String(item.quantity || 1), colQty, y + 5, { align: "center" });
    doc.text("₹" + (item.priceAtPurchase || 0).toLocaleString("en-IN"), colPrice, y + 5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("₹" + lineTotal.toLocaleString("en-IN"), colTotal, y + 5, { align: "right" });
    y += rowH;
  });

  // Table bottom border
  rect(margin, y, contentW, 0.5, GREEN);
  y += 4;

  // ═══════════════════════════════════════════
  // PRICE SUMMARY (Right-aligned)
  // ═══════════════════════════════════════════
  var summaryX = colRight - 80;
  var summaryW = 80;

  var subtotal = items.reduce(function (sum, item) {
    return sum + (item.priceAtPurchase || 0) * (item.quantity || 1);
  }, 0);
  var couponDiscount = order.discountAmount || 0;
  var delivery = subtotal >= 199 ? 0 : 29;
  var platformFee = 3;
  var tax = Math.round(subtotal * 0.05);
  var grandTotal = subtotal - couponDiscount + delivery + platformFee + tax;
  if (grandTotal < 0) grandTotal = 0;

  var summaryRows = [
    { label: "Subtotal", value: subtotal, bold: false },
  ];
  if (couponDiscount > 0) summaryRows.push({ label: "Coupon Savings (" + (order.couponCode || "") + ")", value: -couponDiscount, bold: false, color: GREEN });
  if (delivery > 0) summaryRows.push({ label: "Delivery", value: delivery, bold: false });
  else summaryRows.push({ label: "Delivery", value: 0, bold: false, color: GREEN });
  summaryRows.push({ label: "Platform Fee", value: platformFee, bold: false });
  summaryRows.push({ label: "Tax (est. 5%)", value: tax, bold: false });
  summaryRows.push({ label: "GRAND TOTAL", value: grandTotal, bold: true });

  // Draw summary box background
  rect(summaryX, y, summaryW, summaryRows.length * rowH + 4, GREEN_LIGHT);
  y += 2;

  summaryRows.forEach(function (row) {
    var valStr = row.value < 0 ? "−₹" + Math.abs(row.value).toLocaleString("en-IN") : (row.label === "Delivery" && row.value === 0 ? "FREE" : "₹" + row.value.toLocaleString("en-IN"));
    if (row.label === "Delivery" && row.value === 0) valStr = "FREE";
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setFontSize(row.bold ? 11 : 9);
    doc.setTextColor(row.color || (row.bold ? DARK : GRAY));
    doc.text(row.label, summaryX + 4, y + 4);
    doc.text(valStr, colRight - 4, y + 4, { align: "right" });
    y += rowH;
  });

  y += 8;

  // ═══════════════════════════════════════════
  // QR CODE + THANK YOU (Footer area)
  // ═══════════════════════════════════════════
  // Generate QR code from order data
  try {
    if (typeof QRCode !== "undefined") {
      var qrData = "https://groceryhub.example.com/order/" + shortId;
      var qr = QRCode(0, "M");
      qr.addData(qrData);
      qr.make();

      // Draw QR on a temporary canvas
      var qrSize = 30; // mm
      var qrX = margin;
      var qrY = y;
      var cells = qr.getModuleCount();
      var cellSize = qrSize / cells;

      // Draw QR background
      rect(qrX, qrY, qrSize, qrSize, WHITE);

      // Draw QR as SVG paths using doc.rect
      for (var row = 0; row < cells; row++) {
        for (var col = 0; col < cells; col++) {
          if (qr.isDark(row, col)) {
            var xPos = qrX + col * cellSize;
            var yPos = qrY + row * cellSize;
            // Only draw larger blocks to keep file small
            if (cellSize >= 0.5) {
              doc.setFillColor(DARK);
              doc.rect(xPos, yPos, cellSize, cellSize, "F");
            }
          }
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(GRAY);
      doc.text("Scan to track order", qrX, qrY + qrSize + 4);
    }
  } catch (e) {
    // QR generation failed silently — not critical
  }

  // Thank you message (right side of footer)
  var thanksX = margin + 55;
  text("Thank You for Choosing GroceryHub!", thanksX, y + 8, { color: GREEN, size: 14, style: "bold" });
  text("We appreciate your business. For any queries, contact support@groceryhub.com", thanksX, y + 16, { color: GRAY, size: 9 });
  text("This is a computer-generated invoice and does not require a physical signature.", thanksX, y + 23, { color: GRAY, size: 8 });

  y += 40;

  // Bottom line
  rect(margin, y, contentW, 0.3, GRAY);

  // Footer with page info
  text("Page 1 of 1 | Generated on " + new Date().toLocaleString("en-IN"), colRight - 6, y + 6, { align: "right", color: GRAY, size: 7 });
  text("© 2026 GroceryHub — Fresh Groceries Delivered Fast", margin, y + 6, { color: GRAY, size: 7 });

  // ─── Save PDF ───
  doc.save("GroceryHub_Invoice_" + shortId + ".pdf");
  showToast("Invoice downloaded as PDF", "success");
}

function contactSupport() {
  window.location.href = "mailto:support@groceryhub.com?subject=Order%20" + (order ? order._id.slice(-8).toUpperCase() : "") + "%20Inquiry";
}

// ─── Map Initialization ───
function initMap(addr) {
  var mapContainer = document.getElementById("trackMap");
  if (!mapContainer) return;

  // Get base coordinates
  var coords = CITY_COORDS[addr.city] || DEFAULT_COORDS;

  // Destroy existing map if any
  if (trackingMap) {
    trackingMap.remove();
    trackingMap = null;
  }

  // Initialize map
  trackingMap = L.map("trackMap", {
    center: coords,
    zoom: 13,
    zoomControl: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(trackingMap);

  // Store marker at [coords + small offset]
  var storeCoords = [coords[0] + 0.008, coords[1] - 0.008];
  var customerCoords = [coords[0] - 0.008, coords[1] + 0.008];

  // Store icon
  var storeIcon = L.divIcon({
    className: "tm-store-icon",
    html: '<div class="tm-marker tm-store"><i class="fas fa-store-alt"></i></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // Customer icon
  var customerIcon = L.divIcon({
    className: "tm-customer-icon",
    html: '<div class="tm-marker tm-customer"><i class="fas fa-home"></i></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  L.marker(storeCoords, { icon: storeIcon }).addTo(trackingMap).bindTooltip("GroceryHub Store", { permanent: true, direction: "top" });
  L.marker(customerCoords, { icon: customerIcon }).addTo(trackingMap).bindTooltip("Your Location", { permanent: true, direction: "bottom" });

  // Generate route points
  var routePoints = generateRoute(storeCoords, customerCoords, 10);

  // Draw route line
  routeLine = L.polyline(routePoints, {
    color: "#2E7D32",
    weight: 3,
    opacity: 0.6,
    dashArray: "10, 10",
  }).addTo(trackingMap);

  // Delivery marker
  var deliveryIcon = L.divIcon({
    className: "tm-delivery-icon",
    html: '<div class="tm-marker tm-delivery"><i class="fas fa-motorcycle"></i></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  var status = order ? order.orderStatus : "";
  var statusIdx = getStatusIndex(status);

  var deliveryPos = routePoints[0]; // Start at store
  if (statusIdx >= 3) {
    // Out for Delivery or later: show delivery moving
    var pct = status === "Delivered" ? 1 : 0.6;
    var idx = Math.floor(pct * (routePoints.length - 1));
    deliveryPos = routePoints[idx] || routePoints[0];
  }

  deliveryMarker = L.marker(deliveryPos, { icon: deliveryIcon }).addTo(trackingMap);

  // Animate delivery movement if Out for Delivery
  if (status === "Out for Delivery" || status === "Delivered") {
    simulateDelivery(routePoints, status === "Delivered");
  }

  // Fit bounds
  var bounds = L.latLngBounds([storeCoords, customerCoords]);
  trackingMap.fitBounds(bounds, { padding: [50, 50] });
}

function generateRoute(start, end, steps) {
  var points = [];
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    // Add some random offset to simulate road path
    var lat = start[0] + (end[0] - start[0]) * t + (Math.sin(t * Math.PI * 3) * 0.002);
    var lng = start[1] + (end[1] - start[1]) * t + (Math.cos(t * Math.PI * 2) * 0.002);
    points.push([lat, lng]);
  }
  return points;
}

function simulateDelivery(routePoints, delivered) {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }

  var totalSteps = routePoints.length;
  var startIdx = 0;

  simProgress = delivered ? 1 : 0.3;
  startIdx = Math.floor(simProgress * (totalSteps - 1));

  simInterval = setInterval(function () {
    simProgress += 0.03;
    if (simProgress >= 1) {
      simProgress = 1;
      clearInterval(simInterval);
      simInterval = null;
      // Show arrived notification
      showToast("🎉 Delivery partner has arrived!", "success");
    }
    var idx = Math.floor(simProgress * (totalSteps - 1));
    if (idx >= totalSteps) idx = totalSteps - 1;
    if (deliveryMarker) {
      deliveryMarker.setLatLng(routePoints[idx]);
    }
    if (routeLine) {
      // Update polyline to show traveled portion in solid
      var traveled = routePoints.slice(0, idx + 1);
      trackingMap.removeLayer(routeLine);
      routeLine = L.polyline(traveled, {
        color: "#2E7D32",
        weight: 4,
        opacity: 0.9,
      }).addTo(trackingMap);
    }
  }, 2000);
}

// ─── Init ───
loadOrder();

// Clean up interval on page unload
window.addEventListener("beforeunload", function () {
  if (simInterval) clearInterval(simInterval);
  if (trackingMap) trackingMap.remove();
});
