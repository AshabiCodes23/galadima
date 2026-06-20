"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RoleBadge from "@/components/RoleBadge";
import EmptyState from "@/components/EmptyState";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<any>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const deptRes = await fetch(`/api/departments/${id}`);
        const deptJson = await deptRes.json();
        if (!deptJson.success) {
          toast.error(deptJson.error || "Could not load department");
          return;
        }
        setDepartment(deptJson.department);
        setEmployeeCount(deptJson.employeeCount);

        const empRes = await fetch(`/api/users?department=${encodeURIComponent(deptJson.department.name)}`);
        const empJson = await empRes.json();
        if (empJson.success) setEmployees(empJson.users);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>;
  if (!department) return <EmptyState title="Department not found" text="It may have been deleted." />;

  return (
    <div>
      <Link href="/departments" style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>← Back to Departments</Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>{department.name}</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>{department.description || "No description yet."}</p>
        </div>
        <span className={`badge ${department.isActive ? "badge-approved" : "badge-rejected"}`}>
          {department.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="dashboard-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="stat-card">
          <p className="stat-label">Department Head</p>
          <p className="stat-value" style={{ fontSize: "1.25rem" }}>{department.head?.name || "Unassigned"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Employees</p>
          <p className="stat-value">{employeeCount}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Employees</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {employees.length === 0 ? (
            <div style={{ padding: "20px 24px" }}>
              <EmptyState title="No employees yet" text="Add staff to this department from the Employees page." />
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Employee ID</th><th>Role</th><th>Email</th></tr></thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td><Link href={`/employees/${emp._id}`}>{emp.name}</Link></td>
                    <td>{emp.employeeId}</td>
                    <td><RoleBadge role={emp.role} /></td>
                    <td>{emp.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}