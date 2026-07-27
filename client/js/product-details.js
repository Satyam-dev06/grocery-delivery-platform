// ─── State ───
var currentProduct = null;
var currentQty = 1;
var isInWishlist = false;

function getProductId() {
  var params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderStars(rating) {
  var html = "";
  for (var s = 0; s < 5; s++) {
    html += s < rating
      ? '<i class="fas fa-star" style="color:#FFD700;font-size:16px;"></i>'
      : '<i class="far fa-star" style="color:#ddd;font-size:16px;"></i>';
  }
  return html;
}

async function loadProduct() {
  var id = getProductId();
  if (!id) { showError("No product ID specified."); return; }
  try {
    var product = await fetchProductById(id);
    currentProduct = product;
    renderProduct(product);
  } catch (e) {
    showError(e.message || "Failed to load product.");
  }
}

function showError(msg) {
  document.getElementById("productLoading").style.display = "none";
  document.getElementById("productError").style.display = "block";
  document.getElementById("errorMessage").textContent = msg;
}

function renderProduct(product) {
  document.getElementById("productLoading").style.display = "none";
  document.getElementById("productContent").style.display = "block";
  document.title = product.name + " | GroceryHub";
  var md = document.getElementById("metaDescription");
  if (md) md.content = product.name + " - " + (product.description || "Fresh grocery product");
  var bc = document.getElementById("breadcrumbCategory");
  if (bc) { bc.textContent = product.category || "Products"; bc.href = "index.html?category=" + encodeURIComponent(product.category || ""); }
  document.getElementById("breadcrumbName").textContent = product.name;
  document.getElementById("pdBrand").textContent = product.brand || "";
  document.getElementById("pdCategory").textContent = product.category || "";
  document.getElementById("pdTitle").textContent = product.name;
  document.getElementById("pdStars").innerHTML = renderStars(product.rating || 0);
  document.getElementById("pdReviewCount").textContent = "(" + (product.rating || 0) + " rating" + (product.rating !== 1 ? "s" : "") + ")";
  var discount = 0;
  if (product.oldPrice && product.oldPrice > product.price) discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  document.getElementById("pdCurrentPrice").textContent = "\u20B9" + (product.price || 0).toLocaleString("en-IN");
  var opEl = document.getElementById("pdOldPrice");
  if (product.oldPrice && product.oldPrice > product.price) { opEl.textContent = "\u20B9" + product.oldPrice.toLocaleString("en-IN"); opEl.style.display = "inline"; } else { opEl.style.display = "none"; }
  var db = document.getElementById("pdDiscountBadge");
  var dt = document.getElementById("pdDiscountText");
  if (discount > 0) { db.style.display = "flex"; db.textContent = discount + "% OFF"; dt.style.display = "inline"; dt.textContent = "You save \u20B9" + (product.oldPrice - product.price).toLocaleString("en-IN") + "!"; } else { db.style.display = "none"; dt.style.display = "none"; }
  var se = document.getElementById("pdStockStatus");
  if (product.stock) { se.innerHTML = '<i class="fas fa-check-circle" style="color:#2E7D32;"></i> In Stock'; document.querySelector(".pd-add-cart").disabled = false; document.querySelector(".pd-add-cart").style.opacity = "1"; document.querySelector(".pd-buy-now").disabled = false; document.querySelector(".pd-buy-now").style.opacity = "1"; }
  else { se.innerHTML = '<i class="fas fa-times-circle" style="color:#E53935;"></i> Out of Stock'; document.querySelector(".pd-add-cart").disabled = true; document.querySelector(".pd-add-cart").style.opacity = "0.5"; document.querySelector(".pd-buy-now").disabled = true; document.querySelector(".pd-buy-now").style.opacity = "0.5"; }
  document.getElementById("pdDescription").textContent = product.description || "No description available.";
  document.getElementById("pdMainImage").src = product.image || "";
  var tc = document.getElementById("pdThumbnails");
  tc.innerHTML = "";
  var thumbs = [product.image];
  thumbs.forEach(function (src) { if (!src) return; var t = document.createElement("img"); t.src = src; t.className = "pd-thumb active"; t.alt = product.name; t.onclick = function () { selectThumbnail(this); }; tc.appendChild(t); });
  checkWishlistState(product._id || product.id);
  renderOffers(product);
  var dl = document.getElementById("pdDeliveryTime");
  if (dl) { dl.textContent = (product.category && ["Meat","Dairy","Bakery"].includes(product.category)) ? "20" : "30"; }
  loadRelatedProducts(product.category, product._id || product.id);
  loadReviews(product);
  if (typeof observeProductCards === "function") observeProductCards();
}

function selectThumbnail(thumb) {
  document.querySelectorAll(".pd-thumb").forEach(function (t) { t.classList.remove("active"); });
  thumb.classList.add("active");
  document.getElementById("pdMainImage").src = thumb.src;
}

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById("pdQty").textContent = currentQty;
}

