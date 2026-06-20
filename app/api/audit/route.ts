import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";
import { requireRole } from "@/lib/authorize";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const action = searchParams.get("action");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));

  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (action) query.action = action;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).populate("user", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return NextResponse.json({ success: true, logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}