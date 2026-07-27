const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getDashboard,
  getUsers,
  updateUser,
  deleteUser,
  getOrders,
  updateOrder,
  getPayments,
  refundPayment,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAnalytics,
  getSettings,
  updateSettings,
  sendAdminNotification,
} = require("../controllers/adminController");

// All admin routes require protect + admin middleware
router.use(protect, admin);

router.get("/dashboard", getDashboard);

router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/orders", getOrders);
router.put("/orders/:id", updateOrder);

router.get("/payments", getPayments);
router.post("/payments/refund/:orderId", refundPayment);

router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

router.get("/analytics", getAnalytics);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);

router.post("/notifications", sendAdminNotification);

module.exports = router;
