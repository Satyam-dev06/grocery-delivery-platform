const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    brand: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    image: { type: String, required: true },
    rating: { type: Number, default: 5 },
    stock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ name: "text", category: "text", description: "text", brand: "text" });
// Index for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ featured: 1, trending: 1, recommended: 1 });

module.exports = mongoose.model("Product", productSchema);
