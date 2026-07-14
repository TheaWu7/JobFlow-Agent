import { FileText } from "lucide-react";
import type { ResumeArtifact } from "@/types/agent";
import { PanelTitle } from "@/components/ui/PanelTitle";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { TagGroup } from "@/components/ui/TagGroup";
import { TwoColumn } from "@/components/ui/TextBlock";
import { TextBlock } from "@/components/ui/TextBlock";

export function ResumeView({ artifact }: { artifact: ResumeArtifact }) {
  return (
    <section className="space-y-4">
      <PanelTitle icon={<FileText className="h-5 w-5" />} title={artifact.title} />
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <ScoreCard label="匹配度" score={artifact.matchScore} />
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">{artifact.jdSummary.role}</p>
          <p className="mt-1 text-xs text-muted">{artifact.jdSummary.seniority}</p>
          <TagGroup title="硬性要求" items={artifact.jdSummary.mustHave} />
          <TagGroup title="加分项" items={artifact.jdSummary.niceToHave} />
        </div>
      </div>
      <TwoColumn titleLeft="匹配优势" left={artifact.strengths} titleRight="待补短板" right={artifact.gaps} />
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">简历优化对比</h3>
        <div className="mt-3 space-y-3">
          {artifact.optimizations.map((item) => (
            <div key={item.section} className="rounded-md border border-line bg-panel p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.section}</span>
                <span className="text-xs text-muted">{item.reason}</span>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                <TextBlock label="Before" text={item.before} />
                <TextBlock label="After" text={item.after} strong />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
