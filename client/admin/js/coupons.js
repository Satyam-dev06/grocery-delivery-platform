let coupons = [];

async function loadCoupons() {
  try {
    coupons = await adminFetchCoupons();
    renderCoupons();
  } catch(e) {
    document.getElementById("couponsContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Error: '+e.message+'</p></div>';
  }
}

function renderCoupons() {
  var html = '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-tag"></i> Coupons ('+coupons.length+')</h3></div>';
  if (!coupons.length) {
    html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-tag"></i></div><p>No coupons yet</p></div></div>';
    document.getElementById("couponsContent").innerHTML = html;
    return;
  }
  html += '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th><i class="fas fa-code"></i>Code</th><th><i class="fas fa-percent"></i>Type</th><th><i class="fas fa-indian-rupee-sign"></i>Value</th><th><i class="fas fa-indian-rupee-sign"></i>Min Order</th><th><i class="fas fa-users"></i>Used</th><th><i class="fas fa-calendar-alt"></i>Expiry</th><th><i class="fas fa-check-circle"></i>Active</th><th><i class="fas fa-cog"></i>Actions</th></tr></thead><tbody>';
  coupons.forEach(function(c) {
    var isExpired = new Date(c.expiryDate) < new Date();
    html += '<tr>';
    html += '<td><span class="status-badge status-Confirmed" style="font-family:monospace;font-weight:700;"><i class="fas fa-tag"></i> '+c.code+'</span></td>';
    html += '<td>'+(c.discountType==='percentage'?'<i class="fas fa-percent" style="color:#1565C0;"></i>': '<i class="fas fa-indian-rupee-sign" style="color:#2E7D32;"></i>')+' '+c.discountType+'</td>';
    html += '<td><strong>'+(c.discountType==='percentage'?c.discountValue+'%':'\u20B9'+c.discountValue)+'</strong></td>';
    html += '<td>'+(c.minimumOrder>0?'\u20B9'+(c.minimumOrder||0).toLocaleString("en-IN"):'<span style="color:#94a3b8;">-</span>')+'</td>';
    html += '<td>'+(c.usedCount||0)+'/'+(c.usageLimit||'\u221E')+'</td>';
    html += '<td>'+(isExpired?'<span style="color:#C62828;"><i class="fas fa-clock"></i> ':'<span><i class="fas fa-calendar"></i> ')+formatDate(c.expiryDate)+'</span></td>';
    html += '<td>'+(c.isActive?'<span style="color:#2E7D32;font-size:16px;"><i class="fas fa-check-circle"></i></span>':'<span style="color:#C62828;font-size:16px;"><i class="fas fa-times-circle"></i></span>')+'</td>';
    html += '<td><div class="action-btns">';
    html += '<button class="btn btn-primary btn-sm" onclick="editCoupon(\''+c._id+'\')"><i class="fas fa-pen"></i> Edit</button> ';
    html += '<button class="btn btn-danger btn-sm" onclick="deleteCoupon(\''+c._id+'\')"><i class="fas fa-trash-alt"></i> Delete</button>';
    html += '</div></td></tr>';
  });
  html += '</tbody></table></div></div>';
  document.getElementById("couponsContent").innerHTML = html;
}

function openCouponModal() {
  document.getElementById("editCouponId").value = "";
  document.getElementById("couponModalTitle").innerHTML = '<i class="fas fa-tag"></i> Add Coupon';
  document.getElementById("coupCode").value = "";
  document.getElementById("coupType").value = "percentage";
  document.getElementById("coupValue").value = "";
  document.getElementById("coupMinOrder").value = "0";
  document.getElementById("coupMaxDiscount").value = "0";
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+30);
  document.getElementById("coupExpiry").value = tomorrow.toISOString().split('T')[0];
  document.getElementById("coupUsageLimit").value = "0";
  document.getElementById("coupActive").checked = true;
  document.getElementById("couponModal").classList.add("active");
}

function closeCouponModal() {
  document.getElementById("couponModal").classList.remove("active");
}

function editCoupon(id) {
  var c = coupons.find(function(x){return x._id===id;});
  if (!c) return;
  document.getElementById("editCouponId").value = id;
  document.getElementById("couponModalTitle").innerHTML = '<i class="fas fa-pen"></i> Edit Coupon';
  document.getElementById("coupCode").value = c.code;
  document.getElementById("coupType").value = c.discountType;
  document.getElementById("coupValue").value = c.discountValue;
  document.getElementById("coupMinOrder").value = c.minimumOrder||0;
  document.getElementById("coupMaxDiscount").value = c.maxDiscount||0;
  document.getElementById("coupExpiry").value = new Date(c.expiryDate).toISOString().split('T')[0];
  document.getElementById("coupUsageLimit").value = c.usageLimit||0;
  document.getElementById("coupActive").checked = c.isActive!==false;
  document.getElementById("couponModal").classList.add("active");
}

async function saveCoupon(e) {
  e.preventDefault();
  var id = document.getElementById("editCouponId").value;
  var data = {
    code: document.getElementById("coupCode").value,
    discountType: document.getElementById("coupType").value,
    discountValue: Number(document.getElementById("coupValue").value),
    minimumOrder: Number(document.getElementById("coupMinOrder").value),
    maxDiscount: Number(document.getElementById("coupMaxDiscount").value),
    expiryDate: document.getElementById("coupExpiry").value,
    usageLimit: Number(document.getElementById("coupUsageLimit").value),
    isActive: document.getElementById("coupActive").checked,
  };
  try {
    if (id) {
      await adminUpdateCoupon(id, data);
      showAdminToast("Coupon updated");
    } else {
      await adminCreateCoupon(data);
      showAdminToast("Coupon created");
    }
    closeCouponModal();
    loadCoupons();
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

async function deleteCoupon(id) {
  var ok = await showConfirm("Delete this coupon?");
  if (!ok) return;
  try {
    await adminDeleteCoupon(id);
    showAdminToast("Coupon deleted");
    loadCoupons();
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

loadCoupons();
