/* ============================================
   GroceryHub — Admin Analytics Dashboard
   Chart.js, date-range filters, export (PDF/Excel)
   ============================================ */

// ─── State ───
var analyticsData = null;
var currentRange = "month";
var chartInstances = {};

// ─── Date Helpers ───
function fmtDate(d) { return d.toISOString().slice(0, 10); }
function fmtInr(n) { return "₹" + (n || 0).toLocaleString("en-IN"); }

// ─── Load Analytics ───
async function loadAnalytics() {
  var container = document.getElementById("dashboardContent");
  container.innerHTML = '<div class="ad-loading"><div class="ad-spinner"></div><p>Loading analytics...</p></div>';

  try {
    var url = "/admin/analytics?range=" + currentRange;
    var startEl = document.getElementById("startDate");
    var endEl = document.getElementById("endDate");
    if (currentRange === "custom" && startEl && endEl && startEl.value && endEl.value) {
      url = "/admin/analytics?start=" + startEl.value + "&end=" + endEl.value;
    }
    analyticsData = await apiRequest(url);
    renderDashboard(analyticsData);
  } catch (e) {
    container.innerHTML = '<div class="ad-error"><i class="fas fa-exclamation-triangle"></i><h3>Failed to load analytics</h3><p>' + e.message + '</p><button class="btn btn-primary" onclick="loadAnalytics()">Retry</button></div>';
  }
}

// ─── Apply Custom Date ───
function applyAnalytics() {
  var startEl = document.getElementById("startDate");
  var endEl = document.getElementById("endDate");
  if (!startEl.value || !endEl.value) { alert("Please select both start and end dates"); return; }
  currentRange = "custom";
  document.querySelectorAll(".ad-filter-btn").forEach(function(b) { b.classList.remove("active"); });
  loadAnalytics();
}

// ─── Set up filter buttons ───
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll(".ad-filter-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".ad-filter-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentRange = btn.getAttribute("data-range");
      var customDateEl = document.getElementById("customDateRange");
      if (customDateEl) customDateEl.style.display = currentRange === "custom" ? "flex" : "none";
      loadAnalytics();
    });
  });
  // Set default dates for custom range
  var sd = document.getElementById("startDate");
  var ed = document.getElementById("endDate");
  if (sd) { var d = new Date(); d.setDate(d.getDate() - 30); sd.value = fmtDate(d); }
  if (ed) ed.value = fmtDate(new Date());
});

// ═══════════════════════════════════════════
// RENDER DASHBOARD
// ═══════════════════════════════════════════
function renderDashboard(data) {
  var s = data.stats;
  var c = data.charts;

  var html =
    // ─── Stats Cards ───
    '<div class="ad-stats-row">' +
      card("Revenue Today", fmtInr(s.revenueToday), "fa-indian-rupee-sign", "green") +
      card("Revenue This Month", fmtInr(s.revenueMonth), "fa-calendar-alt", "blue") +
      card("Total Sales", fmtInr(s.totalSales), "fa-chart-line", "green") +
      card("Total Orders", s.totalOrders, "fa-shopping-cart", "purple") +
    '</div>' +
    '<div class="ad-stats-row">' +
      card("Total Customers", s.totalCustomers, "fa-users", "blue") +
      card("Avg Order Value", fmtInr(s.averageOrderValue), "fa-calculator", "teal") +
      card("Returning", s.returningCustomers, "fa-undo-alt", "orange") +
      card("New Customers", s.newCustomers, "fa-user-plus", "green") +
    '</div>' +
    '<div class="ad-stats-row">' +
      card("Orders (Filtered)", s.dateOrders, "fa-truck", "purple") +
      card("Products", s.totalProducts, "fa-boxes", "blue") +
      card("Low Stock", s.lowStock, "fa-exclamation-triangle", "orange") +
      card("Out of Stock", s.outOfStock, "fa-times-circle", "red") +
    '</div>' +

    // ─── Charts Grid ───
    '<div class="ad-charts-grid">' +
      chartBox("Revenue Trend", "line", "revenueTrendChart", "800px") +
      chartBox("Orders Per Day", "bar", "ordersPerDayChart", "800px") +
    '</div>' +
    '<div class="ad-charts-grid two-col">' +
      chartBox("Sales by Category", "doughnut", "categoryChart", "400px") +
      chartBox("Top Selling Products", "bar", "topProductsChart", "400px") +
    '</div>' +
    '<div class="ad-charts-grid">' +
      chartBox("Monthly Revenue", "bar", "monthlyRevenueChart", "800px") +
    '</div>' +

    // ─── Bottom Cards ───
    '<div class="ad-bottom-grid">' +
      bottomCard("Low Stock Products", s.lowStock, "fa-exclamation-triangle", "orange", renderLowStockProducts(data)) +
      bottomCard("Out of Stock Products", s.outOfStock, "fa-times-circle", "red", renderOutOfStock(data)) +
    '</div>' +
    '<div class="ad-bottom-grid">' +
      bottomCard("Recent Orders", data.recentOrders.length, "fa-truck", "blue", renderRecentOrders(data)) +
      bottomCard("Recent Customers", data.recentCustomers.length, "fa-users", "green", renderRecentCustomers(data)) +
    '</div>';

  document.getElementById("dashboardContent").innerHTML = html;

  // ─── Initialize Charts ───
  setTimeout(function() {
    initRevenueTrendChart(c.revenueTrend);
    initOrdersPerDayChart(c.ordersPerDay);
    initCategoryChart(c.categorySales);
    initTopProductsChart(c.topProducts);
    initMonthlyRevenueChart(c.monthlyRevenue);
  }, 100);
}

