const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

router.route("/").get(protect, getCart).post(protect, addToCart).delete(protect, clearCart);
router.route("/:productId").put(protect, updateCartItem).delete(protect, removeFromCart);

module.exports = router;
