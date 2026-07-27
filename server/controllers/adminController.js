const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const Settings = require("../models/Settings");
const { notifyOrderStatus, notifyCoupon, createNotification, notifyAdmin } = require("../utils/notificationHelper");

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

    // Notify user about order status change
    notifyOrderStatus(order.user, order, orderStatus).catch(function(e){});

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
    const { code, description, discountType, discountValue, minimumOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      description: description || "",
      discountType,
      discountValue,
      minimumOrder: minimumOrder || 0,
      maxDiscount: maxDiscount || 0,
      expiryDate,
      usageLimit: usageLimit || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    // Notify all users about new coupon
    if (coupon) {
      try {
        const discountStr = coupon.discountType === 'percentage' ? coupon.discountValue + '% OFF' : '₹' + coupon.discountValue + ' OFF';
        const allUsers = await User.find({ role: "user" }).select("_id");
        for (const u of allUsers) {
          notifyCoupon(u._id, coupon.code, discountStr).catch(function(){});
        }
      } catch (ce) { /* non-critical */ }
    }

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

    const { code, description, discountType, discountValue, minimumOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    if (code !== undefined) coupon.code = code.toUpperCase();
    if (description !== undefined) coupon.description = description;
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
    // ─── Date Range Filter ───
    var range = req.query.range || "month";
    var startDate, endDate = new Date();
    if (req.query.start && req.query.end) {
      startDate = new Date(req.query.start);
      endDate = new Date(req.query.end);
    } else {
      switch (range) {
        case "today":
          startDate = new Date(endDate); startDate.setHours(0,0,0,0);
          break;
        case "7days":
          startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate = new Date(endDate); startDate.setDate(startDate.getDate() - 30);
          break;
        case "month":
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
      }
    }

    // ─── Overall Stats (no date filter) ───
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalDelivered = await Order.countDocuments({ orderStatus: "Delivered" });
    const totalRevenueData = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;
    const avgOrderValue = totalDelivered > 0 ? Math.round(totalRevenue / totalDelivered) : 0;

    // ─── Date-filtered Stats ───
    const dateFilter = { orderedAt: { $gte: startDate, $lte: endDate } };
    const dateRevenueAgg = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const dateRevenue = dateRevenueAgg.length > 0 ? dateRevenueAgg[0].total : 0;
    const dateOrders = await Order.countDocuments(dateFilter);
    const dateNewUsers = await User.countDocuments({ role: "user", createdAt: { $gte: startDate, $lte: endDate } });

    // ─── Returning Customers ───
    const returningAgg = await Order.aggregate([
      { $match: { orderedAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $group: { _id: null, multiple: { $sum: { $cond: [{ $gte: ["$count", 2] }, 1, 0] } }, single: { $sum: { $cond: [{ $eq: ["$count", 1] }, 1, 0] } } } },
    ]);
    const returningCustomers = returningAgg.length > 0 ? returningAgg[0].multiple : 0;
    const newCustomers = returningAgg.length > 0 ? returningAgg[0].single : 0;

    // ─── Revenue Trend (daily for chart) ───
    const revenueTrend = await Order.aggregate([
      { $match: { orderStatus: "Delivered", orderedAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // ─── Orders Per Day ───
    const ordersPerDay = await Order.aggregate([
      { $match: { orderedAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // ─── Sales by Category ───
    const categorySales = await Order.aggregate([
      { $match: { orderedAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$items" },
      { $group: { _id: null, items: { $push: { name: "$items.name", quantity: "$items.quantity" } } } },
    ]);
    // Map product names to categories from Product model
    const categoryMap = {};
    const allProducts = await Product.find({}).select("name category");
    allProducts.forEach(function(p) {
      categoryMap[p.name] = p.category || "Other";
    });
    // Aggregate category sales from actual order items
    const catSalesAgg = await Order.aggregate([
      { $match: { orderedAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.priceAtPurchase", "$items.quantity"] } } } },
      { $sort: { revenue: -1 } },
    ]);

    var categorySalesData = [];
    var catRevenues = {};
    catSalesAgg.forEach(function(item) {
      var cat = categoryMap[item._id] || "Other";
      if (!catRevenues[cat]) catRevenues[cat] = 0;
      catRevenues[cat] += item.revenue;
    });
    Object.keys(catRevenues).forEach(function(cat) {
      categorySalesData.push({ category: cat, revenue: Math.round(catRevenues[cat]) });
    });
    categorySalesData.sort(function(a,b) { return b.revenue - a.revenue; });

    // ─── Top Selling Products ───
    const topProducts = catSalesAgg.slice(0, 10);

    // ─── Monthly Revenue ───
    const monthlyRevenue = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      {
        $group: {
          _id: { year: { $year: "$orderedAt" }, month: { $month: "$orderedAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // ─── Low Stock / Out of Stock ───
    const lowStock = await Product.find({ stock: false }).countDocuments();
    const outOfStock = await Product.find({ stock: false, quantity: { $lte: 0 } }).countDocuments();

    // ─── Recent Orders (last 10) ───
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ orderedAt: -1 })
      .limit(10)
      .select("totalAmount orderStatus paymentStatus paymentMethod orderedAt items.name items.quantity totalItems");

    // ─── Recent Customers (last 10) ───
    const recentCustomers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email phone createdAt");

    res.json({
      stats: {
        revenueToday: dateRevenue,
        revenueMonth: dateRevenue,
        totalSales: totalRevenue,
        totalOrders,
        totalCustomers: totalUsers,
        averageOrderValue: avgOrderValue,
        returningCustomers,
        newCustomers,
        totalProducts,
        totalDelivered,
        lowStock,
        outOfStock,
        dateOrders,
        dateNewUsers,
      },
      charts: {
        revenueTrend,
        ordersPerDay,
        categorySales: categorySalesData,
        topProducts,
        monthlyRevenue,
      },
      recentOrders,
      recentCustomers,
      filters: {
        startDate,
        endDate,
        range,
      },
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

// ─────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS (Send Announcement)
// ─────────────────────────────────────────────────────────
const sendAdminNotification = async (req, res) => {
  try {
    const { title, message, type, target, userId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (title.length > 100) {
      return res.status(400).json({ message: "Title cannot exceed 100 characters" });
    }
    if (message.length > 500) {
      return res.status(400).json({ message: "Message cannot exceed 500 characters" });
    }

    const notifType = type || "admin";
    const notifData = { type: notifType, link: "/" };

    if (target === "single" && userId) {
      // Send to a single user
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }
      await createNotification({
        user: userId,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        link: "/",
      });
    } else {
      // Send to all users (or default)
      const users = await User.find({ role: "user" }).select("_id");
      for (const u of users) {
        await createNotification({
          user: u._id,
          title: title.trim(),
          message: message.trim(),
          type: notifType,
          link: "/",
        }).catch(function(){});
      }
    }

    res.json({ message: "Notification sent successfully", target: target === "single" ? "single" : "all" });
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
  sendAdminNotification,
};