// ─── Helper: Stat Card ───
function card(label, value, icon, color) {
  var v = String(value);
  return '<div class="ad-stat-card ' + color + '"><div class="ad-stat-icon"><i class="fas ' + icon + '"></i></div><div class="ad-stat-body"><div class="ad-stat-value" data-target="' + v.replace(/[₹,]/g,"") + '">' + v + '</div><div class="ad-stat-label">' + label + '</div></div></div>';
}

// ─── Helper: Chart Box ───
function chartBox(title, type, id, height) {
  return '<div class="ad-chart-box"><div class="ad-chart-header"><h3><i class="fas fa-chart-' + (type === "line" ? "line" : type === "bar" ? "bar" : "pie") + '"></i> ' + title + '</h3></div><div class="ad-chart-body"><canvas id="' + id + '" height="300"></canvas></div></div>';
}

// ─── Helper: Bottom Card ───
function bottomCard(title, count, icon, color, content) {
  return '<div class="ad-bottom-card"><div class="ad-bottom-header"><div><i class="fas ' + icon + '" style="color:var(--' + color + ');"></i> <h3>' + title + '</h3></div><span class="ad-badge ' + color + '">' + count + '</span></div><div class="ad-bottom-body">' + content + '</div></div>';
}

// ═══════════════════════════════════════════
// LOW STOCK / OUT OF STOCK
// ═══════════════════════════════════════════
function renderLowStockProducts(data) {
  return '<p style="color:var(--text-muted);padding:20px;text-align:center;"><i class="fas fa-box"></i> ' + data.stats.lowStock + ' products with low stock</p>';
}

function renderOutOfStock(data) {
  return '<p style="color:var(--text-muted);padding:20px;text-align:center;"><i class="fas fa-box"></i> ' + data.stats.outOfStock + ' products out of stock</p>';
}

// ─── Recent Orders ───
function renderRecentOrders(data) {
  if (!data.recentOrders || data.recentOrders.length === 0) {
    return '<div class="ad-empty"><i class="fas fa-clipboard"></i><p>No recent orders</p></div>';
  }
  var h = "";
  data.recentOrders.forEach(function(o) {
    var items = (o.items || []).map(function(i) { return i.name; }).join(", ");
    h += '<div class="ad-list-item"><div class="ad-li-left"><span class="ad-li-title">#' + (o._id ? o._id.slice(-8).toUpperCase() : "") + '</span><span>' + (items.slice(0, 40) + (items.length > 40 ? "..." : "")) + '</span></div><div class="ad-li-right"><span class="status-badge status-' + (o.orderStatus || "").replace(/ /g, "") + '">' + (o.orderStatus || "") + '</span><strong style="color:var(--admin-primary);">' + fmtInr(o.totalAmount) + '</strong></div></div>';
  });
  return h;
}

