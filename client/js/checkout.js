const form = document.getElementById("checkoutForm");

form.addEventListener("submit", function(event){

    event.preventDefault();

    // Read cart
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // ✅ Paste it HERE
    if (cart.length === 0) {

        alert("Your cart is empty!");

        window.location.href = "index.html";

        return;

    }

    // Read old orders
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    // Create new order
    const order = {

        customerName: document.getElementById("name").value,

        phone: document.getElementById("phone").value,

        address: document.getElementById("address").value,

        slot: document.getElementById("slot").value,

        payment: document.getElementById("payment").value,

        items: cart,

        orderDate: new Date().toLocaleString()

    };

    orders.push(order);

    localStorage.setItem("orders", JSON.stringify(orders));

    localStorage.removeItem("cart");

    window.location.href = "order-success.html";

});
