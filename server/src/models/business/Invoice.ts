import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
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
    invoiceId: { type: String, required: true, unique: true },
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

invoiceSchema.index({ status: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
