import { AlertCircle, ClipboardList } from "lucide-react";
import type { Artifact } from "@/types/agent";
import { ResumeView } from "./ResumeView";
import { InterviewView } from "./InterviewView";
import { ReviewView } from "./ReviewView";
import { ProjectView } from "./ProjectView";
import { ClarifyView } from "./ClarifyView";

export function ArtifactPanel({ artifact }: { artifact: Artifact | null }) {
  if (!artifact) {
    return (
      <section className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
        <ClipboardList className="mb-4 h-10 w-10 text-brand" />
        <h2 className="text-lg font-semibold text-ink">Artifact 结果面板</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          在左侧直接描述需求或粘贴 JD、简历、项目材料。Agent 会自动识别任务并在这里切换结构化结果。
        </p>
      </section>
    );
  }

  if (artifact.type === "resume") return <ResumeView artifact={artifact} />;
  if (artifact.type === "interview") return <InterviewView artifact={artifact} />;
  if (artifact.type === "review") return <ReviewView artifact={artifact} />;
  if (artifact.type === "project") return <ProjectView artifact={artifact} />;
  if (artifact.type === "clarify") return <ClarifyView artifact={artifact} />;

  const fallback = artifact as unknown as { type?: string; title?: string };
  console.error("[ArtifactPanel] 未识别的 artifact type:", fallback.type, "artifact:", artifact);
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-accent" />
        <h2 className="font-semibold">{fallback.title ?? "未知 Artifact"}</h2>
      </div>
      <p className="mt-3 text-sm text-muted">未知的 Artifact 类型：{fallback.type ?? "(空)"}，请刷新页面重试。</p>
    </section>
  );
}
