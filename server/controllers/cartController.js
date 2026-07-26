const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ─── Helper: Calculate cart totals from populated items ───
function calculateCartTotals(items) {
  let subtotal = 0;
  let totalItems = 0;

  items.forEach(function (item) {
    // item.product is populated → has price field
    const price = item.product && item.product.price ? item.product.price : 0;
    subtotal += price * item.quantity;
    totalItems += item.quantity;
  });

  return { subtotal, totalItems, totalPrice: subtotal };
}

// ─── Helper: Populate cart items and return with totals ───
async function getPopulatedCart(cartId) {
  const cart = await Cart.findById(cartId).populate(
    "items.product",
    "name price oldPrice image stock rating"
  );

  if (!cart) return { items: [], subtotal: 0, totalItems: 0, totalPrice: 0 };

  const totals = calculateCartTotals(cart.items);
  return {
    _id: cart._id,
    user: cart.user,
    items: cart.items,
    ...totals,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.json({ items: [], subtotal: 0, totalItems: 0, totalPrice: 0 });
    }

    const result = await getPopulatedCart(cart._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart (or increase quantity if already in cart)
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate stock
    if (!product.stock) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart with the item
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    const result = await getPopulatedCart(cart._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private
//
// Business rules:
// - If quantity becomes 0, remove the item from cart
// - Never allow quantity below 0
// - Validate stock before increasing quantity
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();

      const result = await getPopulatedCart(cart._id);
      return res.json(result);
    }

    // Validate stock before increasing
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.stock && quantity > 0) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const result = await getPopulatedCart(cart._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    const result = await getPopulatedCart(cart._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Cart cleared", items: [], subtotal: 0, totalItems: 0, totalPrice: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
