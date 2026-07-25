const mongoose = require("mongoose");

// ─── Payment Schema ───
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "UPI", "Card"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