function pdAddToCart() {
  if (!currentProduct) return;
  var id = currentProduct._id || currentProduct.id;
  var qty = currentQty;
  if (typeof isLoggedIn === "function" && isLoggedIn()) {
    addToCartAPI(id, qty).then(function () { showToast(currentProduct.name + " x" + qty + " added to cart!", "success"); updateCartCount(); }).catch(function (e) { showToast("Error: " + e.message, "error"); });
  } else {
    var cart = JSON.parse(localStorage.getItem("cart")) || [];
    var existing = cart.find(function (item) { return (item._id || item.id) === id; });
    if (existing) { existing.quantity += qty; } else { cart.push({ _id: id, id: id, name: currentProduct.name, price: currentProduct.price, oldPrice: currentProduct.oldPrice || 0, image: currentProduct.image, quantity: qty }); }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast(currentProduct.name + " x" + qty + " added to cart!", "success");
  }
}

function pdBuyNow() {
  pdAddToCart();
  setTimeout(function () { window.location.href = "checkout.html"; }, 500);
}

function pdShare() {
  var url = window.location.href;
  if (navigator.share) { navigator.share({ title: currentProduct ? currentProduct.name : "GroceryHub Product", url: url }).catch(function () {}); }
  else { navigator.clipboard.writeText(url).then(function () { showToast("Link copied to clipboard!", "success"); }).catch(function () { showToast("Share: " + url, "info"); }); }
}

function checkWishlistState(id) {
  var wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  isInWishlist = wishlist.map(String).includes(String(id));
  updateWishlistBtn();
}

function toggleWishlist() {
  if (!currentProduct) return;
  var id = currentProduct._id || currentProduct.id;
  if (isInWishlist) {
    if (typeof isLoggedIn === "function" && isLoggedIn()) removeFromWishlistAPI(id).catch(function () {});
    var wl = JSON.parse(localStorage.getItem("wishlist")) || [];
    wl = wl.filter(function (w) { return String(w) !== String(id); });
    localStorage.setItem("wishlist", JSON.stringify(wl));
    isInWishlist = false;
    showToast("Removed from Wishlist", "info");
  } else {
    if (typeof isLoggedIn === "function" && isLoggedIn()) addToWishlistAPI(id).catch(function () {});
    var wl2 = JSON.parse(localStorage.getItem("wishlist")) || [];
    if (!wl2.map(String).includes(String(id))) wl2.push(id);
    localStorage.setItem("wishlist", JSON.stringify(wl2));
    isInWishlist = true;
    showToast("Added to Wishlist!", "success");
  }
  updateWishlistBtn();
}

function updateWishlistBtn() {
  var btn = document.getElementById("pdWishlistBtn");
  if (!btn) return;
  btn.innerHTML = isInWishlist ? '<i class="fas fa-heart" style="color:#E53935;"></i>' : '<i class="far fa-heart"></i>';
}

document.addEventListener("DOMContentLoaded", function () {
  var wlBtn = document.getElementById("pdWishlistBtn");
  if (wlBtn) wlBtn.addEventListener("click", toggleWishlist);
});

