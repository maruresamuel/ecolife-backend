const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'refund', 'payment', 'earning'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'processing'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['mpesa', 'card', 'bank', 'wallet'],
      default: 'mpesa',
    },
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
    mpesaReceiptNumber: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    description: {
      type: String,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    refundedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Add indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
