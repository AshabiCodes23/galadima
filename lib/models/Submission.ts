import mongoose, { Schema, Document, Model } from "mongoose";
import type { SubmissionStatus } from "@/lib/types";

export interface ISubmission extends Document {
  kpi: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  submittedValue: number;
  notes?: string;
  evidenceUrls: string[];
  evidenceFileNames: string[];
  status: SubmissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    kpi: { type: Schema.Types.ObjectId, ref: "KPI", required: true },
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedValue: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    evidenceUrls: { type: [String], default: [] },
    evidenceFileNames: { type: [String], default: [] },
    status: { type: String, enum: ["pending_review", "approved", "rejected"], default: "pending_review" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SubmissionSchema.index({ kpi: 1 });
SubmissionSchema.index({ employee: 1, status: 1 });
SubmissionSchema.index({ submittedAt: -1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;