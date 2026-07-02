import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: String,
    actorRole: String,

    action: { type: String, required: true, index: true },   // e.g. "order.refund", "user.delete"
    resource: String,                                        // "order", "user", "service"
    resourceId: Schema.Types.ObjectId,

    method: String,     // HTTP method
    endpoint: String,
    statusCode: Number,

    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },

    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,

    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