// ─── Recent Customers ───
function renderRecentCustomers(data) {
  if (!data.recentCustomers || data.recentCustomers.length === 0) {
    return '<div class="ad-empty"><i class="fas fa-users"></i><p>No customers yet</p></div>';
  }
  var h = "";
  data.recentCustomers.forEach(function(u) {
    h += '<div class="ad-list-item"><div class="ad-li-left"><span class="ad-li-title">' + (u.name || "") + '</span><span>' + (u.email || "") + '</span></div><div class="ad-li-right"><span class="ad-li-date">' + (u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", {month:"short", day:"numeric"}) : "") + '</span></div></div>';
  });
  return h;
}

// ═══════════════════════════════════════════
// CHART INITIALIZATION
// ═══════════════════════════════════════════
function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function createChart(id, config) {
  destroyChart(id);
  var ctx = document.getElementById(id);
  if (!ctx) return;
  chartInstances[id] = new Chart(ctx.getContext("2d"), config);
}

// Colors
var COLORS = ["#2E7D32", "#1565C0", "#E65100", "#7B1FA2", "#00838F", "#C62828", "#FF6F00", "#4CAF50", "#42A5F5", "#FF9800"];
var COLORS_ALPHA = COLORS.map(function(c) { return c + "CC"; });

// ─── Revenue Trend (Line) ───
function initRevenueTrendChart(data) {
  if (!data || data.length === 0) {
    document.getElementById("revenueTrendChart").parentElement.innerHTML = '<div class="ad-empty"><i class="fas fa-chart-line"></i><p>No revenue data for this period</p></div>';
    return;
  }
  createChart("revenueTrendChart", {
    type: "line",
    data: {
      labels: data.map(function(d) { return d._id; }),
      datasets: [{
        label: "Revenue (₹)",
        data: data.map(function(d) { return d.revenue; }),
        borderColor: "#2E7D32",
        backgroundColor: "rgba(46,125,50,0.08)",
        borderWidth: 3,
        pointBackgroundColor: "#2E7D32",
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return "₹" + ctx.parsed.y.toLocaleString("en-IN"); } } } },
      scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return "₹" + v.toLocaleString("en-IN"); } } } }
    }
  });
}

