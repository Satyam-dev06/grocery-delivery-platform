const wishlistContainer =
document.getElementById("wishlistContainer");

const wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];

const wishlistProducts =
products.filter(function(product){

    return wishlist.includes(product.id);

});

if(wishlistProducts.length===0){

    wishlistContainer.innerHTML = `

    <h2>

    Your Wishlist is Empty ❤️

    </h2>

    `;

}

else{

    wishlistProducts.forEach(function(product){

        wishlistContainer.innerHTML += `

        <div class="product-card">

            <img src="${product.image}">

            <h3>${product.name}</h3>

            <p class="price">

                ₹${product.price}

            </p>

            <button
            onclick="window.location.href='cart.html'">

                Go To Cart

            </button>

        </div>

        `;

    });

}
