// ─── DOM References ───
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sortSelect = document.getElementById("sortProducts");
const recommendedContainer = document.getElementById("recommendedContainer");
const scrollButton = document.getElementById("scrollTop");

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// ─── Product cache for guest cart ───
let productCache = {};

// ─── Pagination & Filter State ───
let currentPage = 1;
let currentFilters = {};
let totalPages = 1;
let totalProducts = 0;
let isLoading = false;

const DEFAULT_LIMIT = 12;

// ─── Toast ───
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () { toast.classList.remove("show"); }, 2000);
}

// ─── Build skeleton HTML ───
function getSkeletonHTML(count) {
  var html = "";
  for (var i = 0; i < count; i++) {
    html += '<div class="product-card skeleton">' +
      '<div class="skeleton-img"></div>' +
      '<div class="skeleton-text"></div>' +
      '<div class="skeleton-text short"></div>' +
      '<div class="skeleton-btn"></div>' +
    '</div>';
  }
  return html;
}

// ─── Backend-powered fetch & render ───
async function loadProducts(append) {
  if (isLoading) return;
  isLoading = true;

  if (!append) {
    productContainer.innerHTML = getSkeletonHTML(DEFAULT_LIMIT);
  }

  try {
    var opts = {
      page: currentPage,
      limit: DEFAULT_LIMIT,
      sort: sortSelect ? sortSelect.value : "newest",
      ...currentFilters,
    };
    // Remove undefined/empty values
    Object.keys(opts).forEach(function (k) {
      if (!opts[k] && opts[k] !== 0 && opts[k] !== false) delete opts[k];
    });

    var data = await fetchProducts(opts);
    var products = data.products || [];
    var pagination = data.pagination || {};
    totalPages = pagination.totalPages || 1;
    totalProducts = pagination.totalProducts || products.length;

    // Update product cache for guest cart
    products.forEach(function (p) {
      productCache[p._id || p.id] = p;
    });

    // Update filter UI with available categories/brands from API
    if (data.filters) updateFilterUI(data.filters);

    if (!append) {
      productContainer.innerHTML = "";
    }

    if (products.length === 0) {
      productContainer.innerHTML = '<div class="empty-search"><i class="fas fa-search" style="font-size:48px;color:#ccc;margin-bottom:15px;"></i><h3>No products found</h3><p>Try adjusting your search or filters.</p></div>';
      updatePagination();
      updateResultsInfo();
      isLoading = false;
      return;
    }

    displayProducts(products, append);
    updatePagination();
    updateResultsInfo();
  } catch (e) {
    if (!append) {
      productContainer.innerHTML = '<div class="empty-search"><i class="fas fa-exclamation-circle" style="font-size:48px;color:#E53935;margin-bottom:15px;"></i><h3>Error loading products</h3><p>' + e.message + '</p><button class="shop-btn" onclick="loadProducts()" style="margin-top:15px;">Retry</button></div>';
    }
  }

  isLoading = false;
}

// ─── Display products in grid ───
function displayProducts(productList, append) {
  if (!productContainer) return;
  if (!append) productContainer.innerHTML = "";

  productList.forEach(function (product) {
    var id = product._id || product.id;
    var inWishlist = wishlist.map(String).includes(String(id));
    var discount = 0;
    if (product.oldPrice && product.oldPrice > product.price) {
      discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    }
    var starsHtml = "";
    for (var s = 0; s < 5; s++) {
      starsHtml += s < product.rating
        ? '<i class="fas fa-star" style="color:#FFD700;"></i>'
        : '<i class="far fa-star" style="color:#ddd;"></i>';
    }

    productContainer.innerHTML +=
      '<div class="product-card" data-id="' + id + '">' +
        '<div class="wishlist" onclick="addWishlist(\'' + id + '\')" aria-label="Add to wishlist">' +
          (inWishlist ? '<i class="fas fa-heart" style="color:#E53935;"></i>' : '<i class="far fa-heart"></i>') +
        '</div>' +
        (discount > 0 ? '<div class="discount-badge">' + discount + '% OFF</div>' : '') +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<h3>' + product.name + '</h3>' +
        (product.oldPrice && product.oldPrice > product.price
          ? '<p class="old-price">\u20B9' + product.oldPrice + '</p>'
          : '') +
        '<p class="price">\u20B9' + product.price + '</p>' +
        '<p class="stock">' + (product.stock ? '<i class="fas fa-check-circle" style="color:#2E7D32;"></i> In Stock' : '<i class="fas fa-times-circle" style="color:#E53935;"></i> Only 5 Left') + '</p>' +
        '<p class="rating">' + starsHtml + '</p>' +
        '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
      '</div>';
  });
}

