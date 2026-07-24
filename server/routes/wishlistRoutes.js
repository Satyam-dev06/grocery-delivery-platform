const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");

// All wishlist routes require authentication
router.route("/")
  .post(protect, addToWishlist)      // Add product to wishlist
  .get(protect, getWishlist)          // Get user's wishlist
  .delete(protect, clearWishlist);    // Clear entire wishlist

router.route("/:productId")
  .delete(protect, removeFromWishlist);  // Remove specific product

module.exports = router;
