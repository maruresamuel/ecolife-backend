const express = require('express');
const router = express.Router();
const {
  getFillus,
  getFillu,
  createFillu,
  updateFillu,
  deleteFillu,
  filluPhotoUpload,
  deleteFilluPhoto,
  setPrimaryPhoto,
  getFillusInRadius,
  getFillusByUser,
  toggleFilluStatus,
  markAsSold,
  getFilluStats
} = require('../controllers/filluController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Fillu = require('../models/Fillu');
const { upload, uploadSingle } = require('../middleware/upload');

// Include other resource routers
const reviewRouter = require('./reviewRoutes');

// Re-route into other resource routers
router.use('/:filluId/reviews', reviewRouter);

// Public routes
router
  .route('/radius/:zipcode/:distance')
  .get(getFillusInRadius);

router
  .route('/user/:userId')
  .get(getFillusByUser);

// Protected routes
router
  .route('/')
  .get(
    advancedResults(Fillu, [
      {
        path: 'user',
        select: 'name avatar rating'
      },
      {
        path: 'reviews',
        select: 'rating comment'
      }
    ], {
      path: 'reviews',
      select: 'rating'
    }), 
    getFillus
  )
  .post(protect, authorize('user', 'admin'), createFillu);

router
  .route('/:id')
  .get(getFillu)
  .put(protect, authorize('user', 'admin'), updateFillu)
  .delete(protect, authorize('user', 'admin'), deleteFillu);

// Photo upload routes
router
  .route('/:id/photo')
  .put(
    protect, 
    authorize('user', 'admin'), 
    upload.single('file'), 
    filluPhotoUpload
  );

router
  .route('/:id/photo/:photoId')
  .delete(protect, authorize('user', 'admin'), deleteFilluPhoto);

router
  .route('/:id/photo/:photoId/set-primary')
  .put(protect, authorize('user', 'admin'), setPrimaryPhoto);

// Status management routes
router
  .route('/:id/status')
  .put(protect, authorize('user', 'admin'), toggleFilluStatus);

router
  .route('/:id/sold')
  .put(protect, authorize('user', 'admin'), markAsSold);

// Admin routes
router
  .route('/stats')
  .get(protect, authorize('admin'), getFilluStats);

module.exports = router;
