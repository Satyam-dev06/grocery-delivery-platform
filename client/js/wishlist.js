const wishlistContainer = document.getElementById("wishlistContainer");

let wishlistIds = JSON.parse(localStorage.getItem("wishlist")) || [];

// Render wishlist using API data if logged in, else localStorage
async function renderWishlist() {
  wishlistContainer.innerHTML = "";

  let wishlistProducts = [];

  if (isLoggedIn()) {
    try {
      // Fetch from API — each item has populated product details
      const apiWishlist = await fetchWishlistAPI();
      if (apiWishlist && apiWishlist.length > 0) {
        wishlistProducts = apiWishlist
          .filter(function (item) { return item && item.product; })
          .map(function (item) {
            return item.product; // item.product is the populated product object
          });
        // Sync IDs to localStorage for heart icons on other pages
        wishlistIds = apiWishlist
          .filter(function (item) { return item && item.product; })
          .map(function (item) {
            return String(item.product._id || item.product.id);
          });
        localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
      }
    } catch (e) {
      console.error("Wishlist API error:", e);
      // Fallback to localStorage if API fails
      // Use String() comparison to gracefully handle both MongoDB ObjectId strings
      // AND numeric IDs stored as strings in localStorage. Unlike Number(),
      // String() never produces NaN, so products won't be silently dropped.
      const wishlistStr = wishlistIds.map(String);
      wishlistProducts = (typeof products !== "undefined" ? products : []).filter(function (p) {
        return wishlistStr.includes(String(p.id));
      });
    }
  } else {
    // Fallback: filter hardcoded products by localStorage IDs
    // Use String() comparison to handle both numeric and string IDs safely
    const wishlistStr = wishlistIds.map(String);
    wishlistProducts = (typeof products !== "undefined" ? products : []).filter(function (p) {
      return wishlistStr.includes(String(p.id));
    });
  }

  if (wishlistProducts.length === 0) {
    wishlistContainer.innerHTML = '<h2>Your Wishlist is Empty ❤️</h2>';
    return;
  }

  wishlistProducts.forEach(function (product) {
    const prodId = product._id || product.id;
    wishlistContainer.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <h3>${product.name}</h3>
        <p class="price">₹${product.price}</p>
        <button onclick="window.location.href='cart.html'">🛒 Go To Cart</button>
        <button class="remove-wishlist-btn" onclick="removeFromWishlist('${prodId}')">❌ Remove</button>
      </div>`;
  });
}

async function removeFromWishlist(id) {
  if (isLoggedIn()) {
    try {
      await removeFromWishlistAPI(id);
    } catch (e) {
      // If API fails, fall through to local removal
    }
  }
  // Always update localStorage
  wishlistIds = wishlistIds.filter(function (item) {
    return String(item) !== String(id);
  });
  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
  renderWishlist();
}

renderWishlist();
