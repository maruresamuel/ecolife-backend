const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
  likeReview,
  reportReview,
  getUserReviews,
  getPendingReviews,
  updateReviewStatus,
  getReviewStats
} = require('../controllers/reviewController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Review = require('../models/Review');

// Public routes
router
  .route('/')
  .get(
    advancedResults(Review, [
      {
        path: 'user',
        select: 'name avatar'
      },
      {
        path: 'fillu',
        select: 'title'
      }
    ], {
      status: 'approved' // Default filter for public access
    }), 
    getReviews
  )
  .post(protect, authorize('user', 'admin'), addReview);

// Review stats (admin only)
router
  .route('/stats')
  .get(protect, authorize('admin'), getReviewStats);

// Pending reviews (admin only)
router
  .route('/pending')
  .get(protect, authorize('admin'), getPendingReviews);

// User's reviews
router
  .route('/user/:userId')
  .get(getUserReviews);

// Single review operations
router
  .route('/:id')
  .get(getReview)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

// Review actions
router
  .route('/:id/like')
  .put(protect, likeReview);

router
  .route('/:id/report')
  .post(protect, reportReview);

// Admin review status update
router
  .route('/:id/status')
  .put(protect, authorize('admin'), updateReviewStatus);

module.exports = router;
