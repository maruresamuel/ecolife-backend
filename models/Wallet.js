const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'KSH',
    },
  },
  { timestamps: true }
);

// Add index for faster queries
walletSchema.index({ user: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
