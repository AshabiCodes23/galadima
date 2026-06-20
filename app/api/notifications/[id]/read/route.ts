import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { requireAuth } from "@/lib/authorize";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const notification = await Notification.findById(id);
  if (!notification) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (notification.status === "sent") notification.status = "delivered";
  if (notification.status !== "acknowledged") notification.status = "read";
  await notification.save();

  return NextResponse.json({ success: true, notification });
}