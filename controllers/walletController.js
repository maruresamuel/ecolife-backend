const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mpesaService = require('../config/mpesa');

// @desc    Get wallet balance
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        user: req.user._id,
        balance: 0,
        pendingBalance: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: { wallet },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate deposit via M-Pesa
// @route   POST /api/wallet/deposit
// @access  Private
const initiateDeposit = async (req, res, next) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit amount is KSH 100',
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      method: 'mpesa',
      phoneNumber,
      description: 'Wallet deposit via M-Pesa',
    });

    // Initiate M-Pesa STK Push
    const mpesaResponse = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      `DEPOSIT-${transaction._id}`,
      'EcoLife Wallet Deposit'
    );

    // Update transaction with M-Pesa details
    transaction.reference = mpesaResponse.checkoutRequestId;
    transaction.metadata = {
      merchantRequestId: mpesaResponse.merchantRequestId,
      checkoutRequestId: mpesaResponse.checkoutRequestId,
    };
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Please enter your M-Pesa PIN to complete the payment',
      data: {
        transaction,
        checkoutRequestId: mpesaResponse.checkoutRequestId,
      },
    });
  } catch (error) {
    console.error('Deposit error:', error);
    next(error);
  }
};

// @desc    Check deposit status
// @route   GET /api/wallet/deposit/:transactionId/status
// @access  Private
const checkDepositStatus = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.transactionId,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If already completed, return status
    if (transaction.status === 'completed') {
      return res.status(200).json({
        success: true,
        data: { transaction },
      });
    }

    // Query M-Pesa for status
    if (transaction.reference) {
      try {
        const mpesaStatus = await mpesaService.querySTKPushStatus(transaction.reference);
        
        if (mpesaStatus.ResultCode === '0') {
          // Payment successful
          transaction.status = 'completed';
          transaction.mpesaReceiptNumber = mpesaStatus.MpesaReceiptNumber;
          await transaction.save();

          // Update wallet balance
          await Wallet.findOneAndUpdate(
            { user: req.user._id },
            { $inc: { balance: transaction.amount } },
            { upsert: true }
          );
        } else if (mpesaStatus.ResultCode) {
          // Payment failed
          transaction.status = 'failed';
          transaction.metadata = { ...transaction.metadata, mpesaStatus };
          await transaction.save();
        }
      } catch (error) {
        console.error('Error checking M-Pesa status:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    M-Pesa callback handler
// @route   POST /api/wallet/mpesa/callback
// @access  Public (M-Pesa server)
const mpesaCallback = async (req, res, next) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Find transaction
    const transaction = await Transaction.findOne({ reference: checkoutRequestId });

    if (!transaction) {
      return res.status(200).json({ success: true });
    }

    if (resultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

      transaction.status = 'completed';
      transaction.mpesaReceiptNumber = mpesaReceiptNumber;
      transaction.metadata = { ...transaction.metadata, callback: stkCallback };
      await transaction.save();

      // Update wallet balance
      await Wallet.findOneAndUpdate(
        { user: transaction.user },
        { $inc: { balance: transaction.amount } },
        { upsert: true }
      );
    } else {
      // Payment failed
      transaction.status = 'failed';
      transaction.metadata = { ...transaction.metadata, callback: stkCallback, resultDesc };
      await transaction.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ success: true });
  }
};

// @desc    Request withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private (Vendor)
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!req.user.isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can withdraw funds',
      });
    }

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is KSH 500',
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'processing',
      method: 'mpesa',
      phoneNumber: phoneNumber || req.user.phone,
      description: 'Wallet withdrawal',
    });

    // Deduct from wallet immediately
    wallet.balance -= amount;
    await wallet.save();

    // In production, you'd process B2C payment here
    // For now, we'll mark as completed after a delay
    setTimeout(async () => {
      transaction.status = 'completed';
      await transaction.save();
    }, 5000);

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request refund (Customer)
// @route   POST /api/wallet/refund/request
// @access  Private
const requestRefund = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const Order = require('../models/Order');
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request refund for this order',
      });
    }

    // Create refund request transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'refund',
      amount: order.totalAmount,
      status: 'pending',
      method: 'wallet',
      description: reason || 'Refund request',
      relatedOrder: orderId,
    });

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process refund (Vendor)
// @route   POST /api/wallet/refund/process
// @access  Private (Vendor)
const processRefund = async (req, res, next) => {
  try {
    const { transactionId, approve } = req.body;

    if (!req.user.isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can process refunds',
      });
    }

    const transaction = await Transaction.findById(transactionId).populate('relatedOrder');

    if (!transaction || transaction.type !== 'refund') {
      return res.status(404).json({
        success: false,
        message: 'Refund request not found',
      });
    }

    const Order = require('../models/Order');
    const order = await Order.findById(transaction.relatedOrder);

    // Check if vendor owns products in this order
    const vendorItems = order.items.filter(
      item => item.vendor.toString() === req.user._id.toString()
    );

    if (vendorItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You cannot process this refund',
      });
    }

    if (approve) {
      // Approve refund - credit customer wallet
      transaction.status = 'completed';
      transaction.refundedTo = transaction.user;
      await transaction.save();

      await Wallet.findOneAndUpdate(
        { user: transaction.user },
        { $inc: { balance: transaction.amount } },
        { upsert: true }
      );

      // Update order status
      order.status = 'cancelled';
      await order.save();

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: { transaction },
      });
    } else {
      // Reject refund
      transaction.status = 'failed';
      await transaction.save();

      res.status(200).json({
        success: true,
        message: 'Refund request rejected',
        data: { transaction },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction history
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('refundedTo', 'name email')
      .populate('relatedOrder', 'id status');

    const count = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor deposit to customer (for manual refunds)
// @route   POST /api/wallet/vendor/deposit
// @access  Private (Vendor)
const vendorDepositToCustomer = async (req, res, next) => {
  try {
    const { customerId, amount, description } = req.body;

    if (!req.user.isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can perform this action',
      });
    }

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is KSH 100',
      });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check vendor wallet
    const vendorWallet = await Wallet.findOne({ user: req.user._id });
    if (!vendorWallet || vendorWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // Deduct from vendor
    vendorWallet.balance -= amount;
    await vendorWallet.save();

    // Credit customer
    await Wallet.findOneAndUpdate(
      { user: customerId },
      { $inc: { balance: amount } },
      { upsert: true }
    );

    // Create transactions
    await Transaction.create([
      {
        user: req.user._id,
        type: 'payment',
        amount,
        status: 'completed',
        method: 'wallet',
        description: description || `Payment to ${customer.name}`,
        refundedTo: customerId,
      },
      {
        user: customerId,
        type: 'deposit',
        amount,
        status: 'completed',
        method: 'wallet',
        description: description || `Payment from vendor`,
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Deposit successful',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallet,
  initiateDeposit,
  checkDepositStatus,
  mpesaCallback,
  requestWithdrawal,
  requestRefund,
  processRefund,
  getTransactions,
  vendorDepositToCustomer,
};
