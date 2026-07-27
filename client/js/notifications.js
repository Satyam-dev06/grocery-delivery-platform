(function () {
"use strict";

var notifPage = 1;
var notifTotalPages = 1;

var TYPE_COLORS = {
  order: "#1976D2", payment: "#2E7D32", coupon: "#E65100",
  wishlist: "#E53935", offer: "#7B1FA2", admin: "#37474F", system: "#607D8B"
};
var TYPE_ICONS = {
  order: "fa-truck", payment: "fa-credit-card", coupon: "fa-tags",
  wishlist: "fa-heart", offer: "fa-gift", admin: "fa-shield", system: "fa-bell"
};

function timeAgo(dateStr) {
  var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 2592000) return Math.floor(diff / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString();
}

async function loadNotifications(page) {
  var list = document.getElementById("notifList");
  var empty = document.getElementById("notifEmpty");
  notifPage = page || 1;

  try {
    var data = await fetchNotifications(notifPage);
    var notifs = data.notifications || [];
    notifTotalPages = data.pages || 1;

    document.querySelectorAll(".notif-skeleton").forEach(function(e) { e.style.display = "none"; });

    if (notifs.length === 0) {
      list.innerHTML = "";
      empty.style.display = "block";
      document.getElementById("pagination").innerHTML = "";
      return;
    }

    empty.style.display = "none";
    list.innerHTML = notifs.map(function(n) {
      var color = TYPE_COLORS[n.type] || TYPE_COLORS.system;
      var icon = TYPE_ICONS[n.type] || TYPE_ICONS.system;
      var unreadClass = n.isRead ? "" : " unread";
      return '<div class="notif-card' + unreadClass + '" role="button" tabindex="0" aria-label="' + n.title + '">' +
        '<div class="notif-icon" style="background:' + color + '22;color:' + color + '"><i class="fa-solid ' + icon + '"></i></div>' +
        '<div class="notif-content">' +
          '<div class="notif-title">' + n.title + (n.isRead ? "" : ' <span class="notif-badge">New</span>') + '</div>' +
          '<div class="notif-message">' + n.message + '</div>' +
          '<div class="notif-time"><i class="fa-regular fa-clock"></i> ' + timeAgo(n.createdAt) + '</div>' +
        '</div>' +
        '<button class="notif-delete" aria-label="Delete notification"><i class="fa-solid fa-times"></i></button>' +
      '</div>';
    }).join("");

    // Attach event listeners to dynamically created elements
    Array.from(document.querySelectorAll(".notif-card")).forEach(function(card, i) {
      card.addEventListener("click", function() {
        var id = notifs[i]._id;
        var link = notifs[i].link || "";
        handleNotifClick(id, link);
      });
      var delBtn = card.querySelector(".notif-delete");
      if (delBtn) {
        delBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          deleteOneNotif(notifs[i]._id);
        });
      }
    });

    renderPagination();
  } catch (e) {
    document.querySelectorAll(".notif-skeleton").forEach(function(e) { e.style.display = "none"; });
    document.getElementById("notifList").innerHTML = '<div class="notif-empty"><i class="fa-solid fa-exclamation-circle"></i><h3>Error loading notifications</h3><p>' + e.message + '</p></div>';
  }
}

function handleNotifClick(id, link) {
  markNotificationRead(id).then(function() {
    if (link) { window.location.href = link; }
    else { loadNotifications(notifPage); }
  }).catch(function() {
    if (link) { window.location.href = link; }
  });
}

function showNotifToast(msg, type) {
  type = type || "info";
  if (typeof window.showToast === "function") {
    window.showToast(msg, type);
    return;
  }
  var t = document.getElementById("toast");
  if (t) {
    t.innerHTML = msg;
    t.className = "show toast-" + type;
    setTimeout(function() { t.className = ""; }, 2500);
  } else {
    alert(msg);
  }
}

function markAllRead() {
  markAllNotificationsRead().then(function() {
    loadNotifications(notifPage);
    updateBellCount();
    showNotifToast("All notifications marked as read", "success");
  }).catch(function(e) { showNotifToast("Error: " + e.message, "error"); });
}

