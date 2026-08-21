import mongoose, { Document, Schema } from 'mongoose';

export interface ICollectionField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'objectId';
  description?: string;
  required?: boolean;
  filterable?: boolean;
  sortable?: boolean;
}

export interface ICollection {
  name: string;
  description: string;
  fields: ICollectionField[];
  allowedOperations: ('read' | 'create' | 'update' | 'delete')[];
}

export interface IRegisteredFunction {
  name: string;
  description: string;
  permission: string;
  enabled: boolean;
}

export interface IProject extends Document {
  name: string;
  description: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  collections: ICollection[];
  registeredFunctions: IRegisteredFunction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collectionFieldSchema = new Schema<ICollectionField>({
  name: { type: String, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'objectId'], required: true },
  description: String,
  required: { type: Boolean, default: false },
  filterable: { type: Boolean, default: true },
  sortable: { type: Boolean, default: true },
}, { _id: false });

const collectionSchema = new Schema<ICollection>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  fields: [collectionFieldSchema],
  allowedOperations: [{ type: String, enum: ['read', 'create', 'update', 'delete'] }],
}, { _id: false });

const registeredFunctionSchema = new Schema<IRegisteredFunction>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  permission: { type: String, required: true },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    collections: [collectionSchema],
    registeredFunctions: [registeredFunctionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);
