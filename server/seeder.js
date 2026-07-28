require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");
const User = require("./models/User");
const Coupon = require("./models/Coupon");

const products = [
  { name: "Fresh Milk", price: 65, oldPrice: 80, image: "./images/milk.png", category: "Dairy", brand: "Mother Dairy", description: "Fresh full-cream milk sourced from local farms.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
  { name: "Curd (Yogurt)", price: 40, oldPrice: 55, image: "./images/curd.svg", category: "Dairy", brand: "Mother Dairy", description: "Thick and creamy yogurt made from fresh milk.", rating: 4, stock: true, featured: false, trending: true, recommended: true },
  { name: "Butter (500g)", price: 55, oldPrice: 70, image: "./images/butter.svg", category: "Dairy", brand: "Amul", description: "Creamy salted butter perfect for cooking and spreading.", rating: 4, stock: true, featured: true, trending: false, recommended: false },
  { name: "Cheese Slices", price: 90, oldPrice: 120, image: "./images/cheese.svg", category: "Dairy", brand: "Amul", description: "Processed cheese slices for sandwiches and burgers.", rating: 5, stock: false, featured: false, trending: false, recommended: true },
  { name: "Red Apple", price: 120, oldPrice: 150, image: "./images/apple.png", category: "Fruits", brand: "Fresh Valley", description: "Juicy and crisp red apples imported from Kashmir.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
  { name: "Banana (Dozen)", price: 60, oldPrice: 80, image: "./images/banana.svg", category: "Fruits", brand: "Fresh Valley", description: "Ripe and sweet bananas sold in a dozen pack.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
  { name: "Orange", price: 90, oldPrice: 110, image: "./images/orange.svg", category: "Fruits", brand: "Fresh Valley", description: "Sweet and tangy oranges packed with vitamin C.", rating: 5, stock: true, featured: true, trending: true, recommended: false },
  { name: "Pomegranate", price: 150, oldPrice: 180, image: "./images/pomegranate.svg", category: "Fruits", brand: "Fresh Valley", description: "Fresh pomegranates with deep red seeds.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
  { name: "Spinach (Bunch)", price: 40, oldPrice: 55, image: "./images/spinach.png", category: "Vegetables", brand: "Green Farms", description: "Fresh green spinach leaves rich in iron and nutrients.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
  { name: "Tomato (1kg)", price: 35, oldPrice: 50, image: "./images/tomato.svg", category: "Vegetables", brand: "Green Farms", description: "Farm-fresh juicy tomatoes perfect for cooking.", rating: 4, stock: true, featured: false, trending: true, recommended: false },
  { name: "Potato (1kg)", price: 30, oldPrice: 40, image: "./images/potato.svg", category: "Vegetables", brand: "Green Farms", description: "High-quality potatoes ideal for all your recipes.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
  { name: "Onion (1kg)", price: 45, oldPrice: 60, image: "./images/onion.svg", category: "Vegetables", brand: "Green Farms", description: "Fresh red onions with strong flavor.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
  { name: "Brown Bread", price: 45, oldPrice: 60, image: "./images/bread.png", category: "Bakery", brand: "Britannia", description: "Healthy whole wheat brown bread rich in fiber.", rating: 4, stock: false, featured: false, trending: false, recommended: true },
  { name: "Croissant", price: 35, oldPrice: 50, image: "./images/croissant.svg", category: "Bakery", brand: "Britannia", description: "Flaky and buttery croissants baked fresh daily.", rating: 5, stock: true, featured: true, trending: true, recommended: false },
  { name: "Whole Wheat Bread", price: 50, oldPrice: 65, image: "./images/whole-wheat-bread.svg", category: "Bakery", brand: "Britannia", description: "Soft whole wheat bread for healthy sandwiches.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
  { name: "Orange Juice (1L)", price: 80, oldPrice: 100, image: "./images/orange-juice.svg", category: "Beverages", brand: "Tata", description: "Refreshing orange juice with no added sugar.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
  { name: "Cold Coffee (1L)", price: 120, oldPrice: 150, image: "./images/cold-coffee.svg", category: "Beverages", brand: "Nestlé", description: "Ready-to-drink cold coffee with creamy taste.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
  { name: "Green Tea (Pack)", price: 180, oldPrice: 220, image: "./images/green-tea.svg", category: "Beverages", brand: "Tata", description: "Premium green tea bags with natural antioxidants.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
  { name: "Chicken Breast (500g)", price: 250, oldPrice: 320, image: "./images/chicken.svg", category: "Meat", brand: "Fresh Catch", description: "Boneless chicken breast with high protein content.", rating: 4, stock: true, featured: true, trending: true, recommended: true },
  { name: "Fish Fillet (250g)", price: 200, oldPrice: 260, image: "./images/fish.svg", category: "Meat", brand: "Fresh Catch", description: "Fresh boneless fish fillets rich in omega-3.", rating: 5, stock: true, featured: false, trending: false, recommended: false },
  { name: "Basmati Rice (1kg)", price: 140, oldPrice: 180, image: "./images/rice.svg", category: "Grains", brand: "Tata", description: "Premium quality basmati rice with long grains.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
  { name: "Wheat Flour (1kg)", price: 45, oldPrice: 60, image: "./images/flour.svg", category: "Grains", brand: "Britannia", description: "Finely ground whole wheat flour for soft rotis.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
  { name: "Hand Wash (250ml)", price: 95, oldPrice: 125, image: "./images/hand-wash.svg", category: "Personal Care", brand: "Tata", description: "Gentle hand wash with moisturizing properties.", rating: 4, stock: true, featured: false, trending: true, recommended: false },
  { name: "Shampoo (200ml)", price: 180, oldPrice: 240, image: "./images/shampoo.svg", category: "Personal Care", brand: "Nestlé", description: "Nourishing shampoo for silky smooth hair.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
];

// ─── Demo Customers ───
const demoCustomers = [
  { name: "Satyam", email: "satyam@example.com", password: "user123", role: "user" },
  { name: "Rahul",  email: "rahul@example.com",  password: "user123", role: "user" },
  { name: "Priya",  email: "priya@example.com",  password: "user123", role: "user" },
];

// ─── Coupons ───
const coupons = [
  { code: "WELCOME10", description: "10% off on your first order!", discountType: "percentage", discountValue: 10, minimumOrder: 100, maxDiscount: 100, expiryDate: new Date("2026-12-31"), usageLimit: 0, isActive: true },
  { code: "FLAT50",    description: "Flat ₹50 off on orders above ₹250.", discountType: "fixed",      discountValue: 50, minimumOrder: 250, maxDiscount: 0,    expiryDate: new Date("2026-12-31"), usageLimit: 0, isActive: true },
  { code: "FESTIVE20", description: "20% off festive special! Up to ₹150 off.", discountType: "percentage", discountValue: 20, minimumOrder: 500, maxDiscount: 150, expiryDate: new Date("2026-12-31"), usageLimit: 100, isActive: true },
];

const seed = async () => {
  try {
    await connectDB();

    // ─── Users ──────────────────────────────────────────
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create admin (password is auto-hashed by the User model's pre("save") hook)
    await User.create({
      name: "Admin",
      email: "admin@groceryhub.com",
      password: "admin123",
      role: "admin",
    });
    console.log("✓ Admin created");

    // Create demo customers — plain-text password gets hashed by pre("save") hook
    const createdCustomers = [];
    for (const c of demoCustomers) {
      const existing = await User.findOne({ email: c.email });
      if (!existing) {
        const user = await User.create(c);
        createdCustomers.push(user);
      }
    }
    console.log(`✓ ${createdCustomers.length} mock customers created`);

    // ─── Products ───────────────────────────────────────
    await Product.deleteMany({});
    console.log("Cleared existing products");

    await Product.createIndexes();
    const createdProducts = await Product.insertMany(products);
    console.log(`✓ ${createdProducts.length} products seeded`);

    // ─── Coupons ────────────────────────────────────────
    await Coupon.deleteMany({});
    console.log("Cleared existing coupons");

    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`✓ ${createdCoupons.length} coupons seeded`);

    // ─── Summary ────────────────────────────────────────
    console.log("\n─── Seed Complete ───");
    console.log(`  Users:   1 admin + ${createdCustomers.length} customers`);
    console.log(`  Products: ${createdProducts.length}`);
    console.log(`  Coupons:  ${createdCoupons.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
