const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actor: {
      staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreStaff', default: null },
      name: { type: String, default: 'Store Admin', trim: true },
      role: { type: String, default: 'Store Admin', trim: true },
      authUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    source: {
      ipAddress: { type: String, default: '', trim: true },
      userAgent: { type: String, default: '', trim: true },
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ storeId: 1, occurredAt: -1 });
auditLogSchema.index({ storeId: 1, action: 1, occurredAt: -1 });
auditLogSchema.index({ storeId: 1, 'actor.name': 1, occurredAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
