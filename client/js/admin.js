// ─── Admin Shared Functions ───

// Redirect non-admin users
(async function checkAdmin() {
  if (!isLoggedIn()) {
    window.location.href = "../login.html";
    return;
  }
  try {
    const user = await getUserProfile();
    if (user.role !== "admin") {
      window.location.href = "../index.html";
    } else {
      // Update admin profile in header
      const userEl = document.getElementById("adminUser");
      if (userEl) {
        userEl.innerHTML =
          '<div class="avatar" aria-hidden="true"><i class="fas fa-user-shield"></i></div>' +
          '<div class="user-info">' +
          '<span class="user-name">' + user.name + '</span>' +
          '<span class="user-role">Administrator</span>' +
          '</div>';
      }
    }
  } catch (e) {
    window.location.href = "../login.html";
  }
})();

// Toast notification with Font Awesome icon
function showAdminToast(message, type) {
  const existing = document.querySelector(".admin-toast");
  if (existing) existing.remove();

  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
  };

  const toast = document.createElement("div");
  toast.className = "admin-toast " + (type || "success");
  toast.setAttribute("role", "alert");
  toast.innerHTML = (icons[type || "success"] || icons.success) + message;
  document.body.appendChild(toast);

  setTimeout(function () { toast.classList.add("show"); }, 10);
  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// Confirm dialog
function showConfirm(message) {
  return new Promise(function (resolve) {
    var overlay = document.createElement("div");
    overlay.className = "confirm-overlay active";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="confirm-box">' +
      '<div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>' +
      '<h3>Confirm</h3>' +
      '<p>' + message + '</p>' +
      '<div class="confirm-actions">' +
      '<button class="btn btn-danger" id="confirmYes"><i class="fas fa-trash-alt"></i> Yes, Delete</button>' +
      '<button class="btn btn-outline" id="confirmNo"><i class="fas fa-times"></i> Cancel</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.getElementById("confirmYes").onclick = function () {
      overlay.remove();
      resolve(true);
    };
    document.getElementById("confirmNo").onclick = function () {
      overlay.remove();
      resolve(false);
    };
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

// Hamburger toggle
function toggleSidebar() {
  var sidebar = document.querySelector(".admin-sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("open");
  if (overlay) overlay.classList.toggle("show");

  // Update hamburger aria-expanded
  var hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.setAttribute("aria-expanded", sidebar.classList.contains("open"));
  }
}

// Close sidebar on Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    var sidebar = document.querySelector(".admin-sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    if (sidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
      if (overlay) overlay.classList.remove("show");
      var hamburger = document.querySelector(".hamburger");
      if (hamburger) hamburger.setAttribute("aria-expanded", "false");
    }
  }
});

// Format date
function formatDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// Format price
function formatPrice(amount) {
  return "\u20B9" + (amount || 0).toLocaleString("en-IN");
}

// Truncate ID
function shortId(id) {
  if (!id) return "-";
  return id.toString().slice(-8).toUpperCase();
}
