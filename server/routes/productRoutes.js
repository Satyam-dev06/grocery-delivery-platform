const express = require("express");
const router = express.Router();

const {
    getProducts,
    createProduct,
    updateProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);

module.exports = router;