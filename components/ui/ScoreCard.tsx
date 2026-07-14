import { clamp } from "@/lib/utils";

export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-brand">{score}</p>
      <div className="mt-3 h-2 rounded-full bg-panel">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${clamp(score, 0, 100)}%` }} />
      </div>
    </div>
  );
}
