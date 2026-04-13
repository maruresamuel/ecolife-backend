const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔒 Optional safety: block requests if DB not ready
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Server is starting, please try again shortly...',
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/fillus', require('./routes/filluRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EcoLife API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoLife API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      vendor: '/api/vendor',
      fillus: '/api/fillus',
      reviews: '/api/reviews',
      wallet: '/api/wallet',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// 🚀 START SERVER ONLY AFTER DB CONNECTS
const startServer = async () => {
  try {
    await connectDB(); // ⬅️ Wait for MongoDB connection

    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`🔗 Network: http://192.168.0.100:${PORT}`);
      console.log(`🔗 Android Emulator: http://10.0.2.2:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();