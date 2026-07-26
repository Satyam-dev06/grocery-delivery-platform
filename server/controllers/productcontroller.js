const Product = require("../models/Product");

// @desc    Get products with search, filters, sorting & pagination
// @route   GET /api/products
// @query   ?page=&limit=&search=&category=&brand=&minPrice=&maxPrice=
//          &rating=&stock=&featured=&trending=&recommended=&offers=&sort=
const getProducts = async (req, res) => {
  try {
    // --- Parse query params ---
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();
    const brand = (req.query.brand || "").trim();
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 0;
    const rating = parseFloat(req.query.rating) || 0;
    const stock = (req.query.stock || "").trim();
    const featured = (req.query.featured || "").trim();
    const trending = (req.query.trending || "").trim();
    const recommended = (req.query.recommended || "").trim();
    const offers = (req.query.offers || "").trim();
    const sort = (req.query.sort || "newest").trim();

    // --- Build filter ---
    const filter = {};

    if (search) {
      // Escape regex special characters to prevent ReDoS / NoSQL injection
      var safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (minPrice > 0 || maxPrice > 0) {
      filter.price = {};
      if (minPrice > 0) filter.price.$gte = minPrice;
      if (maxPrice > 0) filter.price.$lte = maxPrice;
    }

    if (rating > 0) filter.rating = { $gte: rating };

    if (stock === "in") filter.stock = true;
    else if (stock === "out") filter.stock = false;

    if (featured === "true") filter.featured = true;
    if (trending === "true") filter.trending = true;
    if (recommended === "true") filter.recommended = true;

    if (offers === "true") filter.oldPrice = { $gt: 0 };

    // --- Build sort ---
    let sortOption = {};
    switch (sort) {
      case "newest":      sortOption = { createdAt: -1 }; break;
      case "oldest":      sortOption = { createdAt: 1 }; break;
      case "price_low":   sortOption = { price: 1 }; break;
      case "price_high":  sortOption = { price: -1 }; break;
      case "rating_high": sortOption = { rating: -1, price: 1 }; break;
      case "rating_low":  sortOption = { rating: 1, price: 1 }; break;
      case "name_az":     sortOption = { name: 1 }; break;
      case "name_za":     sortOption = { name: -1 }; break;
      default:            sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalProducts / limit);

    const [categories, brands, priceStats] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("brand"),
      Product.aggregate([
        { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
      ]),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
      filters: {
        categories: categories.sort(),
        brands: brands.filter(Boolean).sort(),
        priceRange:
          priceStats.length > 0
            ? { min: priceStats[0].minPrice, max: priceStats[0].maxPrice }
            : { min: 0, max: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
