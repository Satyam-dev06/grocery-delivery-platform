const productContainer = document.getElementById("productContainer");
products.forEach(function(product){

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