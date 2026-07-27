require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const addressRoutes = require("./routes/addressRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const couponRoutes=require("./routes/couponRoutes");

const app = express();

// Connect to MongoDB BEFORE starting the HTTP server
// This ensures all API requests have a working database connection.
// Mongoose bufferCommands is disabled, so if DB is down the server will
// crash immediately rather than silently buffering and timing out later.
connectDB()
  .then(function () {
    app.listen(PORT, function () {
      console.log("\uD83D\uDE80 Server running on port " + PORT);
    });
  })
  .catch(function (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "client")));

app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use('/api/coupons',couponRoutes);
app.get("/", (req, res) => {
  res.json({ message: "GroceryHub API Running" });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Note: app.listen() is called inside connectDB().then() above.
// This ensures the HTTP server only starts AFTER MongoDB connects.
