export function TextBlock({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <div className="mt-3 rounded-md bg-white/70 p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-sm leading-6 ${strong ? "text-ink" : "text-muted"}`}>{text}</p>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TwoColumn({
  titleLeft, titleRight, left, right
}: {
  titleLeft: string; titleRight: string; left: string[]; right: string[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ListPanel title={titleLeft} items={left} />
      <ListPanel title={titleRight} items={right} />
    </div>
  );
}
