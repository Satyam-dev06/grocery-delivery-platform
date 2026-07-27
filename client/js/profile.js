// ─── State ───
var profileUser = null;
var profileOrders = [];
var profileAddresses = [];
var profileWishlistData = [];
var profileNotifications = [];
var currentSection = "dashboard";

// ─── Auth Guard ───
(function checkProfileAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
})();

// ─── Section Switching ───
function switchProfileSection(sectionId) {
  currentSection = sectionId;
  // Hide all sections
  document.querySelectorAll(".profile-section").forEach(function (el) { el.style.display = "none"; });
  // Show target
  var target = document.getElementById("section-" + sectionId);
  if (target) target.style.display = "block";
  // Update sidebar active state
  document.querySelectorAll(".profile-sidebar-nav a").forEach(function (a) { a.classList.remove("active"); });
  var activeLink = document.querySelector('.profile-sidebar-nav a[data-section="' + sectionId + '"]');
  if (activeLink) activeLink.classList.add("active");
  // Load section data
  loadSectionData(sectionId);
  // Scroll to top of content
  document.getElementById("profileContent").scrollTop = 0;
}

function loadSectionData(sectionId) {
  switch (sectionId) {
    case "dashboard": loadDashboard(); break;
    case "personal": loadPersonalInfo(); break;
    case "addresses": loadProfileAddresses(); break;
    case "wishlist": loadProfileWishlist(); break;
    case "orders": loadProfileOrders(); break;
    case "payments": loadProfilePayments(); break;
    case "notifications": loadProfileNotifications(); break;
  }
}

// ─── Toast ───
function showProfileToast(message, type) {
  type = type || "info";
  var toast = document.getElementById("toast");
  if (!toast) { toast = document.createElement("div"); toast.id = "toast"; document.body.appendChild(toast); }
  var icons = { success: "\u2705", error: "\u274C", warning: "\u26A0\uFE0F", info: "\u2139\uFE0F" };
  toast.innerHTML = (icons[type] || "\u2139\uFE0F") + " " + message;
  toast.className = "show toast-" + type;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () { toast.className = ""; }, 2500);
}

// ─── Init: Load User + All Data ───
(async function initProfile() {
  try {
    profileUser = await getUserProfile();
    renderSidebar(profileUser);
    loadDashboard();
  } catch (e) {
    showProfileToast("Failed to load profile: " + e.message, "error");
  }
})();

function renderSidebar(user) {
  document.getElementById("sidebarName").textContent = user.name || "User";
  document.getElementById("sidebarEmail").textContent = user.email || "";
  document.getElementById("profileLoading").style.display = "none";
  // Set initial section
  switchProfileSection("dashboard");
}

// ─── Dashboard ───
async function loadDashboard() {
  try {
    var orders = await fetchOrders();
    profileOrders = orders || [];
    renderDashboardStats(profileOrders);
    renderRecentOrders(profileOrders);
  } catch (e) {
    document.getElementById("profileStatsGrid").innerHTML = '<div class="empty-search"><p>Could not load dashboard data.</p></div>';
  }
}

function renderDashboardStats(orders) {
  var total = orders.length;
  var completed = orders.filter(function (o) { return o.orderStatus === "Delivered"; }).length;
  var pending = orders.filter(function (o) { return o.orderStatus === "Pending" || o.orderStatus === "Confirmed" || o.orderStatus === "Packed" || o.orderStatus === "Out for Delivery"; }).length;
  var cancelled = orders.filter(function (o) { return o.orderStatus === "Cancelled"; }).length;
  var spent = orders.reduce(function (sum, o) { return sum + (o.totalAmount || 0); }, 0);
  var points = Number(localStorage.getItem("points")) || Math.floor(spent / 100);

  animateValue("pstatTotalOrders", total);
  animateValue("pstatCompleted", completed);
  animateValue("pstatPending", pending);
  animateValue("pstatCancelled", cancelled);
  animateCurrency("pstatSpent", spent);
  animateValue("pstatPoints", points);
}

