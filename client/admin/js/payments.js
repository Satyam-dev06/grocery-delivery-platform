let payPage = 1;
let payPages = 1;

async function loadPayments(page) {
  payPage = page || 1;
  try {
    var data = await adminFetchPayments(payPage);
    payPages = data.pages || 1;
    renderPayments(data);
  } catch(e) {
    document.getElementById("paymentsContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Error: '+e.message+'</p></div>';
  }
}

function renderPayments(data) {
  var html = '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-credit-card"></i> Payments ('+data.total+')</h3></div>';
  if (!data.payments || !data.payments.length) {
    html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-credit-card"></i></div><p>No payments yet</p></div></div>';
    document.getElementById("paymentsContent").innerHTML = html;
    return;
  }
  html += '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th><i class="fas fa-hashtag"></i>Transaction</th><th><i class="fas fa-user"></i>Customer</th><th><i class="fas fa-file-invoice"></i>Order</th><th><i class="fas fa-wallet"></i>Method</th><th><i class="fas fa-indian-rupee-sign"></i>Amount</th><th><i class="fas fa-tag"></i>Status</th><th><i class="fas fa-calendar"></i>Date</th><th><i class="fas fa-cog"></i>Action</th></tr></thead><tbody>';
  data.payments.forEach(function(p) {
    html += '<tr>';
    html += '<td><span style="font-family:monospace;font-weight:600;">'+shortId(p.transactionId||p._id)+'</span></td>';
    html += '<td><strong>'+(p.user?p.user.name:'-')+'</strong></td>';
    html += '<td><span style="font-family:monospace;">'+shortId(p.order?p.order._id:'')+'</span></td>';
    html += '<td>'+(p.paymentMethod==='Cash on Delivery'?'<i class="fas fa-money-bill-wave" style="color:#2E7D32;"></i>':p.paymentMethod==='UPI'?'<i class="fas fa-mobile-screen-button" style="color:#1565C0;"></i>':'<i class="fas fa-credit-card" style="color:#7B1FA2;"></i>')+' '+p.paymentMethod+'</td>';
    html += '<td><strong>\u20B9'+(p.amount||0).toLocaleString("en-IN")+'</strong></td>';
    html += '<td><span class="status-badge status-'+p.paymentStatus+'"><i class="fas fa-circle" style="font-size:7px;"></i> '+p.paymentStatus+'</span></td>';
    html += '<td>'+formatDate(p.createdAt)+'</td>';
    html += '<td>';
    if (p.paymentStatus === 'Paid') {
      html += '<button class="btn btn-danger btn-sm" onclick="refundPayment(\''+(p.order?p.order._id:'')+'\')"><i class="fas fa-rotate-left"></i> Refund</button>';
    } else {
      html += '<span style="color:#94a3b8;font-size:12px;"><i class="fas fa-minus"></i></span>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  if (payPages > 1) {
    html += '<div class="pagination">';
    for (var i=1; i<=payPages; i++) {
      html += '<button class="'+(i===payPage?'active':'')+'" onclick="loadPayments('+i+')" aria-label="Page '+i+'">'+i+'</button>';
    }
    html += '</div>';
  }
  document.getElementById("paymentsContent").innerHTML = html;
}

async function refundPayment(orderId) {
  var ok = await showConfirm("Refund this payment? Status will be set to Failed.");
  if (!ok) return;
  try {
    await adminRefundPayment(orderId);
    showAdminToast("Payment refunded");
    loadPayments(payPage);
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

loadPayments(1);
