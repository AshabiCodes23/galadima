import mongoose, { Schema, Document, Model } from "mongoose";
import type { AuditCategory } from "@/lib/types";

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId; // omitted for system/automated actions
  performedBy: string; // "system", or a display fallback
  category: AuditCategory;
  action: string; // e.g. "kpi_created", "notification_acknowledged"
  resourceType: string; // e.g. "KPI", "Notification", "User"
  resourceId?: mongoose.Types.ObjectId;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>; // priority, source, recipientGroup, responseTimeMinutes, etc.
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    performedBy: { type: String, default: "system" },
    category: {
      type: String,
      enum: ["kpi", "submission", "template", "user", "department", "notification", "auth"],
      required: true,
    },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    notes: { type: String, trim: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;