import type { ReactNode } from "react";

export function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-4 shadow-soft">
      <span className="text-brand">{icon}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
