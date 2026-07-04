const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
let cart = [];
// Function to display products
function displayProducts(productList) {

    productContainer.innerHTML = "";

    productList.forEach(function(product) {

        productContainer.innerHTML += `
            <div class="product-card">

                <img src="${product.image}" alt="${product.name}">

                <h3>${product.name}</h3>

                <p class="price">₹${product.price}</p>

                <p class="rating">${"⭐".repeat(product.rating)}</p>

                <button onclick="addToCart(${product.id})">

            🛒 Add to Cart

            </button>

            </div>
        `;

    });

}
function updateCartCount(){

    cartCount.textContent = cart.length;

}
// Display all products initially
displayProducts(products);
function addToCart(id){

    // Check if product already exists in cart
    const existingProduct = cart.find(function(item){

        return item.id === id;

    });

    // If product exists, increase quantity
    if(existingProduct){

        existingProduct.quantity++;

    }

    // Otherwise add a new product
    else{

        const product = products.find(function(item){

            return item.id === id;

        });

        cart.push({

            ...product,

            quantity:1

        });

    }

    console.log(cart);
    updateCartCount();
}

// Live Search
searchInput.addEventListener("input", function () {

    const searchText = searchInput.value.toLowerCase();

    const filteredProducts = products.filter(function(product) {

        return product.name
            .toLowerCase()
            .includes(searchText);

    });

    displayProducts(filteredProducts);

});
