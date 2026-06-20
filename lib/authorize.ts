import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

type AuthSuccess = { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; error: null };
type AuthFailure = { user: null; error: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSuccess | AuthFailure> {
  const result = await requireAuth();
  if (result.error) return result;
  if (!allowedRoles.includes(result.user.role)) {
    return { user: null, error: NextResponse.json({ success: false, error: "You don't have permission to do this" }, { status: 403 }) };
  }
  return result;
}