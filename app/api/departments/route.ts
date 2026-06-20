import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Department from "@/lib/models/Department";
import User from "@/lib/models/User";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const departments = await Department.find().sort({ name: 1 }).populate("head", "name email employeeId");

  const withCounts = await Promise.all(
    departments.map(async (dept) => ({
      ...dept.toObject(),
      employeeCount: await User.countDocuments({ department: dept.name, isActive: true }),
    }))
  );

  return NextResponse.json({ success: true, departments: withCounts });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  try {
    const { name, description, head } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
    }

    await connectDB();
    const department = await Department.create({
      name: name.trim(),
      description,
      head: head || undefined,
    });

    await createAuditLog({
      userId: user!._id.toString(),
      category: "department",
      action: "department_created",
      resourceType: "Department",
      resourceId: department._id.toString(),
      newValue: { name: department.name, description: department.description, head },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json({ success: false, error: "A department with that name already exists" }, { status: 409 });
    }
    console.error("Department create error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}