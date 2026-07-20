const Order = require("../models/Order");
const Cart = require("../models/Cart");

// @desc    Create a new order from cart
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, slot, payment, express, discount = 0 } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price image"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let productTotal = 0;
    const items = cart.items.map((item) => {
      const price = item.product.price;
      const qty = item.quantity;
      productTotal += price * qty;
      return {
        product: item.product._id,
        name: item.product.name,
        price: price,
        quantity: qty,
        image: item.product.image,
      };
    });

    const deliveryFee = express ? 49 : 25;
    const grandTotal = productTotal + deliveryFee - discount;
    const pointsEarned = Math.floor(productTotal / 10);

    const order = await Order.create({
      user: req.user._id,
      items,
      customerName,
      phone,
      address,
      slot: slot || "9 AM - 11 AM",
      payment: payment || "Cash on Delivery",
      express: express || false,
      deliveryFee,
      discount,
      total: grandTotal,
      pointsEarned,
    });

    // Clear the cart after successful order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the owner or admin can view the order
    if (
      order.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: get all orders
// @route   GET /api/orders/all
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: update order status
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
