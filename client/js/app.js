// ─── DOM References ───
const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sortSelect = document.getElementById("sortProducts");
const recommendedContainer = document.getElementById("recommendedContainer");
const trendingContainer = document.getElementById("trendingContainer");
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

// ─── Smooth scroll to section and update active nav ───
function scrollToSection(id) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.querySelector("." + id);
  }
  if (!el) return;
  var offset = 90; // navbar height offset
  var top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: top, behavior: "smooth" });
  // Update active nav link
  updateActiveNavLink(id);
  // Auto-focus first category card when scrolling to categories
  if (id === "categories") {
    setTimeout(function () {
      var firstCat = document.querySelector(".category-card");
      if (firstCat) firstCat.focus({ preventScroll: true });
    }, 500);
  }
  // Brief highlight on section
  if (id !== "hero") {
    el.style.transition = "background-color 0.5s ease";
    el.style.backgroundColor = "rgba(46,125,50,0.06)";
    setTimeout(function () {
      el.style.backgroundColor = "";
    }, 1000);
  }
}

// ─── Update active nav link based on scroll position ───
function updateActiveNavLink(sectionId) {
  var links = document.querySelectorAll(".nav-links li a");
  links.forEach(function (link) {
    link.classList.remove("active");
    var href = link.getAttribute("href");
    if (href && href.replace("#", "") === sectionId) {
      link.classList.add("active");
    }
  });
}

// ─── Handle scroll-based active nav link ───
function handleScrollActiveNav() {
  var sections = ["hero", "categories", "offers", "featured-products", "recommended-products"];
  var scrollY = window.scrollY + 120;
  var activeId = "hero";

  sections.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) el = document.querySelector("." + id);
    if (el) {
      var offsetTop = el.offsetTop;
      var offsetBottom = offsetTop + el.offsetHeight;
      if (scrollY >= offsetTop && scrollY < offsetBottom) {
        activeId = id;
      }
    }
  });

  var links = document.querySelectorAll(".nav-links li a");
  links.forEach(function (link) {
    link.classList.remove("active");
    var href = link.getAttribute("href");
    if (href) {
      var cleanHref = href.replace("#", "").split("?")[0].split(".")[0];
      if (cleanHref === activeId || (activeId === "featured-products" && cleanHref === "hero")) {
        // Only highlight if it's a scrollable section link
        if (href.startsWith("#")) {
          link.classList.add("active");
        }
      }
    }
  });
}

// ─── Toast ───
function showToast(message, type) {
  type = type || "info";
  const toast = document.getElementById("toast");
  if (!toast) return;
  var icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  var icon = icons[type] || "ℹ️";
  toast.innerHTML = icon + " " + message;
  toast.className = "show toast-" + type;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () { toast.className = ""; }, 2500);
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
    var fetchedProds = data.products || [];
    var pagination = data.pagination || {};
    totalPages = pagination.totalPages || 1;
    totalProducts = pagination.totalProducts || fetchedProds.length;

    // Update product cache for guest cart
    fetchedProds.forEach(function (p) {
      productCache[p._id || p.id] = p;
    });

    // Update filter UI with available categories/brands from API
    if (data.filters) updateFilterUI(data.filters);

    if (!append) {
      productContainer.innerHTML = "";
    }

    if (fetchedProds.length === 0) {
      productContainer.innerHTML = '<div class="empty-search"><i class="fas fa-search" style="font-size:48px;color:#ccc;margin-bottom:15px;"></i><h3>No products found</h3><p>Try adjusting your search or filters.</p></div>';
      updatePagination();
      updateResultsInfo();
      isLoading = false;
      return;
    }

    displayProducts(fetchedProds, append);
    updatePagination();
    updateResultsInfo();
  } catch (e) {
    // If API fails (e.g. MongoDB not running), fall back to static product data
    console.warn("API fetch failed, using static product data:", e.message);
    if (!append) {
      // products.js declares `const products` (lexical global, NOT on window)
      var staticProds = typeof products !== "undefined" ? products : [];
      if (staticProds.length > 0) {
        // Apply basic sort to static data
        var sorted = [].concat(staticProds);
        if (opts.sort === "price_low") sorted.sort(function(a,b){return a.price-b.price;});
        else if (opts.sort === "price_high") sorted.sort(function(a,b){return b.price-a.price;});
        else if (opts.sort === "rating_high") sorted.sort(function(a,b){return b.rating-a.rating;});
        else if (opts.sort === "name_az") sorted.sort(function(a,b){return a.name.localeCompare(b.name);});
        // Filter by category if specified
        if (opts.category) sorted = sorted.filter(function(p){return p.category === opts.category;});
        // Filter by search if specified
        if (opts.search) {
          var q = opts.search.toLowerCase();
          sorted = sorted.filter(function(p){return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);});
        }
        // Filter offers if specified
        if (opts.offers === "true") {
          sorted = sorted.filter(function(p){return p.oldPrice && p.oldPrice > p.price;});
        }
        totalPages = 1;
        totalProducts = sorted.length;
        productContainer.innerHTML = "";
        displayProducts(sorted, false);
        updatePagination();
        updateResultsInfo();
      } else {
        productContainer.innerHTML = '<div class="empty-search"><i class="fas fa-exclamation-circle" style="font-size:48px;color:#E53935;margin-bottom:15px;"></i><h3>Unable to load products</h3><p>Backend is unavailable. Please try again later.</p><button class="shop-btn" onclick="loadProducts()" style="margin-top:15px;">Retry</button></div>';
      }
    }
  }

  isLoading = false;
}

