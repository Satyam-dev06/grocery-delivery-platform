const addressList = document.getElementById("addressList");
const formContainer = document.getElementById("addressFormContainer");
const addressForm = document.getElementById("addressForm");
const formTitle = document.getElementById("formTitle");
const addressIdInput = document.getElementById("addressId");
const saveBtn = document.getElementById("saveAddressBtn");
const formMessage = document.getElementById("formMessage");

// ─── Toast ───
// Direct implementation — does NOT delegate to window.showToast
// to avoid recursion (address.js overrides window.showToast since it loads after app.js).
function showToast(msg, type) {
  type = type || "info";
  var icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  var icon = icons[type] || "ℹ️";
  var t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = icon + " " + msg;
  t.className = "show toast-" + type;
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(function () { t.className = ""; }, 2500);
}

// ─── Show / Hide Form ───
function showAddressForm(address) {
  formContainer.style.display = "block";
  addressIdInput.value = address ? address._id : "";
  formTitle.textContent = address ? "Edit Address" : "Add New Address";
  saveBtn.textContent = address ? "Update Address" : "Save Address";
  if (address) {
    document.getElementById("fullName").value = address.fullName || "";
    document.getElementById("phone").value = address.phone || "";
    document.getElementById("addressLine1").value = address.addressLine1 || "";
    document.getElementById("addressLine2").value = address.addressLine2 || "";
    document.getElementById("city").value = address.city || "";
    document.getElementById("state").value = address.state || "";
    document.getElementById("pincode").value = address.pincode || "";
    document.getElementById("landmark").value = address.landmark || "";
    document.getElementById("addressType").value = address.addressType || "Home";
    document.getElementById("isDefault").checked = address.isDefault || false;
  } else {
    addressForm.reset();
  }
  document.getElementById("showAddForm").style.display = "none";
}

function hideAddressForm() {
  formContainer.style.display = "none";
  document.getElementById("showAddForm").style.display = "inline-block";
  formMessage.textContent = "";
}

// ─── Render Addresses ───
async function renderAddresses() {
  if (!addressList) return;
  // Skeleton is shown in HTML; this function will replace it when data loads
  addressList.innerHTML =
    '<div class="sk-addr-card">' +
      '<div><div class="sk-line w60" style="margin-bottom:8px;"></div></div>' +
      '<div class="sk-line w80" style="margin-bottom:6px;"></div>' +
      '<div class="sk-line w50" style="margin-bottom:6px;"></div>' +
      '<div class="sk-line w30"></div>' +
    '</div>' +
    '<div class="sk-addr-card">' +
      '<div><div class="sk-line w60" style="margin-bottom:8px;"></div></div>' +
      '<div class="sk-line w80" style="margin-bottom:6px;"></div>' +
      '<div class="sk-line w50" style="margin-bottom:6px;"></div>' +
      '<div class="sk-line w30"></div>' +
    '</div>';

  const addresses = await fetchAddresses();

  if (addresses.length === 0) {
    addressList.innerHTML = '<div class="empty-state"><h3>No addresses saved yet</h3><p>Add a delivery address to get started.</p></div>';
    return;
  }

  addressList.innerHTML = "";
  addresses.forEach(function (addr) {
    const typeIcon = { "Home": "🏠", "Work": "💼", "Other": "📍" };
    const icon = typeIcon[addr.addressType] || "📍";
    addressList.innerHTML += `
      <div class="address-card ${addr.isDefault ? "default-address" : ""}">
        <div class="address-header">
          <span class="address-type-badge">${icon} ${addr.addressType}</span>
          ${addr.isDefault ? '<span class="default-badge">⭐ Default</span>' : ""}
        </div>
        <div class="address-body">
          <p class="address-name"><strong>${addr.fullName}</strong> &nbsp;|&nbsp; ${addr.phone}</p>
          <p>${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}</p>
          <p>${addr.city}, ${addr.state} - ${addr.pincode}</p>
          ${addr.landmark ? "<p><em>Near: " + addr.landmark + "</em></p>" : ""}
        </div>
        <div class="address-actions">
          <button class="edit-btn" onclick="editAddress('${addr._id}')">✏️ Edit</button>
          ${addr.isDefault ? "" : '<button class="default-btn" onclick="makeDefault(\'' + addr._id + '\')">⭐ Set Default</button>'}
          <button class="remove-btn" onclick="deleteAddr('${addr._id}')">🗑️ Delete</button>
        </div>
      </div>`;
  });
}

// ─── Guard: prevent concurrent saves ───
var _saving = false;

// ─── Form Submit ───
if (addressForm) {
  addressForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Prevent double-submission
    if (_saving) return;
    _saving = true;
    saveBtn.disabled = true;

    formMessage.textContent = "Saving...";
    formMessage.style.color = "#666";

    const addressData = {
      fullName: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      addressLine1: document.getElementById("addressLine1").value,
      addressLine2: document.getElementById("addressLine2").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      pincode: document.getElementById("pincode").value,
      landmark: document.getElementById("landmark").value,
      addressType: document.getElementById("addressType").value,
      isDefault: document.getElementById("isDefault").checked,
    };

    try {
      const editId = addressIdInput.value;
      if (editId) {
        await updateAddress(editId, addressData);
        showToast("Address updated");
        hideAddressForm();
        renderAddresses();
      } else {
        try {
          await addAddress(addressData);
          showToast("Address added");
          hideAddressForm();
          renderAddresses();
        } catch (err) {
          // 409 = duplicate address detected by server
          if (err.message && err.message.includes("already exists")) {
            showToast("This address already exists.", "warning");
            hideAddressForm();
            renderAddresses();
          } else {
            throw err; // re-throw non-duplicate errors
          }
        }
      }
    } catch (err) {
      formMessage.textContent = "Error: " + err.message;
      formMessage.style.color = "#E53935";
    } finally {
      _saving = false;
      saveBtn.disabled = false;
    }
  });
}

// ─── Edit ───
async function editAddress(id) {
  try {
    const addr = await fetchAddressById(id);
    showAddressForm(addr);
  } catch (e) {
    showToast("Error loading address");
  }
}

// ─── Set Default ───
async function makeDefault(id) {
  try {
    await setDefaultAddress(id);
    showToast("Default address updated");
    renderAddresses();
  } catch (e) {
    showToast("Error: " + e.message);
  }
}

// ─── Delete ───
async function deleteAddr(id) {
  if (!confirm("Delete this address?")) return;
  try {
    await deleteAddress(id);
    showToast("Address deleted");
    renderAddresses();
  } catch (e) {
    showToast("Error: " + e.message);
  }
}

// ─── Init ───
if (isLoggedIn()) {
  renderAddresses();
} else {
  if (addressList) addressList.innerHTML = '<p>Please <a href="login.html">login</a> to manage your addresses.</p>';
}
