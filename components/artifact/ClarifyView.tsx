import { AlertCircle } from "lucide-react";
import type { ClarifyArtifact } from "@/types/agent";

export function ClarifyView({ artifact }: { artifact: ClarifyArtifact }) {
  const isError = artifact.title === "请求失败";
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <AlertCircle className={`h-5 w-5 ${isError ? "text-accent" : "text-note"}`} />
        <h2 className="font-semibold">{artifact.title}</h2>
      </div>
      <p className="mt-3 text-sm text-muted">{artifact.nextQuestion}</p>
      {!isError && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(artifact.missing ?? []).map((item) => (
            <span key={item} className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
              {item}
            </span>
          ))}
          {(!artifact.missing || artifact.missing.length === 0) && (
            <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
              请描述你的需求，例如：帮我优化简历、开始模拟面试、复盘面试、深挖项目
            </span>
          )}
        </div>
      )}
    </section>
  );
}
