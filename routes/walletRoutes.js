const express = require('express');
const router = express.Router();
const {
  getWallet,
  initiateDeposit,
  checkDepositStatus,
  mpesaCallback,
  requestWithdrawal,
  requestRefund,
  processRefund,
  getTransactions,
  vendorDepositToCustomer,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/mpesa/callback', mpesaCallback);

// Protected routes
router.use(protect);

router.get('/', getWallet);
router.get('/balance', getWallet); // Backward compatibility
router.get('/transactions', getTransactions);

// Deposit routes
router.post('/deposit', initiateDeposit);
router.get('/deposit/:transactionId/status', checkDepositStatus);

// Withdrawal routes (Vendor only)
router.post('/withdraw', requestWithdrawal);

// Refund routes
router.post('/refund/request', requestRefund);
router.post('/refund/process', processRefund);

// Vendor specific
router.post('/vendor/deposit', vendorDepositToCustomer);

module.exports = router;