function animateValue(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var start = 0;
  var duration = 600;
  var startTime = null;
  function step(now) {
    if (!startTime) startTime = now;
    var progress = Math.min((now - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function animateCurrency(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var start = 0;
  var duration = 600;
  var startTime = null;
  function step(now) {
    if (!startTime) startTime = now;
    var progress = Math.min((now - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = "\u20B9" + Math.round(eased * target).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = "\u20B9" + target.toLocaleString("en-IN");
  }
  requestAnimationFrame(step);
}

function renderRecentOrders(orders) {
  var container = document.getElementById("profileRecentOrders");
  var recent = orders.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = '<div class="profile-empty"><i class="fas fa-truck"></i><p>No orders yet. Start shopping!</p><a href="index.html" class="shop-btn" style="margin-top:15px;"><i class="fas fa-shopping-bag"></i> Shop Now</a></div>';
    return;
  }
  container.innerHTML = "";
  recent.forEach(function (o) {
    var statusClass = (o.orderStatus || "").toLowerCase().replace(/ /g, "");
    var items = (o.items || []).map(function (i) { return i.name; }).join(", ");
    container.innerHTML +=
      '<div class="profile-order-card" onclick="window.location.href=\'order-tracking.html?id=' + o._id + '\'">' +
      '<div class="poc-header"><span class="status-badge status-' + statusClass + '">' + (o.orderStatus || "Pending") + '</span><span class="poc-date">' + formatDate(o.orderedAt) + '</span></div>' +
      '<div class="poc-body"><span class="poc-items" title="' + items + '">' + truncate(items, 60) + '</span><span class="poc-total">\u20B9' + (o.totalAmount || 0).toLocaleString("en-IN") + '</span></div>' +
      '</div>';
  });
}

// ─── Personal Info ───
function loadPersonalInfo() {
  if (!profileUser) return;
  document.getElementById("profName").textContent = profileUser.name || "-";
  document.getElementById("profEmail").textContent = profileUser.email || "-";
  document.getElementById("profPhone").textContent = profileUser.phone || "-";
  document.getElementById("profAddress").textContent = profileUser.address || "-";
  document.getElementById("profMemberSince").textContent = profileUser.createdAt ? formatDate(profileUser.createdAt) : "-";
  document.getElementById("profRole").textContent = profileUser.role || "User";
  // Populate edit form
  document.getElementById("editName").value = profileUser.name || "";
  document.getElementById("editPhone").value = profileUser.phone || "";
  document.getElementById("editAddress").value = profileUser.address || "";
  // Restore avatar preview
  var savedAvatar = localStorage.getItem("profileAvatar");
  var preview = document.getElementById("pfAvatarPreview");
  if (savedAvatar && preview) {
    preview.innerHTML = '<img src="' + savedAvatar + '" alt="Avatar" class="pf-avatar-preview" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">';
    preview.className = "";
  }
}

function showEditProfile() {
  document.getElementById("profileInfoDisplay").style.display = "none";
  document.getElementById("profileEditForm").style.display = "block";
  // Find and hide the Edit Profile button
  var btns = document.querySelectorAll("#section-personal .shop-btn");
  btns.forEach(function (b) { if (b.textContent.includes("Edit Profile")) b.style.display = "none"; });
}

function cancelEditProfile() {
  document.getElementById("profileInfoDisplay").style.display = "grid";
  document.getElementById("profileEditForm").style.display = "none";
  document.getElementById("editProfileMessage").textContent = "";
  document.getElementById("editPassword").value = "";
  document.getElementById("editConfirmPassword").value = "";
  var btns = document.querySelectorAll("#section-personal .shop-btn");
  btns.forEach(function (b) { if (b.textContent.includes("Edit Profile")) b.style.display = "inline-flex"; });
}

async function saveProfile(e) {
  e.preventDefault();
  var msgEl = document.getElementById("editProfileMessage");
  var name = document.getElementById("editName").value.trim();
  var phone = document.getElementById("editPhone").value.trim();
  var address = document.getElementById("editAddress").value.trim();
  var password = document.getElementById("editPassword").value;
  var confirmPwd = document.getElementById("editConfirmPassword").value;

  if (!name || name.length < 2) { msgEl.textContent = "Name must be at least 2 characters."; msgEl.style.color = "#E53935"; return; }
  if (phone && !/^[0-9]{10,15}$/.test(phone)) { msgEl.textContent = "Please enter a valid phone number."; msgEl.style.color = "#E53935"; return; }
  if (password && password.length < 6) { msgEl.textContent = "Password must be at least 6 characters."; msgEl.style.color = "#E53935"; return; }
  if (password && password !== confirmPwd) { msgEl.textContent = "Passwords do not match."; msgEl.style.color = "#E53935"; return; }

  var body = { name: name, phone: phone, address: address };
  if (password) body.password = password;
  // Avatar is stored client-side in localStorage, not sent to backend

  msgEl.textContent = "Saving...";
  msgEl.style.color = "#666";
  try {
    var updated = await apiRequest("/users/profile", { method: "PUT", body: JSON.stringify(body) });
    profileUser = updated;
    if (updated.token) setToken(updated.token);
    renderSidebar(updated);
    msgEl.textContent = "Profile updated successfully!";
    msgEl.style.color = "#2E7D32";
    setTimeout(function () { cancelEditProfile(); }, 1500);
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
    msgEl.style.color = "#E53935";
  }
}

// ─── Addresses ───
async function loadProfileAddresses() {
  var container = document.getElementById("profileAddressList");
  try {
    var addrs = await fetchAddresses();
    profileAddresses = addrs || [];
    if (profileAddresses.length === 0) {
      container.innerHTML = '<div class="profile-empty"><i class="fas fa-map-marker-alt"></i><p>No addresses saved yet.</p><a href="address.html" class="shop-btn" style="margin-top:15px;"><i class="fas fa-plus"></i> Add Address</a></div>';
      return;
    }
    container.innerHTML = "";
    profileAddresses.forEach(function (a) {
      container.innerHTML +=
        '<div class="profile-addr-card' + (a.isDefault ? ' default-addr' : '') + '">' +
        '<div class="pac-header">' +
        '<span class="pac-type">' + (a.addressType || "Home") + '</span>' +
        (a.isDefault ? '<span class="default-tag">&#x2B50; Default</span>' : '') +
        '</div>' +
        '<p class="pac-name">' + (a.fullName || "") + '</p>' +
        '<p>' + a.addressLine1 + (a.addressLine2 ? ", " + a.addressLine2 : "") + '</p>' +
        '<p>' + a.city + ", " + a.state + " - " + a.pincode + '</p>' +
        '<p class="pac-phone">' + (a.phone || "") + '</p>' +
        '</div>';
    });
  } catch (e) {
    container.innerHTML = '<div class="profile-empty"><p>Could not load addresses.</p></div>';
  }
}

// ─── Wishlist ───
async function loadProfileWishlist() {
  var container = document.getElementById("profileWishlistItems");
  try {
    var wl = await fetchWishlistAPI();
    profileWishlistData = wl || [];
    if (profileWishlistData.length === 0) {
      container.innerHTML = '<div class="profile-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty.</p></div>';
      return;
    }
    container.innerHTML = "";
    profileWishlistData.slice(0, 6).forEach(function (item) {
      var p = item.product || {};
      var pid = p._id || p.id;
      container.innerHTML +=
        '<div class="profile-mini-card">' +
        '<a href="product-details.html?id=' + pid + '"><img src="' + (p.image || "") + '" alt="' + (p.name || "") + '" onerror="this.style.display=\'none\'"></a>' +
        '<div class="pmc-info"><a href="product-details.html?id=' + pid + '"><h4>' + (p.name || "Product") + '</h4></a><span class="pmc-price">\u20B9' + (p.price || 0) + '</span></div>' +
        '</div>';
    });
  } catch (e) {
    container.innerHTML = '<div class="profile-empty"><p>Could not load wishlist.</p></div>';
  }
}

// ─── Orders ───
async function loadProfileOrders() {
  var container = document.getElementById("profileOrdersList");
  if (profileOrders.length === 0) {
    try {
      profileOrders = await fetchOrders() || [];
    } catch (e) {
      container.innerHTML = '<div class="profile-empty"><i class="fas fa-truck"></i><p>Could not load orders.</p></div>';
      return;
    }
  }
  if (profileOrders.length === 0) {
    container.innerHTML = '<div class="profile-empty"><i class="fas fa-truck"></i><p>No orders yet. Start shopping!</p><a href="index.html" class="shop-btn" style="margin-top:15px;"><i class="fas fa-shopping-bag"></i> Shop Now</a></div>';
    return;
  }
  container.innerHTML = "";
  profileOrders.forEach(function (o) {
    var sc = (o.orderStatus || "").toLowerCase().replace(/ /g, "");
    var items = (o.items || []).map(function (i) { return i.name + " x" + i.quantity; }).join(", ");
    container.innerHTML +=
      '<div class="profile-order-card" onclick="window.location.href=\'order-tracking.html?id=' + o._id + '\'">' +
      '<div class="poc-header"><span class="status-badge status-' + sc + '">' + (o.orderStatus || "Pending") + '</span><span class="poc-date">' + formatDate(o.orderedAt) + '</span></div>' +
      '<div class="poc-body"><span class="poc-items" title="' + items + '">' + truncate(items, 80) + '</span><span class="poc-total">\u20B9' + (o.totalAmount || 0).toLocaleString("en-IN") + '</span></div>' +
      '<div class="poc-meta"><span>' + (o.paymentMethod || "-") + '</span><span>' + (o.paymentStatus || "-") + '</span></div>' +
      '</div>';
  });
}

// ─── Payments ───
async function loadProfilePayments() {
  var container = document.getElementById("profilePaymentsList");
  // Use orders data as payment history since each order has payment info
  if (profileOrders.length === 0) {
    try {
      profileOrders = await fetchOrders() || [];
    } catch (e) {
      container.innerHTML = '<div class="profile-empty"><i class="fas fa-credit-card"></i><p>Could not load payment history.</p></div>';
      return;
    }
  }
  var payments = profileOrders.filter(function (o) { return o.paymentMethod; });
  if (payments.length === 0) {
    container.innerHTML = '<div class="profile-empty"><i class="fas fa-credit-card"></i><p>No payment history yet. Your COD and card payments will appear here.</p></div>';
    return;
  }
  container.innerHTML = "";
  payments.forEach(function (o) {
    var ps = (o.paymentStatus || "").toLowerCase();
    container.innerHTML +=
      '<div class="profile-pay-card">' +
      '<div class="ppc-header"><span class="ppc-txn">' + truncate(o._id, 12) + '</span><span class="status-badge status-' + ps + '">' + (o.paymentStatus || "Pending") + '</span></div>' +
      '<div class="ppc-body"><span>' + (o.paymentMethod || "-") + '</span><span class="ppc-amount">\u20B9' + (o.totalAmount || 0).toLocaleString("en-IN") + '</span></div>' +
      '<div class="ppc-date">' + formatDate(o.orderedAt) + '</div>' +
      '</div>';
  });
}

// ─── Notifications ───
async function loadProfileNotifications() {
  var container = document.getElementById("profileNotificationsList");
  try {
    var data = await fetchNotifications();
    profileNotifications = data.notifications || data || [];
    if (!Array.isArray(profileNotifications)) profileNotifications = [];
    if (profileNotifications.length === 0) {
      container.innerHTML = '<div class="profile-empty"><i class="fas fa-bell"></i><p>No notifications yet.</p></div>';
      return;
    }
    container.innerHTML = "";
    profileNotifications.forEach(function (n) {
      container.innerHTML +=
        '<div class="profile-notif-card' + (n.read ? '' : ' unread') + '">' +
        '<div class="pnc-icon"><i class="fas ' + (n.type === "order" ? 'fa-truck' : n.type === "payment" ? 'fa-credit-card' : 'fa-tag') + '"></i></div>' +
        '<div class="pnc-content"><p class="pnc-text">' + (n.message || n.title || "") + '</p><span class="pnc-time">' + formatDate(n.createdAt) + '</span></div>' +
        '</div>';
    });
    // Update badge
    var unread = profileNotifications.filter(function (n) { return !n.read; }).length;
    var badge = document.getElementById("profileNotifBadge");
    if (badge) {
      if (unread > 0) { badge.style.display = "inline"; badge.textContent = unread; }
      else { badge.style.display = "none"; }
    }
  } catch (e) {
    container.innerHTML = '<div class="profile-empty"><i class="fas fa-bell"></i><p>Could not load notifications.</p></div>';
  }
}

async function markAllNotifRead() {
  try {
    await markAllNotificationsRead();
    showProfileToast("All notifications marked as read", "success");
    loadProfileNotifications();
  } catch (e) {
    showProfileToast("Error: " + e.message, "error");
  }
}

// ─── Settings ───
function toggleDarkMode() {
  var enabled = document.getElementById("darkModeToggle").checked;
  if (enabled) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("darkMode", enabled ? "true" : "false");
}

// Restore dark mode setting on load
(function () {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    var toggle = document.getElementById("darkModeToggle");
    if (toggle) toggle.checked = true;
  }
})();

// ─── Logout ───
function handleProfileLogout() {
  document.getElementById("logoutModal").style.display = "flex";
}

function closeLogoutModal() {
  document.getElementById("logoutModal").style.display = "none";
}

function confirmLogout() {
  closeLogoutModal();
  logoutUser();
}

// ─── Avatar Upload ───
function previewAvatar(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var dataUrl = e.target.result;
    var preview = document.getElementById("pfAvatarPreview");
    if (preview) {
      preview.innerHTML = '<img src="' + dataUrl + '" alt="Avatar" class="pf-avatar-preview" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">';
      preview.className = "";
    }
    localStorage.setItem("profileAvatar", dataUrl);
    // Also update sidebar avatar
    updateSidebarAvatar(dataUrl);
  };
  reader.readAsDataURL(file);
}

function updateSidebarAvatar(url) {
  var sidebarAvatar = document.querySelector(".profile-avatar-large");
  if (sidebarAvatar) {
    sidebarAvatar.innerHTML = '<img src="' + url + '" alt="Avatar" style="width:72px;height:72px;border-radius:50%;object-fit:cover;">';
  }
}

// Restore avatar on load
(function restoreAvatar() {
  var savedAvatar = localStorage.getItem("profileAvatar");
  if (savedAvatar) {
    updateSidebarAvatar(savedAvatar);
  }
})();

// ─── Utilities ───
function formatDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.substring(0, max) + "..." : str;
}
