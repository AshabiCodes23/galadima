import { getPerformanceRating } from "@/lib/calculator";

export default function PerformanceBar({ score }: { score: number }) {
  const rating = getPerformanceRating(score).replace(/_/g, "-");
  return (
    <div className="perf-bar">
      <div className={`perf-bar-fill ${rating}`} style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
    </div>
  );
}