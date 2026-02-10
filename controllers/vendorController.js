const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get vendor products
// @route   GET /api/vendor/products
// @access  Private (Vendor only)
const getVendorProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { vendor: req.user._id };

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

// @desc    Get vendor orders
// @route   GET /api/vendor/orders
// @access  Private (Vendor only)
const getVendorOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query - find orders that contain vendor's products
    const query = { 'items.vendor': req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter items to show only vendor's products
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.vendor.toString() === req.user._id.toString()
      );
      return orderObj;
    });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { orders: filteredOrders },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor statistics
// @route   GET /api/vendor/stats
// @access  Private (Vendor only)
const getVendorStats = async (req, res, next) => {
  try {
    // Count total products
    const totalProducts = await Product.countDocuments({
      vendor: req.user._id,
    });

    const activeProducts = await Product.countDocuments({
      vendor: req.user._id,
      isActive: true,
    });

    // Get orders containing vendor's products
    const orders = await Order.find({ 'items.vendor': req.user._id });

    // Calculate order stats
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    orders.forEach((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor.toString() === req.user._id.toString()
      );

      if (vendorItems.length > 0) {
        totalOrders++;

        // Calculate revenue from vendor's items only
        vendorItems.forEach((item) => {
          totalRevenue += item.price * item.quantity;
        });

        if (order.status === 'pending') pendingOrders++;
        if (order.status === 'delivered') deliveredOrders++;
      }
    });

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      vendor: req.user._id,
      stock: { $lte: 5 },
      isActive: true,
    });

    const stats = {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      lowStockProducts,
    };

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor dashboard data
// @route   GET /api/vendor/dashboard
// @access  Private (Vendor only)
const getVendorDashboard = async (req, res, next) => {
  try {
    // Get stats
    const stats = await getVendorStatsData(req.user._id);

    // Get recent orders
    const recentOrders = await Order.find({ 'items.vendor': req.user._id })
      .populate('user', 'name phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Filter to show only vendor's items
    const filteredOrders = recentOrders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.vendor.toString() === req.user._id.toString()
      );
      return orderObj;
    });

    // Get low stock products
    const lowStockProducts = await Product.find({
      vendor: req.user._id,
      stock: { $lte: 5 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentOrders: filteredOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get vendor stats
async function getVendorStatsData(vendorId) {
  const totalProducts = await Product.countDocuments({ vendor: vendorId });
  const activeProducts = await Product.countDocuments({
    vendor: vendorId,
    isActive: true,
  });

  const orders = await Order.find({ 'items.vendor': vendorId });

  let totalOrders = 0;
  let totalRevenue = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;

  orders.forEach((order) => {
    const vendorItems = order.items.filter(
      (item) => item.vendor.toString() === vendorId.toString()
    );

    if (vendorItems.length > 0) {
      totalOrders++;
      vendorItems.forEach((item) => {
        totalRevenue += item.price * item.quantity;
      });

      if (order.status === 'pending') pendingOrders++;
      if (order.status === 'delivered') deliveredOrders++;
    }
  });

  const lowStockProducts = await Product.countDocuments({
    vendor: vendorId,
    stock: { $lte: 5 },
    isActive: true,
  });

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
    lowStockProducts,
  };
}

module.exports = {
  getVendorProducts,
  getVendorOrders,
  getVendorStats,
  getVendorDashboard,
};
