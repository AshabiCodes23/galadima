import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

export default function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`badge badge-role-${role}`}>{ROLE_LABELS[role]}</span>;
}