function renderOffers(product) {
  var section = document.getElementById("pdOffersSection");
  var list = document.getElementById("pdOffersList");
  if (!section || !list) return;
  var offers = [];
  if (product.oldPrice && product.oldPrice > product.price) {
    var disc = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    offers.push("\uD83D\uDD25 " + disc + "% OFF \u2014 Limited time deal on " + product.name);
  }
  offers.push("\uD83D\uDCB0 Extra 5% off on orders above \u20B9499. Use code: GROCERY5");
  offers.push("\uD83D\uDE9A Free delivery on your first order!");
  if (offers.length > 0) {
    section.style.display = "block";
    list.innerHTML = offers.map(function (o) { return '<div class="pd-offer-item"><i class="fas fa-gift"></i> ' + o + '</div>'; }).join("");
  } else { section.style.display = "none"; }
}

async function loadRelatedProducts(category, excludeId) {
  var container = document.getElementById("relatedContainer");
  if (!container) return;
  try {
    var data = await fetchProducts({ category: category, limit: 7, sort: "rating_high" });
    var products = (data.products || []).filter(function (p) { return (p._id || p.id) !== excludeId; }).slice(0, 6);
    if (products.length === 0) {
      var allData = await fetchProducts({ limit: 7, sort: "rating_high" });
      products = (allData.products || []).filter(function (p) { return (p._id || p.id) !== excludeId; }).slice(0, 6);
    }
    container.innerHTML = "";
    if (products.length === 0) { container.innerHTML = '<div class="empty-search"><p>No related products found.</p></div>'; return; }
    products.forEach(function (product) {
      var pid = product._id || product.id;
      var disc = 0;
      if (product.oldPrice && product.oldPrice > product.price) disc = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
      container.innerHTML +=
        '<div class="product-card">' + (disc > 0 ? '<div class="discount-badge">' + disc + '% OFF</div>' : '') +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'" onclick="window.location.href=\'product-details.html?id=' + pid + '\'" style="cursor:pointer;">' +
        '<h3 onclick="window.location.href=\'product-details.html?id=' + pid + '\'" style="cursor:pointer;">' + product.name + '</h3>' +
        (product.oldPrice && product.oldPrice > product.price ? '<p class="old-price">\u20B9' + product.oldPrice + '</p>' : '') +
        '<p class="price">\u20B9' + product.price + '</p>' +
        '<button onclick="addToCartFromDetails(\'' + pid + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button></div>';
    });
    if (typeof observeProductCards === "function") observeProductCards();
  } catch (e) { container.innerHTML = '<div class="empty-search"><p>Could not load related products.</p></div>'; }
}

function addToCartFromDetails(id) {
  if (typeof addToCart === "function") addToCart(id);
  else showToast("Please use the main page to add items.", "info");
}

function loadReviews(product) {
  var container = document.getElementById("reviewsContainer");
  if (!container) return;
  var rating = product.rating || 0;
  container.innerHTML =
    '<div class="pd-rating-summary"><div class="pd-rating-average"><span class="pd-rating-number">' + rating.toFixed(1) + '</span><span class="pd-rating-stars">' + renderStars(rating) + '</span></div><p class="pd-rating-based">Based on ' + rating + ' rating' + (rating !== 1 ? "s" : "") + '</p></div>' +
    '<div class="pd-no-reviews"><i class="fas fa-comment-dots"></i><h3>No reviews yet</h3><p>Be the first to review this product! Share your experience with other customers.</p></div>';
}

function showToast(message, type) {
  type = type || "info";
  var toast = document.getElementById("toast");
  if (!toast) { toast = document.createElement("div"); toast.id = "toast"; document.body.appendChild(toast); }
  var icons = { success: "\u2705", error: "\u274C", warning: "\u26A0\uFE0F", info: "\u2139\uFE0F" };
  toast.innerHTML = (icons[type] || "\u2139\uFE0F") + " " + message;
  toast.className = "show toast-" + type;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () { toast.className = ""; }, 2500);
}

function handleLoginClick() {
  if (typeof isLoggedIn === "function" && isLoggedIn()) { if (typeof logoutUser === "function") logoutUser(); }
  else { window.location.href = "login.html"; }
}

function updateCartCount() {
  var el = document.getElementById("cartCount");
  if (el) { var stored = JSON.parse(localStorage.getItem("cart")) || []; el.textContent = stored.length; }
}

(function init() {
  updateCartCount();
  loadProduct();
})();
