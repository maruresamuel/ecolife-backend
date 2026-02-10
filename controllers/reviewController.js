const Review = require('../models/Review');
const Fillu = require('../models/Fillu');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/fillus/:filluId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.filluId) {
    const reviews = await Review.find({ fillu: req.params.filluId, status: 'approved' })
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'fillu',
    select: 'title'
  });

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  // Only show approved reviews to non-admins
  if (review.status !== 'approved' && req.user?.role !== 'admin') {
    return next(
      new ErrorResponse(`Review with id ${req.params.id} not found`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/v1/fillus/:filluId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.fillu = req.params.filluId;
  req.body.user = req.user.id;

  const fillu = await Fillu.findById(req.params.filluId);

  if (!fillu) {
    return next(
      new ErrorResponse(
        `No fillu with the id of ${req.params.filluId}`,
        404
      )
    );
  }

  // Check if user already reviewed this fillu
  const existingReview = await Review.findOne({
    fillu: req.params.filluId,
    user: req.user.id
  });

  if (existingReview) {
    return next(
      new ErrorResponse(
        `User has already reviewed this fillu`,
        400
      )
    );
  }

  // Check if user can review (e.g., has purchased the item)
  // This would typically check an orders collection
  /*
  const hasPurchased = await Order.exists({
    user: req.user.id,
    'items.fillu': req.params.filluId,
    status: 'completed'
  });
  
  if (!hasPurchased && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `You must purchase this item before leaving a review`,
        400
      )
    );
  }
  */

  // Set default status based on user role
  if (!req.user.roles.includes('admin')) {
    req.body.status = 'pending'; // Regular users need approval
  } else {
    req.body.status = 'approved';
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  // Regular users can only update certain fields
  if (req.user.role !== 'admin') {
    const { rating, comment, isRecommended } = req.body;
    
    // Reset status to pending if admin had previously approved
    if (review.status === 'approved') {
      req.body.status = 'pending';
    }
    
    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment, isRecommended, status: 'pending' },
      {
        new: true,
        runValidators: true
      }
    );
  } else {
    // Admin can update any field including status
    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to delete review`, 401));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Like/Unlike a review
// @route   PUT /api/v1/reviews/:id/like
// @access  Private
exports.likeReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the user has already liked the review
  const likeIndex = review.likes.findIndex(
    (like) => like.user.toString() === req.user.id
  );

  if (likeIndex >= 0) {
    // User already liked, so unlike it
    review.likes.splice(likeIndex, 1);
    review.likesCount = Math.max(0, review.likesCount - 1);
  } else {
    // Add like
    review.likes.push({ user: req.user.id });
    review.likesCount += 1;
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: { likes: review.likes, likesCount: review.likesCount }
  });
});

// @desc    Report a review
// @route   POST /api/v1/reviews/:id/report
// @access  Private
exports.reportReview = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorResponse('Please provide a reason for reporting this review', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Check if user already reported this review
  const existingReport = review.reports.find(
    (report) => report.user.toString() === req.user.id
  );

  if (existingReport) {
    return next(
      new ErrorResponse('You have already reported this review', 400)
    );
  }

  review.reports.push({
    user: req.user.id,
    reason,
    status: 'pending'
  });
  
  review.reportCount = (review.reportCount || 0) + 1;
  
  // Auto-flag if report count exceeds threshold
  if (review.reportCount >= 5 && review.status !== 'removed') {
    review.status = 'flagged';
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: { reportCount: review.reportCount }
  });
});

// @desc    Get reviews by user
// @route   GET /api/v1/users/:userId/reviews
// @access  Public
exports.getUserReviews = asyncHandler(async (req, res, next) => {
  const query = { user: req.params.userId };
  
  // Only show approved reviews to non-admins
  if (!req.user?.roles?.includes('admin')) {
    query.status = 'approved';
  }
  
  const reviews = await Review.find(query)
    .populate({
      path: 'fillu',
      select: 'title images price'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get pending reviews (admin only)
// @route   GET /api/v1/reviews/pending
// @access  Private/Admin
exports.getPendingReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ status: 'pending' })
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .populate({
      path: 'fillu',
      select: 'title'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Update review status (admin only)
// @route   PUT /api/v1/reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['pending', 'approved', 'rejected', 'flagged', 'removed'].includes(status)) {
    return next(
      new ErrorResponse('Invalid status value', 400)
    );
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  );

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Get review statistics
// @route   GET /api/v1/reviews/stats
// @access  Private/Admin
exports.getReviewStats = asyncHandler(async (req, res, next) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        avgRating: { $round: ['$avgRating', 2] }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Calculate total reviews
  const totalReviews = stats.reduce((acc, curr) => acc + curr.count, 0);
  
  // Calculate average rating for all reviews
  const totalRating = stats.reduce(
    (acc, curr) => acc + (curr.avgRating * curr.count),
    0
  );
  const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalReviews,
      avgRating: parseFloat(avgRating.toFixed(2))
    }
  });
});
