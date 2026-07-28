const Product = require("../models/Product");
const mongoose = require("mongoose");

// ─── In-memory product store (fallback when MongoDB is unavailable) ───
let memoryStore = null;

function getMemoryStore() {
  if (memoryStore) return memoryStore;

  // Use inline product data (same data as seeder.js).
  // NOTE: We do NOT require('../seeder') here because seeder.js is an
  // async script that calls process.exit() when MongoDB is unavailable,
  // which would kill the server process. Instead we define the products inline.
  memoryStore = [
      { _id: "p1", id: 1, name: "Fresh Milk", price: 65, oldPrice: 80, image: "./images/milk.png", category: "Dairy", brand: "Mother Dairy", description: "Fresh full-cream milk sourced from local farms.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
      { _id: "p2", id: 2, name: "Curd (Yogurt)", price: 40, oldPrice: 55, image: "./images/curd.webp", category: "Dairy", brand: "Mother Dairy", description: "Thick and creamy yogurt made from fresh milk.", rating: 4, stock: true, featured: false, trending: true, recommended: true },
      { _id: "p3", id: 3, name: "Butter (500g)", price: 55, oldPrice: 70, image: "./images/butter.jpg", category: "Dairy", brand: "Amul", description: "Creamy salted butter perfect for cooking.", rating: 4, stock: true, featured: true, trending: false, recommended: false },
      { _id: "p4", id: 4, name: "Cheese Slices", price: 90, oldPrice: 120, image: "./images/cheese.webp", category: "Dairy", brand: "Amul", description: "Processed cheese slices for sandwiches.", rating: 5, stock: false, featured: false, trending: false, recommended: true },
      { _id: "p5", id: 5, name: "Red Apple", price: 120, oldPrice: 150, image: "./images/apple.png", category: "Fruits", brand: "Fresh Valley", description: "Juicy and crisp red apples from Kashmir.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
      { _id: "p6", id: 6, name: "Banana (Dozen)", price: 60, oldPrice: 80, image: "./images/banana.jpg", category: "Fruits", brand: "Fresh Valley", description: "Ripe and sweet bananas sold in a dozen pack.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
      { _id: "p7", id: 7, name: "Orange", price: 90, oldPrice: 110, image: "./images/orange.svg", category: "Fruits", brand: "Fresh Valley", description: "Sweet and tangy oranges packed with vitamin C.", rating: 5, stock: true, featured: true, trending: true, recommended: false },
      { _id: "p8", id: 8, name: "Pomegranate", price: 150, oldPrice: 180, image: "./images/pomegranate.png", category: "Fruits", brand: "Fresh Valley", description: "Fresh pomegranates with deep red seeds.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
      { _id: "p9", id: 9, name: "Spinach (Bunch)", price: 40, oldPrice: 55, image: "./images/spinach.png", category: "Vegetables", brand: "Green Farms", description: "Fresh green spinach rich in iron.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
      { _id: "p10", id: 10, name: "Tomato (1kg)", price: 35, oldPrice: 50, image: "./images/tomato.jpg", category: "Vegetables", brand: "Green Farms", description: "Farm-fresh juicy tomatoes.", rating: 4, stock: true, featured: false, trending: true, recommended: false },
      { _id: "p11", id: 11, name: "Potato (1kg)", price: 30, oldPrice: 40, image: "./images/potato.png", category: "Vegetables", brand: "Green Farms", description: "High-quality potatoes for all recipes.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
      { _id: "p12", id: 12, name: "Onion (1kg)", price: 45, oldPrice: 60, image: "./images/onion.jpeg", category: "Vegetables", brand: "Green Farms", description: "Fresh red onions with strong flavor.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
      { _id: "p13", id: 13, name: "Brown Bread", price: 45, oldPrice: 60, image: "./images/bread.jpg", category: "Bakery", brand: "Britannia", description: "Healthy whole wheat brown bread rich in fiber.", rating: 4, stock: false, featured: false, trending: false, recommended: true },
      { _id: "p14", id: 14, name: "Croissant", price: 35, oldPrice: 50, image: "./images/croissant.jpg", category: "Bakery", brand: "Britannia", description: "Flaky and buttery croissants baked fresh daily.", rating: 5, stock: true, featured: true, trending: true, recommended: false },
      { _id: "p15", id: 15, name: "Whole Wheat Bread", price: 50, oldPrice: 65, image: "./images/whole-wheat-bread.svg", category: "Bakery", brand: "Britannia", description: "Soft whole wheat bread for healthy sandwiches.", rating: 4, stock: true, featured: false, trending: false, recommended: true },
      { _id: "p16", id: 16, name: "Orange Juice (1L)", price: 80, oldPrice: 100, image: "./images/orange-juice.png", category: "Beverages", brand: "Tata", description: "Refreshing orange juice with no added sugar.", rating: 5, stock: true, featured: true, trending: true, recommended: true },
      { _id: "p17", id: 17, name: "Cold Coffee (1L)", price: 120, oldPrice: 150, image: "./images/cold-coffee.svg", category: "Beverages", brand: "Nestlé", description: "Ready-to-drink cold coffee with creamy taste.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
      { _id: "p18", id: 18, name: "Green Tea (Pack)", price: 180, oldPrice: 220, image: "./images/green-tea.jpeg", category: "Beverages", brand: "Tata", description: "Premium green tea bags with natural antioxidants.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
      { _id: "p19", id: 19, name: "Chicken Breast (500g)", price: 250, oldPrice: 320, image: "./images/chicken.jpeg", category: "Meat", brand: "Fresh Catch", description: "Boneless chicken breast with high protein.", rating: 4, stock: true, featured: true, trending: true, recommended: true },
      { _id: "p20", id: 20, name: "Fish Fillet (250g)", price: 200, oldPrice: 260, image: "./images/fish-fillet.jpeg", category: "Meat", brand: "Fresh Catch", description: "Fresh boneless fish fillets rich in omega-3.", rating: 5, stock: true, featured: false, trending: false, recommended: false },
      { _id: "p21", id: 21, name: "Basmati Rice (1kg)", price: 140, oldPrice: 180, image: "./images/rice.jpg", category: "Grains", brand: "Tata", description: "Premium quality basmati rice with long grains.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
      { _id: "p22", id: 22, name: "Wheat Flour (1kg)", price: 45, oldPrice: 60, image: "./images/flour.jpg", category: "Grains", brand: "Britannia", description: "Finely ground whole wheat flour for soft rotis.", rating: 4, stock: true, featured: false, trending: false, recommended: false },
      { _id: "p23", id: 23, name: "Hand Wash (250ml)", price: 95, oldPrice: 125, image: "./images/handwash.avif", category: "Personal Care", brand: "Tata", description: "Gentle hand wash with moisturizing properties.", rating: 4, stock: true, featured: false, trending: true, recommended: false },
      { _id: "p24", id: 24, name: "Shampoo (200ml)", price: 180, oldPrice: 240, image: "./images/shampoo.webp", category: "Personal Care", brand: "Nestlé", description: "Nourishing shampoo for silky smooth hair.", rating: 5, stock: true, featured: true, trending: false, recommended: true },
    ];
  return memoryStore;
}

// ─── Check if MongoDB is connected ───
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// @desc    Get products with search, filters, sorting & pagination
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    // If MongoDB is connected, use it. Otherwise fall back to in-memory store.
    if (isMongoConnected()) {
      return await getProductsFromMongo(req, res);
    }
    return await getProductsFromMemory(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── MongoDB-based product fetch (original implementation) ───
async function getProductsFromMongo(req, res) {
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

  const filter = {};
  if (search) {
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
  let totalProducts = await Product.countDocuments(filter);

  const hasFlagFilter = featured === "true" || trending === "true" || recommended === "true";
  if (totalProducts === 0 && hasFlagFilter) {
    delete filter.featured;
    delete filter.trending;
    delete filter.recommended;
    sortOption = { rating: -1, price: 1 };
    totalProducts = await Product.countDocuments(filter);
  }

  const products = await Product.find(filter).sort(sortOption).skip(skip).limit(limit).lean();
  const totalPages = Math.ceil(totalProducts / limit);

  const [categories, brands, priceStats] = await Promise.all([
    Product.distinct("category"),
    Product.distinct("brand"),
    Product.aggregate([{ $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } }]),
  ]);

  res.json({
    products,
    pagination: { page, limit, totalProducts, totalPages, nextPage: page < totalPages ? page + 1 : null, previousPage: page > 1 ? page - 1 : null },
    filters: {
      categories: categories.sort(),
      brands: brands.filter(Boolean).sort(),
      priceRange: priceStats.length > 0 ? { min: priceStats[0].minPrice, max: priceStats[0].maxPrice } : { min: 0, max: 0 },
    },
  });
}

// ─── In-memory product fetch (fallback when MongoDB is unavailable) ───
async function getProductsFromMemory(req, res) {
  console.log("[MemoryStore] MongoDB unavailable, using in-memory product store");

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
  const search = (req.query.search || "").trim().toLowerCase();
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

  let allProducts = getMemoryStore();

  // ─── Apply filters ───
  let filtered = allProducts.filter(function (p) {
    // Search
    if (search) {
      var inName = p.name.toLowerCase().includes(search);
      var inCat = (p.category || "").toLowerCase().includes(search);
      var inDesc = (p.description || "").toLowerCase().includes(search);
      var inBrand = (p.brand || "").toLowerCase().includes(search);
      if (!inName && !inCat && !inDesc && !inBrand) return false;
    }
    // Category
    if (category && p.category !== category) return false;
    // Brand
    if (brand && p.brand !== brand) return false;
    // Price range
    if (minPrice > 0 && p.price < minPrice) return false;
    if (maxPrice > 0 && p.price > maxPrice) return false;
    // Rating
    if (rating > 0 && (p.rating || 0) < rating) return false;
    // Stock
    if (stock === "in" && !p.stock) return false;
    if (stock === "out" && p.stock) return false;
    // Flag filters — products in our store HAVE these flags set correctly
    if (featured === "true" && !p.featured) return false;
    if (trending === "true" && !p.trending) return false;
    if (recommended === "true" && !p.recommended) return false;
    // Offers (discounted items)
    if (offers === "true" && (!p.oldPrice || p.oldPrice <= 0)) return false;
    return true;
  });

  // ─── Fallback: if flag-filters return zero, relax them ───
  const hasFlagFilter = featured === "true" || trending === "true" || recommended === "true";
  if (filtered.length === 0 && hasFlagFilter) {
    // Relax flags and return all products sorted by rating desc
    filtered = allProducts.filter(function (p) {
      if (search) {
        var inName = p.name.toLowerCase().includes(search);
        var inCat = (p.category || "").toLowerCase().includes(search);
        var inDesc = (p.description || "").toLowerCase().includes(search);
        var inBrand = (p.brand || "").toLowerCase().includes(search);
        if (!inName && !inCat && !inDesc && !inBrand) return false;
      }
      if (category && p.category !== category) return false;
      if (brand && p.brand !== brand) return false;
      if (minPrice > 0 && p.price < minPrice) return false;
      if (maxPrice > 0 && p.price > maxPrice) return false;
      if (rating > 0 && (p.rating || 0) < rating) return false;
      if (stock === "in" && !p.stock) return false;
      if (stock === "out" && p.stock) return false;
      return true;
    });
    // Sort by rating descending for the fallback
    filtered.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
  }

  // ─── Apply sorting ───
  switch (sort) {
    case "newest":
      // No createdAt in memory store, use insertion order (stable)
      break;
    case "oldest":
      filtered.reverse();
      break;
    case "price_low":
      filtered.sort(function (a, b) { return a.price - b.price; });
      break;
    case "price_high":
      filtered.sort(function (a, b) { return b.price - a.price; });
      break;
    case "rating_high":
      filtered.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
      break;
    case "rating_low":
      filtered.sort(function (a, b) { return (a.rating || 0) - (b.rating || 0); });
      break;
    case "name_az":
      filtered.sort(function (a, b) { return a.name.localeCompare(b.name); });
      break;
    case "name_za":
      filtered.sort(function (a, b) { return b.name.localeCompare(a.name); });
      break;
  }

  // ─── Pagination ───
  var totalProducts = filtered.length;
  var totalPages = Math.ceil(totalProducts / limit);
  var skip = (page - 1) * limit;
  var products = filtered.slice(skip, skip + limit);

  // ─── Build filters metadata ───
  var uniqueCategories = [];
  var uniqueBrands = [];
  var minP = Infinity, maxP = 0;
  allProducts.forEach(function (p) {
    if (p.category && uniqueCategories.indexOf(p.category) === -1) uniqueCategories.push(p.category);
    if (p.brand && uniqueBrands.indexOf(p.brand) === -1) uniqueBrands.push(p.brand);
    if (p.price < minP) minP = p.price;
    if (p.price > maxP) maxP = p.price;
  });

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
      categories: uniqueCategories.sort(),
      brands: uniqueBrands.filter(Boolean).sort(),
      priceRange: { min: minP === Infinity ? 0 : minP, max: maxP },
    },
  });
}

const getProductById = async (req, res) => {
  try {
    var pid = req.params.id;

    // ── Try MongoDB (only if the ID is a valid ObjectId) ──
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(pid)) {
      var mongoProduct = await Product.findById(pid);
      if (mongoProduct) {
        // Fix stale SVG image paths that exist in MongoDB but whose files were deleted
        if (mongoProduct.image && needsImageFix(mongoProduct.image)) {
          var allP = getMemoryStore();
          var fix = allP.find(function (p) { return p.name === mongoProduct.name; });
          if (fix && fix.image) {
            mongoProduct.image = fix.image;
          }
        }
        return res.status(200).json(mongoProduct);
      }
    }

    // ── Fallback: search in-memory store by _id OR id ──
    var allProducts = getMemoryStore();
    var product = allProducts.find(function (p) {
      return String(p._id) === pid || String(p.id) === pid;
    });
    if (product) return res.status(200).json(product);

    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    // If anything fails, try in-memory as final fallback
    try {
      var allProducts = getMemoryStore();
      var product = allProducts.find(function (p) {
        return String(p._id) === pid || String(p.id) === pid;
      });
      if (product) return res.status(200).json(product);
    } catch (e) {}
    res.status(500).json({ message: error.message });
  }
};

// Helper: check if a product image path refers to a deleted SVG file
function needsImageFix(imagePath) {
  if (!imagePath || imagePath.indexOf(".svg") === -1) return false;
  // These 3 SVGs still exist — no fix needed
  var knownExisting = ["orange.svg", "whole-wheat-bread.svg", "cold-coffee.svg"];
  for (var i = 0; i < knownExisting.length; i++) {
    if (imagePath.indexOf(knownExisting[i]) !== -1) return false;
  }
  return true;
}

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
