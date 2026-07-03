const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");

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

                <button>Add to Cart</button>

            </div>
        `;

    });

}

// Display all products initially
displayProducts(products);

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