function deleteAll() {
  if (!confirm("Delete all notifications?")) return;
  deleteAllNotifications().then(function() {
    loadNotifications(1);
    updateBellCount();
    showNotifToast("All notifications deleted", "info");
  }).catch(function(e) { showNotifToast("Error: " + e.message, "error"); });
}

function deleteOneNotif(id) {
  deleteNotification(id).then(function() {
    loadNotifications(notifPage);
    updateBellCount();
    showNotifToast("Notification deleted", "info");
  }).catch(function(e) { showNotifToast("Error: " + e.message, "error"); });
}

function renderPagination() {
  var el = document.getElementById("pagination");
  if (!el) return;
  if (notifTotalPages <= 1) { el.innerHTML = ""; return; }
  var html = '<button class="page-btn" onclick="loadNotifications(' + (notifPage - 1) + ')" ' + (notifPage <= 1 ? "disabled" : "") + '><i class="fas fa-chevron-left"></i></button>';
  for (var i = 1; i <= notifTotalPages; i++) {
    html += '<button class="page-btn' + (i === notifPage ? " active" : "") + '" onclick="loadNotifications(' + i + ')">' + i + '</button>';
  }
  html += '<button class="page-btn" onclick="loadNotifications(' + (notifPage + 1) + ')" ' + (notifPage >= notifTotalPages ? "disabled" : "") + '><i class="fas fa-chevron-right"></i></button>';
  el.innerHTML = html;
}

function updateBellCount() {
  var badge = document.getElementById("notifBadge");
  if (!badge) return;
  if (!isLoggedIn()) { badge.style.display = "none"; return; }
  fetchUnreadCount().then(function(count) {
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }).catch(function() { badge.style.display = "none"; });
}

function toggleNotifDropdown() {
  var dd = document.getElementById("notifDropdown");
  if (!dd) return;
  var isOpen = dd.classList.contains("show");
  dd.classList.toggle("show");
  if (!isOpen) loadDropdownNotifs();
}

async function loadDropdownNotifs() {
  var dd = document.getElementById("notifDropdown");
  if (!dd) return;
  try {
    var data = await fetchNotifications(1);
    var notifs = (data.notifications || []).slice(0, 5);
    if (notifs.length === 0) {
      dd.innerHTML = '<div class="dd-empty"><i class="fa-regular fa-bell-slash"></i> No notifications</div><a href="notifications.html" class="dd-view-all">View All</a>';
      return;
    }
    dd.innerHTML = notifs.map(function(n) {
      var color = TYPE_COLORS[n.type] || "#607D8B";
      var icon = TYPE_ICONS[n.type] || "fa-bell";
      return '<div class="dd-item' + (n.isRead ? "" : " dd-unread") + '">' +
        '<span class="dd-icon" style="color:' + color + '"><i class="fa-solid ' + icon + '"></i></span>' +
        '<span class="dd-text">' + n.title + '</span>' +
        '<span class="dd-time">' + timeAgo(n.createdAt) + '</span>' +
      '</div>';
    }).join("") + '<a href="notifications.html" class="dd-view-all">View All</a>';

    // Attach click listeners for dropdown items
    var items = dd.querySelectorAll(".dd-item");
    notifs.forEach(function(n, i) {
      if (items[i]) {
        items[i].addEventListener("click", function(e) {
          e.stopPropagation();
          handleNotifClick(n._id, n.link || "");
        });
      }
    });
  } catch(e) {
    dd.innerHTML = '<div class="dd-empty">Could not load</div><a href="notifications.html" class="dd-view-all">View All</a>';
  }
}

// ─── Init ───
if (document.getElementById("notifList")) {
  loadNotifications(1);
}

// ─── Expose functions to global scope for inline handlers and external calls ───
window.loadNotifications = loadNotifications;
window.handleNotifClick = handleNotifClick;
window.markAllRead = markAllRead;
window.deleteAll = deleteAll;
window.deleteOneNotif = deleteOneNotif;
window.updateBellCount = updateBellCount;
window.toggleNotifDropdown = toggleNotifDropdown;

})();
