const Coupon = require("../models/Coupon");
const { createNotification } = require("../utils/notificationHelper");

const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code || !code.trim()) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal || 0, message: "Please enter a coupon code" });
    }
    if (cartTotal === undefined || cartTotal === null || cartTotal < 0) {
      return res.status(400).json({ message: "Valid cart total is required" });
    }
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal, message: "Invalid coupon code" });
    }
    if (!coupon.isActive) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal, message: "This coupon is no longer active" });
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal, message: "This coupon has expired" });
    }
    if (coupon.minimumOrder > 0 && cartTotal < coupon.minimumOrder) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal, message: "Minimum order amount of ₹" + coupon.minimumOrder + " required" });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, discount: 0, finalTotal: cartTotal, message: "This coupon has reached its usage limit" });
    }
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((cartTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
      if (discount > cartTotal) {
        discount = cartTotal;
      }
    }
    const finalTotal = Math.round((cartTotal - discount) * 100) / 100;

    // Notify user about successful coupon application
    createNotification({
      user: req.user._id,
      title: "Coupon Applied",
      message: "Coupon code " + coupon.code + " applied! You saved \u20B9" + discount + " on your order.",
      type: "coupon",
      link: "/checkout.html",
    }).catch(function(){});

    res.json({
      valid: true,
      discount,
      finalTotal,
      message: "Coupon applied! You saved ₹" + discount,
      coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, maxDiscount: coupon.maxDiscount, description: coupon.description || "" },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase().trim() }).select(
      "code description discountType discountValue minimumOrder maxDiscount expiryDate usageLimit usedCount isActive"
    );
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyCoupon, getCouponByCode };
