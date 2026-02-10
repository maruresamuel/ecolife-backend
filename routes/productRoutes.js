const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createProductValidator,
  updateProductValidator,
} = require('../utils/validators');

// Public routes
router.get('/', getProducts);
router.get('/categories/list', getCategories);
router.get('/:id', getProduct);

// Protected routes (Vendor only)
router.post(
  '/',
  protect,
  authorize('vendor'),
  upload.single('image'),
  createProductValidator,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('vendor'),
  upload.single('image'),
  updateProductValidator,
  updateProduct
);

router.delete('/:id', protect, authorize('vendor'), deleteProduct);

module.exports = router;
