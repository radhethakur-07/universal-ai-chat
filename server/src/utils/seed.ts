import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Customer } from '../models/business/Customer';
import { Product } from '../models/business/Product';
import { Order } from '../models/business/Order';
import { Invoice } from '../models/business/Invoice';
import logger from './logger';

const MONGODB_URI = process.env.MONGODB_URI || '';

const customers = [
  { customerId: 'CUST-001', name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '+91-9876543210', city: 'Mumbai', state: 'Maharashtra', segment: 'enterprise' },
  { customerId: 'CUST-002', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91-9876543211', city: 'Ahmedabad', state: 'Gujarat', segment: 'wholesale' },
  { customerId: 'CUST-003', name: 'Rohit Singh', email: 'rohit.singh@email.com', phone: '+91-9876543212', city: 'Delhi', state: 'Delhi', segment: 'retail' },
  { customerId: 'CUST-004', name: 'Ananya Krishnan', email: 'ananya.k@email.com', phone: '+91-9876543213', city: 'Chennai', state: 'Tamil Nadu', segment: 'wholesale' },
  { customerId: 'CUST-005', name: 'Vikram Mehta', email: 'vikram.mehta@email.com', phone: '+91-9876543214', city: 'Mumbai', state: 'Maharashtra', segment: 'enterprise' },
  { customerId: 'CUST-006', name: 'Kavya Reddy', email: 'kavya.reddy@email.com', phone: '+91-9876543215', city: 'Hyderabad', state: 'Telangana', segment: 'retail' },
  { customerId: 'CUST-007', name: 'Aditya Kumar', email: 'aditya.k@email.com', phone: '+91-9876543216', city: 'Bangalore', state: 'Karnataka', segment: 'enterprise' },
  { customerId: 'CUST-008', name: 'Sneha Joshi', email: 'sneha.joshi@email.com', phone: '+91-9876543217', city: 'Pune', state: 'Maharashtra', segment: 'wholesale' },
  { customerId: 'CUST-009', name: 'Rahul Gupta', email: 'rahul.gupta@email.com', phone: '+91-9876543218', city: 'Kolkata', state: 'West Bengal', segment: 'retail' },
  { customerId: 'CUST-010', name: 'Meera Nair', email: 'meera.nair@email.com', phone: '+91-9876543219', city: 'Kochi', state: 'Kerala', segment: 'wholesale' },
  { customerId: 'CUST-011', name: 'Suresh Verma', email: 'suresh.v@email.com', phone: '+91-9876543220', city: 'Jaipur', state: 'Rajasthan', segment: 'retail' },
  { customerId: 'CUST-012', name: 'Divya Agarwal', email: 'divya.a@email.com', phone: '+91-9876543221', city: 'Mumbai', state: 'Maharashtra', segment: 'enterprise' },
  { customerId: 'CUST-013', name: 'Manoj Pillai', email: 'manoj.p@email.com', phone: '+91-9876543222', city: 'Bangalore', state: 'Karnataka', segment: 'wholesale' },
  { customerId: 'CUST-014', name: 'Pooja Choudhary', email: 'pooja.c@email.com', phone: '+91-9876543223', city: 'Delhi', state: 'Delhi', segment: 'retail' },
  { customerId: 'CUST-015', name: 'Kiran Rao', email: 'kiran.rao@email.com', phone: '+91-9876543224', city: 'Hyderabad', state: 'Telangana', segment: 'enterprise' },
];

const products = [
  { productId: 'PROD-001', name: 'MacBook Pro 16"', category: 'Electronics', subcategory: 'Laptops', price: 189999, costPrice: 150000, stock: 45, unit: 'piece', sku: 'MBP16-2024' },
  { productId: 'PROD-002', name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', subcategory: 'Smartphones', price: 124999, costPrice: 95000, stock: 120, unit: 'piece', sku: 'SGS24U' },
  { productId: 'PROD-003', name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', subcategory: 'Audio', price: 29999, costPrice: 22000, stock: 200, unit: 'piece', sku: 'SWHHXM5' },
  { productId: 'PROD-004', name: 'Dell UltraSharp 27" Monitor', category: 'Electronics', subcategory: 'Monitors', price: 54999, costPrice: 42000, stock: 80, unit: 'piece', sku: 'DU27MNT' },
  { productId: 'PROD-005', name: 'Logitech MX Master 3 Mouse', category: 'Electronics', subcategory: 'Accessories', price: 9999, costPrice: 7000, stock: 350, unit: 'piece', sku: 'LMX3' },
  { productId: 'PROD-006', name: 'HP LaserJet Pro Printer', category: 'Electronics', subcategory: 'Printers', price: 18999, costPrice: 14000, stock: 60, unit: 'piece', sku: 'HPLJP' },
  { productId: 'PROD-007', name: 'Ergonomic Office Chair', category: 'Furniture', subcategory: 'Seating', price: 24999, costPrice: 18000, stock: 90, unit: 'piece', sku: 'EOC001' },
  { productId: 'PROD-008', name: 'Standing Desk 150cm', category: 'Furniture', subcategory: 'Desks', price: 34999, costPrice: 26000, stock: 55, unit: 'piece', sku: 'SD150' },
  { productId: 'PROD-009', name: 'iPad Pro 12.9"', category: 'Electronics', subcategory: 'Tablets', price: 109999, costPrice: 85000, stock: 75, unit: 'piece', sku: 'IPADP129' },
  { productId: 'PROD-010', name: 'Canon EOS R5 Camera', category: 'Electronics', subcategory: 'Cameras', price: 289999, costPrice: 230000, stock: 25, unit: 'piece', sku: 'CANER5' },
  { productId: 'PROD-011', name: 'Mechanical Keyboard TKL', category: 'Electronics', subcategory: 'Accessories', price: 7499, costPrice: 5000, stock: 280, unit: 'piece', sku: 'MKTKL' },
  { productId: 'PROD-012', name: 'UPS Power Backup 1500VA', category: 'Electronics', subcategory: 'Power', price: 8999, costPrice: 6500, stock: 150, unit: 'piece', sku: 'UPS1500' },
  { productId: 'PROD-013', name: 'Noise Cancelling Earbuds', category: 'Electronics', subcategory: 'Audio', price: 12999, costPrice: 9000, stock: 400, unit: 'piece', sku: 'NCE001' },
  { productId: 'PROD-014', name: 'Webcam 4K Pro', category: 'Electronics', subcategory: 'Accessories', price: 11999, costPrice: 8500, stock: 180, unit: 'piece', sku: 'WC4KP' },
  { productId: 'PROD-015', name: 'NAS Storage 4TB', category: 'Electronics', subcategory: 'Storage', price: 22999, costPrice: 17000, stock: 40, unit: 'piece', sku: 'NAS4TB' },
];

type Region = 'North' | 'South' | 'East' | 'West' | 'Central';
const cityRegionMap: Record<string, Region> = {
  Mumbai: 'West',
  Pune: 'West',
  Ahmedabad: 'West',
  Delhi: 'North',
  Jaipur: 'North',
  Chennai: 'South',
  Hyderabad: 'South',
  Bangalore: 'South',
  Kochi: 'South',
  Kolkata: 'East',
};

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const paymentStatuses = ['unpaid', 'paid', 'partial', 'refunded'] as const;
const paymentMethods = ['cash', 'card', 'upi', 'netbanking', 'emi'] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  logger.info('Connected to MongoDB');

  // Clean existing demo data
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Invoice.deleteMany({});

  // Seed customers
  await Customer.insertMany(customers);
  logger.info('Customers seeded');

  // Seed products
  await Product.insertMany(products);
  logger.info('Products seeded');

  // Seed orders (30 records)
  const orders = [];
  for (let i = 1; i <= 30; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]!;
    const product1 = products[Math.floor(Math.random() * products.length)]!;
    const product2 = products[Math.floor(Math.random() * products.length)]!;
    const qty1 = Math.ceil(Math.random() * 3);
    const qty2 = Math.ceil(Math.random() * 2);
    const items = [
      { productId: product1.productId, productName: product1.name, quantity: qty1, unitPrice: product1.price, totalPrice: qty1 * product1.price },
    ];
    if (product2.productId !== product1.productId) {
      items.push({ productId: product2.productId, productName: product2.name, quantity: qty2, unitPrice: product2.price, totalPrice: qty2 * product2.price });
    }
    const amount = items.reduce((s, it) => s + it.totalPrice, 0);
    const tax = Math.round(amount * 0.18);
    const totalAmount = amount + tax;
    const city = customer.city;
    const region = cityRegionMap[city] || 'North';
    const status = i <= 3 ? 'pending' : randomFrom(statuses);
    const paymentStatus = status === 'cancelled' ? 'refunded' : (status === 'delivered' ? 'paid' : randomFrom(paymentStatuses));
    orders.push({
      orderId: `ORD-${String(100 + i).padStart(3, '0')}`,
      customerId: customer.customerId,
      customerName: customer.name,
      city,
      state: customer.state,
      region,
      items,
      amount,
      tax,
      totalAmount,
      status,
      paymentStatus,
      paymentMethod: randomFrom(paymentMethods),
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
    });
  }
  await Order.insertMany(orders);
  logger.info('Orders seeded');

  // Seed invoices (25 records)
  const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
  const invoices = orders.slice(0, 25).map((order, idx) => {
    const status = order.paymentStatus === 'paid' ? 'paid' : randomFrom(invoiceStatuses);
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    return {
      invoiceId: `INV-${String(200 + idx + 1).padStart(3, '0')}`,
      orderId: order.orderId,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: order.amount,
      tax: order.tax,
      totalAmount: order.totalAmount,
      status,
      dueDate,
      paidDate: status === 'paid' ? new Date() : undefined,
    };
  });
  await Invoice.insertMany(invoices);
  logger.info('Invoices seeded');

  // Seed demo user
  const existingUser = await User.findOne({ email: 'demo@devdynasty.in' });
  let demoUser;
  if (!existingUser) {
    demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@devdynasty.in',
      password: 'Demo@1234',
      role: 'admin',
    });
    logger.info('Demo user created');
  } else {
    demoUser = existingUser;
    logger.info('Demo user already exists');
  }

  // Seed E-Commerce project
  await Project.deleteMany({ slug: 'ecommerce-demo' });
  await Project.create({
    name: 'E-Commerce Demo',
    description: 'Demo e-commerce project for Smart India Hackathon 2026 — Dev Dynasty',
    slug: 'ecommerce-demo',
    owner: demoUser._id,
    members: [demoUser._id],
    collections: [
      {
        name: 'orders',
        description: 'Customer purchase orders with items, amounts, status and region data',
        fields: [
          { name: 'orderId', type: 'string', description: 'Unique order ID like ORD-101', filterable: true, sortable: true },
          { name: 'customerId', type: 'string', description: 'Customer ID', filterable: true },
          { name: 'customerName', type: 'string', description: 'Customer full name', filterable: true },
          { name: 'city', type: 'string', description: 'Delivery city', filterable: true },
          { name: 'state', type: 'string', description: 'State', filterable: true },
          { name: 'region', type: 'string', description: 'Region: North, South, East, West, Central', filterable: true },
          { name: 'amount', type: 'number', description: 'Order amount before tax in INR', filterable: true, sortable: true },
          { name: 'tax', type: 'number', description: 'GST tax amount', filterable: false },
          { name: 'totalAmount', type: 'number', description: 'Total amount including tax', filterable: true, sortable: true },
          { name: 'status', type: 'string', description: 'Order status: pending, confirmed, processing, shipped, delivered, cancelled', filterable: true },
          { name: 'paymentStatus', type: 'string', description: 'Payment status: unpaid, paid, partial, refunded', filterable: true },
          { name: 'paymentMethod', type: 'string', description: 'Payment method: cash, card, upi, netbanking, emi', filterable: true },
          { name: 'createdAt', type: 'date', description: 'Order creation date', filterable: true, sortable: true },
        ],
        allowedOperations: ['read', 'update'],
      },
      {
        name: 'customers',
        description: 'Customer profile data',
        fields: [
          { name: 'customerId', type: 'string', description: 'Unique customer ID', filterable: true },
          { name: 'name', type: 'string', description: 'Customer name', filterable: true },
          { name: 'email', type: 'string', description: 'Email address', filterable: true },
          { name: 'city', type: 'string', description: 'City', filterable: true },
          { name: 'state', type: 'string', description: 'State', filterable: true },
          { name: 'segment', type: 'string', description: 'Customer segment: retail, wholesale, enterprise', filterable: true },
        ],
        allowedOperations: ['read'],
      },
      {
        name: 'products',
        description: 'Product catalog with pricing and stock',
        fields: [
          { name: 'productId', type: 'string', description: 'Product ID', filterable: true },
          { name: 'name', type: 'string', description: 'Product name', filterable: true },
          { name: 'category', type: 'string', description: 'Category', filterable: true },
          { name: 'subcategory', type: 'string', description: 'Subcategory', filterable: true },
          { name: 'price', type: 'number', description: 'Selling price in INR', filterable: true, sortable: true },
          { name: 'stock', type: 'number', description: 'Available stock', filterable: true, sortable: true },
        ],
        allowedOperations: ['read', 'update'],
      },
      {
        name: 'invoices',
        description: 'Invoice records linked to orders',
        fields: [
          { name: 'invoiceId', type: 'string', description: 'Invoice ID', filterable: true },
          { name: 'orderId', type: 'string', description: 'Linked order ID', filterable: true },
          { name: 'customerName', type: 'string', description: 'Customer name', filterable: true },
          { name: 'totalAmount', type: 'number', description: 'Invoice total in INR', filterable: true, sortable: true },
          { name: 'status', type: 'string', description: 'Invoice status: draft, sent, paid, overdue, cancelled', filterable: true },
          { name: 'dueDate', type: 'date', description: 'Payment due date', filterable: true, sortable: true },
        ],
        allowedOperations: ['read', 'update'],
      },
    ],
    registeredFunctions: [
      { name: 'getOrderSummary', description: 'Returns total order counts by status', permission: 'orders.read', enabled: true },
      { name: 'calculateInvoiceTotal', description: 'Calculates total invoice amount, optionally filtered by status (unpaid, paid, etc.)', permission: 'invoices.read', enabled: true },
      { name: 'getTopProducts', description: 'Returns top products by revenue. Optional args: {limit: number}', permission: 'orders.read', enabled: true },
      { name: 'calculateRevenueByRegion', description: 'Calculates total revenue grouped by region', permission: 'orders.read', enabled: true },
    ],
  });
  logger.info('E-Commerce project seeded');
  logger.info('Seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  logger.error('Seed failed', err);
  process.exit(1);
});
