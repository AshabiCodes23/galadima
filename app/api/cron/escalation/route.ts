import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import PushSubscription from "@/lib/models/PushSubscription";
import { createAuditLog } from "@/lib/audit";
import { sendPushToSubscriptions } from "@/lib/webpush";

const THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const threshold = new Date(Date.now() - THRESHOLD_MS);
  const overdue = await Notification.find({ acknowledged: false, escalated: false, priority: { $in: ["Critical", "High"] }, createdAt: { $lte: threshold } });

  if (!overdue.length) return NextResponse.json({ success: true, escalated: 0 });

  const leadership = await User.find({ role: { $in: ["department_head", "super_admin"] }, isActive: true });
  const leadershipIds = leadership.map((u) => u._id);
  const subscriptions = await PushSubscription.find({ user: { $in: leadershipIds } });

  for (const n of overdue) {
    n.escalated = true;
    n.priority = "Critical";
    const mergedIds = [...new Set([...n.recipientUserIds.map(String), ...leadershipIds.map(String)])];
    n.recipientUserIds = mergedIds.map((id) => new mongoose.Types.ObjectId(id));
    await n.save();

    await createAuditLog({
      category: "notification",
      action: "notification_escalated",
      resourceType: "Notification",
      resourceId: n._id.toString(),
      notes: "Auto-escalated after 4 hours unacknowledged",
      metadata: { priority: "Critical", source: n.source, eventType: n.eventType },
    });

    await sendPushToSubscriptions(subscriptions, { title: `ESCALATED: ${n.title}`, body: `Unacknowledged for over 4 hours. ${n.message}`, priority: "Critical" });
  }

  return NextResponse.json({ success: true, escalated: overdue.length });
}