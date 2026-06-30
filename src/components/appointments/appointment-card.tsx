import type { AppointmentListItem } from "@/types/appointments";

import {
  appointmentSourceLabels,
  formatAppointmentMoney,
  formatAppointmentPhone,
} from "./appointment-helpers";
import { AppointmentActions } from "./appointment-actions";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";

type AppointmentCardProps = {
  appointment: AppointmentListItem;
  timezone: string;
  currency: string;
  statusAction: (formData: FormData) => void | Promise<void>;
};

export function AppointmentCard({
  appointment,
  timezone,
  currency,
  statusAction,
}: AppointmentCardProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
            {appointment.patient.name}
          </p>
          <p className="mt-2 text-sm text-muted">
            {formatAppointmentPhone(appointment.patient.phoneE164)}
            {appointment.patient.email ? ` - ${appointment.patient.email}` : ""}
          </p>
        </div>

        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Doctor
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {appointment.doctor.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.doctor.specialty ?? "Sin especialidad"}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Servicio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {appointment.service.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.service.durationMinutes} min -{" "}
            {formatAppointmentMoney(appointment.service.priceCents, currency)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha y hora
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatDateTimeInTimeZone(appointment.startAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Hasta {formatDateTimeInTimeZone(appointment.endAt, timezone)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Origen
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {appointmentSourceLabels[appointment.source]}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.notes ?? "Sin notas internas"}
          </p>
        </div>
      </div>

      <AppointmentActions
        appointmentId={appointment.id}
        status={appointment.status}
        action={statusAction}
      />
    </article>
  );
}
