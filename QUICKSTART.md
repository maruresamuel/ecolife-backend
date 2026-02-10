# EcoLife Backend - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd ecolife-backend
npm install
```

### Step 2: Setup Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, update MONGO_URI and JWT_SECRET
```

**Minimum .env configuration:**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecolife
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=30d
```

### Step 3: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use MongoDB Docker container
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Seed Database (Optional but Recommended)
```bash
npm run seed
```

This creates:
- ✅ 3 vendor accounts
- ✅ 2 customer accounts  
- ✅ 12 sample products
- ✅ 3 sample orders

### Step 5: Start the Server
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

You should see:
```
🍃 MongoDB Connected: localhost
🚀 Server running on port 5000
📱 Environment: development
```

### Step 6: Test the API

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Login as Vendor:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor1@ecolife.com",
    "password": "password123"
  }'
```

**Get Products:**
```bash
curl http://localhost:5000/api/products
```

## 📱 Test Accounts

After running `npm run seed`, use these accounts:

### Vendors
| Email | Password | Description |
|-------|----------|-------------|
| vendor1@ecolife.com | password123 | Green Farm Organics |
| vendor2@ecolife.com | password123 | Nature's Basket |
| vendor3@ecolife.com | password123 | Organic Harvest |

### Customers
| Email | Password |
|-------|----------|
| customer1@ecolife.com | password123 |
| customer2@ecolife.com | password123 |

## 🔗 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Main Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Vendor)
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order (Customer)
- `GET /api/vendor/stats` - Vendor statistics
- `GET /api/vendor/dashboard` - Vendor dashboard

**See [README.md](./README.md) for complete API documentation**

## 🎯 Quick Testing Workflow

### 1. Register as Customer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "customer"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from response.

### 3. Browse Products
```bash
curl http://localhost:5000/api/products
```

### 4. Create an Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID_HERE",
        "quantity": 2
      }
    ],
    "shippingAddress": "123 Test Street, City",
    "phone": "9876543210"
  }'
```

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error: connect ECONNREFUSED
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
ps aux | grep mongo

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

### Port Already in Use
```
❌ Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change port in `.env` or kill the process
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### JWT Error - Secret Not Defined
```
❌ JWT_SECRET is not defined
```
**Solution:** Make sure `.env` file exists and contains `JWT_SECRET`

## 📖 Next Steps

1. ✅ **Explore API**: Use the test accounts to explore all endpoints
2. ✅ **Read API Docs**: Check [README.md](./README.md) for detailed documentation
3. ✅ **Connect Mobile App**: Update API_BASE_URL in mobile app to connect
4. ✅ **Customize**: Modify models, add features as needed

## 🆘 Need Help?

- Check [README.md](./README.md) for detailed documentation
- Review code comments in controllers and models
- Check MongoDB logs: `/usr/local/var/log/mongodb/`
- Check Node.js logs in terminal

## 🎉 Success!

If you see products when you visit `http://localhost:5000/api/products`, you're all set!

Your backend is now running and ready to connect with the mobile app.

---

**Made with 💚 for EcoLife**
