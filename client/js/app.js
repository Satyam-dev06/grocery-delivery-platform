const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sortSelect = document.getElementById("sortProducts");
const recommendedContainer = document.getElementById("recommendedContainer");
const scrollButton = document.getElementById("scrollTop");

let cart = JSON.parse(localStorage.getItem("cart")) || [];


function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2000);

}


function displayProducts(productList) {

    if (!productContainer) return;

    productContainer.innerHTML = "";

    productList.forEach(function (product) {

        productContainer.innerHTML += `

        <div class="product-card">

            <div
                class="wishlist"
                onclick="addWishlist(${product.id})">

                ${wishlist.includes(product.id) ? "❤️" : "🤍"}

                </div>

            <div class="discount-badge">

                ${Math.round(
                    ((product.oldPrice - product.price) /
                        product.oldPrice) * 100
                )}% OFF

            </div>

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p class="old-price">

                ₹${product.oldPrice}

            </p>

            <p class="price">

                ₹${product.price}

            </p>

            <p class="stock">

                ${product.stock
                    ? "✅ In Stock"
                    : "⚠ Only 5 Left"}

            </p>

            <p class="rating">

                ${"⭐".repeat(product.rating)}

            </p>

            <button onclick="addToCart(${product.id})">

                🛒 Add To Cart

            </button>

        </div>

        `;

    });

}


function updateCartCount() {

    if (cartCount) {

        cartCount.textContent = cart.length;

    }

}

function saveCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

}

function addToCart(id) {

    const existingProduct = cart.find(function (item) {

        return item.id === id;

    });

    if (existingProduct) {

        existingProduct.quantity++;

    }

    else {

        const product = products.find(function (item) {

            return item.id === id;

        });

        cart.push({

            ...product,

            quantity: 1

        });

    }

    saveCart();

    updateCartCount();

    const product = products.find(function (item) {

        return item.id === id;

    });

    showToast(product.name + " added to cart 🛒");

}


function addWishlist(id) {

    let wishlist =
        JSON.parse(localStorage.getItem("wishlist")) || [];

    const exists = wishlist.find(function (item) {

        return item === id;

    });

    if (!exists) {

        wishlist.push(id);

        localStorage.setItem(

            "wishlist",

            JSON.stringify(wishlist)

        );

        showToast("Added to Wishlist ❤️");

    }

    else {

        showToast("Already in Wishlist ❤️");

    }

}


function filterCategory(category) {

    const filteredProducts = products.filter(function (product) {

        return product.category === category;

    });

    displayProducts(filteredProducts);

}


if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchText =
            searchInput.value.toLowerCase();

        const filteredProducts = products.filter(function (product) {

            return product.name
                .toLowerCase()
                .includes(searchText);

        });

        displayProducts(filteredProducts);

    });

}


if (sortSelect) {

    sortSelect.addEventListener("change", function () {

        const sortedProducts = [...products];

        if (sortSelect.value === "low") {

            sortedProducts.sort(function (a, b) {

                return a.price - b.price;

            });

        }

        else if (sortSelect.value === "high") {

            sortedProducts.sort(function (a, b) {

                return b.price - a.price;

            });

        }

        displayProducts(sortedProducts);

    });

}


function displayRecommendations() {

    if (!recommendedContainer) return;

    recommendedContainer.innerHTML = "";

    const recommended = products.slice(0, 3);

    recommended.forEach(function (product) {

        recommendedContainer.innerHTML += `

        <div class="product-card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p class="price">

                ₹${product.price}

            </p>

            <button
                onclick="addToCart(${product.id})">

                Add To Cart

            </button>

        </div>

        `;

    });

}


if (scrollButton) {

    window.addEventListener("scroll", function () {

        if (window.scrollY > 500) {

            scrollButton.style.display = "block";

        }

        else {

            scrollButton.style.display = "none";

        }

    });

    scrollButton.addEventListener("click", function () {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}

displayProducts(products);

displayRecommendations();

updateCartCount();