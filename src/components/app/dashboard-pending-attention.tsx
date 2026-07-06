import Link from "next/link";

import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import { CompactStatCard } from "@/components/ui/compact-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardPendingAttentionSummary } from "@/lib/dashboard/today-operations";

type DashboardPendingAttentionProps = {
  summary: DashboardPendingAttentionSummary;
  pendingAppointmentsHref: string;
  waitlistHref: string;
  notificationsHref: string;
};

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
    >
      {label}
    </Link>
  );
}

export function DashboardPendingAttention({
  summary,
  pendingAppointmentsHref,
  waitlistHref,
  notificationsHref,
}: DashboardPendingAttentionProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Pendientes de atencion
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            Pendientes
          </h2>
        </div>

        {summary.totalPendingCount === 0 ? (
          <EmptyState title="No hay pendientes por atender." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <CompactStatCard
              label="Reservas"
              value={summary.pendingAppointmentsCount}
              tone="amber"
            />
            <CompactStatCard
              label="Lista de espera"
              value={summary.activeWaitlistEntriesCount}
              tone="brand"
            />
            <CompactStatCard
              label="Notificaciones"
              value={summary.pendingNotificationsCount}
              tone="slate"
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ActionLink href={pendingAppointmentsHref} label="Ver reservas pendientes" />
        <ActionLink href={waitlistHref} label="Ver lista de espera" />
        <ActionLink href={notificationsHref} label="Ver notificaciones" />
      </div>

      <CollapsibleDetails summary="Ver detalles" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <CompactStatCard
            label="Reservas pendientes"
            value={summary.pendingAppointmentsCount}
            tone="amber"
          />
          <CompactStatCard
            label="Lista de espera activa"
            value={summary.activeWaitlistEntriesCount}
            tone="brand"
          />
          <CompactStatCard
            label="Notificaciones pendientes"
            value={summary.pendingNotificationsCount}
            tone="slate"
          />
          <CompactStatCard
            label="Ofertas pendientes"
            value={summary.pendingWaitlistOffersCount}
            tone="emerald"
          />
        </div>
      </CollapsibleDetails>
    </section>
  );
}
