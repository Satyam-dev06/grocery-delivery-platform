require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const products = [
  { name: "Fresh Milk", price: 65, oldPrice: 80, image: "./images/milk.png", category: "Dairy", rating: 5, stock: true },
  { name: "Curd (Yogurt)", price: 40, oldPrice: 55, image: "./images/curd.svg", category: "Dairy", rating: 4, stock: true },
  { name: "Butter (500g)", price: 55, oldPrice: 70, image: "./images/butter.svg", category: "Dairy", rating: 4, stock: true },
  { name: "Cheese Slices", price: 90, oldPrice: 120, image: "./images/cheese.svg", category: "Dairy", rating: 5, stock: false },
  { name: "Red Apple", price: 120, oldPrice: 150, image: "./images/apple.png", category: "Fruits", rating: 5, stock: true },
  { name: "Banana (Dozen)", price: 60, oldPrice: 80, image: "./images/banana.svg", category: "Fruits", rating: 4, stock: true },
  { name: "Orange", price: 90, oldPrice: 110, image: "./images/orange.svg", category: "Fruits", rating: 5, stock: true },
  { name: "Pomegranate", price: 150, oldPrice: 180, image: "./images/pomegranate.svg", category: "Fruits", rating: 4, stock: true },
  { name: "Spinach (Bunch)", price: 40, oldPrice: 55, image: "./images/spinach.png", category: "Vegetables", rating: 5, stock: true },
  { name: "Tomato (1kg)", price: 35, oldPrice: 50, image: "./images/tomato.svg", category: "Vegetables", rating: 4, stock: true },
  { name: "Potato (1kg)", price: 30, oldPrice: 40, image: "./images/potato.svg", category: "Vegetables", rating: 4, stock: true },
  { name: "Onion (1kg)", price: 45, oldPrice: 60, image: "./images/onion.svg", category: "Vegetables", rating: 4, stock: true },
  { name: "Brown Bread", price: 45, oldPrice: 60, image: "./images/bread.png", category: "Bakery", rating: 4, stock: false },
  { name: "Croissant", price: 35, oldPrice: 50, image: "./images/croissant.svg", category: "Bakery", rating: 5, stock: true },
  { name: "Whole Wheat Bread", price: 50, oldPrice: 65, image: "./images/whole-wheat-bread.svg", category: "Bakery", rating: 4, stock: true },
  { name: "Orange Juice (1L)", price: 80, oldPrice: 100, image: "./images/orange-juice.svg", category: "Beverages", rating: 5, stock: true },
  { name: "Cold Coffee (1L)", price: 120, oldPrice: 150, image: "./images/cold-coffee.svg", category: "Beverages", rating: 4, stock: true },
  { name: "Green Tea (Pack)", price: 180, oldPrice: 220, image: "./images/green-tea.svg", category: "Beverages", rating: 5, stock: true },
  { name: "Chicken Breast (500g)", price: 250, oldPrice: 320, image: "./images/chicken.svg", category: "Meat", rating: 4, stock: true },
  { name: "Fish Fillet (250g)", price: 200, oldPrice: 260, image: "./images/fish.svg", category: "Meat", rating: 5, stock: true },
  { name: "Basmati Rice (1kg)", price: 140, oldPrice: 180, image: "./images/rice.svg", category: "Grains", rating: 5, stock: true },
  { name: "Wheat Flour (1kg)", price: 45, oldPrice: 60, image: "./images/flour.svg", category: "Grains", rating: 4, stock: true },
  { name: "Hand Wash (250ml)", price: 95, oldPrice: 125, image: "./images/hand-wash.svg", category: "Personal Care", rating: 4, stock: true },
  { name: "Shampoo (200ml)", price: 180, oldPrice: 240, image: "./images/shampoo.svg", category: "Personal Care", rating: 5, stock: true },
];

const seed = async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    console.log("Cleared existing products");
    const created = await Product.insertMany(products);
    console.log("Inserted " + created.length + " products");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
