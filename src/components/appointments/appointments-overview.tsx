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
        Resumen rapido
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Filtradas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {summary.total}
          </p>
        </div>
        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Hoy
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {summary.today}
          </p>
        </div>
        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Confirmadas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {summary.confirmed}
          </p>
        </div>
        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Pendientes
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {summary.pending}
          </p>
        </div>
      </div>
    </article>
  );
}
