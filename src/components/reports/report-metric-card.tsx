import { cn } from "@/lib/utils";

type ReportMetricCardProps = {
  label: string;
  value: string;
  note: string;
  tone?: "brand" | "emerald" | "amber" | "slate";
};

const toneClasses = {
  brand: "border-brand-100 bg-brand-50 text-brand-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export function ReportMetricCard({
  label,
  value,
  note,
  tone = "slate",
}: ReportMetricCardProps) {
  return (
    <article className="surface-card p-4 sm:p-5">
      <span
        className={cn(
          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
          toneClasses[tone],
        )}
      >
        {label}
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.06em] text-ink sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {note}
      </p>
    </article>
  );
}
