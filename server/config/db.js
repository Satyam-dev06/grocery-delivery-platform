const mongoose = require("mongoose");

// Disable Mongoose query buffering so operations fail immediately
// instead of timing out after 10 seconds when DB is not connected.
mongoose.set("bufferCommands", false);

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    console.log("MONGO_URI:", uri ? "\u2705 Defined (" + uri.substring(0, 30) + "...)" : "\u274C UNDEFINED");

    if (!uri) {
      throw new Error("MONGO_URI is not defined. Create a .env file in the server/ directory with:\n  MONGO_URI=mongodb://127.0.0.1:27017/groceryhub\n  JWT_SECRET=your_super_secret_key_change_this");
    }

    console.log("\u{1F50C} Connecting to MongoDB...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log("\u2705 MongoDB Connected successfully");
  } catch (error) {
    console.error("\u274C MongoDB connection failed:");
    console.error("  Reason: " + error.message);
    // Crash the server so the operator knows DB is down
    process.exit(1);
  }
}

// ─── Connection Event Listeners ───
mongoose.connection.on("connected", function () {
  console.log("\u{1F7E2} Mongoose connection event: connected");
});

mongoose.connection.on("error", function (err) {
  console.error("\u{1F534} Mongoose connection event: error — " + err.message);
});

mongoose.connection.on("disconnected", function () {
  console.warn("\u{1F7E0} Mongoose connection event: disconnected");
});

// Graceful shutdown
process.on("SIGINT", async function () {
  await mongoose.connection.close();
  console.log("\u{1F534} Mongoose connection closed due to app termination");
  process.exit(0);
});

module.exports = connectDB;