const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create vendors
    const vendors = await User.create([
      {
        name: 'Green Farm Organics',
        email: 'vendor1@ecolife.com',
        password: 'password123',
        phone: '9876543210',
        role: 'vendor',
        address: '123 Green Valley, Organic Farm Road, Karnataka',
      },
      {
        name: 'Nature\'s Basket',
        email: 'vendor2@ecolife.com',
        password: 'password123',
        phone: '9876543211',
        role: 'vendor',
        address: '456 Eco Street, Fresh Market Area, Kerala',
      },
      {
        name: 'Organic Harvest',
        email: 'vendor3@ecolife.com',
        password: 'password123',
        phone: '9876543212',
        role: 'vendor',
        address: '789 Natural Lane, Farm District, Tamil Nadu',
      },
    ]);

    console.log('✅ Created vendors');

    // Create customers
    const customers = await User.create([
      {
        name: 'John Doe',
        email: 'customer1@ecolife.com',
        password: 'password123',
        phone: '9123456780',
        role: 'customer',
        address: '101 City Center, Urban Area, Bangalore',
      },
      {
        name: 'Jane Smith',
        email: 'customer2@ecolife.com',
        password: 'password123',
        phone: '9123456781',
        role: 'customer',
        address: '202 Downtown Street, Metro City, Mumbai',
      },
    ]);

    console.log('✅ Created customers');

    // Create products
    const products = await Product.create([
      // Vendor 1 products
      {
        name: 'Organic Tomatoes',
        description: 'Fresh organic tomatoes grown without pesticides',
        price: 60,
        stock: 100,
        category: 'Organic Vegetables',
        unit: 'kg',
        vendor: vendors[0]._id,
      },
      {
        name: 'Organic Carrots',
        description: 'Crunchy and sweet organic carrots',
        price: 50,
        stock: 80,
        category: 'Organic Vegetables',
        unit: 'kg',
        vendor: vendors[0]._id,
      },
      {
        name: 'Fresh Spinach',
        description: 'Green leafy organic spinach, rich in iron',
        price: 40,
        stock: 60,
        category: 'Organic Vegetables',
        unit: 'bunch',
        vendor: vendors[0]._id,
      },
      // Vendor 2 products
      {
        name: 'Organic Apples',
        description: 'Crisp and juicy organic apples',
        price: 120,
        stock: 50,
        category: 'Organic Fruits',
        unit: 'kg',
        vendor: vendors[1]._id,
      },
      {
        name: 'Organic Bananas',
        description: 'Naturally ripened organic bananas',
        price: 45,
        stock: 100,
        category: 'Organic Fruits',
        unit: 'dozen',
        vendor: vendors[1]._id,
      },
      {
        name: 'Organic Milk',
        description: 'Pure organic milk from grass-fed cows',
        price: 80,
        stock: 40,
        category: 'Dairy Products',
        unit: 'liter',
        vendor: vendors[1]._id,
      },
      {
        name: 'Fresh Yogurt',
        description: 'Homemade organic yogurt with probiotics',
        price: 60,
        stock: 30,
        category: 'Dairy Products',
        unit: '500g',
        vendor: vendors[1]._id,
      },
      // Vendor 3 products
      {
        name: 'Brown Rice',
        description: 'Organic brown rice, high in fiber',
        price: 90,
        stock: 150,
        category: 'Grains & Pulses',
        unit: 'kg',
        vendor: vendors[2]._id,
      },
      {
        name: 'Organic Lentils',
        description: 'Protein-rich organic lentils',
        price: 110,
        stock: 100,
        category: 'Grains & Pulses',
        unit: 'kg',
        vendor: vendors[2]._id,
      },
      {
        name: 'Bamboo Toothbrush',
        description: 'Eco-friendly biodegradable bamboo toothbrush',
        price: 150,
        stock: 200,
        category: 'Eco-friendly Products',
        unit: 'piece',
        vendor: vendors[2]._id,
      },
      {
        name: 'Natural Face Cream',
        description: 'Chemical-free natural face cream with herbs',
        price: 350,
        stock: 50,
        category: 'Natural Cosmetics',
        unit: '50ml',
        vendor: vendors[2]._id,
      },
      {
        name: 'Herbal Tea Mix',
        description: 'Organic herbal tea blend for relaxation',
        price: 200,
        stock: 75,
        category: 'Herbal Products',
        unit: '100g',
        vendor: vendors[2]._id,
      },
    ]);

    console.log('✅ Created products');

    // Create sample orders
    const orders = await Order.create([
      {
        user: customers[0]._id,
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            quantity: 2,
            price: products[0].price,
            vendor: vendors[0]._id,
          },
          {
            product: products[3]._id,
            name: products[3].name,
            quantity: 1,
            price: products[3].price,
            vendor: vendors[1]._id,
          },
        ],
        totalAmount: 240,
        status: 'delivered',
        shippingAddress: '101 City Center, Urban Area, Bangalore',
        phone: '9123456780',
        notes: 'Please deliver in the evening',
        paymentStatus: 'paid',
      },
      {
        user: customers[1]._id,
        items: [
          {
            product: products[7]._id,
            name: products[7].name,
            quantity: 5,
            price: products[7].price,
            vendor: vendors[2]._id,
          },
          {
            product: products[8]._id,
            name: products[8].name,
            quantity: 2,
            price: products[8].price,
            vendor: vendors[2]._id,
          },
        ],
        totalAmount: 670,
        status: 'processing',
        shippingAddress: '202 Downtown Street, Metro City, Mumbai',
        phone: '9123456781',
        paymentStatus: 'paid',
      },
      {
        user: customers[0]._id,
        items: [
          {
            product: products[5]._id,
            name: products[5].name,
            quantity: 3,
            price: products[5].price,
            vendor: vendors[1]._id,
          },
        ],
        totalAmount: 240,
        status: 'pending',
        shippingAddress: '101 City Center, Urban Area, Bangalore',
        phone: '9123456780',
        paymentStatus: 'pending',
      },
    ]);

    console.log('✅ Created orders');

    console.log('');
    console.log('🌱 Database seeded successfully!');
    console.log('');
    console.log('📧 Test Accounts:');
    console.log('-------------------');
    console.log('Vendors:');
    console.log('  Email: vendor1@ecolife.com | Password: password123');
    console.log('  Email: vendor2@ecolife.com | Password: password123');
    console.log('  Email: vendor3@ecolife.com | Password: password123');
    console.log('');
    console.log('Customers:');
    console.log('  Email: customer1@ecolife.com | Password: password123');
    console.log('  Email: customer2@ecolife.com | Password: password123');
    console.log('');

    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
