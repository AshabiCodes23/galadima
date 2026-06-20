const LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  approved: "Approved",
  rejected: "Rejected",
  pending_review: "Pending Review",
};

const CLASSES: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "badge-in-progress",
  pending_review: "badge-in-progress",
  completed: "badge-completed",
  overdue: "badge-overdue",
  approved: "badge-approved",
  rejected: "badge-rejected",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${CLASSES[status] || "badge-pending"}`}>{LABELS[status] || status}</span>;
}