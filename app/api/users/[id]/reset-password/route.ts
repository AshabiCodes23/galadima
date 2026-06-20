import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { generateTemporaryPassword } from "@/lib/constants";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  const newPassword = generateTemporaryPassword();
  target.passwordHash = await hashPassword(newPassword);
  await target.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "user",
    action: "password_reset",
    resourceType: "User",
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: `Password reset for ${target.name}`, temporaryPassword: newPassword });
}