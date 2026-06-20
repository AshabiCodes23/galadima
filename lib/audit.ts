import AuditLog from "@/lib/models/AuditLog";
import type { AuditCategory } from "@/lib/types";

interface LogParams {
  userId?: string;
  performedBy?: string;
  category: AuditCategory;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: LogParams) {
  return AuditLog.create({
    user: params.userId,
    performedBy: params.performedBy ?? (params.userId ? undefined : "system"),
    category: params.category,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    oldValue: params.oldValue,
    newValue: params.newValue,
    metadata: params.metadata,
    notes: params.notes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}