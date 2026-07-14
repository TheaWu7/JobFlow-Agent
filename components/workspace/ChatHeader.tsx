import { Sparkles } from "lucide-react";
import { clearWorkspaceDraft } from "@/lib/workspaceState";

export function ChatHeader() {
  return (
    <div className="border-b border-line p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-semibold">Agent Workspace</h1>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted hover:border-line hover:bg-panel hover:text-accent"
          type="button"
          title="清空对话，重新开始"
          onClick={() => clearWorkspaceDraft()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        自然语言是唯一业务入口；Agent 自动识别任务、补齐素材并生成右侧结果。
      </p>
    </div>
  );
}
