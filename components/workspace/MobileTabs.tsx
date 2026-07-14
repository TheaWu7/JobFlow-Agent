import { cn } from "@/lib/utils";

export function MobileTabs({ view, onChange }: { view: "chat" | "artifact"; onChange: (v: "chat" | "artifact") => void }) {
  return (
    <div className="flex gap-2 lg:hidden">
      <button
        className={cn("h-10 flex-1 rounded-md border text-sm", view === "chat" ? "border-brand bg-white text-brand" : "border-line bg-panel text-muted")}
        onClick={() => onChange("chat")}
        type="button"
      >
        Chat
      </button>
      <button
        className={cn("h-10 flex-1 rounded-md border text-sm", view === "artifact" ? "border-brand bg-white text-brand" : "border-line bg-panel text-muted")}
        onClick={() => onChange("artifact")}
        type="button"
      >
        Artifact
      </button>
    </div>
  );
}
