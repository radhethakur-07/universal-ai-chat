import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  orderId: string;
  customerId: string;
  customerName: string;
  city: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  items: IOrderItem[];
  amount: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'emi';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: String,
  productName: String,
  quantity: Number,
  unitPrice: Number,
  totalPrice: Number,
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    region: { type: String, enum: ['North', 'South', 'East', 'West', 'Central'], required: true },
    items: [orderItemSchema],
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partial', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'emi'],
      default: 'upi',
    },
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ city: 1 });
orderSchema.index({ region: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
