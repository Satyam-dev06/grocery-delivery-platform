const Notification = require("../models/Notification");
const { sendEmail } = require("./email");

const TYPE_CONFIG = {
  order:    { icon: "fa-solid fa-truck",       color: "#1976D2" },
  payment:  { icon: "fa-solid fa-credit-card", color: "#2E7D32" },
  coupon:   { icon: "fa-solid fa-tags",        color: "#E65100" },
  wishlist: { icon: "fa-solid fa-heart",       color: "#E53935" },
  offer:    { icon: "fa-solid fa-gift",         color: "#7B1FA2" },
  admin:    { icon: "fa-solid fa-shield",       color: "#37474F" },
  system:   { icon: "fa-solid fa-bell",         color: "#607D8B" },
};

async function createNotification({ user, title, message, type, link, sendEmail: shouldSendEmail, emailTemplate, emailData }) {
  try {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.system;
    const notif = await Notification.create({
      user,
      title,
      message,
      type: type || "system",
      icon: cfg.icon,
      link: link || "",
      notificationType: shouldSendEmail ? "both" : "in-app",
    });
    if (shouldSendEmail && emailTemplate) {
      const userDoc = await require("../models/User").findById(user).select("email name");
      if (userDoc && userDoc.email) {
        const sent = await sendEmail({ to: userDoc.email, template: emailTemplate, templateData: emailData || [userDoc.name] });
        if (sent) {
          notif.emailSent = true;
          await notif.save();
        }
      }
    }
    return notif;
  } catch (error) {
    console.error("Create notification error:", error.message);
    return null;
  }
}

async function notifyOrderStatus(userId, order, status) {
  const msgs = {
    Pending:    { title: "Order Placed",     message: "Your order #" + order._id + " has been placed.", type: "order", link: "/orders.html", email: "orderConfirmation", data: [order.user?.name || "Customer", order._id.toString(), "Rs" + (order.totalAmount || 0)] },
    Confirmed:  { title: "Order Confirmed",   message: "Order #" + order._id + " has been confirmed.", type: "order", link: "/orders.html" },
    Packed:     { title: "Order Packed",      message: "Order #" + order._id + " is being packed.", type: "order", link: "/orders.html" },
    "Out for Delivery": { title: "Out for Delivery!", message: "Order #" + order._id + " is out for delivery!", type: "order", link: "/orders.html" },
    Delivered:  { title: "Order Delivered!",   message: "Order #" + order._id + " has been delivered. Enjoy!", type: "order", link: "/orders.html", email: "orderDelivered", data: [order.user?.name || "Customer", order._id.toString()] },
    Cancelled:  { title: "Order Cancelled",   message: "Order #" + order._id + " has been cancelled.", type: "order", link: "/orders.html" },
  };
  const msg = msgs[status];
  if (!msg) return;
  return createNotification({
    user: userId,
    title: msg.title,
    message: msg.message,
    type: msg.type,
    link: msg.link,
    sendEmail: !!msg.email,
    emailTemplate: msg.email,
    emailData: msg.data,
  });
}

async function notifyPayment(userId, status, amount) {
  if (status === "Paid") {
    return createNotification({
      user: userId, title: "Payment Successful", message: "Payment of Rs" + (amount || 0) + " was successful.",
      type: "payment", link: "/orders.html", sendEmail: true, emailTemplate: "paymentSuccess", emailData: [null, amount || 0],
    });
  } else if (status === "Failed") {
    return createNotification({
      user: userId, title: "Payment Failed", message: "Payment of Rs" + (amount || 0) + " failed. Please try again.",
      type: "payment", link: "/orders.html", sendEmail: true, emailTemplate: "paymentFailed", emailData: [null, amount || 0],
    });
  }
}

async function notifyNewUser(user) {
  return createNotification({
    user: user._id, title: "Welcome to GroceryHub!", message: "Hi " + user.name + "! Welcome aboard. Start shopping now!",
    type: "system", link: "/", sendEmail: true, emailTemplate: "welcome", emailData: [user.name],
  });
}

async function notifyAdmin(event, data) {
  const admins = await require("../models/User").find({ role: "admin" }).select("_id");
  const results = [];
  for (const admin of admins) {
    let notif = { user: admin._id, type: "admin", link: "/admin" };
    if (event === "new_user") {
      notif.title = "New User Registered";
      notif.message = data.name + " (" + data.email + ") has registered.";
    } else if (event === "new_order") {
      notif.title = "New Order Placed";
      notif.message = "Order #" + data.orderId + " placed. Total: Rs" + (data.total || 0);
    } else if (event === "payment_completed") {
      notif.title = "Payment Completed";
      notif.message = "Payment of Rs" + (data.amount || 0) + " completed for order #" + (data.orderId || "");
    } else if (event === "payment_failed") {
      notif.title = "Payment Failed";
      notif.message = "Payment failed for order #" + (data.orderId || "");
    } else if (event === "refund_requested") {
      notif.title = "Refund Requested";
      notif.message = "Refund requested for order #" + (data.orderId || "");
    } else {
      return;
    }
    const r = await createNotification(notif);
    if (r) results.push(r);
  }
  return results;
}

async function notifyCoupon(userId, code, discount) {
  return createNotification({
    user: userId, title: "Coupon Received!", message: "Coupon code " + code + " is now available. " + discount,
    type: "coupon", link: "/", sendEmail: true, emailTemplate: "couponReceived", emailData: [null, code, discount],
  });
}

module.exports = { createNotification, notifyOrderStatus, notifyPayment, notifyNewUser, notifyAdmin, notifyCoupon, TYPE_CONFIG };
