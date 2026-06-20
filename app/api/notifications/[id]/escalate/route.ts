import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "department_head", "hr_admin"]);
  if (error) return error;

  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: undefined }));

  await connectDB();
  const notification = await Notification.findById(id);
  if (!notification) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const leadership = await User.find({ role: { $in: ["department_head", "super_admin"] }, isActive: true }).select("_id");
  notification.escalated = true;
  notification.priority = "Critical";
  const mergedIds = [...new Set([...notification.recipientUserIds.map(String), ...leadership.map((u) => u._id.toString())])];
  notification.recipientUserIds = mergedIds.map((mid) => new mongoose.Types.ObjectId(mid));
  await notification.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "notification",
    action: "notification_escalated",
    resourceType: "Notification",
    resourceId: id,
    notes: reason || "Manually escalated",
  });

  return NextResponse.json({ success: true, notification });
}