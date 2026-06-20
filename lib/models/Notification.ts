import mongoose, { Schema, Document, Model } from "mongoose";
import type { NotificationPriority, NotificationSource, NotificationStatus } from "@/lib/types";

export interface INotification extends Document {
  title: string;
  message: string;
  priority: NotificationPriority;
  source: NotificationSource;
  eventType: string;
  recipientGroup: string; // human label, e.g. "project_managers", "all_staff"
  recipientUserIds: mongoose.Types.ObjectId[]; // resolved at creation time — exactly who got pushed
  deliveryMode: "group" | "targeted";
  status: NotificationStatus;
  acknowledged: boolean;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  escalated: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["Critical", "Urgent", "High", "Medium", "Low", "Informational"],
      default: "Medium",
    },
    source: { type: String, enum: ["Freshservice", "Freshsales", "Freshdesk", "KPMS", "Manual"], required: true },
    eventType: { type: String, required: true },
    recipientGroup: { type: String, required: true },
    recipientUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deliveryMode: { type: String, enum: ["group", "targeted"], default: "group" },
    status: { type: String, enum: ["sent", "delivered", "read", "acknowledged"], default: "sent" },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    escalated: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ recipientUserIds: 1 });
NotificationSchema.index({ acknowledged: 1, escalated: 1, priority: 1 });
NotificationSchema.index({ source: 1, eventType: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;