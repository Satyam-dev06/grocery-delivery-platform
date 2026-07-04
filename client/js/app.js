const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
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

// Display all products initially
displayProducts(products);
function addToCart(id){

    const product = products.find(function(item){

        cart.push({


    ...product,

    quantity:1

});
    console.log(cart);
    return item.id === id;

});

console.log(product);

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
