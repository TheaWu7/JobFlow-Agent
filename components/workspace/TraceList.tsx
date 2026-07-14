import type { AgentTraceStep } from "@/types/agent";
import { cn } from "@/lib/utils";

export function TraceList({ trace }: { trace: AgentTraceStep[] }) {
  if (!trace.length) return null;
  return (
    <div className="border-t border-line bg-panel/60 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase text-muted">Agent Trace</p>
      <div className="space-y-2">
        {trace.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-muted">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                item.status === "done" && "bg-brand",
                item.status === "running" && "bg-note",
                item.status === "pending" && "bg-line",
                item.status === "error" && "bg-accent"
              )}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
