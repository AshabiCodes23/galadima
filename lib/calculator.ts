import type { KPIFormula, KPICalculationResult, PerformanceRating } from "@/lib/types";

export function calculateKPI(formula: KPIFormula, target: number, actual: number, weight: number): KPICalculationResult {
  let achievementPercent = 0;
  let cappedAt100 = false;

  switch (formula) {
    case "standard":
      achievementPercent = calculateStandard(target, actual);
      break;
    case "reverse": {
      const reverseResult = calculateReverse(target, actual);
      achievementPercent = reverseResult.value;
      cappedAt100 = reverseResult.capped;
      break;
    }
    case "binary":
      achievementPercent = calculateBinary(actual);
      break;
    case "weighted":
      achievementPercent = calculateStandard(target, actual);
      break;
    case "growth":
      achievementPercent = calculateGrowth(target, actual);
      break;
    default:
      achievementPercent = 0;
  }

  achievementPercent = Math.round(achievementPercent * 100) / 100;
  const weightedScore = Math.round(achievementPercent * (weight / 100) * 100) / 100;

  return { achievementPercent, weightedScore, cappedAt100 };
}

// Formula 1 — Standard: Achievement % = (Actual / Target) * 100
function calculateStandard(target: number, actual: number): number {
  if (target === 0) return 0;
  return (actual / target) * 100;
}

// Formula 2 — Reverse: lower actual is better. Capped at 100%.
function calculateReverse(target: number, actual: number): { value: number; capped: boolean } {
  if (actual === 0) return { value: 100, capped: true };
  const raw = (target / actual) * 100;
  if (raw > 100) return { value: 100, capped: true };
  return { value: raw, capped: false };
}

// Formula 3 — Binary: Completed = 100%, Not completed = 0%
function calculateBinary(actual: number): number {
  return actual >= 1 ? 100 : 0;
}

// Formula 5 — Growth: capped at 150%, rewards exceeding target within a bound
function calculateGrowth(target: number, actual: number): number {
  if (target === 0) return 0;
  const raw = (actual / target) * 100;
  return Math.min(raw, 150);
}

export function getPerformanceRating(score: number): PerformanceRating {
  if (score >= 90) return "outstanding";
  if (score >= 80) return "excellent";
  if (score >= 70) return "good";
  if (score >= 60) return "fair";
  return "needs_improvement";
}

export function getPerformanceRatingLabel(rating: PerformanceRating): string {
  const labels: Record<PerformanceRating, string> = {
    outstanding: "Outstanding",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needs_improvement: "Needs Improvement",
  };
  return labels[rating];
}

// KPI Performance 60% | Attendance 10% | Compliance 10% | Manager Review 10% | Peer Review 10%
export function calculateAppraisalScore(params: {
  kpiScore: number;
  attendanceScore: number;
  complianceScore: number;
  managerReviewScore: number;
  peerReviewScore: number;
}) {
  const totalScore =
    params.kpiScore * 0.6 + params.attendanceScore * 0.1 + params.complianceScore * 0.1 + params.managerReviewScore * 0.1 + params.peerReviewScore * 0.1;
  const rounded = Math.round(totalScore * 100) / 100;
  return { ...params, totalScore: rounded, rating: getPerformanceRating(rounded) };
}

export function calculateDepartmentScore(employeeScores: number[]): number {
  if (employeeScores.length === 0) return 0;
  const total = employeeScores.reduce((sum, score) => sum + score, 0);
  return Math.round((total / employeeScores.length) * 100) / 100;
}

export function isKPIOverdue(dueDate: Date, status: string): boolean {
  if (status === "completed" || status === "approved") return false;
  return new Date() > new Date(dueDate);
}

export function getKPIPeriod(type: "weekly" | "monthly" | "quarterly" | "annual"): { start: Date; end: Date } {
  const now = new Date();
  switch (type) {
    case "weekly": {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "monthly": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "quarterly": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "annual": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
}