// ─── Results Info ───
function updateResultsInfo() {
  var el = document.getElementById("resultsInfo");
  if (!el) return;
  if (totalProducts === 0) {
    el.textContent = "";
    return;
  }
  el.textContent = "Showing page " + currentPage + " of " + totalPages + " (" + totalProducts + " products)";
}

// ─── Pagination Controls ───
function updatePagination() {
  var paginationEl = document.getElementById("pagination");
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  var html = '<button class="page-btn" onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage <= 1 ? 'disabled' : '') + ' aria-label="Previous page"><i class="fas fa-chevron-left"></i></button>';

  var start = Math.max(1, currentPage - 2);
  var end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    html += '<button class="page-btn" onclick="goToPage(1)">1</button>';
    if (start > 2) html += '<span class="page-dots">...</span>';
  }

  for (var i = start; i <= end; i++) {
    html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
  }

  if (end < totalPages) {
    if (end < totalPages - 1) html += '<span class="page-dots">...</span>';
    html += '<button class="page-btn" onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
  }

  html += '<button class="page-btn" onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage >= totalPages ? 'disabled' : '') + ' aria-label="Next page"><i class="fas fa-chevron-right"></i></button>';

  paginationEl.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages || isLoading) return;
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: document.querySelector(".featured-products").offsetTop - 100, behavior: "smooth" });
}

// ─── Search with Debounce ───
let searchTimeout = null;
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

if (searchInput) {
  var searchWrapper = searchInput.parentElement;
  var suggestionsEl = document.createElement("div");
  suggestionsEl.className = "search-suggestions";
  suggestionsEl.setAttribute("role", "listbox");
  searchWrapper.style.position = "relative";
  searchWrapper.appendChild(suggestionsEl);

  searchInput.addEventListener("focus", function () {
    renderSuggestions();
  });

  searchInput.addEventListener("input", function () {
    var val = searchInput.value.trim();
    if (val.length > 0) {
      renderSuggestions(val);
    } else {
      renderSuggestions();
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      currentFilters.search = val || undefined;
      currentPage = 1;
      loadProducts();
    }, 300);
  });

  // Clear button
  var clearBtn = document.createElement("button");
  clearBtn.className = "search-clear";
  clearBtn.innerHTML = '<i class="fas fa-times"></i>';
  clearBtn.setAttribute("aria-label", "Clear search");
  clearBtn.style.display = "none";
  searchWrapper.appendChild(clearBtn);

  clearBtn.addEventListener("click", function () {
    searchInput.value = "";
    clearBtn.style.display = "none";
    suggestionsEl.classList.remove("show");
    currentFilters.search = undefined;
    currentPage = 1;
    loadProducts();
    searchInput.focus();
  });

  searchInput.addEventListener("keyup", function () {
    clearBtn.style.display = searchInput.value.trim() ? "block" : "none";
  });

  document.addEventListener("click", function (e) {
    if (!searchWrapper.contains(e.target)) {
      suggestionsEl.classList.remove("show");
    }
  });
}

