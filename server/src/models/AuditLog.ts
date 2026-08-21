import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  action: string;
  entity?: string;
  recordId?: string;
  toolName?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
  duration?: number;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    action: { type: String, required: true },
    entity: String,
    recordId: String,
    toolName: String,
    success: { type: Boolean, required: true },
    errorMessage: String,
    metadata: { type: Schema.Types.Mixed },
    requestId: String,
    ipAddress: String,
    duration: Number,
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ project: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
