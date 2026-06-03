import { cn, pct } from "@/lib/utils";

export function Progress({ value, alert }: { value: number; alert?: boolean }) {
  const width = pct(value);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
      <div
        className={cn("h-full rounded-full transition-all", alert ? "bg-coral" : "bg-mint")}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
