const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

/**
 * seedAdmin.js
 *
 * Creates an admin user in the database.
 * Run this ONCE after the server dependencies are installed:
 *   node seedAdmin.js
 *
 * The register API does NOT allow setting role="admin" (security),
 * so we use this script to create the admin account directly.
 */

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const adminData = {
      name: "Admin",
      email: "admin@groceryhub.com",
      password: "admin123",
      phone: "+91 9999999999",
      address: "GroceryHub HQ, Jalandhar",
      role: "admin",
    };

    // Check if admin already exists
    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log("ℹ️  Admin user already exists:");
      console.log("   Email:", existing.email);
      console.log("   Role:", existing.role);
      console.log("   ID:", existing._id);

      // Update role to admin if it was changed
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log("✅ Updated role to admin");
      }
    } else {
      // Create new admin user
      const admin = await User.create(adminData);
      console.log("✅ Admin user created successfully:");
      console.log("   Name:", admin.name);
      console.log("   Email:", admin.email);
      console.log("   Role:", admin.role);
      console.log("   ID:", admin._id);
    }

    console.log("\n📝 Login credentials:");
    console.log("   Email:    admin@groceryhub.com");
    console.log("   Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