// ─── Orders Per Day (Bar) ───
function initOrdersPerDayChart(data) {
  if (!data || data.length === 0) {
    document.getElementById("ordersPerDayChart").parentElement.innerHTML = '<div class="ad-empty"><i class="fas fa-chart-bar"></i><p>No order data for this period</p></div>';
    return;
  }
  createChart("ordersPerDayChart", {
    type: "bar",
    data: {
      labels: data.map(function(d) { return d._id; }),
      datasets: [{
        label: "Orders",
        data: data.map(function(d) { return d.count; }),
        backgroundColor: "rgba(21,101,192,0.6)",
        borderColor: "#1565C0",
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// ─── Sales by Category (Doughnut) ───
function initCategoryChart(data) {
  if (!data || data.length === 0) {
    document.getElementById("categoryChart").parentElement.innerHTML = '<div class="ad-empty"><i class="fas fa-chart-pie"></i><p>No category sales data for this period</p></div>';
    return;
  }
  var sliced = data.slice(0, 8);
  createChart("categoryChart", {
    type: "doughnut",
    data: {
      labels: sliced.map(function(d) { return d.category; }),
      datasets: [{
        data: sliced.map(function(d) { return d.revenue; }),
        backgroundColor: COLORS.slice(0, sliced.length),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function(ctx) { var l = ctx.label || ""; var v = ctx.parsed || 0; return l + ": ₹" + v.toLocaleString("en-IN"); } } }
      }
    }
  });
}

// ─── Top Selling Products (Horizontal Bar) ───
function initTopProductsChart(data) {
  if (!data || data.length === 0) {
    document.getElementById("topProductsChart").parentElement.innerHTML = '<div class="ad-empty"><i class="fas fa-chart-bar"></i><p>No product sales data for this period</p></div>';
    return;
  }
  var sliced = data.slice(0, 8).reverse();
  createChart("topProductsChart", {
    type: "bar",
    data: {
      labels: sliced.map(function(d) { return d._id; }),
      datasets: [{
        label: "Qty Sold",
        data: sliced.map(function(d) { return d.quantity; }),
        backgroundColor: sliced.map(function(_, i) { return COLORS[i % COLORS.length] + "CC"; }),
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// ─── Monthly Revenue (Bar) ───
function initMonthlyRevenueChart(data) {
  if (!data || data.length === 0) {
    document.getElementById("monthlyRevenueChart").parentElement.innerHTML = '<div class="ad-empty"><i class="fas fa-chart-bar"></i><p>No monthly data yet</p></div>';
    return;
  }
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  createChart("monthlyRevenueChart", {
    type: "bar",
    data: {
      labels: data.map(function(d) { return months[(d._id.month || 1) - 1] + " " + (d._id.year || ""); }),
      datasets: [
        {
          label: "Revenue",
          data: data.map(function(d) { return d.revenue; }),
          backgroundColor: "rgba(46,125,50,0.7)",
          borderColor: "#2E7D32",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y",
        },
        {
          label: "Orders",
          data: data.map(function(d) { return d.orders; }),
          backgroundColor: "rgba(21,101,192,0.5)",
          borderColor: "#1565C0",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y1",
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ": " + (ctx.dataset.label === "Revenue" ? "₹" + ctx.parsed.y.toLocaleString("en-IN") : ctx.parsed.y); } } }
      },
      scales: {
        y: { beginAtZero: true, position: "left", ticks: { callback: function(v) { return "₹" + v.toLocaleString("en-IN"); } } },
        y1: { beginAtZero: true, position: "right", grid: { display: false } }
      }
    }
  });
}

// ═══════════════════════════════════════════
// EXPORT: PDF
// ═══════════════════════════════════════════
function exportPDF() {
  if (!analyticsData || typeof window.jspdf === "undefined") {
    alert("Analytics data not loaded or PDF library unavailable");
    return;
  }
  var { jsPDF } = window.jspdf;
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var s = analyticsData.stats;
  var GREEN = "#2E7D32";
  var GRAY = "#666666";
  var DARK = "#1a1a2e";
  var margin = 15;
  var y = margin;
  var pageW = 210;

  function rect(x, y, w, h, color) { doc.setFillColor(color); doc.rect(x, y, w, h, "F"); }
  function txt(str, x, y, opts) {
    opts = opts || {};
    doc.setFont("helvetica", opts.style || "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(opts.color || DARK);
    doc.text(str, x, y, opts.align ? { align: opts.align } : undefined);
  }

  // Header
  rect(margin, y, pageW - margin * 2, 18, GREEN);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor("#ffffff");
  doc.text("GROCERYHUB - ANALYTICS REPORT", margin + 5, y + 13);
  txt(new Date().toLocaleDateString("en-IN", {year:"numeric",month:"long",day:"numeric"}), pageW - margin - 5, y + 13, { align: "right", color: "#ffffff", size: 9 });
  y += 25;

  // Stats
  txt("KEY METRICS", margin, y, { color: GREEN, size: 11, style: "bold" });
  y += 8;
  var statsList = [
    ["Total Orders", s.totalOrders, "Revenue", "₹" + (s.totalSales || 0).toLocaleString("en-IN")],
    ["Customers", s.totalCustomers, "Avg Order Value", "₹" + (s.averageOrderValue || 0).toLocaleString("en-IN")],
    ["Products", s.totalProducts, "Low Stock", s.lowStock],
  ];
  statsList.forEach(function(row) {
    txt(row[0], margin, y, { color: GRAY, size: 9 });
    txt(String(row[1]), margin + 50, y, { color: DARK, size: 10, style: "bold" });
    txt(row[2], margin + 100, y, { color: GRAY, size: 9 });
    txt(String(row[3]), margin + 160, y, { color: DARK, size: 10, style: "bold" });
    y += 6;
  });

  y += 6;

  // Top Products
  if (analyticsData.charts.topProducts && analyticsData.charts.topProducts.length > 0) {
    rect(margin, y, pageW - margin * 2, 8, GREEN);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#ffffff");
    doc.text("Product", margin + 4, y + 6);
    doc.text("Qty", pageW - margin - 30, y + 6, { align: "center" });
    doc.text("Revenue", pageW - margin - 4, y + 6, { align: "right" });
    y += 10;

    analyticsData.charts.topProducts.slice(0, 8).forEach(function(p, i) {
      var bg = i % 2 === 0 ? "#ffffff" : "#E8F5E9";
      rect(margin, y, pageW - margin * 2, 6, bg);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(DARK);
      doc.text((p._id || "").substring(0, 30), margin + 4, y + 5);
      doc.text(String(p.quantity || 0), pageW - margin - 30, y + 5, { align: "center" });
      doc.text("₹" + (p.revenue || 0).toLocaleString("en-IN"), pageW - margin - 4, y + 5, { align: "right" });
      y += 6.5;
    });
    y += 5;
  }

  // Category Sales
  if (analyticsData.charts.categorySales && analyticsData.charts.categorySales.length > 0) {
    txt("SALES BY CATEGORY", margin, y, { color: GREEN, size: 11, style: "bold" });
    y += 8;
    analyticsData.charts.categorySales.slice(0, 6).forEach(function(c) {
      txt(c.category, margin, y, { color: DARK, size: 9 });
      txt("₹" + (c.revenue || 0).toLocaleString("en-IN"), pageW - margin - 4, y, { align: "right", color: GREEN, size: 9, style: "bold" });
      y += 5.5;
    });
  }

  // Footer
  y = 270;
  rect(margin, y, pageW - margin * 2, 0.3, GRAY);
  txt("Generated by GroceryHub Admin | © 2026", margin, y + 6, { color: GRAY, size: 7 });

  doc.save("GroceryHub_Analytics_Report.pdf");
}

// ═══════════════════════════════════════════
// EXPORT: Excel
// ═══════════════════════════════════════════
function exportExcel() {
  if (!analyticsData || typeof XLSX === "undefined") {
    alert("Analytics data not loaded or Excel library unavailable");
    return;
  }

  var wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  var s = analyticsData.stats;
  var summaryData = [
    ["Metric", "Value"],
    ["Total Orders", s.totalOrders],
    ["Total Revenue", s.totalSales],
    ["Total Customers", s.totalCustomers],
    ["Average Order Value", s.averageOrderValue],
    ["Returning Customers", s.returningCustomers],
    ["New Customers", s.newCustomers],
    ["Total Products", s.totalProducts],
    ["Low Stock Products", s.lowStock],
    ["Out of Stock Products", s.outOfStock],
    ["Orders (Filtered)", s.dateOrders],
    ["Revenue Today", s.revenueToday],
  ];
  var ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: Revenue Trend
  if (analyticsData.charts.revenueTrend && analyticsData.charts.revenueTrend.length > 0) {
    var trendData = [["Date", "Revenue", "Orders"]];
    analyticsData.charts.revenueTrend.forEach(function(d) {
      trendData.push([d._id, d.revenue, d.orders || 0]);
    });
    var ws2 = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, ws2, "Revenue Trend");
  }

  // Sheet 3: Top Products
  if (analyticsData.charts.topProducts && analyticsData.charts.topProducts.length > 0) {
    var prodData = [["Product", "Quantity Sold", "Revenue"]];
    analyticsData.charts.topProducts.forEach(function(p) {
      prodData.push([p._id, p.quantity, p.revenue]);
    });
    var ws3 = XLSX.utils.aoa_to_sheet(prodData);
    XLSX.utils.book_append_sheet(wb, ws3, "Top Products");
  }

  // Sheet 4: Category Sales
  if (analyticsData.charts.categorySales && analyticsData.charts.categorySales.length > 0) {
    var catData = [["Category", "Revenue"]];
    analyticsData.charts.categorySales.forEach(function(c) {
      catData.push([c.category, c.revenue]);
    });
    var ws4 = XLSX.utils.aoa_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, ws4, "Category Sales");
  }

  XLSX.writeFile(wb, "GroceryHub_Analytics_Data.xlsx");
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
loadAnalytics();

// Reset charts on window resize
var resizeTimer;
window.addEventListener("resize", function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    Object.keys(chartInstances).forEach(function(key) {
      if (chartInstances[key]) chartInstances[key].resize();
    });
  }, 250);
});
