const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "GroceryHub" },
    supportEmail: { type: String, default: "support@groceryhub.com" },
    supportPhone: { type: String, default: "+91-9876543210" },
    deliveryCharge: { type: Number, default: 40 },
    freeDeliveryAmount: { type: Number, default: 500 },
    tax: { type: Number, default: 5 },
    logo: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "\u20B9" },
  },
  { timestamps: true }
);

settingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) return settings;
  return await this.create({});
};

module.exports = mongoose.model("Settings", settingsSchema);
