const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sortSelect = document.getElementById("sortProducts");
const recommendedContainer = document.getElementById("recommendedContainer");
const scrollButton = document.getElementById("scrollTop");

let allProducts = [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// Show toast notification
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () { toast.classList.remove("show"); }, 2000);
}

// Display products in grid
function displayProducts(productList) {
  if (!productContainer) return;
  productContainer.innerHTML = "";
  productList.forEach(function (product) {
    const id = product._id || product.id;
    productContainer.innerHTML += `
      <div class="product-card">
        <div class="wishlist" onclick="addWishlist('${id}')">${wishlist.map(String).includes(String(id)) ? "❤️" : "🤍"}</div>
        <div class="discount-badge">${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF</div>
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <h3>${product.name}</h3>
        <p class="old-price">₹${product.oldPrice}</p>
        <p class="price">₹${product.price}</p>
        <p class="stock">${product.stock ? "In Stock" : "Only 5 Left"}</p>
        <p class="rating">${"⭐".repeat(product.rating)}</p>
        <button onclick="addToCart('${id}')">Add To Cart</button>
      </div>`;
  });
}

// Update cart count badge
function updateCartCount() {
  if (cartCount) {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];
    cartCount.textContent = stored.length;
  }
}

// Add to cart via API (or localStorage fallback)
async function addToCart(id) {
  if (isLoggedIn()) {
    try {
      const product = allProducts.find(function (p) { return (p._id || p.id) === id; });
      const updatedCart = await addToCartAPI(id, 1);
      // Sync API cart to localStorage for badge & checkout
      if (updatedCart && updatedCart.items) {
        localStorage.setItem("cart", JSON.stringify(updatedCart.items));
      }
      showToast((product ? product.name : "Item") + " added to cart");
      updateCartCount();
    } catch (e) {
      showToast("Error: " + e.message);
    }
  } else {
    // localStorage fallback
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    // Check by both _id and id (API products use _id, fallback products use id)
    const existing = cart.find(function (item) { return (item._id || item.id) === id; });
    if (existing) {
      existing.quantity++;
    } else {
      const product = allProducts.find(function (p) { return (p._id || p.id) === id; });
      if (product) {
        cart.push({ ...product, quantity: 1, id: id });
      }
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    const product = allProducts.find(function (p) { return (p._id || p.id) === id; });
    showToast((product ? product.name : "Item") + " added to cart");
  }
}

// Add to wishlist (uses API when logged in, localStorage fallback)
async function addWishlist(id) {
  const idStr = String(id);
  const wishlistStr = wishlist.map(String);

  if (wishlistStr.includes(idStr)) {
    showToast("Already in Wishlist");
    return;
  }

  if (isLoggedIn()) {
    try {
      await addToWishlistAPI(id);
    } catch (e) {
      showToast("Error: " + e.message);
      return;
    }
  }

  // Update local state and localStorage
  wishlist.push(idStr);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  showToast("Added to Wishlist ❤️");
  displayProducts(allProducts);
}

// Sync wishlist from API on page load (used after login)
async function syncWishlistFromAPI() {
  if (isLoggedIn()) {
    try {
      const apiWishlist = await fetchWishlistAPI();
      wishlist = apiWishlist.map(function (item) {
        return String(item.product._id || item.product.id);
      });
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (e) {
      // Keep existing localStorage wishlist
    }
  }
}

// Filter by category
function filterCategory(category) {
  const filtered = allProducts.filter(function (p) { return p.category === category; });
  displayProducts(filtered);
}

// Search
if (searchInput) {
  searchInput.addEventListener("input", function () {
    const text = searchInput.value.toLowerCase();
    const filtered = allProducts.filter(function (p) { return p.name.toLowerCase().includes(text); });
    displayProducts(filtered);
  });
}

// Sort
if (sortSelect) {
  sortSelect.addEventListener("change", function () {
    const sorted = [...allProducts];
    if (sortSelect.value === "low") sorted.sort(function (a, b) { return a.price - b.price; });
    else if (sortSelect.value === "high") sorted.sort(function (a, b) { return b.price - a.price; });
    displayProducts(sorted);
  });
}

// Recommendations
function displayRecommendations() {
  if (!recommendedContainer) return;
  recommendedContainer.innerHTML = "";
  allProducts.slice(0, 3).forEach(function (product) {
    const id = product._id || product.id;
    recommendedContainer.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <h3>${product.name}</h3>
        <p class="price">₹${product.price}</p>
        <button onclick="addToCart('${id}')">Add To Cart</button>
      </div>`;
  });
}

// Trending products
const trendingContainer = document.getElementById("trendingContainer");
function displayTrendingProducts() {
  if (!trendingContainer) return;
  trendingContainer.innerHTML = "";
  const trending = [...allProducts].sort(function (a, b) { return b.rating - a.rating; }).slice(0, 4);
  trending.forEach(function (product) {
    const id = product._id || product.id;
    trendingContainer.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <h3>${product.name}</h3>
        <p class="price">₹${product.price}</p>
        <button onclick="addToCart('${id}')">Add To Cart</button>
      </div>`;
  });
}

// Scroll to top
if (scrollButton) {
  window.addEventListener("scroll", function () {
    scrollButton.style.display = window.scrollY > 500 ? "block" : "none";
  });
  scrollButton.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
}

// Load products from API (with localStorage fallback)
(async function init() {
  try {
    allProducts = await fetchProducts();
  } catch (e) {
    allProducts = (typeof products !== "undefined") ? products : [];
  }
  await syncWishlistFromAPI();
  displayProducts(allProducts);
  displayRecommendations();
  displayTrendingProducts();
  updateCartCount();
  updateNavbar();
})();

// Update navbar based on auth state
function updateNavbar() {
  const loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;
  if (isLoggedIn()) {
    getUserProfile().then(function (user) {
      loginBtn.innerHTML = user.name + " | Logout";
      loginBtn.onclick = function () { logoutUser(); };
      const pointsEl = document.getElementById("userPoints");
      if (pointsEl) {
        const stored = Number(localStorage.getItem("points")) || 0;
        pointsEl.textContent = stored;
      }
      // Sync wishlist when user profile loads (user just logged in)
      syncWishlistFromAPI();
    }).catch(function () {
      loginBtn.innerHTML = "Login";
      loginBtn.onclick = function () { window.location.href = "login.html"; };
    });
  } else {
    loginBtn.innerHTML = "Login";
    loginBtn.onclick = function () { window.location.href = "login.html"; };
  }
}
