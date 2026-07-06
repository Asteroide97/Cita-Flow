import { cn } from "@/lib/utils";

type CompactStatCardProps = {
  label: string;
  value: string | number;
  note?: string;
  tone?: "brand" | "emerald" | "amber" | "slate";
  className?: string;
};

const toneClasses = {
  brand: "text-brand-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  slate: "text-slate-700",
};

export function CompactStatCard({
  label,
  value,
  note,
  tone = "brand",
  className,
}: CompactStatCardProps) {
  return (
    <article className={cn("rounded-[22px] border border-line/80 bg-white/92 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className={cn("mt-3 text-2xl font-semibold tracking-[-0.05em]", toneClasses[tone])}>
        {value}
      </p>
      {note ? (
        <p className="mt-2 text-xs font-medium leading-5 text-muted">{note}</p>
      ) : null}
    </article>
  );
}
