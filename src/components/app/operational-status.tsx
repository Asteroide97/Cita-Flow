import Link from "next/link";

import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import { cn } from "@/lib/utils";
import type {
  OperationalStatusCheck,
  OperationalStatusLevel,
} from "@/lib/dashboard/operational-status";

type OperationalStatusProps = {
  level: OperationalStatusLevel;
  label: string;
  headline: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  actionTarget?: "_self" | "_blank";
  checks: OperationalStatusCheck[];
};

const levelClasses: Record<
  OperationalStatusLevel,
  {
    badge: string;
    panel: string;
    icon: string;
  }
> = {
  READY: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    panel: "border-emerald-100 bg-emerald-50/50",
    icon: "bg-emerald-100 text-emerald-700",
  },
  ATTENTION: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    panel: "border-amber-100 bg-amber-50/45",
    icon: "bg-amber-100 text-amber-700",
  },
  NO_AVAILABILITY: {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    panel: "border-slate-200 bg-slate-50/90",
    icon: "bg-slate-200 text-slate-700",
  },
};

function CheckItem({ check }: { check: OperationalStatusCheck }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border p-4",
        check.isComplete
          ? "border-emerald-100 bg-emerald-50/50"
          : "border-line/80 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold",
            check.isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
          )}
        >
          {check.isComplete ? "OK" : "--"}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{check.label}</p>
          {check.note ? <p className="mt-2 text-sm leading-6 text-muted">{check.note}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function OperationalStatus({
  level,
  label,
  headline,
  description,
  actionHref,
  actionLabel,
  actionTarget,
  checks,
}: OperationalStatusProps) {
  const classes = levelClasses[level];

  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Estado operativo
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                classes.badge,
              )}
            >
              {label}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold tracking-[-0.05em] text-ink sm:text-3xl">
            {headline}
          </h2>
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>

        <div
          className={cn(
            "w-full rounded-[28px] border p-5 sm:p-6 xl:max-w-sm",
            classes.panel,
          )}
        >
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                classes.icon,
              )}
            >
              {level === "READY" ? "OK" : level === "NO_AVAILABILITY" ? "00" : "!"}
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Accion recomendada</p>
              <p className="mt-2 text-sm leading-6 text-muted">{actionLabel}</p>
            </div>
          </div>

          <Link
            href={actionHref}
            target={actionTarget}
            rel={actionTarget === "_blank" ? "noreferrer" : undefined}
            className="mt-5 inline-flex w-full justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            {actionLabel}
          </Link>
        </div>
      </div>

      <CollapsibleDetails summary="Ver detalles" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </div>
      </CollapsibleDetails>
    </section>
  );
}