function renderSuggestions(query) {
  var el = document.querySelector(".search-suggestions");
  if (!el) return;

  if (query && query.length > 0) {
    el.innerHTML = '<div class="suggestion-item suggestion-hint" style="cursor:default;color:#666;"><i class="fas fa-search"></i> Searching for "' + query + '"...</div>';
    el.classList.add("show");
    return;
  }

  var items = [];
  if (searchHistory.length > 0) {
    searchHistory.slice(0, 5).forEach(function (term) {
      items.push('<div class="suggestion-item" onclick="selectSearch(\'' + term.replace(/'/g, "\\'") + '\')" role="option" tabindex="0"><i class="fas fa-history"></i> ' + term + '</div>');
    });
  } else {
    items.push('<div class="suggestion-item suggestion-hint" style="cursor:default;color:#999;"><i class="fas fa-search"></i> Start typing to search products...</div>');
  }

  el.innerHTML = items.join("");
  el.classList.add("show");
}

function selectSearch(term) {
  searchInput.value = term;
  document.querySelector(".search-clear").style.display = "block";
  document.querySelector(".search-suggestions").classList.remove("show");
  currentFilters.search = term;
  currentPage = 1;
  loadProducts();
  if (!searchHistory.includes(term)) {
    searchHistory.unshift(term);
    if (searchHistory.length > 10) searchHistory.pop();
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }
}

// ─── Category & Brand Filter ───
function filterCategory(category) {
  document.getElementById("filterDrawer")?.classList.remove("open");
  document.getElementById("filterOverlay")?.classList.remove("show");
  currentFilters.category = category === "all" ? undefined : category;
  currentPage = 1;
  loadProducts();
}

// ─── Sort ───
if (sortSelect) {
  sortSelect.addEventListener("change", function () {
    currentPage = 1;
    loadProducts();
  });
}

// ─── Filter Sidebar ───
function applyFilters() {
  var category = document.getElementById("filterCategory")?.value;
  var brand = document.getElementById("filterBrand")?.value;
  var minPrice = document.getElementById("filterMinPrice")?.value;
  var maxPrice = document.getElementById("filterMaxPrice")?.value;
  var rating = document.getElementById("filterRating")?.value;
  var stock = document.getElementById("filterStock")?.value;
  var featured = document.getElementById("filterFeatured")?.checked;
  var trending = document.getElementById("filterTrending")?.checked;
  var recommended = document.getElementById("filterRecommended")?.checked;
  var offers = document.getElementById("filterOffers")?.checked;

  currentFilters.category = category || undefined;
  currentFilters.brand = brand || undefined;
  currentFilters.minPrice = minPrice ? Number(minPrice) : undefined;
  currentFilters.maxPrice = maxPrice ? Number(maxPrice) : undefined;
  currentFilters.rating = rating ? Number(rating) : undefined;
  currentFilters.stock = stock || undefined;
  currentFilters.featured = featured ? "true" : undefined;
  currentFilters.trending = trending ? "true" : undefined;
  currentFilters.recommended = recommended ? "true" : undefined;
  currentFilters.offers = offers ? "true" : undefined;

  currentPage = 1;
  loadProducts();

  document.getElementById("filterDrawer")?.classList.remove("open");
  document.getElementById("filterOverlay")?.classList.remove("show");
}

function clearFilters() {
  currentFilters = {};
  currentPage = 1;
  searchInput.value = "";
  document.querySelector(".search-clear")?.style.display = "none";

  ["filterCategory", "filterBrand", "filterMinPrice", "filterMaxPrice", "filterRating", "filterStock"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["filterFeatured", "filterTrending", "filterRecommended", "filterOffers"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.checked = false;
  });

  loadProducts();
  document.getElementById("filterDrawer")?.classList.remove("open");
  document.getElementById("filterOverlay")?.classList.remove("show");
}

function toggleFilterDrawer() {
  document.getElementById("filterDrawer")?.classList.toggle("open");
  document.getElementById("filterOverlay")?.classList.toggle("show");
}

// ─── Update filter UI from API metadata ───
function updateFilterUI(filters) {
  if (!filters) return;

  var catSelect = document.getElementById("filterCategory");
  if (catSelect && filters.categories) {
    var val = catSelect.value;
    catSelect.innerHTML = '<option value="">All Categories</option>';
    filters.categories.forEach(function (c) {
      catSelect.innerHTML += '<option value="' + c + '">' + c + '</option>';
    });
    catSelect.value = val;
  }

  var brandSelect = document.getElementById("filterBrand");
  if (brandSelect && filters.brands) {
    var val2 = brandSelect.value;
    brandSelect.innerHTML = '<option value="">All Brands</option>';
    filters.brands.forEach(function (b) {
      brandSelect.innerHTML += '<option value="' + b + '">' + b + '</option>';
    });
    brandSelect.value = val2;
  }

  if (filters.priceRange) {
    var minInput = document.getElementById("filterMinPrice");
    var maxInput = document.getElementById("filterMaxPrice");
    if (minInput) minInput.placeholder = "Min: \u20B9" + filters.priceRange.min;
    if (maxInput) maxInput.placeholder = "Max: \u20B9" + filters.priceRange.max;
  }
}

// ─── Load Recommendations & Trending ───
async function loadRecommendationsAndTrending() {
  try {
    var [recData, trendData] = await Promise.all([
      fetchProducts({ limit: 4, recommended: "true", sort: "rating_high" }),
      fetchProducts({ limit: 4, trending: "true", sort: "rating_high" }),
    ]);

    if (recommendedContainer) {
      recommendedContainer.innerHTML = "";
      (recData.products || []).forEach(function (product) {
        var id = product._id || product.id;
        recommendedContainer.innerHTML +=
          '<div class="product-card">' +
            '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<h3>' + product.name + '</h3>' +
            '<p class="price">\u20B9' + product.price + '</p>' +
            '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
          '</div>';
      });
    }

    var trendingContainer = document.getElementById("trendingContainer");
    if (trendingContainer) {
      trendingContainer.innerHTML = "";
      (trendData.products || []).forEach(function (product) {
        var id = product._id || product.id;
        trendingContainer.innerHTML +=
          '<div class="product-card">' +
            '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<h3>' + product.name + '</h3>' +
            '<p class="price">\u20B9' + product.price + '</p>' +
            '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
          '</div>';
      });
    }
  } catch (e) {
    // Silently fail for recommendations/trending
  }
}

// ─── Cart ───
function updateCartCount() {
  if (cartCount) {
    var stored = JSON.parse(localStorage.getItem("cart")) || [];
    cartCount.textContent = stored.length;
  }
}

async function syncCartFromAPI() {
  if (isLoggedIn()) {
    try {
      var data = await fetchCart();
      if (data && data.items) {
        localStorage.setItem("cart", JSON.stringify(data.items));
        updateCartCount();
      }
    } catch (e) {}
  }
}

async function addToCart(id) {
  // Build product data from cache (for guest users)
  var product = productCache[id];

  if (isLoggedIn()) {
    try {
      var updatedCart = await addToCartAPI(id, 1);
      if (updatedCart && updatedCart.items) {
        localStorage.setItem("cart", JSON.stringify(updatedCart.items));
      }
      showToast((product ? product.name : "Item") + " added to cart");
      updateCartCount();
    } catch (e) {
      showToast("Error: " + e.message);
    }
  } else {
    var cart = JSON.parse(localStorage.getItem("cart")) || [];
    var existing = cart.find(function (item) { return (item._id || item.id) === id; });
    if (existing) {
      existing.quantity++;
    } else if (product) {
      cart.push({
        _id: id,
        id: id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice || 0,
        image: product.image,
        quantity: 1
      });
    } else {
      cart.push({ _id: id, id: id, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast((product ? product.name : "Item") + " added to cart");
  }
}

// ─── Wishlist ───
async function addWishlist(id) {
  var idStr = String(id);
  var wishlistStr = wishlist.map(String);

  if (wishlistStr.includes(idStr)) {
    if (isLoggedIn()) {
      try { await removeFromWishlistAPI(id); } catch (e) {}
    }
    wishlist = wishlist.filter(function (w) { return String(w) !== idStr; });
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    showToast("Removed from Wishlist");
  } else {
    if (isLoggedIn()) {
      try { await addToWishlistAPI(id); } catch (e) { showToast("Error: " + e.message); return; }
    }
    wishlist.push(idStr);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    showToast("Added to Wishlist");
  }
  loadProducts();
}

async function syncWishlistFromAPI() {
  if (isLoggedIn()) {
    try {
      var apiWishlist = await fetchWishlistAPI();
      wishlist = apiWishlist.map(function (item) {
        return String(item.product?._id || item.product?.id);
      });
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (e) {}
  }
}

// ─── Navbar ───
function updateNavbar() {
  var loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;
  if (isLoggedIn()) {
    getUserProfile().then(function (user) {
      loginBtn.innerHTML = '<i class="fas fa-user"></i> ' + user.name + ' <i class="fas fa-sign-out-alt"></i>';
      loginBtn.onclick = function () { logoutUser(); };
      var pointsEl = document.getElementById("userPoints");
      if (pointsEl) {
        pointsEl.textContent = Number(localStorage.getItem("points")) || 0;
      }
      syncWishlistFromAPI();
      syncCartFromAPI();
    }).catch(function () {
      loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
      loginBtn.onclick = function () { window.location.href = "login.html"; };
    });
  } else {
    loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
    loginBtn.onclick = function () { window.location.href = "login.html"; };
  }
}

// ─── Init ───
(async function init() {
  await syncWishlistFromAPI();
  await syncCartFromAPI();
  await loadProducts();
  await loadRecommendationsAndTrending();
  updateCartCount();
  updateNavbar();
})();
