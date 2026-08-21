import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  responseType?: string;
  responseData?: Record<string, unknown>;
  toolsUsed?: string[];
  processingTime?: number;
  timestamp: Date;
}

export interface IConversation extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  responseType: String,
  responseData: { type: Schema.Types.Mixed },
  toolsUsed: [String],
  processingTime: Number,
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const conversationSchema = new Schema<IConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, default: 'New Conversation', trim: true },
    messages: [messageSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, project: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
