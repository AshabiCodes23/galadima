import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import PushSubscription from "@/lib/models/PushSubscription";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { sendPushToSubscriptions } from "@/lib/webpush";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const broadcasts = await Notification.find({ eventType: "broadcast" }).sort({ createdAt: -1 }).limit(50);
  return NextResponse.json({ success: true, broadcasts });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "department_head", "hr_admin"]);
  if (error) return error;

  const { title, message, department } = await req.json();
  if (!title || !message) {
    return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
  }

  await connectDB();
  const userQuery: Record<string, unknown> = { isActive: true };
  if (department) userQuery.department = department;
  if (user!.role === "department_head") userQuery.department = user!.department; // can't broadcast outside own department

  const recipients = await User.find(userQuery);
  if (!recipients.length) {
    return NextResponse.json({ success: false, error: `No active users found${department ? ` in "${department}"` : ""}` }, { status: 404 });
  }

  const notification = await Notification.create({
    title, message, priority: "High", source: "Manual", eventType: "broadcast",
    recipientGroup: department || "all_staff",
    recipientUserIds: recipients.map((r) => r._id),
    deliveryMode: "group", status: "sent",
  });

  await createAuditLog({
    userId: user!._id.toString(),
    category: "notification",
    action: "broadcast_sent",
    resourceType: "Notification",
    resourceId: notification._id.toString(),
    metadata: { recipientCount: recipients.length, department: department || "all_staff" },
  });

  const subscriptions = await PushSubscription.find({ user: { $in: recipients.map((r) => r._id) } });
  const pushCount = await sendPushToSubscriptions(subscriptions, { title, body: message, priority: "High" });

  return NextResponse.json({ success: true, message: `Broadcast sent to ${recipients.length} user(s), ${pushCount} push notification(s) delivered`, notification });
}