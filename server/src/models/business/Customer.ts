import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  segment: 'retail' | 'wholesale' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    segment: { type: String, enum: ['retail', 'wholesale', 'enterprise'], default: 'retail' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
