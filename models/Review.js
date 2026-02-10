const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  fillu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fillu',
    required: [true, 'Please add a Fillu ID'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  isRecommended: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  response: {
    text: String,
    respondedAt: Date
  },
  images: [{
    url: String,
    publicId: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent user from submitting more than one review per fillu
reviewSchema.index({ fillu: 1, user: 1 }, { unique: true });

// Create a compound index for common queries
reviewSchema.index({ fillu: 1, status: 1, rating: -1, createdAt: -1 });

// Update Fillu's average rating when a review is saved or removed
reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.fillu);
});

reviewSchema.post('remove', async function() {
  await this.constructor.calculateAverageRating(this.fillu);
});

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(filluId) {
  const stats = await this.aggregate([
    {
      $match: { fillu: filluId, status: 'approved' }
    },
    {
      $group: {
        _id: '$fillu',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        recommended: {
          $avg: {
            $cond: [{ $eq: ['$isRecommended', true] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.model('Fillu').findByIdAndUpdate(filluId, {
      averageRating: stats[0].avgRating,
      reviewCount: stats[0].nRating,
      recommendedPercent: Math.round(stats[0].recommended * 100)
    });
  } else {
    await this.model('Fillu').findByIdAndUpdate(filluId, {
      averageRating: 0,
      reviewCount: 0,
      recommendedPercent: 0
    });
  }
};

// Add a method to check if user can review
try {
  const User = mongoose.model('User');
  
  reviewSchema.methods.canUserReview = async function(userId) {
    // Check if user has already reviewed this fillu
    const existingReview = await this.constructor.findOne({
      fillu: this.fillu,
      user: userId
    });
    
    if (existingReview) {
      return { canReview: false, reason: 'You have already reviewed this item' };
    }
    
    // Optional: Check if user has purchased the item
    // This requires integration with your order system
    /*
    const hasPurchased = await Order.exists({
      user: userId,
      'items.fillu': this.fillu,
      status: 'completed'
    });
    
    if (!hasPurchased) {
      return { canReview: false, reason: 'You need to purchase this item before reviewing' };
    }
    */
    
    return { canReview: true };
  };
} catch (error) {
  console.warn('User model not found. Skipping canUserReview method setup.');
}

module.exports = mongoose.model('Review', reviewSchema);
