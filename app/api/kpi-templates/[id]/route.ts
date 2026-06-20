import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import KPITemplate from "@/lib/KPITemplate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const template = await KPITemplate.findById(id);
  if (!template) return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });

  return NextResponse.json({ success: true, template });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "department_head", "hr_admin"]);
  if (error) return error;

  const { id } = await params;
  const updates = await req.json();

  await connectDB();
  const before = await KPITemplate.findById(id);
  if (!before) return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });

  const allowedFields = ["name", "description", "department", "role", "kpis", "isActive"];
  const sanitized: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in updates) sanitized[field] = updates[field];
  }

  const template = await KPITemplate.findByIdAndUpdate(id, sanitized, { new: true });

  await createAuditLog({
    userId: user!._id.toString(),
    category: "template",
    action: "template_updated",
    resourceType: "KPITemplate",
    resourceId: id,
    oldValue: before.toObject() as unknown as Record<string, unknown>,
    newValue: sanitized,
  });

  return NextResponse.json({ success: true, template });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin"]);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const template = await KPITemplate.findByIdAndDelete(id);
  if (!template) return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });

  await createAuditLog({
    userId: user!._id.toString(),
    category: "template",
    action: "template_deleted",
    resourceType: "KPITemplate",
    resourceId: id,
    oldValue: template.toObject() as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, message: "Template deleted" });
}