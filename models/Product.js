const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'Organic Vegetables',
        'Organic Fruits',
        'Dairy Products',
        'Grains & Pulses',
        'Eco-friendly Products',
        'Natural Cosmetics',
        'Herbal Products',
        'Others',
      ],
    },
    unit: {
      type: String,
      default: 'piece',
    },
    image: {
      type: String,
      default: null,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Sustainability Fields
    isOrganic: {
      type: Boolean,
      default: false,
    },
    certifications: [{
      type: String,
      enum: [
        'USDA Organic',
        'Fair Trade',
        'Carbon Neutral',
        'Rainforest Alliance',
        'B Corporation',
        'Leaping Bunny',
        'FSC Certified',
        'Non-GMO',
        'Vegan',
        'Cruelty-Free',
      ],
    }],
    sustainabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    carbonFootprint: {
      type: Number, // in kg CO2
      default: 0,
    },
    packaging: {
      type: String,
      enum: [
        'Biodegradable',
        'Recyclable',
        'Compostable',
        'Reusable',
        'Plastic-Free',
        'Minimal',
        'Standard',
      ],
      default: 'Standard',
    },
    origin: {
      type: String,
      enum: ['Local', 'Regional', 'National', 'International'],
      default: 'Local',
    },
    ecoLabels: [{
      type: String,
    }],
    environmentalImpact: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Index for filtering
productSchema.index({ category: 1, price: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);