import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  project: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  productId: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'piece' },
    sku: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ project: 1, productId: 1 }, { unique: true });
productSchema.index({ project: 1, sku: 1 });
productSchema.index({ project: 1, category: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