// ─── Display products in grid ───
function displayProducts(productList, append) {
  if (!productContainer) return;
  if (!append) productContainer.innerHTML = "";

  // Get current search query for highlighting
  var searchQ = (currentFilters.search || "").toLowerCase();

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

    // Highlight matching text if search is active
    var displayName = product.name;
    if (searchQ && product.name.toLowerCase().includes(searchQ)) {
      var idx = product.name.toLowerCase().indexOf(searchQ);
      var matched = product.name.substring(idx, idx + searchQ.length);
      displayName = product.name.substring(0, idx) +
        '<span class="search-highlight">' + matched + '</span>' +
        product.name.substring(idx + searchQ.length);
    }

    productContainer.innerHTML +=
      '<div class="product-card" data-id="' + id + '">' +
        '<div class="wishlist" onclick="addWishlist(\'' + id + '\')" aria-label="Add to wishlist">' +
          (inWishlist ? '<i class="fas fa-heart" style="color:#E53935;"></i>' : '<i class="far fa-heart"></i>') +
        '</div>' +
        (discount > 0 ? '<div class="discount-badge">' + discount + '% OFF</div>' : '') +
        '<a href="product-details.html?id=' + id + '" class="pd-card-link">' +
        '<img src="' + imgUrl(resolveProductImage(product)) + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '</a>' +
        '<a href="product-details.html?id=' + id + '" class="pd-card-link">' +
        '<h3>' + displayName + '</h3>' +
        '</a>' +
        (product.oldPrice && product.oldPrice > product.price
          ? '<p class="old-price">₹' + product.oldPrice + '</p>'
          : '') +
        '<p class="price">₹' + product.price + '</p>' +
        '<p class="stock">' + (product.stock ? '<i class="fas fa-check-circle" style="color:#2E7D32;"></i> In Stock' : '<i class="fas fa-times-circle" style="color:#E53935;"></i> Only 5 Left') + '</p>' +
        '<p class="rating">' + starsHtml + '</p>' +
        '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
      '</div>';
  });
  observeProductCards();
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
  var featuredEl = document.querySelector(".featured-products");
  if (featuredEl) {
    window.scrollTo({ top: featuredEl.offsetTop - 100, behavior: "smooth" });
  }
}

