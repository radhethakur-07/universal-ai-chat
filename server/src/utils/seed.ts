import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Customer } from '../models/business/Customer';
import { Product } from '../models/business/Product';
import { Order } from '../models/business/Order';
import { Invoice } from '../models/business/Invoice';
import { syncLegacyIndexes } from '../config/database';
import logger from './logger';

export const sampleCustomers = [
  { customerId: 'CUST-001', name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '+91-9876543210', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' as const },
  { customerId: 'CUST-002', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91-9876543211', city: 'Ahmedabad', state: 'Gujarat', country: 'India', segment: 'wholesale' as const },
  { customerId: 'CUST-003', name: 'Rohit Singh', email: 'rohit.singh@email.com', phone: '+91-9876543212', city: 'Delhi', state: 'Delhi', country: 'India', segment: 'retail' as const },
  { customerId: 'CUST-004', name: 'Ananya Krishnan', email: 'ananya.k@email.com', phone: '+91-9876543213', city: 'Chennai', state: 'Tamil Nadu', country: 'India', segment: 'wholesale' as const },
  { customerId: 'CUST-005', name: 'Vikram Mehta', email: 'vikram.mehta@email.com', phone: '+91-9876543214', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' as const },
  { customerId: 'CUST-006', name: 'Kavya Reddy', email: 'kavya.reddy@email.com', phone: '+91-9876543215', city: 'Hyderabad', state: 'Telangana', country: 'India', segment: 'retail' as const },
  { customerId: 'CUST-007', name: 'Aditya Kumar', email: 'aditya.k@email.com', phone: '+91-9876543216', city: 'Bangalore', state: 'Karnataka', country: 'India', segment: 'enterprise' as const },
  { customerId: 'CUST-008', name: 'Sneha Joshi', email: 'sneha.joshi@email.com', phone: '+91-9876543217', city: 'Pune', state: 'Maharashtra', country: 'India', segment: 'wholesale' as const },
  { customerId: 'CUST-009', name: 'Rahul Gupta', email: 'rahul.gupta@email.com', phone: '+91-9876543218', city: 'Kolkata', state: 'West Bengal', country: 'India', segment: 'retail' as const },
  { customerId: 'CUST-010', name: 'Meera Nair', email: 'meera.nair@email.com', phone: '+91-9876543219', city: 'Kochi', state: 'Kerala', country: 'India', segment: 'wholesale' as const },
  { customerId: 'CUST-011', name: 'Suresh Verma', email: 'suresh.v@email.com', phone: '+91-9876543220', city: 'Jaipur', state: 'Rajasthan', country: 'India', segment: 'retail' as const },
  { customerId: 'CUST-012', name: 'Divya Agarwal', email: 'divya.a@email.com', phone: '+91-9876543221', city: 'Mumbai', state: 'Maharashtra', country: 'India', segment: 'enterprise' as const },
  { customerId: 'CUST-013', name: 'Manoj Pillai', email: 'manoj.p@email.com', phone: '+91-9876543222', city: 'Bangalore', state: 'Karnataka', country: 'India', segment: 'wholesale' as const },
  { customerId: 'CUST-014', name: 'Pooja Choudhary', email: 'pooja.c@email.com', phone: '+91-9876543223', city: 'Delhi', state: 'Delhi', country: 'India', segment: 'retail' as const },
  { customerId: 'CUST-015', name: 'Kiran Rao', email: 'kiran.rao@email.com', phone: '+91-9876543224', city: 'Hyderabad', state: 'Telangana', country: 'India', segment: 'enterprise' as const },
];

export const sampleProducts = [
  { productId: 'PROD-001', name: 'Laptop Pro 15', category: 'Electronics', subcategory: 'Computers', price: 65000, costPrice: 45000, stock: 50, unit: 'piece', sku: 'SKU-LAP-001', isActive: true },
  { productId: 'PROD-002', name: 'Wireless Mouse', category: 'Electronics', subcategory: 'Accessories', price: 1500, costPrice: 800, stock: 200, unit: 'piece', sku: 'SKU-MOU-002', isActive: true },
  { productId: 'PROD-003', name: 'Mechanical Keyboard', category: 'Electronics', subcategory: 'Accessories', price: 4500, costPrice: 2500, stock: 150, unit: 'piece', sku: 'SKU-KEY-003', isActive: true },
  { productId: 'PROD-004', name: 'Monitor 27"', category: 'Electronics', subcategory: 'Displays', price: 28000, costPrice: 18000, stock: 75, unit: 'piece', sku: 'SKU-MON-004', isActive: true },
  { productId: 'PROD-005', name: 'Office Chair', category: 'Furniture', subcategory: 'Seating', price: 15000, costPrice: 8000, stock: 30, unit: 'piece', sku: 'SKU-CHR-005', isActive: true },
  { productId: 'PROD-006', name: 'Standing Desk', category: 'Furniture', subcategory: 'Desks', price: 22000, costPrice: 12000, stock: 20, unit: 'piece', sku: 'SKU-DSK-006', isActive: true },
  { productId: 'PROD-007', name: 'USB-C Hub', category: 'Electronics', subcategory: 'Accessories', price: 2500, costPrice: 1200, stock: 300, unit: 'piece', sku: 'SKU-HUB-007', isActive: true },
  { productId: 'PROD-008', name: 'Webcam HD', category: 'Electronics', subcategory: 'Cameras', price: 3500, costPrice: 2000, stock: 100, unit: 'piece', sku: 'SKU-CAM-008', isActive: true },
  { productId: 'PROD-009', name: 'Noise Cancelling Headphones', category: 'Electronics', subcategory: 'Audio', price: 14000, costPrice: 8000, stock: 80, unit: 'piece', sku: 'SKU-AUD-009', isActive: true },
  { productId: 'PROD-010', name: 'Smartphone X12', category: 'Electronics', subcategory: 'Mobiles', price: 45000, costPrice: 30000, stock: 60, unit: 'piece', sku: 'SKU-PHN-010', isActive: true },
  { productId: 'PROD-011', name: 'Tablet Pro', category: 'Electronics', subcategory: 'Tablets', price: 32000, costPrice: 20000, stock: 40, unit: 'piece', sku: 'SKU-TAB-011', isActive: true },
  { productId: 'PROD-012', name: 'Printer Laser', category: 'Electronics', subcategory: 'Printers', price: 16000, costPrice: 10000, stock: 25, unit: 'piece', sku: 'SKU-PRN-012', isActive: true },
  { productId: 'PROD-013', name: 'Bookshelf', category: 'Furniture', subcategory: 'Storage', price: 7500, costPrice: 4000, stock: 35, unit: 'piece', sku: 'SKU-SHF-013', isActive: true },
  { productId: 'PROD-014', name: 'Desk Lamp LED', category: 'Furniture', subcategory: 'Lighting', price: 3000, costPrice: 1500, stock: 120, unit: 'piece', sku: 'SKU-LMP-014', isActive: true },
  { productId: 'PROD-015', name: 'Power Bank 20000mAh', category: 'Electronics', subcategory: 'Accessories', price: 3200, costPrice: 1800, stock: 200, unit: 'piece', sku: 'SKU-PWR-015', isActive: true },
];

const regions = ['North', 'South', 'East', 'West', 'Central'] as const;
const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const paymentStatuses = ['unpaid', 'paid', 'partial', 'refunded'] as const;
const paymentMethods = ['cash', 'card', 'upi', 'netbanking', 'emi'] as const;

function randomItem<T>(arr: readonly T[] | T[]): T {
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

export const defaultProjectCollections = [
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
      { name: 'paymentMethod', type: 'string', description: 'Payment method: cash, card, upi, netbanking, emi', filterable: true, sortable: false },
      { name: 'createdAt', type: 'date', description: 'Order creation date', filterable: true, sortable: true },
    ],
    allowedOperations: ['read', 'create', 'update'],
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
    allowedOperations: ['read', 'create', 'update'],
  },
  {
    name: 'products',
    description: 'Product catalog',
    fields: [
      { name: 'productId', type: 'string', filterable: true, sortable: true },
      { name: 'name', type: 'string', filterable: true, sortable: true },
      { name: 'category', type: 'string', filterable: true, sortable: false },
      { name: 'subcategory', type: 'string', filterable: true, sortable: false },
      { name: 'price', type: 'number', filterable: true, sortable: true },
      { name: 'stock', type: 'number', filterable: true, sortable: true },
    ],
    allowedOperations: ['read', 'create', 'update'],
  },
  {
    name: 'invoices',
    description: 'Invoice records linked to orders',
    fields: [
      { name: 'invoiceId', type: 'string', filterable: true, sortable: true },
      { name: 'status', type: 'string', description: 'draft, sent, paid, overdue, cancelled', filterable: true, sortable: false },
      { name: 'totalAmount', type: 'number', filterable: true, sortable: true },
      { name: 'dueDate', type: 'date', filterable: true, sortable: true },
    ],
    allowedOperations: ['read', 'create', 'update'],
  },
];

export const defaultRegisteredFunctions = [
  { name: 'getOrderSummary', description: 'Returns total order counts by status', permission: 'orders.read', enabled: true },
  { name: 'calculateInvoiceTotal', description: 'Calculates total invoice amount, optionally filtered by status (paid, draft, sent, overdue)', permission: 'invoices.read', enabled: true },
  { name: 'getTopProducts', description: 'Returns top products by revenue. Optional args: {limit: number}', permission: 'orders.read', enabled: true },
  { name: 'calculateRevenueByRegion', description: 'Calculates total revenue grouped by region', permission: 'orders.read', enabled: true },
];

/**
 * Seeds sample customers, products, orders, and invoices for a specific project and user.
 */
export async function seedProjectData(
  projectId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<{ customers: number; products: number; orders: number; invoices: number }> {
  // Ensure legacy single-field unique indexes are cleaned up
  await syncLegacyIndexes();

  // 1. Seed customers
  const customers = sampleCustomers.map((c) => ({
    ...c,
    project: projectId,
    user: userId,
  }));
  await Customer.insertMany(customers);

  // 2. Seed products
  const products = sampleProducts.map((p) => ({
    ...p,
    project: projectId,
    user: userId,
  }));
  await Product.insertMany(products);

  // 3. Seed orders (30)
  const orders = [];
  for (let i = 1; i <= 30; i++) {
    const customer = randomItem(sampleCustomers);
    const product = randomItem(sampleProducts);
    const qty = randomBetween(1, 4);
    const amount = product.price * qty;
    const tax = Math.round(amount * 0.18);
    const totalAmount = amount + tax;
    const status = randomItem(orderStatuses);
    const paymentStatus =
      status === 'delivered' ? 'paid' : status === 'cancelled' ? 'refunded' : randomItem(paymentStatuses);

    orders.push({
      project: projectId,
      user: userId,
      orderId: `ORD-${String(i).padStart(3, '0')}`,
      customerId: customer.customerId,
      customerName: customer.name,
      city: customer.city,
      state: customer.state,
      region: randomItem(regions),
      status,
      paymentStatus,
      paymentMethod: randomItem(paymentMethods),
      items: [
        {
          productId: product.productId,
          productName: product.name,
          quantity: qty,
          unitPrice: product.price,
          totalPrice: amount,
        },
      ],
      amount,
      tax,
      totalAmount,
      createdAt: daysAgo(randomBetween(0, 60)),
    });
  }
  await Order.insertMany(orders);

  // 4. Seed invoices (25)
  const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
  const invoices = [];
  for (let i = 1; i <= 25; i++) {
    const order = orders[i - 1] || orders[0]!;
    const status = order.paymentStatus === 'paid' ? 'paid' : randomItem(invoiceStatuses);
    invoices.push({
      project: projectId,
      user: userId,
      invoiceId: `INV-${String(i).padStart(3, '0')}`,
      orderId: order.orderId,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: order.amount,
      tax: order.tax,
      totalAmount: order.totalAmount,
      status,
      dueDate: daysAgo(randomBetween(-30, 30)),
      paidDate: status === 'paid' ? new Date() : undefined,
      createdAt: order.createdAt,
    });
  }
  await Invoice.insertMany(invoices);

  return {
    customers: customers.length,
    products: products.length,
    orders: orders.length,
    invoices: invoices.length,
  };
}

/**
 * Global seed runner for demo setup.
 */
export async function runSeed(): Promise<{ message: string; counts: Record<string, number> }> {
  // Check if demo user already exists with orders
  const existingDemoUser = await User.findOne({ email: 'demo@devdynasty.in' });
  const existingOrders = await Order.countDocuments();
  if (existingDemoUser && existingOrders > 0) {
    logger.info('Database already seeded, skipping.');
    return { message: 'Already seeded', counts: { orders: existingOrders } };
  }

  logger.info('Starting database seed...');

  // Clear demo collections
  await Promise.all([
    User.deleteMany({ email: 'demo@devdynasty.in' }),
    Project.deleteMany({ slug: 'ecommerce-demo' }),
  ]);

  // Create demo user
  const demoUser = new User({
    name: 'Demo User',
    email: 'demo@devdynasty.in',
    password: 'DevDynasty@SIH2026',
    role: 'admin',
    isActive: true,
  });
  await demoUser.save();
  logger.info('Demo user created');

  // Create project
  const demoProject = await Project.create({
    name: 'E-Commerce Demo',
    description: 'Demo e-commerce workspace with orders, customers, products and invoices for SIH 2026',
    slug: 'ecommerce-demo',
    owner: demoUser._id,
    members: [demoUser._id],
    collections: defaultProjectCollections,
    registeredFunctions: defaultRegisteredFunctions,
  });
  logger.info('E-Commerce project created');

  // Seed sample data for demo user
  const counts = await seedProjectData(demoProject._id, demoUser._id);
  logger.info('Seed complete for demo project!');

  return {
    message: 'Seed successful',
    counts,
  };
}

// CLI runner (for npm run seed or direct execution)
const isDirectRun =
  (typeof require !== 'undefined' && require.main === module) ||
  (process.argv[1] && process.argv[1].includes('seed'));

if (isDirectRun) {
  import('dotenv/config').then(async () => {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      console.error('MONGODB_URI is not defined');
      process.exit(1);
    }
    await mongoose.connect(uri);
    await runSeed();
    await mongoose.disconnect();
    process.exit(0);
  }).catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
  });
}
