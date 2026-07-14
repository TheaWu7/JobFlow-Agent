import { CheckCircle2 } from "lucide-react";
import type { ReviewArtifact } from "@/types/agent";
import { clamp } from "@/lib/utils";
import { PanelTitle } from "@/components/ui/PanelTitle";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { TwoColumn } from "@/components/ui/TextBlock";

export function ReviewView({ artifact, compact = false }: { artifact: ReviewArtifact; compact?: boolean }) {
  return (
    <section className="space-y-4">
      {!compact && <PanelTitle icon={<CheckCircle2 className="h-5 w-5" />} title={artifact.title} />}
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <ScoreCard label="综合评分" score={artifact.overallScore} />
        <div className="rounded-lg border border-line bg-white p-4">
          <h3 className="text-sm font-semibold">短板标签</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {artifact.weaknessTags.map((item) => (
              <span key={item} className="rounded-md bg-accent/10 px-2 py-1 text-xs text-accent">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">维度评分</h3>
        <div className="mt-3 space-y-3">
          {artifact.dimensionScores.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span>{item.score}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-panel">
                <div className="h-2 rounded-full bg-note" style={{ width: `${clamp(item.score, 0, 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{item.evidence}</p>
            </div>
          ))}
        </div>
      </div>
      <TwoColumn titleLeft="改进建议" left={artifact.improvements} titleRight="练习计划" right={artifact.practicePlan} />
    </section>
  );
}
