import Link from "next/link";

import type { DashboardTodayOperationsSummary } from "@/lib/dashboard/today-operations";

type DashboardTodayOperationsProps = {
  summary: DashboardTodayOperationsSummary;
  agendaHref: string;
};

type TodayStatCardProps = {
  label: string;
  value: string;
  helper: string;
};

function TodayStatCard({ label, value, helper }: TodayStatCardProps) {
  return (
    <article className="rounded-[24px] border border-line/80 bg-white/92 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">{helper}</p>
    </article>
  );
}

export function DashboardTodayOperations({
  summary,
  agendaHref,
}: DashboardTodayOperationsProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Operacion de hoy
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            Que esta pasando hoy
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Resumen rapido de reservas, proxima atencion y huecos reales restantes
            para el dia de hoy.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          {summary.dateLabel}
        </div>
      </div>

      {summary.totalReservations === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line bg-surface-soft px-5 py-4 text-sm text-muted">
          No hay reservas hoy.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TodayStatCard
          label="Reservas de hoy"
          value={String(summary.totalReservations)}
          helper="Total de reservas registradas en el negocio para hoy."
        />
        <TodayStatCard
          label="Confirmadas"
          value={String(summary.confirmedCount)}
          helper="Reservas listas para atender."
        />
        <TodayStatCard
          label="Pendientes"
          value={String(summary.pendingCount)}
          helper="Reservas que aun requieren confirmacion."
        />
        <TodayStatCard
          label="Canceladas"
          value={String(summary.cancelledCount)}
          helper="Reservas canceladas que se conservan en historial."
        />
        <TodayStatCard
          label="Completadas"
          value={String(summary.completedCount)}
          helper="Reservas ya atendidas hoy."
        />
        <TodayStatCard
          label="No-show"
          value={String(summary.noShowCount)}
          helper="Clientes que no asistieron a su horario."
        />
        <TodayStatCard
          label="Proxima reserva"
          value={summary.nextAppointment?.timeLabel ?? "Sin proximas"}
          helper={
            summary.nextAppointment?.summary ??
            "No hay mas reservas activas pendientes para el resto del dia."
          }
        />
        <TodayStatCard
          label="Profesionales con reservas"
          value={String(summary.professionalsWithReservationsCount)}
          helper="Profesionales con al menos una reserva no cancelada hoy."
        />
        <TodayStatCard
          label="Horarios libres restantes"
          value={
            summary.remainingSlotsTodayCount === null
              ? "--"
              : String(summary.remainingSlotsTodayCount)
          }
          helper={summary.remainingSlotsTodayNote}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={agendaHref}
          className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
        >
          Ver agenda de hoy
        </Link>
      </div>
    </section>
  );
}
