let currentPage = 1;
let totalPages = 1;

async function loadOrders(page) {
  page = page || currentPage;
  currentPage = page;
  try {
    var status = document.getElementById("orderStatusFilter").value;
    var data = await adminFetchOrders(page, status);
    totalPages = data.pages || 1;
    renderOrders(data);
  } catch(e) {
    document.getElementById("ordersContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Error: '+e.message+'</p></div>';
  }
}

function renderOrders(data) {
  var html = '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-truck"></i> Orders ('+data.total+')</h3></div>';
  if (!data.orders || !data.orders.length) {
    html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-clipboard-list"></i></div><p>No orders found</p></div></div>';
    html += paginationHTML();
    document.getElementById("ordersContent").innerHTML = html;
    return;
  }
  html += '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th><i class="fas fa-hashtag"></i>Order ID</th><th><i class="fas fa-user"></i>Customer</th><th><i class="fas fa-shopping-cart"></i>Products</th><th><i class="fas fa-indian-rupee-sign"></i>Amount</th><th><i class="fas fa-credit-card"></i>Payment</th><th><i class="fas fa-tag"></i>Status</th><th><i class="fas fa-calendar"></i>Date</th><th><i class="fas fa-cog"></i>Action</th></tr></thead><tbody>';
  data.orders.forEach(function(o) {
    var names = (o.items||[]).map(function(i){return i.name;}).join(", ");
    html += '<tr>';
    html += '<td><span style="font-family:monospace;font-weight:600;">'+shortId(o._id)+'</span></td>';
    html += '<td><strong>'+(o.user?o.user.name:'-')+'</strong><br><span style="font-size:11px;color:var(--admin-text-light);">'+ (o.user?o.user.email:'') +'</span></td>';
    html += '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+names+'">'+names+'</td>';
    html += '<td><strong>\u20B9'+(o.totalAmount||0).toLocaleString("en-IN")+'</strong></td>';
    html += '<td><span class="status-badge status-'+o.paymentStatus+'"><i class="fas fa-circle" style="font-size:7px;"></i> '+o.paymentStatus+'</span></td>';
    html += '<td><span class="status-badge status-'+(o.orderStatus||"").replace(/ /g,"")+'"><i class="fas fa-circle" style="font-size:7px;"></i> '+o.orderStatus+'</span></td>';
    html += '<td>'+formatDate(o.orderedAt)+'</td>';
    html += '<td><button class="btn btn-info btn-sm" onclick="openOrderModal(\''+o._id+'\',\''+o.orderStatus+'\')"><i class="fas fa-pen"></i> Update</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  html += paginationHTML();
  document.getElementById("ordersContent").innerHTML = html;
}

function paginationHTML() {
  if (totalPages <= 1) return '';
  var h = '<div class="pagination">';
  for (var i=1; i<=totalPages; i++) {
    h += '<button class="'+(i===currentPage?'active':'')+'" onclick="loadOrders('+i+')" aria-label="Page '+i+'">'+i+'</button>';
  }
  h += '</div>';
  return h;
}

function openOrderModal(id, currentStatus) {
  document.getElementById("updateOrderId").value = id;
  document.getElementById("updateOrderStatusSelect").value = currentStatus;
  document.getElementById("orderStatusModal").classList.add("active");
}

function closeOrderModal() {
  document.getElementById("orderStatusModal").classList.remove("active");
}

async function saveOrderStatus() {
  var id = document.getElementById("updateOrderId").value;
  var status = document.getElementById("updateOrderStatusSelect").value;
  try {
    await adminUpdateOrder(id, status);
    showAdminToast("Order status updated to " + status);
    closeOrderModal();
    loadOrders(currentPage);
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

loadOrders(1);
