const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already in wishlist (the unique index will also catch this)
    const existing = await Wishlist.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existing) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Create wishlist entry
    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      product: productId,
    });

    // Return the item with populated product details
    const populated = await Wishlist.findById(wishlistItem._id).populate(
      "product",
      "name price oldPrice image stock rating category"
    );

    res.status(201).json(populated);
  } catch (error) {
    // Handle duplicate key error from MongoDB unique index
    if (error.code === 11000) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate("product", "name price oldPrice image stock rating category")
      .sort("-createdAt");

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ user: req.user._id });
    res.json({ message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
};
