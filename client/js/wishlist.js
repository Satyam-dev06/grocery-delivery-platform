const wishlistContainer =
document.getElementById("wishlistContainer");

let wishlistIds =
JSON.parse(localStorage.getItem("wishlist")) || [];

function renderWishlist() {

    wishlistContainer.innerHTML = "";

    const wishlistProducts =
    products.filter(function(product){

        return wishlistIds.includes(product.id);

    });

    if(wishlistIds.length === 0 || wishlistProducts.length === 0){

        wishlistContainer.innerHTML = `

        <h2>Your Wishlist is Empty ❤️</h2>

        `;

        return;

    }

    wishlistProducts.forEach(function(product){

        wishlistContainer.innerHTML += `

        <div class="product-card">

            <img src="${product.image}" onerror="this.style.display='none'">

            <h3>${product.name}</h3>

            <p class="price">

                ₹${product.price}

            </p>

            <button
            onclick="window.location.href='cart.html'">

                🛒 Go To Cart

            </button>

            <button
            class="remove-wishlist-btn"
            onclick="removeFromWishlist(${product.id})">

                ❌ Remove

            </button>

        </div>

        `;

    });

}

function removeFromWishlist(id) {

    wishlistIds = wishlistIds.filter(function(item) {

        return item !== id;

    });

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlistIds)
    );

    renderWishlist();

}

renderWishlist();
