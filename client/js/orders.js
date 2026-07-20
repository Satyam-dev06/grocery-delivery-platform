const ordersContainer = document.getElementById("ordersContainer");

(async function loadOrders() {
  let orders = [];

  if (isLoggedIn()) {
    try {
      orders = await fetchOrders();
    } catch (e) {
      orders = JSON.parse(localStorage.getItem("orders")) || [];
    }
  } else {
    orders = JSON.parse(localStorage.getItem("orders")) || [];
  }

  if (orders.length === 0) {
    ordersContainer.innerHTML = '<h2>No Orders Yet</h2>';
    return;
  }

  orders.forEach(function (order) {
    let itemsHtml = "";
    if (order.items) {
      itemsHtml = order.items.map(function (item) {
        return (item.name || "Item") + " x " + item.quantity;
      }).join(", ");
    }
    ordersContainer.innerHTML += `
      <div class="order-card">
        <h3>${order.customerName || "Order"}</h3>
        <p><strong>Status:</strong> ${order.status || "Delivered"}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Delivery:</strong> ${order.slot}</p>
        <p><strong>Payment:</strong> ${order.payment}</p>
        <p><strong>Total:</strong> Rs.${order.total}</p>
        <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : order.orderDate}</p>
        <p><strong>Items:</strong> ${itemsHtml}</p>
      </div>`;
  });
})();
