import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Customer } from '../models/business/Customer';
import { Product } from '../models/business/Product';
import { Order } from '../models/business/Order';
import { Invoice } from '../models/business/Invoice';
import logger from './logger';

const customers = [
  { customerId: 'CUST-001', name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '+91-9876543210', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' },
  { customerId: 'CUST-002', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91-9876543211', city: 'Ahmedabad', state: 'Gujarat', country: 'India', segment: 'wholesale' },
  { customerId: 'CUST-003', name: 'Rohit Singh', email: 'rohit.singh@email.com', phone: '+91-9876543212', city: 'Delhi', state: 'Delhi', country: 'India', segment: 'retail' },
  { customerId: 'CUST-004', name: 'Ananya Krishnan', email: 'ananya.k@email.com', phone: '+91-9876543213', city: 'Chennai', state: 'Tamil Nadu', country: 'India', segment: 'wholesale' },
  { customerId: 'CUST-005', name: 'Vikram Mehta', email: 'vikram.mehta@email.com', phone: '+91-9876543214', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' },
  { customerId: 'CUST-006', name: 'Kavya Reddy', email: 'kavya.reddy@email.com', phone: '+91-9876543215', city: 'Hyderabad', state: 'Telangana', country: 'India', segment: 'retail' },
  { customerId: 'CUST-007', name: 'Aditya Kumar', email: 'aditya.k@email.com', phone: '+91-9876543216', city: 'Bangalore', state: 'Karnataka', country: 'India', segment: 'enterprise' },
  { customerId: 'CUST-008', name: 'Sneha Joshi', email: 'sneha.joshi@email.com', phone: '+91-9876543217', city: 'Pune', state: 'Maharashtra', country: 'India', segment: 'wholesale' },
  { customerId: 'CUST-009', name: 'Rahul Gupta', email: 'rahul.gupta@email.com', phone: '+91-9876543218', city: 'Kolkata', state: 'West Bengal', country: 'India', segment: 'retail' },
  { customerId: 'CUST-010', name: 'Meera Nair', email: 'meera.nair@email.com', phone: '+91-9876543219', city: 'Kochi', state: 'Kerala', country: 'India', segment: 'wholesale' },
  { customerId: 'CUST-011', name: 'Suresh Verma', email: 'suresh.v@email.com', phone: '+91-9876543220', city: 'Jaipur', state: 'Rajasthan', country: 'India', segment: 'retail' },
  { customerId: 'CUST-012', name: 'Divya Agarwal', email: 'divya.a@email.com', phone: '+91-9876543221', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' },
  { customerId: 'CUST-013', name: 'Manoj Pillai', email: 'manoj.p@email.com', phone: '+91-9876543222', city: 'Bangalore', state: 'Karnataka', country: 'India', segment: 'wholesale' },
  { customerId: 'CUST-014', name: 'Pooja Choudhary', email: 'pooja.c@email.com', phone: '+91-9876543223', city: 'Delhi', state: 'Delhi', country: 'India', segment: 'retail' },
  { customerId: 'CUST-015', name: 'Kiran Rao', email: 'kiran.rao@email.com', phone: '+91-9876543224', city: 'Hyderabad', state: 'Telangana', country: 'India', segment: 'enterprise' },
];

const products = [
  { productId: 'PROD-001', name: 'Laptop Pro 15', category: 'Electronics', costPrice: 45000, sellingPrice: 65000, stock: 50 },
  { productId: 'PROD-002', name: 'Wireless Mouse', category: 'Electronics', costPrice: 800, sellingPrice: 1500, stock: 200 },
  { productId: 'PROD-003', name: 'Mechanical Keyboard', category: 'Electronics', costPrice: 2500, sellingPrice: 4500, stock: 150 },
  { productId: 'PROD-004', name: 'Monitor 27"', category: 'Electronics', costPrice: 18000, sellingPrice: 28000, stock: 75 },
  { productId: 'PROD-005', name: 'Office Chair', category: 'Furniture', costPrice: 8000, sellingPrice: 15000, stock: 30 },
  { productId: 'PROD-006', name: 'Standing Desk', category: 'Furniture', costPrice: 12000, sellingPrice: 22000, stock: 20 },
  { productId: 'PROD-007', name: 'USB-C Hub', category: 'Electronics', costPrice: 1200, sellingPrice: 2500, stock: 300 },
  { productId: 'PROD-008', name: 'Webcam HD', category: 'Electronics', costPrice: 2000, sellingPrice: 3500, stock: 100 },
  { productId: 'PROD-009', name: 'Noise Cancelling Headphones', category: 'Electronics', costPrice: 8000, sellingPrice: 14000, stock: 80 },
  { productId: 'PROD-010', name: 'Smartphone X12', category: 'Electronics', costPrice: 30000, sellingPrice: 45000, stock: 60 },
  { productId: 'PROD-011', name: 'Tablet Pro', category: 'Electronics', costPrice: 20000, sellingPrice: 32000, stock: 40 },
  { productId: 'PROD-012', name: 'Printer Laser', category: 'Electronics', costPrice: 10000, sellingPrice: 16000, stock: 25 },
  { productId: 'PROD-013', name: 'Bookshelf', category: 'Furniture', costPrice: 4000, sellingPrice: 7500, stock: 35 },
  { productId: 'PROD-014', name: 'Desk Lamp LED', category: 'Furniture', costPrice: 1500, sellingPrice: 3000, stock: 120 },
  { productId: 'PROD-015', name: 'Power Bank 20000mAh', category: 'Electronics', costPrice: 1800, sellingPrice: 3200, stock: 200 },
];

const regions = ['North', 'South', 'East', 'West', 'Central'];
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'COD'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Core seed logic — can be called from startup or API route.
 * Does NOT connect/disconnect mongoose — caller is responsible for that.
 */
export async function runSeed(): Promise<{ message: string; counts: Record<string, number> }> {
  // Check if already seeded
  const existingOrders = await Order.countDocuments();
  if (existingOrders > 0) {
    logger.info('Database already seeded, skipping.');
    return { message: 'Already seeded', counts: { orders: existingOrders } };
  }

  logger.info('Starting database seed...');

  // Clear collections
  await Promise.all([
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Invoice.deleteMany({}),
    User.deleteMany({ email: 'demo@devdynasty.in' }),
    Project.deleteMany({ slug: 'ecommerce-demo' }),
  ]);

  // Seed customers
  await Customer.insertMany(customers);
  logger.info('Customers seeded');

  // Seed products
  await Product.insertMany(products);
  logger.info('Products seeded');

  // Seed orders (30)
  const orders = [];
  for (let i = 1; i <= 30; i++) {
    const customer = randomItem(customers);
    const product = randomItem(products);
    const qty = randomBetween(1, 5);
    const totalAmount = product.sellingPrice * qty;
    orders.push({
      orderId: `ORD-${String(i).padStart(3, '0')}`,
      customerId: customer.customerId,
      customerName: customer.name,
      city: customer.city,
      region: randomItem(regions),
      status: randomItem(statuses),
      paymentMethod: randomItem(paymentMethods),
      items: [{ productId: product.productId, productName: product.name, quantity: qty, unitPrice: product.sellingPrice, totalPrice: totalAmount }],
      totalAmount,
      tax: Math.round(totalAmount * 0.18),
      createdAt: daysAgo(randomBetween(0, 60)),
    });
  }
  await Order.insertMany(orders);
  logger.info('Orders seeded');

  // Seed invoices (25)
  const invoiceStatuses = ['paid', 'unpaid', 'overdue', 'partial'];
  const invoices = [];
  for (let i = 1; i <= 25; i++) {
    const order = orders[i - 1] || orders[0]!;
    const status = randomItem(invoiceStatuses);
    invoices.push({
      invoiceId: `INV-${String(i).padStart(3, '0')}`,
      orderId: order.orderId,
      customerId: order.customerId,
      customerName: order.customerName,
      status,
      totalAmount: order.totalAmount,
      paidAmount: status === 'paid' ? order.totalAmount : status === 'partial' ? Math.round(order.totalAmount / 2) : 0,
      dueDate: daysAgo(randomBetween(-30, 30)),
      createdAt: order.createdAt,
    });
  }
  await Invoice.insertMany(invoices);
  logger.info('Invoices seeded');

  // Create demo user
  const demoUser = new User({
    name: 'Demo User',
    email: 'demo@devdynasty.in',
    password: 'Demo@1234',
    role: 'admin',
    isActive: true,
  });
  await demoUser.save();
  logger.info('Demo user created');

  // Create project
  await Project.create({
    name: 'E-Commerce Demo',
    description: 'Demo e-commerce project with orders, customers, products and invoices for SIH 2026',
    slug: 'ecommerce-demo',
    owner: demoUser._id,
    members: [demoUser._id],
    collections: [
      {
        name: 'orders',
        description: 'Customer orders with status tracking',
        fields: [
          { name: 'orderId', type: 'string', description: 'Unique order ID like ORD-001', filterable: true, sortable: true },
          { name: 'customerName', type: 'string', description: 'Customer full name', filterable: true, sortable: true },
          { name: 'city', type: 'string', description: 'Customer city', filterable: true, sortable: false },
          { name: 'region', type: 'string', description: 'Region: North, South, East, West, Central', filterable: true, sortable: false },
          { name: 'status', type: 'string', description: 'Order status: pending, confirmed, processing, shipped, delivered, cancelled', filterable: true, sortable: false },
          { name: 'totalAmount', type: 'number', description: 'Total order amount in INR', filterable: true, sortable: true },
          { name: 'paymentMethod', type: 'string', description: 'Payment method used', filterable: true, sortable: false },
          { name: 'createdAt', type: 'date', description: 'Order creation date', filterable: true, sortable: true },
        ],
        allowedOperations: ['read', 'update'],
      },
      {
        name: 'customers',
        description: 'Customer master data',
        fields: [
          { name: 'customerId', type: 'string', filterable: true, sortable: true },
          { name: 'name', type: 'string', filterable: true, sortable: true },
          { name: 'city', type: 'string', filterable: true, sortable: false },
          { name: 'segment', type: 'string', description: 'retail, wholesale, enterprise', filterable: true, sortable: false },
        ],
        allowedOperations: ['read'],
      },
      {
        name: 'products',
        description: 'Product catalog',
        fields: [
          { name: 'productId', type: 'string', filterable: true, sortable: true },
          { name: 'name', type: 'string', filterable: true, sortable: true },
          { name: 'category', type: 'string', filterable: true, sortable: false },
          { name: 'sellingPrice', type: 'number', filterable: true, sortable: true },
          { name: 'stock', type: 'number', filterable: true, sortable: true },
        ],
        allowedOperations: ['read'],
      },
      {
        name: 'invoices',
        description: 'Invoice records linked to orders',
        fields: [
          { name: 'invoiceId', type: 'string', filterable: true, sortable: true },
          { name: 'status', type: 'string', description: 'paid, unpaid, overdue, partial', filterable: true, sortable: false },
          { name: 'totalAmount', type: 'number', filterable: true, sortable: true },
          { name: 'dueDate', type: 'date', filterable: true, sortable: true },
        ],
        allowedOperations: ['read', 'update'],
      },
    ],
    registeredFunctions: [
      { name: 'getOrderSummary', description: 'Returns total order counts by status', permission: 'orders.read', enabled: true },
      { name: 'calculateInvoiceTotal', description: 'Calculates total invoice amount, optionally filtered by status (unpaid, paid, overdue)', permission: 'invoices.read', enabled: true },
      { name: 'getTopProducts', description: 'Returns top products by revenue. Optional args: {limit: number}', permission: 'orders.read', enabled: true },
      { name: 'calculateRevenueByRegion', description: 'Calculates total revenue grouped by region', permission: 'orders.read', enabled: true },
    ],
  });
  logger.info('E-Commerce project seeded');
  logger.info('Seed complete!');

  return {
    message: 'Seed successful',
    counts: { customers: customers.length, products: products.length, orders: orders.length, invoices: invoices.length },
  };
}

// CLI runner (for npm run seed)
if (require.main === module) {
  import('dotenv/config').then(async () => {
    const uri = process.env.MONGODB_URI || '';
    await mongoose.connect(uri);
    await runSeed();
    await mongoose.disconnect();
    process.exit(0);
  }).catch(err => {
    console.error('Seed failed', err);
    process.exit(1);
  });
}
