import type { NotificationPriority, NotificationSource } from "@/lib/types";

export interface RuleResult {
  title: string;
  message: string;
  priority: NotificationPriority;
  group: string;
  assigneeField?: string;
  includeSupervisor?: boolean;
}

const mapFreshdeskPriority = (raw: unknown): NotificationPriority | null => {
  if (raw === undefined || raw === null) return null;
  const map: Record<string, NotificationPriority> = {
    "1": "Low", low: "Low", "2": "Medium", medium: "Medium",
    "3": "High", high: "High", "4": "Urgent", urgent: "Urgent",
  };
  return map[typeof raw === "string" ? raw.toLowerCase() : String(raw)] || null;
};

type RuleMap = Record<string, (data: Record<string, unknown>) => RuleResult>;

const freshserviceRules: RuleMap = {
  project_due_soon: (d) => ({ title: "Project Due Soon", message: `"${d.project_name}" is due in ${d.days_remaining} day(s). Ensure all milestones are on track.`, priority: "High", group: "project_managers" }),
  task_overdue: (d) => ({ title: "Task Overdue", message: `Task "${d.task_name}" in "${d.project_name}" is overdue by ${d.days_overdue} day(s).`, priority: "Critical", group: "department_heads", assigneeField: "assignee_email", includeSupervisor: true }),
  milestone_reached: (d) => ({ title: "Milestone Reached", message: `Milestone "${d.milestone_name}" in "${d.project_name}" completed.`, priority: "Informational", group: "project_stakeholders" }),
  project_blocked: (d) => ({ title: "Project Blocked", message: `"${d.project_name}" is blocked: ${d.reason}. Requires management intervention.`, priority: "Critical", group: "project_managers" }),
  budget_overrun: (d) => ({ title: "Budget Overrun", message: `"${d.project_name}" has exceeded budget by ${d.overrun_percentage}%. Spend: ${d.current_spend}.`, priority: "Critical", group: "project_stakeholders" }),
  sla_near_breach: (d) => ({ title: "SLA Near Breach", message: `Ticket "${d.ticket_name}" SLA is at ${d.sla_percentage || 50}% — at risk of breach.`, priority: "High", group: "department_heads", assigneeField: "agent_email", includeSupervisor: true }),
  sla_breached: (d) => ({ title: "SLA Breached", message: `Ticket "${d.ticket_name}" has breached its SLA. Escalate now.`, priority: "Critical", group: "department_heads" }),
  item_below_threshold: (d) => ({ title: "Stock Below Threshold", message: `${d.item_name} below minimum stock (current: ${d.current_qty}, min: ${d.min_qty}).`, priority: "Critical", group: "procurement_team" }),
  purchase_order_approved: (d) => ({ title: "PO Approved", message: `Purchase order for "${d.item_name}" (₦${d.amount}) approved by ${d.approver}.`, priority: "Informational", group: "procurement_team" }),
  purchase_order_rejected: (d) => ({ title: "PO Rejected", message: `Purchase order for "${d.item_name}" rejected: ${d.reason}.`, priority: "High", group: "procurement_team" }),
  site_incident: (d) => ({ title: "Site Incident Reported", message: `Incident at "${d.site_name}": ${d.description}. Safety team notified.`, priority: "Critical", group: "project_managers" }),
  inspection_due: (d) => ({ title: "Site Inspection Due", message: `Inspection due for "${d.site_name}" on ${d.due_date}.`, priority: "High", group: "project_stakeholders" }),
  asset_maintenance_due: (d) => ({ title: "Asset Maintenance Due", message: `${d.asset_name} requires maintenance by ${d.due_date}.`, priority: "Medium", group: "facilities_team" }),
};

const freshsalesRules: RuleMap = {
  contact_created: (d) => ({ title: "New Lead Assigned", message: `Lead "${d.lead_name}" has been assigned to you. Follow up promptly.`, priority: "High", group: "sales_team", assigneeField: "rep_email" }),
  contact_updated: (d) => ({ title: "Hot Lead Alert", message: `Lead "${d.lead_name}" has turned hot. Follow up immediately.`, priority: "Critical", group: "sales_team", assigneeField: "rep_email", includeSupervisor: true }),
  deal_stage_changed: (d) => ({ title: "Pipeline Stage Updated", message: `"${d.lead_name || d.deal_name}" has moved to "${d.new_stage}".`, priority: "Medium", group: "sales_team", assigneeField: "rep_email", includeSupervisor: true }),
  note_created: (d) => ({ title: "You Were Mentioned", message: `You were mentioned in a note on "${d.lead_name}".`, priority: "High", group: "sales_team", assigneeField: "mentioned_email" }),
  unattended: (d) => ({ title: "Unattended Conversation", message: `A conversation with "${d.lead_name}" has not been attended to. Follow up now.`, priority: "High", group: "sales_team", assigneeField: "rep_email", includeSupervisor: true }),
};

