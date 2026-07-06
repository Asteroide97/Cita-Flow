import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import { getDevelopmentAppointmentLinks } from "@/lib/appointments/tokens";
import type { AppointmentListItem } from "@/types/appointments";

import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import {
  appointmentSourceLabels,
  formatAppointmentMoney,
  formatAppointmentPhone,
} from "./appointment-helpers";
import { AppointmentActions } from "./appointment-actions";
import { AppointmentSelfServiceLinks } from "./appointment-self-service-links";
import { AppointmentStatusBadge } from "./appointment-status-badge";

type AppointmentCardProps = {
  appointment: AppointmentListItem;
  timezone: string;
  currency: string;
  statusAction: (formData: FormData) => void | Promise<void>;
};

function CompactField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function AppointmentCard({
  appointment,
  timezone,
  currency,
  statusAction,
}: AppointmentCardProps) {
  const initialLinks =
    process.env.NODE_ENV !== "production"
      ? getDevelopmentAppointmentLinks(appointment.id)
      : null;
  const detailsLabelParts = [
    formatAppointmentPhone(appointment.patient.phoneE164),
    appointment.patient.email,
  ].filter(Boolean);

  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-[-0.04em] text-ink">
            {appointment.patient.name}
          </p>
          <p className="mt-2 text-sm text-muted">
            {formatDateTimeInTimeZone(appointment.startAt, timezone)}
          </p>
        </div>

        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CompactField label="Servicio" value={appointment.service.name} />
        <CompactField label="Profesional" value={appointment.doctor.name} />
        <CompactField
          label="Fecha y hora"
          value={formatDateTimeInTimeZone(appointment.startAt, timezone)}
        />
        <CompactField
          label="Origen"
          value={appointmentSourceLabels[appointment.source]}
        />
      </div>

      <AppointmentActions
        appointmentId={appointment.id}
        status={appointment.status}
        action={statusAction}
        visibleActions={["confirm", "cancel"]}
      />

      <CollapsibleDetails summary="Ver detalles" className="mt-5">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CompactField
              label="Cliente"
              value={detailsLabelParts.join(" - ") || "Sin contacto"}
            />
            <CompactField
              label="Hasta"
              value={formatDateTimeInTimeZone(appointment.endAt, timezone)}
            />
            <CompactField
              label="Duracion"
              value={`${appointment.service.durationMinutes} min`}
            />
            <CompactField
              label="Precio"
              value={formatAppointmentMoney(appointment.service.priceCents, currency)}
            />
          </div>

          <div className="rounded-[18px] border border-line/80 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Notas internas
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {appointment.notes ?? "Sin notas internas."}
            </p>
          </div>

          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
            action={statusAction}
            visibleActions={["complete", "no-show"]}
          />

          {process.env.NODE_ENV !== "production" ? (
            <AppointmentSelfServiceLinks
              appointmentId={appointment.id}
              initialLinks={initialLinks}
            />
          ) : null}
        </div>
      </CollapsibleDetails>
    </article>
  );
}
