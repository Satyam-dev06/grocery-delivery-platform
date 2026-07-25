const Payment = require("../models/Payment");
const Order = require("../models/Order");

// ─────────────────────────────────────────────────────────
// @desc    Create a payment for an existing order
// @route   POST /api/payment/create
// @access  Private
//
// Flow:
// 1. Validate order exists and belongs to user
// 2. Check order hasn't already been paid
// 3. Validate payment method
// 4. Generate fake transaction ID
// 5. Create Payment record
// 6. Update order.paymentStatus to Paid
// 7. Return payment details
// ─────────────────────────────────────────────────────────
const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const validMethods = ["UPI", "Card"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Fetch the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the order owner can pay
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if already paid
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    // Check if already cancelled
    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Cannot pay for a cancelled order" });
    }

    // Generate a fake transaction ID (format: TXN + timestamp + random chars)
    const transactionId =
      "TXN" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the payment record
    const payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      paymentMethod,
      transactionId,
      amount: order.totalAmount,
      paymentStatus: "Paid",
    });

    // Update the order's payment status
    order.paymentStatus = "Paid";
    await order.save();

    res.status(201).json({
      message: "Payment successful",
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        orderId: order._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Verify a payment (for future gateway integration)
// @route   POST /api/payment/verify
// @access  Private
//
// Placeholder — in production this would verify with Razorpay/Stripe
// ─────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      verified: payment.paymentStatus === "Paid",
      payment: {
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.paymentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get payment details by order ID
// @route   GET /api/payment/:orderId
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────
const getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this order" });
    }

    // Only the owner or admin can view
    if (
      payment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(payment);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Webhook placeholder (for payment gateway callbacks)
// @route   POST /api/payment/webhook
// @access  Public (secured by signature in production)
//
// In production: verify webhook signature from Razorpay/Stripe,
// then update payment status accordingly.
// ─────────────────────────────────────────────────────────
const webhookPlaceholder = async (req, res) => {
  try {
    // Log the webhook payload for debugging
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));

    // Placeholder: always acknowledge
    res.json({ received: true, message: "Webhook acknowledged" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Refund placeholder (initiate a refund)
// @route   POST /api/payment/refund/:orderId
// @access  Private/Admin
//
// In production: call Razorpay/Stripe refund API with
// the transaction ID.
// ─────────────────────────────────────────────────────────
const refundPlaceholder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await Payment.findOne({ order: req.params.orderId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this order" });
    }

    if (payment.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Payment is not in a refundable state" });
    }

    // Mark payment as refunded (placeholder — in production, call gateway API)
    payment.paymentStatus = "Refunded";
    await payment.save();

    res.json({
      message: "Refund initiated (placeholder)",
      transactionId: payment.transactionId,
      amount: payment.amount,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  getPaymentByOrderId,
  webhookPlaceholder,
  refundPlaceholder,
};
