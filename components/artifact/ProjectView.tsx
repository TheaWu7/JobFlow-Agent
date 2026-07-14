import { Star } from "lucide-react";
import type { ProjectArtifact } from "@/types/agent";
import { PanelTitle } from "@/components/ui/PanelTitle";
import { TagGroup } from "@/components/ui/TagGroup";

export function ProjectView({ artifact }: { artifact: ProjectArtifact }) {
  return (
    <section className="space-y-4">
      <PanelTitle icon={<Star className="h-5 w-5" />} title={artifact.title} />
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(artifact.star).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-brand">{key}</p>
            <p className="mt-2 text-sm leading-6 text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">口述脚本</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{artifact.pitchScript}</p>
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">高频追问</h3>
        <div className="mt-3 space-y-3">
          {artifact.followUps.map((item) => (
            <div key={item.question} className="rounded-md bg-panel p-3">
              <p className="text-sm font-medium">{item.question}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.answerFrame}</p>
            </div>
          ))}
        </div>
      </div>
      <TagGroup title="风险点" items={artifact.riskPoints} tone="warn" />
    </section>
  );
}
