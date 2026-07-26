(async function loadSettings() {
  try {
    var s = await adminFetchSettings();
    document.getElementById("setStoreName").value = s.storeName||"";
    document.getElementById("setEmail").value = s.supportEmail||"";
    document.getElementById("setPhone").value = s.supportPhone||"";
    document.getElementById("setDeliveryCharge").value = s.deliveryCharge||40;
    document.getElementById("setFreeDelivery").value = s.freeDeliveryAmount||500;
    document.getElementById("setTax").value = s.tax||5;
    document.getElementById("setCurrency").value = s.currency||"INR";
    document.getElementById("setCurrencySymbol").value = s.currencySymbol||"₹";
    document.getElementById("setLogo").value = s.logo||"";
  } catch(e) {
    showAdminToast("Failed to load settings: "+e.message, "error");
  }
})();

async function saveSettings(e) {
  e.preventDefault();
  var data = {
    storeName: document.getElementById("setStoreName").value,
    supportEmail: document.getElementById("setEmail").value,
    supportPhone: document.getElementById("setPhone").value,
    deliveryCharge: Number(document.getElementById("setDeliveryCharge").value),
    freeDeliveryAmount: Number(document.getElementById("setFreeDelivery").value),
    tax: Number(document.getElementById("setTax").value),
    currency: document.getElementById("setCurrency").value,
    currencySymbol: document.getElementById("setCurrencySymbol").value,
    logo: document.getElementById("setLogo").value,
  };
  try {
    await adminUpdateSettings(data);
    showAdminToast("Settings saved successfully!");
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}
