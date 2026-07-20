const cartItems = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");

// Load cart from Local Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Update cart count badge across all pages
function updateCartBadge() {
    const badge = document.getElementById("cartCount");
    if (badge) {
        badge.textContent = cart.length;
    }
}

// Render Cart
function renderCart() {

    cartItems.innerHTML = "";

    // Empty Cart
    if (cart.length === 0) {

        cartItems.innerHTML = `
            <h2>Your Cart is Empty 🛒</h2>
        `;

        totalPrice.textContent = 0;

        return;
    }

    let total = 0;

    cart.forEach(function(product) {

        total += product.price * product.quantity;

        cartItems.innerHTML += `

            <div class="product-card">

                <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">

                <h3>${product.name}</h3>

                <p>₹${product.price}</p>

                <div class="quantity-controls">

                    <button onclick="decreaseQuantity(${product.id})">
                        -
                    </button>

                    <span>
                        ${product.quantity}
                    </span>

                    <button onclick="increaseQuantity(${product.id})">
                        +
                    </button>

                </div>

                <button
                    class="remove-btn"
                    onclick="removeItem(${product.id})">

                    🗑 Remove

                </button>

            </div>

        `;

    });

    totalPrice.textContent = total;

    updateCartBadge();

}

// Increase Quantity
function increaseQuantity(id) {

    const product = cart.find(function(item) {

        return item.id === id;

    });

    product.quantity++;

    localStorage.setItem("cart", JSON.stringify(cart));

    renderCart();

}

// Decrease Quantity
function decreaseQuantity(id) {

    const product = cart.find(function(item) {

        return item.id === id;

    });

    if (product.quantity > 1) {

        product.quantity--;

    }

    localStorage.setItem("cart", JSON.stringify(cart));

    renderCart();

}

// Remove Item
function removeItem(id) {

    cart = cart.filter(function(product) {

        return product.id !== id;

    });

    localStorage.setItem("cart", JSON.stringify(cart));

    renderCart();

}

// Initial Render
renderCart();