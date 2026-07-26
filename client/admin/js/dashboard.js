// Animated counter: smoothly counts up to the target value
function animateCounter(el, target, suffix) {
  suffix = suffix || "";
  var duration = 800;
  var start = performance.now();

  function step(now) {
    var elapsed = now - start;
    var progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(eased * target);
    el.textContent = suffix + current.toLocaleString("en-IN");
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = suffix + target.toLocaleString("en-IN");
    }
  }

  requestAnimationFrame(step);
}

// Animated counter for revenue (has ₹ prefix and commas)
function animateRevenue(el, target) {
  var duration = 800;
  var start = performance.now();

  function step(now) {
    var elapsed = now - start;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(eased * target);
    el.textContent = "\u20B9" + current.toLocaleString("en-IN");
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = "\u20B9" + target.toLocaleString("en-IN");
    }
  }

  requestAnimationFrame(step);
}

(async function loadDashboard() {
  try {
    const data = await adminFetchDashboard();
    const s = data.stats;
    var html =
      '<div class="stats-grid" id="statsGrid">' +
      '<div class="stat-card green"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-value" id="statTotalUsers">0</div><div class="stat-label">Total Users</div></div>' +
      '<div class="stat-card blue"><div class="stat-icon"><i class="fas fa-boxes"></i></div><div class="stat-value" id="statTotalProducts">0</div><div class="stat-label">Total Products</div></div>' +
      '<div class="stat-card purple"><div class="stat-icon"><i class="fas fa-truck"></i></div><div class="stat-value" id="statTotalOrders">0</div><div class="stat-label">Total Orders</div></div>' +
      '<div class="stat-card green"><div class="stat-icon"><i class="fas fa-indian-rupee-sign"></i></div><div class="stat-value" id="statRevenue">\u20B90</div><div class="stat-label">Revenue (Delivered)</div></div>' +
      '<div class="stat-card orange"><div class="stat-icon"><i class="fas fa-clock"></i></div><div class="stat-value" id="statPendingOrders">0</div><div class="stat-label">Pending Orders</div></div>' +
      '<div class="stat-card teal"><div class="stat-icon"><i class="fas fa-circle-check"></i></div><div class="stat-value" id="statDelivered">0</div><div class="stat-label">Delivered</div></div>' +
      '<div class="stat-card red"><div class="stat-icon"><i class="fas fa-ban"></i></div><div class="stat-value" id="statCancelled">0</div><div class="stat-label">Cancelled</div></div>' +
      '<div class="stat-card blue"><div class="stat-icon"><i class="fas fa-triangle-exclamation"></i></div><div class="stat-value" id="statLowStock">0</div><div class="stat-label">Low Stock</div></div>' +
      '</div>';

    // Sort config for tables
    var sortOrders = {};
    function getSortIcon(col) { return '<i class="fas fa-sort" style="cursor:pointer;opacity:0.4;margin-left:4px;font-size:10px;" onclick="event.stopPropagation()"></i>'; }

    // Recent orders table
    html += '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-truck"></i> Recent Orders</h3></div>';
    if (data.recentOrders && data.recentOrders.length) {
      html += '<div class="admin-table-wrapper"><table class="admin-table" id="recentOrdersTable"><thead><tr>' +
        '<th onclick="sortTable(\'recentOrdersTable\',0,\'string\')"><i class="fas fa-hashtag"></i>Order ID' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentOrdersTable\',1,\'string\')"><i class="fas fa-user"></i>Customer' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentOrdersTable\',2,\'string\')"><i class="fas fa-shopping-cart"></i>Items' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentOrdersTable\',3,\'number\')"><i class="fas fa-indian-rupee-sign"></i>Amount' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentOrdersTable\',4,\'string\')"><i class="fas fa-tag"></i>Status' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentOrdersTable\',5,\'date\')"><i class="fas fa-calendar"></i>Date' + getSortIcon() + '</th>' +
        '</tr></thead><tbody>';
      data.recentOrders.forEach(function(o) {
        var names = (o.items||[]).map(function(i){return i.name;}).join(", ");
        html += '<tr><td><span style="font-family:monospace;font-weight:600;" data-sort="'+o._id+'">'+shortId(o._id)+'</span></td><td>'+(o.user?o.user.name:'-')+'</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+names+'"><span data-sort="'+names+'">'+names+'</span></td><td data-sort="'+(o.totalAmount||0)+'"><strong>\u20B9'+(o.totalAmount||0).toLocaleString("en-IN")+'</strong></td><td><span class="status-badge status-'+(o.orderStatus||"").replace(/ /g,"")+'"><i class="fas fa-circle" style="font-size:7px;"></i> '+o.orderStatus+'</span></td><td data-sort="'+(o.orderedAt||'')+'">'+formatDate(o.orderedAt)+'</td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-clipboard-list"></i></div><p>No orders yet</p></div>';
    }
    html += '</div>';

    // Recent users table
    html += '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-users"></i> Recent Users</h3></div>';
    if (data.recentUsers && data.recentUsers.length) {
      html += '<div class="admin-table-wrapper"><table class="admin-table" id="recentUsersTable"><thead><tr>' +
        '<th onclick="sortTable(\'recentUsersTable\',0,\'string\')"><i class="fas fa-user"></i>Name' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentUsersTable\',1,\'string\')"><i class="fas fa-envelope"></i>Email' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentUsersTable\',2,\'string\')"><i class="fas fa-shield-alt"></i>Role' + getSortIcon() + '</th>' +
        '<th onclick="sortTable(\'recentUsersTable\',3,\'date\')"><i class="fas fa-calendar"></i>Joined' + getSortIcon() + '</th>' +
        '</tr></thead><tbody>';
      data.recentUsers.forEach(function(u) {
        html += '<tr><td>'+u.name+'</td><td>'+u.email+'</td><td><span class="status-badge '+(u.role==='admin'?'status-Confirmed':'status-Pending')+'"><i class="fas '+(u.role==='admin'?'fa-user-shield':'fa-user')+'"></i> '+u.role+'</span></td><td data-sort="'+(u.createdAt||'')+'">'+formatDate(u.createdAt)+'</td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div class="empty-state"><p>No users yet</p></div>';
    }
    html += '</div>';

    document.getElementById("dashboardContent").innerHTML = html;

    // Trigger animated counters after DOM is rendered
    setTimeout(function() {
      animateCounter(document.getElementById("statTotalUsers"), s.totalUsers);
      animateCounter(document.getElementById("statTotalProducts"), s.totalProducts);
      animateCounter(document.getElementById("statTotalOrders"), s.totalOrders);
      animateRevenue(document.getElementById("statRevenue"), s.revenue || 0);
      animateCounter(document.getElementById("statPendingOrders"), s.pendingOrders);
      animateCounter(document.getElementById("statDelivered"), s.deliveredOrders);
      animateCounter(document.getElementById("statCancelled"), s.cancelledOrders);
      animateCounter(document.getElementById("statLowStock"), s.lowStockProducts);
    }, 100);

  } catch (e) {
    document.getElementById("dashboardContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Failed to load dashboard: ' + e.message + '</p></div>';
  }
})();

// ─── Table Sorting ───
var sortStates = {};

function sortTable(tableId, colIndex, dataType) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var tbody = table.querySelector("tbody");
  var rows = Array.from(tbody.querySelectorAll("tr"));

  var key = tableId + "_" + colIndex;
  sortStates[key] = sortStates[key] === "asc" ? "desc" : "asc";
  var dir = sortStates[key] === "asc" ? 1 : -1;

  rows.sort(function(a, b) {
    var cellA = a.children[colIndex];
    var cellB = b.children[colIndex];
    var valA = cellA.getAttribute("data-sort") || cellA.textContent.trim();
    var valB = cellB.getAttribute("data-sort") || cellB.textContent.trim();

    if (dataType === "number") {
      return (parseFloat(valA) - parseFloat(valB)) * dir;
    }
    if (dataType === "date") {
      return (new Date(valA) - new Date(valB)) * dir;
    }
    return valA.localeCompare(valB) * dir;
  });

  rows.forEach(function(row) { tbody.appendChild(row); });

  // Update sort icons
  table.querySelectorAll("th i.fa-sort, th i.fa-sort-up, th i.fa-sort-down").forEach(function(icon) {
    icon.className = "fas fa-sort";
    icon.style.opacity = "0.4";
  });
  var headerIcon = table.querySelectorAll("th")[colIndex].querySelector("i.fa-sort, i.fa-sort-up, i.fa-sort-down");
  if (headerIcon) {
    headerIcon.className = "fas fa-sort-" + (sortStates[key] === "asc" ? "up" : "down");
    headerIcon.style.opacity = "1";
  }
}
