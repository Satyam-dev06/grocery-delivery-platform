const Address = require("../models/Address");
const mongoose = require("mongoose");

// @desc    Add new address (with duplicate detection)
// @route   POST /api/address
// @access  Private
const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // ── Duplicate check ────────────────────────────────────────
    // Before inserting, look for an exact match across all address
    // fields for this user.  Exclude isDefault from the match so
    // that marking a different address as default after a save
    // doesn't create a duplicate on the next save.
    const existing = await Address.findOne({
      user: req.user._id,
      fullName: fullName ? fullName.trim() : "",
      phone: phone ? phone.trim() : "",
      addressLine1: addressLine1 ? addressLine1.trim() : "",
      addressLine2: addressLine2 ? addressLine2.trim() : "",
      city: city ? city.trim() : "",
      state: state ? state.trim() : "",
      pincode: pincode ? pincode.trim() : "",
      landmark: landmark ? landmark.trim() : "",
      addressType: addressType || "Home",
    });

    if (existing) {
      // If the existing address is identical except for isDefault,
      // just toggle the default flag if needed and return.
      if (isDefault && !existing.isDefault) {
        await Address.updateMany(
          { user: req.user._id },
          { isDefault: false }
        );
        existing.isDefault = true;
        await existing.save();
      }
      return res.status(409).json({
        message: "This address already exists.",
        address: existing,
      });
    }
    // ── End duplicate check ────────────────────────────────────

    // If this address is set as default, remove default from all other addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      landmark: landmark || "",
      addressType: addressType || "Home",
      isDefault: isDefault || false,
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all addresses for logged-in user
// @route   GET /api/address
// @access  Private
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 }); // Default first, then newest

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single address by ID
// @route   GET /api/address/:id
// @access  Private
const getAddressById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/address/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // If setting as default, remove default from all other addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }

    // Update only provided fields
    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (landmark !== undefined) address.landmark = landmark;
    if (addressType !== undefined) address.addressType = addressType;
    if (isDefault !== undefined) address.isDefault = isDefault;

    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set address as default
// @route   PUT /api/address/default/:id
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove default from all other addresses
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { isDefault: false }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
