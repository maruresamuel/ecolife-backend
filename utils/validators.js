const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// User validators
const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['customer', 'vendor'])
    .withMessage('Role must be either customer or vendor'),
  body('address').optional().trim(),
  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Product validators
const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Organic Vegetables',
      'Organic Fruits',
      'Dairy Products',
      'Grains & Pulses',
      'Eco-friendly Products',
      'Natural Cosmetics',
      'Herbal Products',
      'Others',
    ])
    .withMessage('Invalid category'),
  body('unit').optional().trim(),
  validate,
];

const updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description').optional().trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .optional()
    .isIn([
      'Organic Vegetables',
      'Organic Fruits',
      'Dairy Products',
      'Grains & Pulses',
      'Eco-friendly Products',
      'Natural Cosmetics',
      'Herbal Products',
      'Others',
    ])
    .withMessage('Invalid category'),
  body('unit').optional().trim(),
  body('isActive').optional().isBoolean(),
  validate,
];

// Order validators
const createOrderValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('notes').optional().trim(),
  validate,
];

const updateOrderStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  validate,
];

// Review validators
const createReviewValidator = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  validate,
];

// Fillu validators
const createFilluValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Vehicles',
      'Services',
      'Jobs',
      'Real Estate',
      'Pets',
      'Sports & Hobbies',
      'Other',
    ])
    .withMessage('Invalid category'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  createProductValidator,
  updateProductValidator,
  createOrderValidator,
  updateOrderStatusValidator,
  createReviewValidator,
  createFilluValidator,
};
