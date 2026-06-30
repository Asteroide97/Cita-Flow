import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  note: string;
  tone: "brand" | "emerald" | "amber" | "slate";
};

const toneClasses = {
  brand: "border-brand-100 bg-brand-50 text-brand-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export function MetricCard({ label, value, note, tone }: MetricCardProps) {
  return (
    <article className="surface-card p-6">
      <div
        className={cn(
          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
          toneClasses[tone],
        )}
      >
        {label}
      </div>

      <p className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-ink">{value}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{note}</p>
    </article>
  );
}
