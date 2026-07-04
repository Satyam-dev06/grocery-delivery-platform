const cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cartItems");

let total = 0;

cart.forEach(function(product){

    total += product.price * product.quantity;

    cartItems.innerHTML += `

    <div class="product-card">

        <img src="${product.image}">

        <h3>${product.name}</h3>

        <p>₹${product.price}</p>

        <p>

            Quantity :

            ${product.quantity}

        </p>

    </div>

    `;

});

document.getElementById("totalPrice").textContent = total;