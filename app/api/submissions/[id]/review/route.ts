import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import KPI from "@/lib/models/KPI";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { calculateKPI } from "@/lib/calculator";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "department_head", "hr_admin"]);
  if (error) return error;

  const { id } = await params;
  const { action, reviewNotes } = await req.json();

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ success: false, error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  await connectDB();
  const submission = await Submission.findById(id);
  if (!submission) return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });

  const kpi = await KPI.findById(submission.kpi);
  if (!kpi) return NextResponse.json({ success: false, error: "Related KPI not found" }, { status: 404 });

  if (user!.role === "department_head" && kpi.department !== user!.department) {
    return NextResponse.json({ success: false, error: "You can only review submissions in your own department" }, { status: 403 });
  }

  if (submission.status !== "pending_review") {
    return NextResponse.json({ success: false, error: "This submission has already been reviewed" }, { status: 409 });
  }

  submission.status = action === "approve" ? "approved" : "rejected";
  submission.reviewedBy = user!._id;
  submission.reviewedAt = new Date();
  submission.reviewNotes = reviewNotes;
  await submission.save();

  if (action === "approve") {
    const { achievementPercent, weightedScore } = calculateKPI(kpi.formula, kpi.targetValue, submission.submittedValue, kpi.weight);
    kpi.actualValue = submission.submittedValue;
    kpi.achievementPercent = achievementPercent;
    kpi.weightedScore = weightedScore;
    kpi.status = "approved";
    kpi.approvedBy = user!._id;
    kpi.approvedAt = new Date();
  } else {
    kpi.status = "rejected";
    kpi.rejectionReason = reviewNotes;
  }
  await kpi.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "submission",
    action: action === "approve" ? "submission_approved" : "submission_rejected",
    resourceType: "Submission",
    resourceId: id,
    metadata: { kpiId: kpi._id.toString(), achievementPercent: kpi.achievementPercent },
    notes: reviewNotes,
  });

  return NextResponse.json({ success: true, submission, kpi });
}