const mongoose = require('mongoose');

const filluSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Vehicles',
      'Services',
      'Jobs',
      'Real Estate',
      'Pets',
      'Sports & Hobbies',
      'Other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be a positive number']
  },
  condition: {
    type: String,
    required: [true, 'Please specify the condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isNegotiable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'pending', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from now
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based searches
filluSchema.index({ location: '2dsphere' });

// Reverse populate with virtuals
filluSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'fillu',
  justOne: false
});

// Cascade delete reviews when a fillu is deleted
filluSchema.pre('remove', async function(next) {
  await this.model('Review').deleteMany({ fillu: this._id });
  next();
});

// Static method to get avg rating and save
filluSchema.statics.getAverageRating = async function(filluId) {
  const obj = await this.aggregate([
    {
      $match: { _id: filluId }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'fillu',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' }
      }
    },
    {
      $project: {
        _id: 1,
        averageRating: { $ifNull: ['$averageRating', 0] },
        reviewCount: 1
      }
    }
  ]);

  try {
    await this.model('Fillu').findByIdAndUpdate(filluId, {
      averageRating: obj[0]?.averageRating || 0,
      reviewCount: obj[0]?.reviewCount || 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save or delete of review
filluSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Fillu', filluSchema);
