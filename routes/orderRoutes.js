const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createOrderValidator,
  updateOrderStatusValidator,
} = require('../utils/validators');

// All order routes require authentication
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), createOrderValidator, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', authorize('customer'), cancelOrder);

// Vendor routes
router.put(
  '/:id/status',
  authorize('vendor'),
  updateOrderStatusValidator,
  updateOrderStatus
);

module.exports = router;
