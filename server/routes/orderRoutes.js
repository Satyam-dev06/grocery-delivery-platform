const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrdersAdmin,
} = require("../controllers/orderController");

// ─── User routes (protected) ───
router.route("/").post(protect, placeOrder).get(protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/cancel/:id", protect, cancelOrder);

// ─── Admin routes ───
router.get("/all", protect, admin, getAllOrdersAdmin);
router.put("/status/:id", protect, admin, updateOrderStatus);

module.exports = router;
