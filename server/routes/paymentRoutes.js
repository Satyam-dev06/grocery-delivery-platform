const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createPayment,
  verifyPayment,
  getPaymentByOrderId,
  webhookPlaceholder,
  refundPlaceholder,
} = require("../controllers/paymentController");

// ─── Payment Routes ───
router.post("/create", protect, createPayment);
router.post("/verify", protect, verifyPayment);
router.get("/:orderId", protect, getPaymentByOrderId);

// ─── Admin / Public Routes ───
router.post("/webhook", webhookPlaceholder);      // Webhooks are typically public
router.post("/refund/:orderId", protect, admin, refundPlaceholder);

module.exports = router;
