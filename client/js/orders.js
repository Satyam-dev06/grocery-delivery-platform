const ordersContainer = document.getElementById("ordersContainer");

const orders = JSON.parse(localStorage.getItem("orders")) || [];

if(orders.length===0){

    ordersContainer.innerHTML=`

        <h2>No Orders Yet 📦</h2>

    `;

}

else{

    orders.forEach(function(order){

        let total = 0;

        order.items.forEach(function(product){

            total += product.price * product.quantity;

        });

        ordersContainer.innerHTML += `

        <div class="product-card">

            <h3>${order.customerName}</h3>

            <p><strong>Phone:</strong> ${order.phone}</p>

            <p><strong>Address:</strong> ${order.address}</p>

            <p><strong>Delivery:</strong> ${order.slot}</p>

            <p><strong>Payment:</strong> ${order.payment}</p>

            <p><strong>Date:</strong> ${order.orderDate}</p>

                <p>

                <strong>Items:</strong>

                ${order.items.map(function(product){

                return `${product.name} × ${product.quantity}`;

                }).join(", ")}

                </p>
        </div>

        `;

    });

}

