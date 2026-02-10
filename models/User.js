const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    role: {
      type: String,
      enum: ['customer', 'vendor'],
      default: 'customer',
    },
    address: {
      type: String,
      required: function () {
        return this.role === 'vendor';
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Vendor Verification Fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [{
      type: String, // URLs to uploaded documents
    }],
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    businessLicense: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    certifications: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);