import mongoose, { Schema, Document, Model } from "mongoose";
import type { KPICategory, KPIFormula, KPIType, KPIStatus } from "@/lib/types";

export interface IKPI extends Document {
  name: string;
  description?: string;
  department: string;
  employee: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  template?: mongoose.Types.ObjectId;
  category: KPICategory;
  formula: KPIFormula;
  kpiType: KPIType;
  weight: number;
  targetValue: number;
  actualValue?: number;
  achievementPercent?: number;
  weightedScore?: number;
  status: KPIStatus;
  evidenceRequired: boolean;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KPISchema = new Schema<IKPI>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: Schema.Types.ObjectId, ref: "KPITemplate" },
    category: {
      type: String,
      enum: ["productivity", "revenue", "operational", "quality", "innovation"],
      required: true,
    },
    formula: {
      type: String,
      enum: ["standard", "reverse", "binary", "weighted", "growth"],
      required: true,
      default: "standard",
    },
    kpiType: { type: String, enum: ["weekly", "monthly", "quarterly", "annual"], required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    targetValue: { type: Number, required: true, min: 0 },
    actualValue: { type: Number, min: 0 },
    achievementPercent: { type: Number, min: 0 },
    weightedScore: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "overdue", "approved", "rejected"],
      default: "pending",
    },
    evidenceRequired: { type: Boolean, default: false },
    dueDate: { type: Date, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

KPISchema.index({ employee: 1, status: 1 });
KPISchema.index({ department: 1, status: 1 });
KPISchema.index({ dueDate: 1 });
KPISchema.index({ kpiType: 1 });
KPISchema.index({ periodStart: 1, periodEnd: 1 });

const KPI: Model<IKPI> = mongoose.models.KPI || mongoose.model<IKPI>("KPI", KPISchema);

export default KPI;