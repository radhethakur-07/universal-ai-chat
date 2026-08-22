import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  project: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  invoiceId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    invoiceId: { type: String, required: true },
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate: { type: Date, required: true },
    paidDate: Date,
  },
  { timestamps: true }
);

invoiceSchema.index({ project: 1, invoiceId: 1 }, { unique: true });
invoiceSchema.index({ project: 1, status: 1 });
invoiceSchema.index({ project: 1, customerId: 1 });
invoiceSchema.index({ project: 1, dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
