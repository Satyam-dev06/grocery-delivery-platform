const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const sortSelect = document.getElementById("sortProducts");
let cart = JSON.parse(localStorage.getItem("cart")) || [];
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
function saveCart(){

    localStorage.setItem("cart", JSON.stringify(cart));

}
displayProducts(products);

updateCartCount();

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
    saveCart();
    updateCartCount();
}

function filterCategory(category){

    const filteredProducts = products.filter(function(product){

        return product.category === category;

    });

    displayProducts(filteredProducts);

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

sortProducts.addEventListener("change", function(){

    const sortedProducts = [...products];

    if(sortProducts.value==="low"){

        sortedProducts.sort(function(a,b){

            return a.price-b.price;

        });

    }

    else if(sortProducts.value==="high"){

        sortedProducts.sort(function(a,b){

            return b.price-a.price;

        });

    }

    displayProducts(sortedProducts);

});

