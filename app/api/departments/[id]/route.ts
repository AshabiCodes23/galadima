import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Department from "@/lib/models/Department";
import User from "@/lib/models/User";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const department = await Department.findById(id).populate("head", "name email employeeId");
  if (!department) return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });

  const employeeCount = await User.countDocuments({ department: department.name, isActive: true });

  return NextResponse.json({ success: true, department, employeeCount });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  const { id } = await params;
  const updates = await req.json();

  await connectDB();
  const before = await Department.findById(id);
  if (!before) return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });

  const allowedFields = ["name", "description", "head", "isActive"];
  const sanitized: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in updates) sanitized[field] = updates[field];
  }

  const department = await Department.findByIdAndUpdate(id, sanitized, { new: true });

  await createAuditLog({
    userId: user!._id.toString(),
    category: "department",
    action: "department_updated",
    resourceType: "Department",
    resourceId: id,
    oldValue: before.toObject() as unknown as Record<string, unknown>,
    newValue: sanitized,
  });

  return NextResponse.json({ success: true, department });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin"]);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const department = await Department.findById(id);
  if (!department) return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });

  const activeStaff = await User.countDocuments({ department: department.name, isActive: true });
  if (activeStaff > 0) {
    return NextResponse.json(
      { success: false, error: `Can't delete — ${activeStaff} active staff member(s) are still in this department` },
      { status: 409 }
    );
  }

  await Department.findByIdAndDelete(id);

  await createAuditLog({
    userId: user!._id.toString(),
    category: "department",
    action: "department_deleted",
    resourceType: "Department",
    resourceId: id,
    oldValue: department.toObject() as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, message: "Department deleted" });
}