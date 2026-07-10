const form = document.getElementById("checkoutForm");
const applyCoupon = document.getElementById("applyCoupon");


let discount = 0;


function updateSummary() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    let productTotal = 0;

    cart.forEach(function(product) {

        productTotal += product.price * product.quantity;

    });

    let delivery = 25;

    if (document.getElementById("express").checked) {

        delivery = 49;

    }

    const grandTotal = productTotal + delivery - discount;

    document.getElementById("summaryTotal").textContent = productTotal;

    document.getElementById("deliveryFee").textContent = delivery;

    document.getElementById("discountAmount").textContent = discount;

    document.getElementById("grandTotal").textContent = grandTotal;

}


updateSummary();


applyCoupon.addEventListener("click", function () {

    const coupon = document.getElementById("coupon").value.trim();

    if (coupon === "SAVE20") {

        discount = 20;

        document.getElementById("couponMessage").textContent =
            "Coupon Applied ✅";

    }

    else {

        discount = 0;

        document.getElementById("couponMessage").textContent =
            "Invalid Coupon ❌";

    }

    updateSummary();

});


document.getElementById("express").addEventListener(

    "change",

    updateSummary

);


form.addEventListener("submit", function (event) {

    event.preventDefault();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {

        alert("Your cart is empty!");

        window.location.href = "index.html";

        return;

    }

    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    // Calculate totals

    let productTotal = 0;

    cart.forEach(function(product){

        productTotal += product.price * product.quantity;

    });

    let delivery = 25;

    const express = document.getElementById("express").checked;

    if(express){

        delivery = 49;

    }

    const grandTotal = productTotal + delivery - discount;

    // Create Order

    const order = {

        customerName: document.getElementById("name").value,

        phone: document.getElementById("phone").value,

        address: document.getElementById("address").value,

        slot: document.getElementById("slot").value,

        payment: document.getElementById("payment").value,

        express: express,

        items: cart,

        discount: discount,

        deliveryFee: delivery,

        total: grandTotal,

        orderDate: new Date().toLocaleString()

    };

    // Save Order

    orders.push(order);

    localStorage.setItem(

        "orders",

        JSON.stringify(orders)

    );

    
    const currentPoints =
        Number(localStorage.getItem("points")) || 0;

    const earnedPoints =
        Math.floor(productTotal / 10);

    localStorage.setItem(

        "points",

        currentPoints + earnedPoints

    );

    // Clear Cart

    localStorage.removeItem("cart");

    // Redirect

    window.location.href = "order-success.html";

});