const freshdeskRules: RuleMap = {
  new_ticket: (d) => ({ title: "New Support Ticket", message: `Ticket #${d.ticket_id}: "${d.subject}" submitted by ${d.requester}.`, priority: mapFreshdeskPriority(d.priority) || "Medium", group: "support_team" }),
  unassigned_ticket: (d) => ({ title: "Unassigned Ticket", message: `Ticket #${d.ticket_id} "${d.subject}" unassigned for ${d.hours} hours.`, priority: mapFreshdeskPriority(d.priority) || "High", group: "support_team" }),
  ticket_sla_near_breach: (d) => ({ title: "Ticket SLA Warning", message: `Ticket #${d.ticket_id} SLA deadline in ${d.minutes_remaining} minutes.`, priority: "Critical", group: "department_heads", assigneeField: "agent_email", includeSupervisor: true }),
  ticket_escalated: (d) => ({ title: "Ticket Escalated", message: `Ticket #${d.ticket_id} "${d.subject}" escalated. Reason: ${d.reason}.`, priority: "Critical", group: "department_heads" }),
  ticket_resolved: (d) => ({ title: "Ticket Resolved", message: `Ticket #${d.ticket_id} "${d.subject}" resolved by ${d.agent}.`, priority: mapFreshdeskPriority(d.priority) || "Informational", group: "support_team" }),
  ticket_reopened: (d) => ({ title: "Ticket Reopened", message: `Ticket #${d.ticket_id} "${d.subject}" reopened by ${d.requester}. Reason: ${d.reason}.`, priority: mapFreshdeskPriority(d.priority) || "High", group: "support_team", assigneeField: "agent_email", includeSupervisor: true }),
  unanswered_customer_reply: (d) => ({ title: "Unanswered Customer Reply", message: `Customer reply on Ticket #${d.ticket_id} unanswered for ${d.hours} hours.`, priority: mapFreshdeskPriority(d.priority) || "High", group: "department_heads", assigneeField: "agent_email", includeSupervisor: true }),
  maintenance_request: (d) => ({ title: "Maintenance Request", message: `Unit ${d.unit_number}: "${d.issue}" reported by ${d.resident_name}.`, priority: mapFreshdeskPriority(d.priority) || "Medium", group: "facilities_team" }),
  urgent_maintenance: (d) => ({ title: "Urgent Maintenance", message: `URGENT: Unit ${d.unit_number} "${d.issue}" by ${d.resident_name}. May affect other residents.`, priority: "Critical", group: "project_managers" }),
  resident_complaint: (d) => ({ title: "Resident Complaint", message: `Complaint from ${d.resident_name} (Unit ${d.unit_number}): "${d.complaint}".`, priority: mapFreshdeskPriority(d.priority) || "High", group: "support_team" }),
  csat_low: (d) => ({ title: "Low CSAT Score", message: `${d.requester} gave ${d.score}/5 for Ticket #${d.ticket_id}. Feedback: "${d.feedback}".`, priority: mapFreshdeskPriority(d.priority) || "High", group: "department_heads" }),
};

const RULES_BY_SOURCE: Record<string, RuleMap> = {
  Freshservice: freshserviceRules,
  Freshsales: freshsalesRules,
  Freshdesk: freshdeskRules,
};

export function evaluateRule(source: NotificationSource, eventType: string, data: Record<string, unknown>): RuleResult | null {
  const builder = RULES_BY_SOURCE[source]?.[eventType];
  return builder ? builder(data) : null;
}

function deptQuery(name: string) {
  return { department: { $regex: new RegExp(`^${name}$`, "i") } };
}

export const GROUP_QUERIES: Record<string, Record<string, unknown>> = {
  project_managers: { role: { $in: ["department_head", "super_admin"] } },
  project_stakeholders: { role: { $in: ["department_head", "super_admin"] } },
  department_heads: { role: { $in: ["department_head", "super_admin"] } },
  procurement_team: deptQuery("Procurement"),
  facilities_team: deptQuery("Facilities"),
  support_team: deptQuery("Support"),
  sales_team: deptQuery("Sales"),
  all_staff: {},
};

export function recipientQuery(group: string): Record<string, unknown> {
  return { isActive: true, ...(GROUP_QUERIES[group] || {}) };
}