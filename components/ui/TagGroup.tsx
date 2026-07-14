import { cn } from "@/lib/utils";

export function TagGroup({
  title,
  items,
  tone = "default"
}: {
  title: string;
  items: string[];
  tone?: "default" | "warn";
}) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "rounded-md px-2 py-1 text-xs",
              tone === "warn" ? "bg-accent/10 text-accent" : "bg-brand/10 text-brand"
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
