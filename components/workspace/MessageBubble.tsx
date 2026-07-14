import type { ChatMessage } from "@/types/agent";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  return (
    <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6",
          message.role === "user" ? "bg-brand text-white" : "bg-panel text-ink"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content || (isStreaming ? " " : "")}</p>
        {message.attachments?.length ? (
          <div className="mt-2 space-y-1">
            {message.attachments.map((file) => (
              <div key={file.id} className="rounded-md bg-white/15 px-2 py-1 text-xs">
                {file.name} · {file.status === "ready" ? "已读取" : file.error}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