// ─── Category Filter ───
function filterCategory(category) {
  // Close filter drawer if open
  document.getElementById("filterDrawer")?.classList.remove("open");
  document.getElementById("filterOverlay")?.classList.remove("show");
  currentFilters.category = category === "all" ? undefined : category;
  // Clear offers filter when selecting a category
  delete currentFilters.offers;
  currentPage = 1;
  loadProducts();
  // Scroll to products section
  var featuredEl = document.querySelector(".featured-products");
  if (featuredEl) {
    setTimeout(function () {
      featuredEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }
}

// ─── Offers Filter ───
function filterOffers() {
  currentFilters.offers = "true";
  delete currentFilters.category;
  currentPage = 1;
  loadProducts();
  // Close any open drawers
  document.getElementById("filterDrawer")?.classList.remove("open");
  document.getElementById("filterOverlay")?.classList.remove("show");
  // Scroll to products section
  var featuredEl = document.querySelector(".featured-products");
  if (featuredEl) {
    setTimeout(function () {
      featuredEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }
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
  if (searchInput) {
    searchInput.value = "";
  }
  var clearBtn = document.querySelector(".search-clear");
  if (clearBtn) clearBtn.style.display = "none";

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
    if (minInput) minInput.placeholder = "Min: ₹" + filters.priceRange.min;
    if (maxInput) maxInput.placeholder = "Max: ₹" + filters.priceRange.max;
  }
}

// ─── Scroll-Reveal Intersection Observer ───
function observeProductCards() {
  var cards = document.querySelectorAll(".product-card:not(.reveal-card)");
  if (cards.length === 0) return;
  cards.forEach(function (c) { c.classList.add("reveal-card"); });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  cards.forEach(function (c) { observer.observe(c); });
}

// ─── Load Recommendations & Trending ───
async function loadRecommendationsAndTrending() {
  // Reference global products from products.js (const lexical binding, not on window)
  var staticProducts = typeof products !== "undefined" ? products : [];
  
  try {
    var [recData, trendData] = await Promise.all([
      fetchProducts({ limit: 4, recommended: "true", sort: "rating_high" }),
      fetchProducts({ limit: 4, trending: "true", sort: "rating_high" }),
    ]);

    if (recommendedContainer) {
      recommendedContainer.innerHTML = "";
      var recItems = recData.products || [];
      if (recItems.length === 0 && staticProducts.length > 0) {
        recItems = [].concat(staticProducts).sort(function(a,b){return b.rating - a.rating;}).slice(0,4);
      }
      recItems.forEach(function (product) {
        var id = product._id || product.id;
        var discount = 0;
        if (product.oldPrice && product.oldPrice > product.price) {
          discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        }
        recommendedContainer.innerHTML +=
          '<div class="product-card">' +
            (discount > 0 ? '<div class="discount-badge">' + discount + '% OFF</div>' : '') +
            '<div class="wishlist" onclick="addWishlist(\'' + id + '\')" aria-label="Add to wishlist"><i class="far fa-heart"></i></div>' +
            '<a href="product-details.html?id=' + id + '" class="pd-card-link"><img src="' + imgUrl(resolveProductImage(product)) + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'"></a>' +
            '<a href="product-details.html?id=' + id + '" class="pd-card-link"><h3>' + product.name + '</h3></a>' +
            (product.oldPrice && product.oldPrice > product.price
              ? '<p class="old-price">₹' + product.oldPrice + '</p>'
              : '') +
            '<p class="price">₹' + product.price + '</p>' +
            '<p class="rating">' + getStars(product.rating) + '</p>' +
            '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
          '</div>';
      });
    }

    if (trendingContainer) {
      trendingContainer.innerHTML = "";
      var trendItems = trendData.products || [];
      if (trendItems.length === 0 && staticProducts.length > 0) {
        trendItems = [].concat(staticProducts).sort(function(a,b){return b.rating - a.rating;}).slice(0,4);
      }
      trendItems.forEach(function (product) {
        var id = product._id || product.id;
        var discount = 0;
        if (product.oldPrice && product.oldPrice > product.price) {
          discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        }
        trendingContainer.innerHTML +=
          '<div class="product-card">' +
            (discount > 0 ? '<div class="discount-badge">' + discount + '% OFF</div>' : '') +
            '<div class="wishlist" onclick="addWishlist(\'' + id + '\')" aria-label="Add to wishlist"><i class="far fa-heart"></i></div>' +
            '<a href="product-details.html?id=' + id + '" class="pd-card-link"><img src="' + imgUrl(resolveProductImage(product)) + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'"></a>' +
            '<a href="product-details.html?id=' + id + '" class="pd-card-link"><h3>' + product.name + '</h3></a>' +
            (product.oldPrice && product.oldPrice > product.price
              ? '<p class="old-price">₹' + product.oldPrice + '</p>'
              : '') +
            '<p class="price">₹' + product.price + '</p>' +
            '<p class="rating">' + getStars(product.rating) + '</p>' +
            '<button onclick="addToCart(\'' + id + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
          '</div>';
      });
    }
    observeProductCards();
  } catch (e) {
    console.warn("Failed to load recommendations/trending, using static products:", e.message);
    if (recommendedContainer && staticProducts.length > 0) {
      recommendedContainer.innerHTML = "";
      [].concat(staticProducts).sort(function(a,b){return b.rating - a.rating;}).slice(0,4).forEach(function (product) {
        recommendedContainer.innerHTML +=
          '<div class="product-card">' +
            '<img src="' + imgUrl(resolveProductImage(product)) + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<h3>' + product.name + '</h3>' +
            '<p class="price">₹' + product.price + '</p>' +
            '<button onclick="addToCart(\'' + (product._id || product.id) + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
          '</div>';
      });
    }
    if (trendingContainer && staticProducts.length > 0) {
      trendingContainer.innerHTML = "";
      [].concat(staticProducts).sort(function(a,b){return b.rating - a.rating;}).slice(0,4).forEach(function (product) {
        trendingContainer.innerHTML +=
            '<div class="product-card">' +
              '<img src="' + imgUrl(resolveProductImage(product)) + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
              '<h3>' + product.name + '</h3>' +
              '<p class="price">₹' + product.price + '</p>' +
              '<button onclick="addToCart(\'' + (product._id || product.id) + '\')"><i class="fas fa-shopping-cart"></i> Add To Cart</button>' +
            '</div>';
      });
    }
  }
}

function getStars(rating) {
  var html = "";
  for (var s = 0; s < 5; s++) {
    html += s < rating
      ? '<i class="fas fa-star" style="color:#FFD700;font-size:13px;"></i>'
      : '<i class="far fa-star" style="color:#ddd;font-size:13px;"></i>';
  }
  return html;
}

// ─── Floating Cart Button ───
var _floatingCart = null;
var _lastCartClickTime = 0;
var _cartPulseTimer = null;

function createFloatingCart() {
  if (document.getElementById("floatingCart")) return;
  var el = document.createElement("a");
  el.id = "floatingCart";
  el.className = "floating-cart";
  el.href = "cart.html";
  el.setAttribute("aria-label", "Open shopping cart");
  el.setAttribute("role", "button");
  el.innerHTML =
    '<i class="fas fa-shopping-cart"></i>' +
    '<span class="fcart-count" id="fcartCount">0</span>' +
    '<span class="fcart-divider"></span>' +
    '<span><span id="fcartText">Cart</span> <span class="fcart-amount" id="fcartAmount">₹0</span></span>';
  document.body.appendChild(el);
  _floatingCart = el;

  // Track when user last opened the cart (via this button)
  el.addEventListener("click", function () {
    _lastCartClickTime = Date.now();
  });
}

function updateFloatingCart() {
  if (!_floatingCart) createFloatingCart();
  var el = _floatingCart;
  if (!el) return;

  // Hide on cart.html and checkout.html
  var path = window.location.pathname;
  if (path.indexOf("cart.html") !== -1 || path.indexOf("checkout.html") !== -1) {
    el.classList.remove("visible");
    el.style.display = "none";
    return;
  }
  el.style.display = "flex";

  var stored = JSON.parse(localStorage.getItem("cart")) || [];
  if (stored.length === 0) {
    el.classList.remove("visible");
    return;
  }

  // Count items and total
  var count = 0;
  var total = 0;
  stored.forEach(function (item) {
    var qty = item.quantity || 1;
    count += qty;
    total += (item.price || 0) * qty;
  });

  document.getElementById("fcartCount").textContent = stored.length;
  document.getElementById("fcartAmount").textContent = "₹" + total.toLocaleString("en-IN");
  document.getElementById("fcartText").textContent = stored.length === 1 ? "1 Item" : stored.length + " Items";

  // Show with animation on first appearance
  if (!el.classList.contains("visible")) {
    el.classList.add("visible");
    // Start pulse timer for idle reminder
    startCartPulseTimer();
  }
}

function animateFloatingCart() {
  if (!_floatingCart || !_floatingCart.classList.contains("visible")) return;
  // Shake icon
  _floatingCart.classList.remove("shake");
  void _floatingCart.offsetWidth; // force reflow
  _floatingCart.classList.add("shake");
  // Glow
  _floatingCart.classList.remove("glow");
  void _floatingCart.offsetWidth;
  _floatingCart.classList.add("glow");
  // Reset pulse timer
  startCartPulseTimer();
}

function startCartPulseTimer() {
  if (_cartPulseTimer) clearTimeout(_cartPulseTimer);
  _cartPulseTimer = setTimeout(function () {
    if (!_floatingCart || !_floatingCart.classList.contains("visible")) return;
    // Only pulse if user hasn't opened the cart in 30 seconds
    if (Date.now() - _lastCartClickTime > 30000) {
      _floatingCart.classList.add("pulse");
    }
  }, 30000);
}

// ─── Cart ───
function updateCartCount() {
  if (cartCount) {
    var stored = JSON.parse(localStorage.getItem("cart")) || [];
    cartCount.textContent = stored.length;
  }
  // Also update floating cart
  updateFloatingCart();
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
  var product = productCache[id];

  if (isLoggedIn()) {
    try {
      var updatedCart = await addToCartAPI(id, 1);
      if (updatedCart && updatedCart.items) {
        localStorage.setItem("cart", JSON.stringify(updatedCart.items));
      }
      showToast((product ? product.name : "Item") + " added to cart  <a href=\"cart.html\" style=\"color:#FFD54F;font-weight:700;text-decoration:underline;\">View Cart</a>");
      updateCartCount();
      animateFloatingCart();
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
        image: resolveProductImage(product),
        quantity: 1
      });
    } else {
      cart.push({ _id: id, id: id, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast((product ? product.name : "Item") + " added to cart  <a href=\"cart.html\" style=\"color:#FFD54F;font-weight:700;text-decoration:underline;\">View Cart</a>");
    animateFloatingCart();
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

// ─── Wishlist Login Modal ───
var wishlistModal = null;

function createWishlistModal() {
  if (document.getElementById("wishlistModal")) return;
  wishlistModal = document.createElement("div");
  wishlistModal.id = "wishlistModal";
  wishlistModal.className = "auth-modal-overlay";
  wishlistModal.innerHTML =
    '<div class="auth-modal">' +
    '<button class="auth-modal-close" onclick="closeWishlistModal()">&times;</button>' +
    '<div class="auth-modal-icon"><i class="fas fa-heart" style="color:#E53935;"></i></div>' +
    '<h3>Please Login to Wishlist</h3>' +
    '<p>Save your favorite products and access them anytime.</p>' +
    '<div class="auth-modal-buttons">' +
    '<button class="shop-btn" onclick="window.location.href=\'login.html\'"><i class="fas fa-sign-in-alt"></i> Login</button>' +
    '<button class="shop-btn-outline" onclick="closeWishlistModal()"><i class="fas fa-times"></i> Cancel</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(wishlistModal);
}

function closeWishlistModal() {
  var m = document.getElementById("wishlistModal");
  if (m) m.style.display = "none";
}

// ─── Login Button Handler ───
function handleLoginClick() {
  if (isLoggedIn()) {
    logoutUser();
  } else {
    window.location.href = "login.html";
  }
}

// ─── Newsletter Subscribe ───
function subscribeNewsletter() {
  var input = document.getElementById("newsletterEmail");
  if (!input) return;
  var email = input.value.trim();
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email address", "warning");
    return;
  }
  // Save to localStorage for now (backend integration would go here)
  var subs = JSON.parse(localStorage.getItem("newsletter_subs") || "[]");
  if (subs.includes(email)) {
    showToast("You're already subscribed!", "info");
  } else {
    subs.push(email);
    localStorage.setItem("newsletter_subs", JSON.stringify(subs));
    showToast("Subscribed successfully! 🎉", "success");
    input.value = "";
  }
}

// ─── Navbar: Logged-in User Dropdown ───
function toggleUserDropdown() {
  var dd = document.getElementById("userDropdown");
  if (dd) dd.classList.toggle("show");
}

function updateNavbar() {
  var loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;

  // Remove old dropdown and its click handler
  var oldDD = document.getElementById("userDropdown");
  if (oldDD) {
    if (oldDD._closeHandler) document.removeEventListener("click", oldDD._closeHandler);
    oldDD.remove();
  }

  if (isLoggedIn()) {
    getUserProfile().then(function (user) {
      var name = user.name || "My Account";
      loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> ' + name + ' <i class="fas fa-chevron-down"></i>';
      loginBtn.onclick = function (e) { e.stopPropagation(); toggleUserDropdown(); };

      // Create dropdown
      var dd = document.createElement("div");
      dd.id = "userDropdown";
      dd.className = "user-dropdown";
      loginBtn.parentElement.appendChild(dd);

      var menuItems = [];
      menuItems.push({ icon: "fa-user",   text: "My Profile",       href: "profile.html" });
      menuItems.push({ icon: "fa-box",    text: "My Orders",        href: "orders.html" });
      menuItems.push({ icon: "fa-heart",  text: "Wishlist",         href: "wishlist.html" });
      menuItems.push({ icon: "fa-bell",   text: "Notifications",    href: "notifications.html" });

      if (user.role === "admin") {
        menuItems.push({ type: "divider" });
        menuItems.push({ icon: "fa-shield-halved", text: "Admin Dashboard", href: "admin/index.html" });
      }

      menuItems.push({ type: "divider" });
      menuItems.push({ icon: "fa-right-from-bracket", text: "Logout", onClick: "logoutUser()" });

      var html = "";
      menuItems.forEach(function (item) {
        if (item.type === "divider") {
          html += '<div class="dd-divider"></div>';
        } else if (item.onClick) {
          html += '<a class="dd-item" href="#" onclick="' + item.onClick + ';return false;"><i class="fas ' + item.icon + '"></i> ' + item.text + '</a>';
        } else {
          html += '<a class="dd-item" href="' + item.href + '"><i class="fas ' + item.icon + '"></i> ' + item.text + '</a>';
        }
      });
      dd.innerHTML = html;

      // Close on outside click
      function closeDD(e) {
        if (!loginBtn.contains(e.target) && !dd.contains(e.target)) {
          dd.classList.remove("show");
        }
      }
      document.addEventListener("click", closeDD);
      // Clean up event listener when dropdown is removed
      dd._closeHandler = closeDD;

      var pointsEl = document.getElementById("userPoints");
      if (pointsEl) pointsEl.textContent = Number(localStorage.getItem("points")) || 0;

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

// Close user dropdown on resize (optional cleanup)
window.addEventListener("resize", function () {
  var dd = document.getElementById("userDropdown");
  if (dd) dd.classList.remove("show");
});

// ─── Navbar Scroll Shadow + Active Nav ───
var navbar = document.querySelector(".navbar");
if (navbar) {
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    // Navbar shadow
    if (y > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
    // Scroll-to-top button visibility (300px threshold)
    if (scrollButton) {
      if (y > 300) {
        scrollButton.classList.add("visible");
      } else {
        scrollButton.classList.remove("visible");
      }
    }
    // Update active nav link based on scroll position (throttled)
    handleScrollActiveNav();
  });
}

// ─── Scroll-to-Top Click Handler ───
if (scrollButton) {
  scrollButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ─── Search with Debounce + Keyboard Navigation + Suggestions ───
let searchTimeout = null;
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
let searchSuggestionIndex = -1;
let searchProductSuggestions = [];

// Popular search terms
const popularSearches = ["Fresh Milk", "Apple", "Banana", "Bread", "Chicken", "Rice", "Tomato", "Orange Juice"];

if (searchInput) {
  var searchWrapper = searchInput.parentElement;
  var suggestionsEl = document.createElement("div");
  suggestionsEl.className = "search-suggestions";
  suggestionsEl.setAttribute("role", "listbox");
  suggestionsEl.setAttribute("id", "searchSuggestions");
  searchWrapper.style.position = "relative";
  searchWrapper.appendChild(suggestionsEl);

  searchInput.setAttribute("autocomplete", "off");
  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-controls", "searchSuggestions");

  searchInput.addEventListener("focus", function () {
    var val = searchInput.value.trim();
    if (val.length > 0) {
      renderSearchSuggestions(val);
    } else {
      renderSearchSuggestions();
    }
  });

  // Single input handler: suggestions + debounce + clear button
  searchInput.addEventListener("input", function () {
    var val = searchInput.value.trim();
    searchSuggestionIndex = -1;

    // Update clear button visibility
    if (clearBtn) clearBtn.style.display = val ? "block" : "none";

    // Render suggestions
    if (val.length > 0) {
      renderSearchSuggestions(val);
    } else {
      renderSearchSuggestions();
    }

    // Debounced product search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      currentFilters.search = val || undefined;
      currentPage = 1;
      loadProducts();
    }, 300);
  });

  // Keyboard navigation for search suggestions
  searchInput.addEventListener("keydown", function (e) {
    var items = suggestionsEl.querySelectorAll(".suggestion-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      searchSuggestionIndex = Math.min(searchSuggestionIndex + 1, items.length - 1);
      updateSuggestionFocus(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchSuggestionIndex <= 0) {
        searchSuggestionIndex = -1;
        items.forEach(function (el) { el.classList.remove("focused"); });
      } else {
        searchSuggestionIndex = Math.max(searchSuggestionIndex - 1, 0);
        updateSuggestionFocus(items);
      }
    } else if (e.key === "Enter") {
      if (searchSuggestionIndex >= 0 && items[searchSuggestionIndex]) {
        e.preventDefault();
        items[searchSuggestionIndex].click();
      }
    } else if (e.key === "Escape") {
      suggestionsEl.classList.remove("show");
      searchSuggestionIndex = -1;
    }
  });

  function updateSuggestionFocus(items) {
    items.forEach(function (el, i) {
      el.classList.toggle("focused", i === searchSuggestionIndex);
    });
    if (searchSuggestionIndex >= 0) {
      items[searchSuggestionIndex].scrollIntoView({ block: "nearest" });
    }
  }

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

  document.addEventListener("click", function (e) {
    if (!searchWrapper.contains(e.target)) {
      suggestionsEl.classList.remove("show");
    }
  });
}

function renderSearchSuggestions(query) {
  var el = document.querySelector(".search-suggestions");
  if (!el) return;

  searchProductSuggestions = [];

  if (query && query.length > 0) {
    el.innerHTML = '<div class="suggestion-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    el.classList.add("show");

    // Fetch real-time suggestions from API
    fetchProducts({ search: query, limit: 5, page: 1 }).then(function (data) {
      var prods = data.products || [];
      if (prods.length === 0) {
        el.innerHTML = '<div class="suggestion-item suggestion-hint" style="cursor:default;color:#999;"><i class="fas fa-search"></i> No products found for "' + escapeHtml(query) + '"</div>';
        el.classList.add("show");
        return;
      }
      searchProductSuggestions = prods;
      var html = '<div class="suggestion-group-label"><i class="fas fa-box"></i> Products</div>';
      prods.forEach(function (p, idx) {
        var displayName = highlightMatch(p.name, query);
        html += '<div class="suggestion-item" data-index="' + idx + '" onclick="selectProductSuggestion(' + idx + ')" role="option" tabindex="0">' +
          '<img src="' + imgUrl(resolveProductImage(p)) + '" alt="" class="suggestion-thumb" onerror="this.style.display=\'none\'">' +
          '<div class="suggestion-text"><span class="suggestion-name">' + displayName + '</span>' +
          '<span class="suggestion-price">₹' + p.price + '</span></div>' +
          '</div>';
      });
      el.innerHTML = html;
      el.classList.add("show");
    }).catch(function () {
      // Fallback: search locally
      var staticProds = typeof products !== "undefined" ? products : [];
      var q = query.toLowerCase();
      var matches = staticProds.filter(function (p) {
        return p.name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               (p.brand && p.brand.toLowerCase().includes(q));
      }).slice(0, 5);

      if (matches.length === 0) {
        el.innerHTML = '<div class="suggestion-item suggestion-hint" style="cursor:default;color:#999;"><i class="fas fa-search"></i> No products found for "' + escapeHtml(query) + '"</div>';
        el.classList.add("show");
        return;
      }
      searchProductSuggestions = matches;
      var html2 = '<div class="suggestion-group-label"><i class="fas fa-box"></i> Products</div>';
      matches.forEach(function (p, idx) {
        var displayName2 = highlightMatch(p.name, query);
        html2 += '<div class="suggestion-item" data-index="' + idx + '" onclick="selectProductSuggestion(' + idx + ')" role="option" tabindex="0">' +
          '<img src="' + imgUrl(resolveProductImage(p)) + '" alt="" class="suggestion-thumb" onerror="this.style.display=\'none\'">' +
          '<div class="suggestion-text"><span class="suggestion-name">' + displayName2 + '</span>' +
          '<span class="suggestion-price">₹' + p.price + '</span></div>' +
          '</div>';
      });
      el.innerHTML = html2;
      el.classList.add("show");
    });
    return;
  }

  // No query: show recent searches + popular
  var items = [];

  if (searchHistory.length > 0) {
    items.push('<div class="suggestion-group-label"><i class="fas fa-history"></i> Recent Searches</div>');
    searchHistory.slice(0, 5).forEach(function (term) {
      items.push('<div class="suggestion-item" onclick="selectSearchSuggestion(\'' + escapeJsStr(term) + '\')" role="option" tabindex="0"><i class="fas fa-history"></i> ' + escapeHtml(term) + '</div>');
    });
  }

  items.push('<div class="suggestion-group-label"><i class="fas fa-fire"></i> Popular Searches</div>');
  popularSearches.slice(0, 5).forEach(function (term) {
    items.push('<div class="suggestion-item" onclick="selectSearchSuggestion(\'' + escapeJsStr(term) + '\')" role="option" tabindex="0"><i class="fas fa-fire" style="color:#FF5722;"></i> ' + escapeHtml(term) + '</div>');
  });

  el.innerHTML = items.join("");
  el.classList.add("show");
}

function selectSearchSuggestion(term) {
  searchInput.value = term;
  var clearBtn = document.querySelector(".search-clear");
  if (clearBtn) clearBtn.style.display = "block";
  document.querySelector(".search-suggestions").classList.remove("show");
  currentFilters.search = term;
  currentFilters.offers = undefined;
  currentPage = 1;
  loadProducts();
  if (!searchHistory.includes(term)) {
    searchHistory.unshift(term);
    if (searchHistory.length > 10) searchHistory.pop();
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }
  // Scroll to products
  var featuredEl = document.querySelector(".featured-products");
  if (featuredEl) featuredEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectProductSuggestion(index) {
  var p = searchProductSuggestions[index];
  if (!p) return;
  var id = p._id || p.id;
  // Select the product's name as search term
  selectSearchSuggestion(p.name);
}

function highlightMatch(text, query) {
  if (!query || !text) return escapeHtml(text);
  var q = query.toLowerCase();
  var t = text.toLowerCase();
  var idx = t.indexOf(q);
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.substring(0, idx)) +
    '<span class="search-highlight">' + escapeHtml(text.substring(idx, idx + query.length)) + '</span>' +
    escapeHtml(text.substring(idx + query.length));
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsStr(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\\"");
}

// ─── Button Ripple Effect ───
document.addEventListener("click", function (e) {
  var btn = e.target.closest(".ripple-btn, .shop-btn, .category-btn, .nav-link-btn, .cart-btn, .login-btn, .page-btn, .filter-toggle-btn, .btn-apply, .btn-clear, .offer-card button, .newsletter-form button, footer a");
  if (!btn) return;

  var ripple = document.createElement("span");
  ripple.className = "ripple-effect";
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var x = e.clientX - rect.left - size / 2;
  var y = e.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";
  btn.appendChild(ripple);
  setTimeout(function () { ripple.remove(); }, 600);
});// ─── Init ───
(function init() {
  // Guard: only run product-specific code on pages that have a product container
  var hasProducts = !!document.getElementById("productContainer");

  if (hasProducts) {
    createWishlistModal();
    loadProducts();
    loadRecommendationsAndTrending();
  }

  // Run universal setup on every page
  syncWishlistFromAPI();
  syncCartFromAPI();
  updateCartCount();
  updateNavbar();
  if (typeof updateBellCount === "function") updateBellCount();

  // Floating cart button (injected once, visible on product pages)
  createFloatingCart();
  updateFloatingCart();

  // Trigger scroll check on load
  if (navbar && window.scrollY > 10) navbar.classList.add("scrolled");

  // Initialize active nav link after layout is computed
  setTimeout(function () { handleScrollActiveNav(); }, 300);

  // Poll for new notifications every 30 seconds
  setInterval(function() {
    if (typeof updateBellCount === "function") updateBellCount();
  }, 30000);
})();

// Close notification dropdown on outside click
document.addEventListener("click", function(e) {
  var bell = document.querySelector(".notif-bell");
  var dd = document.getElementById("notifDropdown");
  if (bell && dd && !bell.contains(e.target) && dd.classList.contains("show")) {
    dd.classList.remove("show");
  }
});

// Close user dropdown on outside click (also handled via _closeHandler)

// Close user dropdown on outside click (also handled via _closeHandler)
