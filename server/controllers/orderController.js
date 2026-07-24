const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");

// ─────────────────────────────────────────────────────────
// @desc    Place a new order from the user's cart
// @route   POST /api/orders
// @access  Private
//
// Flow:
// 1. Fetch the user's cart with populated products
// 2. Validate cart is not empty
// 3. For each cart item, copy current product price into priceAtPurchase
// 4. Lookup the selected delivery address (from addressId in body)
// 5. Calculate totals (totalItems, totalAmount)
// 6. Create the order
// 7. Clear the cart automatically
// ─────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;

    // ── Step 1: Fetch & validate cart ──
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price image"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // ── Step 2: Fetch & validate address ──
    if (!addressId) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // ── Step 3: Build order items with priceAtPurchase ──
    let totalItems = 0;
    let totalAmount = 0;
    const items = cart.items.map(function (item) {
      const price = item.product.price;
      const qty = item.quantity;
      totalItems += qty;
      totalAmount += price * qty;
      return {
        product: item.product._id,
        name: item.product.name,
        priceAtPurchase: price,
        quantity: qty,
        image: item.product.image || "",
      };
    });

    // ── Step 4: Build delivery address from saved address ──
    const deliveryAddress = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      addressType: address.addressType || "Home",
    };

    // ── Step 5: Validate payment method ──
    const validMethods = ["Cash on Delivery", "UPI", "Card"];
    const method = paymentMethod || "Cash on Delivery";
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // ── Step 6: Create the order ──
    const order = await Order.create({
      user: req.user._id,
      items,
      deliveryAddress,
      paymentMethod: method,
      paymentStatus: method === "Cash on Delivery" ? "Pending" : "Paid",
      orderStatus: "Pending",
      totalItems,
      totalAmount,
    });

    // ── Step 7: Clear the cart ──
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get logged-in user's orders
// @route   GET /api/orders
// @access  Private
// ─────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .select("totalItems totalAmount orderStatus paymentStatus paymentMethod orderedAt items.name items.quantity items.priceAtPurchase items.image")
      .sort({ orderedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the owner or an admin can view this order
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Cancel an order
// @route   PUT /api/orders/cancel/:id
// @access  Private
//
// Rules:
// - Only orders with status "Pending" or "Confirmed" can be cancelled
// - Only the order owner can cancel
// ─────────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the owner can cancel
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Only Pending or Confirmed orders can be cancelled
    const cancellable = ["Pending", "Confirmed"];
    if (!cancellable.includes(order.orderStatus)) {
      return res.status(400).json({
        message: "Order cannot be cancelled. Only Pending or Confirmed orders can be cancelled.",
      });
    }

    order.orderStatus = "Cancelled";
    const updated = await order.save();

    res.json({ message: "Order cancelled successfully", order: updated });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Admin: update order status
// @route   PUT /api/orders/status/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const validStatuses = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Cannot change status of a cancelled order
    if (order.orderStatus === "Cancelled" && orderStatus !== "Cancelled") {
      return res.status(400).json({ message: "Cannot update a cancelled order" });
    }

    // If delivered, auto-set payment to Paid (if COD)
    if (orderStatus === "Delivered" && order.paymentStatus === "Pending") {
      order.paymentStatus = "Paid";
    }

    order.orderStatus = orderStatus;
    const updated = await order.save();

    res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Admin: get all orders
// @route   GET /api/orders/all
// @access  Private/Admin
// ─────────────────────────────────────────────────────────
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ orderedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrdersAdmin,
};
