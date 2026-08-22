import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  project: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
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
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerId: { type: String, required: true },
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

customerSchema.index({ project: 1, customerId: 1 }, { unique: true });
customerSchema.index({ project: 1, email: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
