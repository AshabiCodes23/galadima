import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { requireAuth } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const notification = await Notification.findById(id);
  if (!notification) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (!notification.recipientUserIds.some((r) => r.toString() === user!._id.toString())) {
    return NextResponse.json({ success: false, error: "This alert wasn't sent to you" }, { status: 403 });
  }
  if (notification.acknowledged) {
    return NextResponse.json({ success: true, notification, message: "Already acknowledged" });
  }

  const responseTimeMinutes = Math.round((Date.now() - notification.createdAt.getTime()) / 60000);
  notification.acknowledged = true;
  notification.status = "acknowledged";
  notification.acknowledgedBy = user!._id;
  notification.acknowledgedAt = new Date();
  await notification.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "notification",
    action: "notification_acknowledged",
    resourceType: "Notification",
    resourceId: id,
    metadata: { responseTimeMinutes, priority: notification.priority },
  });

  return NextResponse.json({ success: true, notification, responseTimeMinutes });
}