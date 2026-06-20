import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import KPI from "@/lib/models/KPI";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/authorize";
import { isKPIOverdue } from "@/lib/calculator";
import { Types } from "mongoose";
import { KPITrendSource } from "@/lib/types";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  await connectDB();

  if (user!.role === "staff") {
    return NextResponse.json({ success: true, view: "employee", data: await buildEmployeeDashboard(user!._id) });
  }
  if (user!.role === "department_head") {
    return NextResponse.json({ success: true, view: "department", data: await buildDepartmentDashboard(user!.department) });
  }
  return NextResponse.json({ success: true, view: "executive", data: await buildExecutiveDashboard() });
}

async function buildEmployeeDashboard(employeeId: Types.ObjectId | string) {
  const kpis = await KPI.find({ employee: employeeId });
  const approved = kpis.filter((k) => k.status === "approved");

  return {
    personalScore: average(approved.map((k) => k.achievementPercent || 0)),
    assignedKPIs: kpis.length,
    completedKPIs: approved.length,
    overdueKPIs: kpis.filter((k) => isKPIOverdue(k.dueDate, k.status)).length,
    dueKPIs: kpis.filter((k) => ["pending", "in_progress"].includes(k.status)).slice(0, 10),
    performanceTrend: monthlyTrend(approved),
  };
}

async function buildDepartmentDashboard(department: string) {
  const members = await User.find({ department, isActive: true }).select("name employeeId");
  const kpis = await KPI.find({ department });

  const teamPerformance = members.map((member) => {
    const memberKPIs = kpis.filter((k) => k.employee.toString() === member._id.toString());
    const approved = memberKPIs.filter((k) => k.status === "approved");
    return {
      employee: { id: member._id, name: member.name, employeeId: member.employeeId },
      score: average(approved.map((k) => k.achievementPercent || 0)),
      completedKPIs: approved.length,
      totalKPIs: memberKPIs.length,
    };
  });

  return {
    departmentScore: average(teamPerformance.map((t) => t.score)),
    totalMembers: members.length,
    openKPIs: kpis.filter((k) => ["pending", "in_progress"].includes(k.status)).length,
    completedKPIs: kpis.filter((k) => k.status === "approved").length,
    missedKPIs: kpis.filter((k) => isKPIOverdue(k.dueDate, k.status)).length,
    teamPerformance,
  };
}

async function buildExecutiveDashboard() {
  const allUsers = await User.find({ isActive: true }).select("name employeeId department");
  const allKPIs = await KPI.find();
  const departments = [...new Set(allUsers.map((u) => u.department))];

  const departmentRankings = departments.map((department) => {
    const deptKPIs = allKPIs.filter((k) => k.department === department);
    const approved = deptKPIs.filter((k) => k.status === "approved");
    return {
      department,
      score: average(approved.map((k) => k.achievementPercent || 0)),
      completionRate: deptKPIs.length ? Math.round((approved.length / deptKPIs.length) * 100) : 0,
      totalKPIs: deptKPIs.length,
      completedKPIs: approved.length,
    };
  }).sort((a, b) => b.score - a.score);

  const performerScores = allUsers
    .map((u) => {
      const userKPIs = allKPIs.filter((k) => k.employee.toString() === u._id.toString());
      const approved = userKPIs.filter((k) => k.status === "approved");
      return {
        employee: { id: u._id, name: u.name, employeeId: u.employeeId, department: u.department },
        score: average(approved.map((k) => k.achievementPercent || 0)),
        completedKPIs: approved.length,
        totalKPIs: userKPIs.length,
      };
    })
    .filter((p) => p.totalKPIs > 0)
    .sort((a, b) => b.score - a.score);

  const completed = allKPIs.filter((k) => k.status === "approved");

  return {
    companyScore: average(departmentRankings.map((d) => d.score)),
    totalEmployees: allUsers.length,
    activeKPIs: allKPIs.filter((k) => ["pending", "in_progress"].includes(k.status)).length,
    completedKPIs: completed.length,
    overdueKPIs: allKPIs.filter((k) => isKPIOverdue(k.dueDate, k.status)).length,
    kpiCompletionRate: allKPIs.length ? Math.round((completed.length / allKPIs.length) * 100) : 0,
    departmentRankings,
    topPerformers: performerScores.slice(0, 5),
    underperformers: performerScores.slice(-5).reverse(),
    monthlyTrend: monthlyTrend(completed),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function monthlyTrend(approvedKPIs: KPITrendSource[]) {
  const months: Record<string, number[]> = {};
  for (const kpi of approvedKPIs) {
    const key = new Date(kpi.approvedAt || kpi.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    months[key] = months[key] || [];
    months[key].push(kpi.achievementPercent || 0);
  }
  return Object.entries(months)
    .map(([month, scores]) => ({ month, score: average(scores), completionRate: 100 }))
    .slice(-6);
}