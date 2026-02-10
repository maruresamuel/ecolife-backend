# EcoLife Backend API

A comprehensive RESTful API for EcoLife - a sustainable marketplace platform connecting organic vendors with eco-conscious customers.

## 🌱 Features

- **Authentication & Authorization**: JWT-based secure authentication with role-based access control
- **User Management**: Customer and Vendor roles with profile management
- **Product Management**: Full CRUD operations for organic products
- **Order Management**: Complete order lifecycle from creation to delivery
- **Vendor Dashboard**: Statistics, analytics, and management tools
- **Image Upload**: Product image upload with validation
- **Search & Filter**: Advanced product search and filtering
- **Fillus Marketplace**: Secondary marketplace for buying/selling items
- **Review System**: Product and seller reviews

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **File Upload**: Multer
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
cd ecolife-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/ecolife

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=30d

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Seed Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This will create:
- 3 vendor accounts
- 2 customer accounts
- 12 sample products
- 3 sample orders

### 5. Start the server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "customer",
  "address": "123 Main St"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9876543210",
  "address": "456 New Address"
}
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
Query Parameters:
  - search: string (search by name/description)
  - category: string
  - minPrice: number
  - maxPrice: number
  - sortBy: price_asc | price_desc | name
  - page: number (default: 1)
  - limit: number (default: 10)
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Get Categories
```http
GET /api/products/categories/list
```

#### Create Product (Vendor Only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "price": 60,
  "stock": 100,
  "category": "Organic Vegetables",
  "unit": "kg",
  "image": <file>
}
```

#### Update Product (Vendor Only)
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Updated Name",
  "price": 70,
  "stock": 80,
  "image": <file>
}
```

#### Delete Product (Vendor Only)
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

### Order Endpoints

#### Create Order (Customer Only)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": "123 Main St, City",
  "phone": "9876543210",
  "notes": "Deliver in evening"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
Query Parameters:
  - status: pending | processing | shipped | delivered | cancelled
  - page: number
  - limit: number
```

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Vendor Only)
```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "processing" | "shipped" | "delivered"
}
```

#### Cancel Order (Customer Only)
```http
PUT /api/orders/:id/cancel
Authorization: Bearer <token>
```

### Vendor Endpoints

#### Get Vendor Products
```http
GET /api/vendor/products
Authorization: Bearer <token>
Query Parameters:
  - status: active | inactive
  - page: number
  - limit: number
```

#### Get Vendor Orders
```http
GET /api/vendor/orders
Authorization: Bearer <token>
Query Parameters:
  - status: pending | processing | shipped | delivered
  - page: number
  - limit: number
```

#### Get Vendor Statistics
```http
GET /api/vendor/stats
Authorization: Bearer <token>

Response:
{
  "totalProducts": 10,
  "activeProducts": 8,
  "totalOrders": 25,
  "pendingOrders": 5,
  "deliveredOrders": 15,
  "totalRevenue": 15000,
  "lowStockProducts": 2
}
```

#### Get Vendor Dashboard
```http
GET /api/vendor/dashboard
Authorization: Bearer <token>
```

## 📁 Project Structure

```
ecolife-backend/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── jwt.js                # JWT configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── productController.js  # Product management
│   ├── orderController.js    # Order management
│   ├── vendorController.js   # Vendor operations
│   ├── filluController.js    # Fillu marketplace
│   └── reviewController.js   # Review system
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   ├── roleMiddleware.js     # Role-based access
│   ├── errorMiddleware.js    # Error handling
│   └── uploadMiddleware.js   # File upload
├── models/
│   ├── User.js               # User schema
│   ├── Product.js            # Product schema
│   ├── Order.js              # Order schema
│   ├── Fillu.js              # Fillu schema
│   └── Review.js             # Review schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── productRoutes.js      # Product endpoints
│   ├── orderRoutes.js        # Order endpoints
│   ├── vendorRoutes.js       # Vendor endpoints
│   ├── filluRoutes.js        # Fillu endpoints
│   └── reviewRoutes.js       # Review endpoints
├── utils/
│   ├── generateToken.js      # JWT token generation
│   ├── validators.js         # Input validation
│   └── hash.js               # Password hashing
├── database/
│   └── seed.js               # Database seeding
├── uploads/
│   └── products/             # Product images
├── .env.example              # Environment template
├── server.js                 # App entry point
└── package.json
```

## 🔐 Security

- Passwords are hashed using bcryptjs
- JWT tokens for secure authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Protected routes with authentication middleware
- File upload validation (type, size)

## 🧪 Testing

### Test Accounts (after seeding)

**Vendors:**
- Email: `vendor1@ecolife.com` | Password: `password123`
- Email: `vendor2@ecolife.com` | Password: `password123`
- Email: `vendor3@ecolife.com` | Password: `password123`

**Customers:**
- Email: `customer1@ecolife.com` | Password: `password123`
- Email: `customer2@ecolife.com` | Password: `password123`

### Sample Product Categories

- Organic Vegetables
- Organic Fruits
- Dairy Products
- Grains & Pulses
- Eco-friendly Products
- Natural Cosmetics
- Herbal Products
- Others

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | Yes |
| PORT | Server port | Yes |
| MONGO_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret key for JWT | Yes |
| JWT_EXPIRE | Token expiration time | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, email support@ecolife.com or join our Slack channel.

## 🎯 Roadmap

- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Promotional codes/coupons
- [ ] Product recommendations
- [ ] Chat system between buyers and sellers
- [ ] Multi-language support

---

Made with 💚 for a sustainable future
