const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for the given user ID.
 *
 * @param {string} id - MongoDB _id of the user
 * @returns {string} Signed JWT token valid for 30 days
 *
 * How it works:
 * - jwt.sign({ id }, secret, options) creates a signed token
 * - The { id } payload is embedded in the token so we can
 *   identify the user when they send the token back
 * - process.env.JWT_SECRET is the private key used to sign
 *   and verify the token. NEVER expose this.
 * - expiresIn: "30d" means the token auto-expires after 30 days.
 *   After that, the user must log in again.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
