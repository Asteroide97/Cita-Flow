import Link from "next/link";

import type { DashboardPendingAttentionSummary } from "@/lib/dashboard/today-operations";

type DashboardPendingAttentionProps = {
  summary: DashboardPendingAttentionSummary;
  pendingAppointmentsHref: string;
  waitlistHref: string;
  notificationsHref: string;
};

type PendingCardProps = {
  label: string;
  value: number;
  helper: string;
};

function PendingCard({ label, value, helper }: PendingCardProps) {
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
            Cola operativa del negocio
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Elementos que todavia requieren seguimiento manual desde reservas,
            lista de espera y notificaciones.
          </p>
        </div>

        {summary.totalPendingCount === 0 ? (
          <div className="rounded-[24px] border border-dashed border-line bg-surface-soft px-5 py-4 text-sm text-muted">
            No hay pendientes por atender.
          </div>
        ) : (
          <div className="rounded-[24px] border border-amber-100 bg-amber-50/55 px-5 py-4 text-sm text-amber-800">
            Hay {summary.totalPendingCount} elemento
            {summary.totalPendingCount === 1 ? "" : "s"} pendiente
            {summary.totalPendingCount === 1 ? "" : "s"} por revisar hoy.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <PendingCard
          label="Reservas pendientes"
          value={summary.pendingAppointmentsCount}
          helper="Reservas en estado PENDING listas para confirmar o revisar."
        />
        <PendingCard
          label="Lista de espera activa"
          value={summary.activeWaitlistEntriesCount}
          helper="Entradas ACTIVE u OFFERED esperando seguimiento."
        />
        <PendingCard
          label="Notificaciones pendientes"
          value={summary.pendingNotificationsCount}
          helper="Mensajes en cola que aun no cambian de estado."
        />
        <PendingCard
          label="Ofertas de lista de espera"
          value={summary.pendingWaitlistOffersCount}
          helper="Ofertas PENDING que aun no han sido aceptadas o rechazadas."
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ActionLink href={pendingAppointmentsHref} label="Ver reservas pendientes" />
        <ActionLink href={waitlistHref} label="Ver lista de espera" />
        <ActionLink href={notificationsHref} label="Ver notificaciones" />
      </div>
    </section>
  );
}
