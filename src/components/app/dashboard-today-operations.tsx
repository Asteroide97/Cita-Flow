import Link from "next/link";

import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import { CompactStatCard } from "@/components/ui/compact-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardTodayOperationsSummary } from "@/lib/dashboard/today-operations";

type DashboardTodayOperationsProps = {
  summary: DashboardTodayOperationsSummary;
  agendaHref: string;
};

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
            Hoy
          </h2>
        </div>

        <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          {summary.dateLabel}
        </div>
      </div>

      {summary.totalReservations === 0 ? (
        <EmptyState title="No hay reservas hoy." className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CompactStatCard
            label="Reservas"
            value={summary.totalReservations}
            tone="brand"
          />
          <CompactStatCard
            label="Confirmadas"
            value={summary.confirmedCount}
            tone="emerald"
          />
          <CompactStatCard
            label="Pendientes"
            value={summary.pendingCount}
            tone="amber"
          />
          <CompactStatCard
            label="Proxima"
            value={summary.nextAppointment?.timeLabel ?? "Sin proximas"}
            note={summary.nextAppointment?.summary ?? "Sin reservas activas pendientes."}
            tone="slate"
          />
          <CompactStatCard
            label="Huecos libres"
            value={summary.remainingSlotsTodayCount ?? "--"}
            note={summary.remainingSlotsTodayNote}
            tone="brand"
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={agendaHref}
          className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
        >
          Ver agenda de hoy
        </Link>
      </div>

      <CollapsibleDetails summary="Ver detalles" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStatCard
            label="Canceladas"
            value={summary.cancelledCount}
            tone="slate"
          />
          <CompactStatCard
            label="Completadas"
            value={summary.completedCount}
            tone="emerald"
          />
          <CompactStatCard
            label="No-show"
            value={summary.noShowCount}
            tone="amber"
          />
          <CompactStatCard
            label="Profesionales con reservas"
            value={summary.professionalsWithReservationsCount}
            tone="brand"
          />
        </div>
      </CollapsibleDetails>
    </section>
  );
}
