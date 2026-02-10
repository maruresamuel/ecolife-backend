const express = require('express');
const router = express.Router();
const {
  getVendorProducts,
  getVendorOrders,
  getVendorStats,
  getVendorDashboard,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All vendor routes require authentication and vendor role
router.use(protect);
router.use(authorize('vendor'));

router.get('/products', getVendorProducts);
router.get('/orders', getVendorOrders);
router.get('/stats', getVendorStats);
router.get('/dashboard', getVendorDashboard);

module.exports = router;
