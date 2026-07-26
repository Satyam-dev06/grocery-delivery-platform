const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find({}, "totalAmount orderStatus paymentStatus");
    const revenue = orders
      .filter(function (o) { return o.orderStatus === "Delivered"; })
      .reduce(function (sum, o) { return sum + (o.totalAmount || 0); }, 0);

    const pendingOrders = orders.filter(function (o) { return o.orderStatus === "Pending"; }).length;
    const confirmedOrders = orders.filter(function (o) { return o.orderStatus === "Confirmed"; }).length;
    const packedOrders = orders.filter(function (o) { return o.orderStatus === "Packed"; }).length;
    const outForDeliveryOrders = orders.filter(function (o) { return o.orderStatus === "Out for Delivery"; }).length;
    const deliveredOrders = orders.filter(function (o) { return o.orderStatus === "Delivered"; }).length;
    const cancelledOrders = orders.filter(function (o) { return o.orderStatus === "Cancelled"; }).length;

    const lowStockProducts = await Product.countDocuments({ stock: false });

    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ orderedAt: -1 })
      .limit(10)
      .select("totalAmount orderStatus paymentStatus paymentMethod orderedAt items.name items.quantity");

    const recentUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email phone role createdAt");

    const totalPayments = await Payment.countDocuments();
    const totalRevenuePaid = await Payment.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        revenue,
        pendingOrders,
        confirmedOrders,
        packedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts,
        totalPayments,
        totalRevenuePaid: totalRevenuePaid.length > 0 ? totalRevenuePaid[0].total : 0,
      },
      recentOrders,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Attach order counts for each user
    const userIds = users.map(function (u) { return u._id; });
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    orderCounts.forEach(function (item) { countMap[item._id.toString()] = item.count; });
    const usersWithCounts = users.map(function (u) {
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        orderCount: countMap[u._id.toString()] || 0,
      };
    });

    res.json({ users: usersWithCounts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin users" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status || "";
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.orderStatus = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.orderStatus === "Cancelled" && orderStatus !== "Cancelled") {
      return res.status(400).json({ message: "Cannot update a cancelled order" });
    }
    if (orderStatus === "Delivered" && order.paymentStatus === "Pending") {
      order.paymentStatus = "Paid";
    }
    order.orderStatus = orderStatus;
    const updated = await order.save();
    res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────
const getPayments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments();
    const payments = await Payment.find({})
      .populate("user", "name email")
      .populate("order", "totalAmount orderedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ payments, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this order" });
    }

    if (payment.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Payment is not in a paid state" });
    }

    payment.paymentStatus = "Failed";
    payment.transactionId = "REFUND_" + payment.transactionId;
    await payment.save();

    order.orderStatus = "Cancelled";
    await order.save();

    res.json({ message: "Payment refunded successfully", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────────────────
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minimumOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minimumOrder: minimumOrder || 0,
      maxDiscount: maxDiscount || 0,
      expiryDate,
      usageLimit: usageLimit || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const { code, discountType, discountValue, minimumOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    if (code !== undefined) coupon.code = code.toUpperCase();
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minimumOrder !== undefined) coupon.minimumOrder = minimumOrder;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    const updated = await coupon.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Monthly orders for chart
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$orderedAt" },
            month: { $month: "$orderedAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    // Top products by quantity sold
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.priceAtPurchase", "$items.quantity"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
    ]);

    // User registrations over time
    const userRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      monthlyOrders,
      ordersByStatus,
      topProducts,
      userRegistrations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const { storeName, supportEmail, supportPhone, deliveryCharge, freeDeliveryAmount, tax, logo, currency, currencySymbol } = req.body;

    if (storeName !== undefined) settings.storeName = storeName;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;
    if (deliveryCharge !== undefined) settings.deliveryCharge = deliveryCharge;
    if (freeDeliveryAmount !== undefined) settings.freeDeliveryAmount = freeDeliveryAmount;
    if (tax !== undefined) settings.tax = tax;
    if (logo !== undefined) settings.logo = logo;
    if (currency !== undefined) settings.currency = currency;
    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;

    const updated = await settings.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
