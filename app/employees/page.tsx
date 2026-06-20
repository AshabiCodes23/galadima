"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ROLE_LABELS } from "@/lib/utils/constants";
import type { UserRole, EmploymentStatus } from "@/lib/types";

// Types

interface Department {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: Department;
  employmentStatus: EmploymentStatus;
  lastLogin?: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: UserRole | "";
  department: string;
  password: string;
}

type ModalMode = "create" | "edit" | "reset_password" | "change_status" | null;

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  department: "",
  password: "",
};

const STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  on_leave: "On Leave",
};

const STATUS_BADGE: Record<EmploymentStatus, string> = {
  active: "badge-approved",
  inactive: "badge-pending",
  suspended: "badge-overdue",
  on_leave: "badge-in-progress",
};

// NOTE: "team_lead" is not in the UserRole union in lib/types.ts.
// Add it back here (and to UserRole + the relevant requireRole(...) calls)
// once that role is actually supported on the backend.
const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "department_head", label: "Department Head" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "staff", label: "Staff" },
] satisfies { value: UserRole; label: string }[];

// Helpers

function formatDate(str?: string): string {
  if (!str) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(str));
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Modal Overlay

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-neutral-200)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ marginBottom: subtitle ? 3 : 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: "0.875rem" }}>{subtitle}</p>}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Close modal"
            onClick={onClose}
            style={{ flexShrink: 0, padding: "4px 8px", fontSize: "1.25rem", lineHeight: 1 }}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        {/* Modal Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Toast

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        background: type === "success" ? "var(--color-success)" : "var(--color-primary)",
        color: "#ffffff",
        fontSize: "0.875rem",
        fontWeight: 500,
        boxShadow: "var(--shadow-lg)",
        maxWidth: 360,
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: "slideUp 0.2s ease",
      }}
    >
      <span aria-hidden="true">{type === "success" ? "\u2713" : "\u2715"}</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", marginLeft: "auto", fontSize: "1rem", lineHeight: 1 }}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

// Form Field Helper
// Moved to module scope (was previously declared inside EmployeesPage, which
// recreated it on every render - react-hooks/static-components).

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-group">
      <label className={`form-label${required ? " required" : ""}`}>{label}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
}

// Main Page

export default function EmployeesPage() {
  const { data: session } = useSession();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const [newStatus, setNewStatus] = useState<EmploymentStatus>("active");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const isSuperAdmin = session?.user?.role === "super_admin";

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  // Fetch

  const fetchEmployees = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search) params.set("search", search);
        if (filterDept) params.set("department", filterDept);
        if (filterRole) params.set("role", filterRole);
        if (filterStatus) params.set("status", filterStatus);

        const res = await fetch(`/api/users?${params}`);
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data);
          setPagination({
            page: json.pagination.page,
            totalPages: json.pagination.totalPages,
            total: json.pagination.total,
          });
        }
      } catch {
        showToast("Failed to load employees.", "error");
      } finally {
        setLoading(false);
      }
    },
    [filterDept, filterRole, filterStatus, search, showToast]
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/departments?limit=100", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDepartments(json.data);
      })
      .catch(() => {
        // Keep the employee page usable if department filters fail to load.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchEmployees(1), 350);
    return () => clearTimeout(timeout);
  }, [fetchEmployees]);

  // Modal Openers

  function openCreate() {
    setSelectedEmployee(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModal("create");
  }

  function openEdit(emp: Employee) {
    setSelectedEmployee(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone ?? "",
      role: emp.role,
      department: emp.department?._id ?? "",
      password: "",
    });
    setErrors({});
    setModal("edit");
  }

  function openResetPassword(emp: Employee) {
    setSelectedEmployee(emp);
    setForm({ ...EMPTY_FORM, password: "" });
    setErrors({});
    setModal("reset_password");
  }

  function openChangeStatus(emp: Employee) {
    setSelectedEmployee(emp);
    setNewStatus(emp.employmentStatus);
    setModal("change_status");
  }

  function closeModal() {
    setModal(null);
    setSelectedEmployee(null);
    setErrors({});
  }

  // Validation

  function validateForm(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.role) errs.role = "Role is required";
    if (!form.department) errs.department = "Department is required";
    if (modal === "create" && !form.password.trim()) errs.password = "Password is required";
    if (modal === "reset_password" && !form.password.trim()) errs.password = "New password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Submit Handlers

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
          department: form.department,
          password: form.password,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(json.message ?? "Staff account created.", "success");
      closeModal();
      fetchEmployees(1);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to create account.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm() || !selectedEmployee) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/${selectedEmployee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
          department: form.department,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Account updated successfully.", "success");
      closeModal();
      fetchEmployees(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update account.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!validateForm() || !selectedEmployee) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/${selectedEmployee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", newPassword: form.password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Password reset successfully.", "success");
      closeModal();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to reset password.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeStatus() {
    if (!selectedEmployee) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/${selectedEmployee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_status", status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Account status updated.", "success");
      closeModal();
      fetchEmployees(pagination.page);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Render

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .employee-row-actions { opacity: 0; transition: opacity 0.15s ease; }
        tr:hover .employee-row-actions { opacity: 1; }
        @media (max-width: 900px) {
          .employee-row-actions { opacity: 1; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Staff Management</h1>
            <p>
              {pagination.total} member{pagination.total !== 1 ? "s" : ""} across all departments
            </p>
          </div>
          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>
              Add Staff Member
            </button>
          )}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, auto)",
            gap: 10,
            alignItems: "center",
          }}
          className="filters-grid"
        >
          <input
            className="form-input"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ margin: 0 }}
          />
          <select
            className="form-select"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ margin: 0, minWidth: 160 }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ margin: 0, minWidth: 140 }}
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ margin: 0, minWidth: 130 }}
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_LABELS) as EmploymentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "60px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No staff members found</p>
              <p className="empty-state-text">
                {search || filterDept || filterRole || filterStatus
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first staff member to get started."}
              </p>
              {isSuperAdmin && !search && !filterDept && !filterRole && !filterStatus && (
                <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
                  Add Staff Member
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Employee ID</th>
                    <th className="hide-mobile">Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="hide-mobile">Last Login</th>
                    {isSuperAdmin && <th style={{ width: 40 }} />}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      {/* Avatar + Name */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--color-primary-muted)",
                              color: "var(--color-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: 600,
                                color: "var(--color-neutral-900)",
                                fontSize: "0.875rem",
                                marginBottom: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {emp.name}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-neutral-400)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: "0.8125rem",
                            background: "var(--color-neutral-100)",
                            padding: "2px 7px",
                            borderRadius: "var(--radius-sm)",
                            fontFamily: "monospace",
                          }}
                        >
                          {emp.employeeId}
                        </code>
                      </td>
                      <td className="hide-mobile">
                        <span style={{ fontSize: "0.875rem" }}>{emp.department?.name ?? "-"}</span>
                      </td>
                      <td>
                        <span className="badge badge-pending" style={{ fontSize: "0.75rem" }}>
                          {ROLE_LABELS[emp.role] ?? emp.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[emp.employmentStatus]}`}>
                          {STATUS_LABELS[emp.employmentStatus]}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)" }}>
                          {formatDate(emp.lastLogin)}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td>
                          <div
                            className="employee-row-actions"
                            style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}
                          >
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEdit(emp)}
                              title="Edit"
                              style={{ padding: "4px 8px" }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openResetPassword(emp)}
                              title="Reset Password"
                              style={{ padding: "4px 8px" }}
                            >
                              Reset PW
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openChangeStatus(emp)}
                              title="Change Status"
                              style={{ padding: "4px 8px" }}
                            >
                              Status
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--color-neutral-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)" }}>
                Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fetchEmployees(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fetchEmployees(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {modal === "create" && (
        <Modal
          title="Add Staff Member"
          subtitle="Create a new account. The staff member will receive login credentials via email."
          onClose={closeModal}
        >
          <form onSubmit={handleCreateSubmit} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Full Name" required error={errors.name}>
                  <input
                    className={`form-input${errors.name ? " error" : ""}`}
                    placeholder="e.g. Wealthstein Adekoya"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </Field>
              </div>
              <Field label="Work Email" required error={errors.email}>
                <input
                  className={`form-input${errors.email ? " error" : ""}`}
                  type="email"
                  placeholder="name@landbookbyharmony.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+234..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Role" required error={errors.role}>
                <select
                  className={`form-select${errors.role ? " error" : ""}`}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                  <option value="">Select role...</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Department" required error={errors.department}>
                <select
                  className={`form-select${errors.department ? " error" : ""}`}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="Login Password"
                  required
                  error={errors.password}
                  hint="This is the permanent password for this account. Only you can reset it."
                >
                  <input
                    className={`form-input${errors.password ? " error" : ""}`}
                    type="password"
                    placeholder="Set a strong password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Create Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === "edit" && selectedEmployee && (
        <Modal
          title="Edit Staff Member"
          subtitle={`Editing account for ${selectedEmployee.name}`}
          onClose={closeModal}
        >
          <form onSubmit={handleEditSubmit} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Full Name" required error={errors.name}>
                  <input
                    className={`form-input${errors.name ? " error" : ""}`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </Field>
              </div>
              <Field label="Work Email" required error={errors.email}>
                <input
                  className={`form-input${errors.email ? " error" : ""}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone Number">
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Role" required error={errors.role}>
                <select
                  className={`form-select${errors.role ? " error" : ""}`}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Department" required error={errors.department}>
                <select
                  className={`form-select${errors.department ? " error" : ""}`}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {modal === "reset_password" && selectedEmployee && (
        <Modal
          title="Reset Password"
          subtitle={`Set a new password for ${selectedEmployee.name}`}
          onClose={closeModal}
        >
          <form onSubmit={handleResetPassword} noValidate>
            <Field
              label="New Password"
              required
              error={errors.password}
              hint="The staff member will use this password to log in. Only you can change it."
            >
              <input
                className={`form-input${errors.password ? " error" : ""}`}
                type="password"
                placeholder="Enter new password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoFocus
                autoComplete="new-password"
              />
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Reset Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Status Dialog */}
      {modal === "change_status" && selectedEmployee && (
        <Modal
          title="Change Account Status"
          subtitle={`Update employment status for ${selectedEmployee.name}`}
          onClose={closeModal}
        >
          <Field label="Status">
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EmploymentStatus)}
            >
              {(Object.keys(STATUS_LABELS) as EmploymentStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          {(newStatus === "suspended" || newStatus === "inactive") && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--color-primary-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(196,18,48,0.12)",
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "var(--color-primary)", fontWeight: 500 }}>
                {newStatus === "suspended"
                  ? "Suspending this account will prevent the staff member from logging in immediately."
                  : "Deactivating this account will remove it from all active KPI assignments."}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </button>
            <button
              className={`btn ${newStatus === "suspended" || newStatus === "inactive" ? "btn-danger" : "btn-primary"}`}
              onClick={handleChangeStatus}
              disabled={submitting}
            >
              {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Update Status"}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 700px) {
          .filters-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
