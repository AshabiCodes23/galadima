import mongoose, { Schema, Document, Model } from "mongoose";
import type { KPICategory, KPIFormula, KPIType, UserRole } from "@/lib/types";

export interface IKPITemplateItem {
  name: string;
  description?: string;
  category: KPICategory;
  formula: KPIFormula;
  kpiType: KPIType;
  targetValue: number;
  weight: number;
  evidenceRequired: boolean;
}

export interface IKPITemplate extends Document {
  name: string;
  description?: string;
  department: string;
  role?: UserRole;
  kpis: IKPITemplateItem[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KPITemplateItemSchema = new Schema<IKPITemplateItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
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
    targetValue: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0, max: 100 },
    evidenceRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const KPITemplateSchema = new Schema<IKPITemplate>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    role: { type: String, enum: ["super_admin", "department_head", "staff", "hr_admin"] },
    kpis: [KPITemplateItemSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

KPITemplateSchema.index({ department: 1 });
KPITemplateSchema.index({ role: 1 });
KPITemplateSchema.index({ isActive: 1 });

const KPITemplate: Model<IKPITemplate> =
  mongoose.models.KPITemplate || mongoose.model<IKPITemplate>("KPITemplate", KPITemplateSchema);

export default KPITemplate;