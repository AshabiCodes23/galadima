import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import KPITemplate from "@/lib/KPITemplate";
import { isDuplicateKeyError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const role = searchParams.get("role");

  const query: Record<string, unknown> = { isActive: true };
  if (department) query.department = department;
  if (role) query.role = role;

  const templates = await KPITemplate.find(query).sort({ name: 1 });
  return NextResponse.json({ success: true, templates });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "department_head", "hr_admin"]);
  if (error) return error;

  try {
    const { name, description, department, role, kpis } = await req.json();

    if (!name || !department || !Array.isArray(kpis) || kpis.length === 0) {
      return NextResponse.json(
        { success: false, error: "Name, department, and at least one KPI line item are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const template = await KPITemplate.create({
      name: name.trim(),
      description,
      department,
      role,
      kpis,
      createdBy: user!._id,
    });

    await createAuditLog({
      userId: user!._id.toString(),
      category: "template",
      action: "template_created",
      resourceType: "KPITemplate",
      resourceId: template._id.toString(),
      newValue: { name: template.name, department: template.department, itemCount: kpis.length },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json({ success: false, error: "A template with that name already exists" }, { status: 409 });
    }
    console.error("Template create error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}