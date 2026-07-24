const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes — only authenticated users can access.
 *
 * How it works:
 * 1. Client sends token in Authorization header: "Bearer <token>"
 * 2. We extract the token from the header
 * 3. jwt.verify() decodes the token using our secret key
 *    - If the token is valid, it returns the decoded payload { id }
 *    - If the token is expired or tampered with, it throws an error
 * 4. We find the user by the decoded id and attach them to req.user
 * 5. next() passes control to the actual route handler
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token: "Bearer xyz123" → "xyz123"
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using our secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Admin middleware — only users with role "admin" can access.
 *
 * This MUST be used AFTER the protect middleware because
 * it relies on req.user being set by protect first.
 *
 * Example: router.get("/admin/data", protect, admin, handler);
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, admin };
