import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import KPI from "@/lib/models/KPI";
import { requireAuth } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));
  const status = searchParams.get("status");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  if (user!.role === "staff") {
    query.employee = user!._id;
  } else if (user!.role === "department_head") {
    // Submissions don't carry department directly — scope through this
    // department head's KPIs.
    const deptKPIIds = await KPI.find({ department: user!.department }).select("_id");
    query.kpi = { $in: deptKPIIds.map((k) => k._id) };
  }

  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate("kpi", "name targetValue formula status")
      .populate("employee", "name employeeId")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit),
    Submission.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    submissions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { kpiId, submittedValue, notes, evidenceUrls, evidenceFileNames } = await req.json();

    if (!kpiId || submittedValue === undefined) {
      return NextResponse.json({ success: false, error: "kpiId and submittedValue are required" }, { status: 400 });
    }

    await connectDB();
    const kpi = await KPI.findById(kpiId);
    if (!kpi) return NextResponse.json({ success: false, error: "KPI not found" }, { status: 404 });

    const isOwner = kpi.employee.toString() === user!._id.toString();
    const isPrivileged = ["super_admin", "hr_admin"].includes(user!.role) || (user!.role === "department_head" && kpi.department === user!.department);
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ success: false, error: "You can only submit progress for your own KPIs" }, { status: 403 });
    }

    if (kpi.evidenceRequired && (!evidenceUrls || evidenceUrls.length === 0)) {
      return NextResponse.json({ success: false, error: "This KPI requires evidence to be attached" }, { status: 400 });
    }

    const submission = await Submission.create({
      kpi: kpi._id,
      employee: kpi.employee,
      submittedValue,
      notes,
      evidenceUrls: evidenceUrls || [],
      evidenceFileNames: evidenceFileNames || [],
      status: "pending_review",
    });

    // Resubmission after a rejection (or first submission) moves the KPI
    // back into progress.
    if (["pending", "rejected", "overdue"].includes(kpi.status)) {
      kpi.status = "in_progress";
      await kpi.save();
    }

    await createAuditLog({
      userId: user!._id.toString(),
      category: "submission",
      action: "submission_created",
      resourceType: "Submission",
      resourceId: submission._id.toString(),
      metadata: { kpiId: kpi._id.toString(), submittedValue },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (err) {
    console.error("Submission create error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}