"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

interface Employee {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  role: UserRole;
  isActive: boolean;
}

interface EmployeeKPI {
  _id: string;
  name: string;
  status: string;
  achievementPercent?: number;
  dueDate: string;
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [kpis, setKpis] = useState<EmployeeKPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [empRes, kpiRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/kpis?employee=${id}&limit=50`),
        ]);
        const empJson = await empRes.json();
        if (!empJson.success) {
          toast.error(empJson.error || "Could not load employee");
          return;
        }
        setEmployee(empJson.user);

        const kpiJson = await kpiRes.json();
        if (kpiJson.success) setKpis(kpiJson.kpis);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>;
  if (!employee) return <EmptyState title="Employee not found" text="They may have been removed." />;

  const approved = kpis.filter((k) => k.status === "approved");
  const score = approved.length ? Math.round(approved.reduce((sum, k) => sum + (k.achievementPercent || 0), 0) / approved.length) : 0;

  return (
    <div>
      <Link href="/employees" style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>← Back to Employees</Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>{employee.name}</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>{employee.employeeId} · {employee.department}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <RoleBadge role={employee.role} />
          <span className={`badge ${employee.isActive ? "badge-approved" : "badge-rejected"}`}>{employee.isActive ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><p className="stat-label">Average Score</p><p className="stat-value">{score}%</p></div>
        <div className="stat-card"><p className="stat-label">Total KPIs</p><p className="stat-value">{kpis.length}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value">{approved.length}</p></div>
        <div className="stat-card"><p className="stat-label">Email</p><p className="stat-value" style={{ fontSize: "0.9375rem" }}>{employee.email}</p></div>
      </div>

      <div className="card">
        <div className="card-header"><h3>KPI History</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {kpis.length === 0 ? (
            <div style={{ padding: "20px 24px" }}>
              <EmptyState title="No KPIs yet" text="Nothing has been assigned to this employee yet." />
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>KPI</th><th>Status</th><th>Achievement</th><th>Due</th></tr></thead>
              <tbody>
                {kpis.map((kpi) => (
                  <tr key={kpi._id}>
                    <td>{kpi.name}</td>
                    <td><StatusBadge status={kpi.status} /></td>
                    <td>{kpi.achievementPercent != null ? `${kpi.achievementPercent}%` : "—"}</td>
                    <td>{formatDate(kpi.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-400)", marginTop: 16 }}>
        To edit this profile, reset a password, or change role, use the Manage button on the Employees list.
      </p>
    </div>
  );
}