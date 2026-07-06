import { CompactStatCard } from "@/components/ui/compact-stat-card";
import type { AppointmentSummary } from "@/types/appointments";

type AppointmentsOverviewProps = {
  summary: AppointmentSummary;
};

export function AppointmentsOverview({
  summary,
}: AppointmentsOverviewProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
        Resumen
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <CompactStatCard label="Filtradas" value={summary.total} tone="brand" />
        <CompactStatCard label="Hoy" value={summary.today} tone="slate" />
        <CompactStatCard
          label="Confirmadas"
          value={summary.confirmed}
          tone="emerald"
        />
        <CompactStatCard
          label="Pendientes"
          value={summary.pending}
          tone="amber"
        />
      </div>
    </article>
  );
}
