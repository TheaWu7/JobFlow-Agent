import type { UploadedAttachment } from "@/types/agent";
import { cn } from "@/lib/utils";

export function AttachmentPreview({ attachments }: { attachments: UploadedAttachment[] }) {
  if (!attachments.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((file) => (
        <span key={file.id} className={cn("rounded-md border px-2 py-1 text-xs", file.status === "ready" ? "border-brand/30 bg-brand/10 text-brand" : "border-accent/30 bg-accent/10 text-accent")}>
          {file.name}
        </span>
      ))}
    </div>
  );
}
