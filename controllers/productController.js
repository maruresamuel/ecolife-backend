const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy,
      page = 1,
      limit = 10,
      // Eco-friendly filters
      isOrganic,
      certification,
      minSustainabilityScore,
      packaging,
      origin,
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search by name or description
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Eco-friendly filters
    if (isOrganic === 'true') {
      query.isOrganic = true;
    }

    if (certification) {
      query.certifications = certification;
    }

    if (minSustainabilityScore) {
      query.sustainabilityScore = { $gte: parseInt(minSustainabilityScore) };
    }

    if (packaging && packaging !== 'All') {
      query.packaging = packaging;
    }

    if (origin && origin !== 'All') {
      query.origin = origin;
    }

    // Sort options
    let sort = {};
    if (sortBy === 'price_asc') {
      sort = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sort = { price: -1 };
    } else if (sortBy === 'name') {
      sort = { name: 1 };
    } else if (sortBy === 'sustainability') {
      sort = { sustainabilityScore: -1 };
    } else if (sortBy === 'carbon_footprint') {
      sort = { carbonFootprint: 1 }; // Lower is better
    } else {
      sort = { createdAt: -1 }; // Default: newest first
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .populate('vendor', 'name email phone address')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'vendor',
      'name email phone address'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor only)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, unit } = req.body;

    // Add vendor from authenticated user
    const productData = {
      name,
      description,
      price,
      stock,
      category,
      unit,
      vendor: req.user._id,
    };

    // Add image if uploaded
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor only - own products)
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user owns the product
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    // Update fields
    const { name, description, price, stock, category, unit, isActive } =
      req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (isActive !== undefined) product.isActive = isActive;

    // Update image if uploaded
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor only - own products)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user owns the product
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories/list
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = [
      'Organic Vegetables',
      'Organic Fruits',
      'Dairy Products',
      'Grains & Pulses',
      'Eco-friendly Products',
      'Natural Cosmetics',
      'Herbal Products',
      'Others',
    ];

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};
