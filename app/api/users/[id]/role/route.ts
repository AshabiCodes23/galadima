import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = ["super_admin", "department_head", "staff", "hr_admin"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin"]);
  if (error) return error;

  const { id } = await params;
  const { role } = await req.json();

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  }

  await connectDB();
  const before = await User.findById(id);
  if (!before) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  const target = await User.findByIdAndUpdate(id, { role }, { new: true });

  await createAuditLog({
    userId: user!._id.toString(),
    category: "user",
    action: "user_role_changed",
    resourceType: "User",
    resourceId: id,
    oldValue: { role: before.role },
    newValue: { role },
  });

  return NextResponse.json({ success: true, message: `Role updated to ${role}`, user: target });
}