const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// All routes require authentication
router.route("/")
  .post(protect, addAddress)
  .get(protect, getAddresses);

router.route("/:id")
  .get(protect, getAddressById)
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route("/default/:id")
  .put(protect, setDefaultAddress);

module.exports = router;
