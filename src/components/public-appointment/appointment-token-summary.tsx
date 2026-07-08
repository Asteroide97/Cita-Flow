import { AppointmentSource, AppointmentStatus } from "@prisma/client";

import {
  appointmentSourceLabels,
  appointmentStatusLabels,
  formatAppointmentMoney,
  formatAppointmentPhone,
} from "@/components/appointments/appointment-helpers";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { CalendarLinkActions } from "@/components/ui/calendar-link-actions";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";

type AppointmentTokenSummaryProps = {
  clinicName: string;
  patientName: string;
  phoneE164: string;
  email: string | null;
  doctorName: string;
  doctorSpecialty: string | null;
  serviceName: string;
  priceCents: number | null;
  durationMinutes: number;
  startAt: Date;
  endAt: Date;
  timezone: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  currency: string;
  calendarIcsUrl?: string | null;
  googleCalendarUrl?: string | null;
};

export function AppointmentTokenSummary({
  clinicName,
  patientName,
  phoneE164,
  email,
  doctorName,
  doctorSpecialty,
  serviceName,
  priceCents,
  durationMinutes,
  startAt,
  endAt,
  timezone,
  status,
  source,
  notes,
  currency,
  calendarIcsUrl = null,
  googleCalendarUrl = null,
}: AppointmentTokenSummaryProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Resumen de la reserva
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            {clinicName}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {patientName} · {formatAppointmentPhone(phoneE164)}
            {email ? ` · ${email}` : ""}
          </p>
        </div>

        <AppointmentStatusBadge status={status} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Profesional
          </p>
          <p className="mt-3 text-base font-semibold text-ink">{doctorName}</p>
          <p className="mt-1 text-sm text-muted">
            {doctorSpecialty ?? "Sin rol o especialidad"}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Servicio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">{serviceName}</p>
          <p className="mt-1 text-sm text-muted">
            {durationMinutes} min · {formatAppointmentMoney(priceCents, currency)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha y hora
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatDateTimeInTimeZone(startAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Hasta {formatDateTimeInTimeZone(endAt, timezone)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Estado y origen
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {appointmentStatusLabels[status]}
          </p>
          <p className="mt-1 text-sm text-muted">{appointmentSourceLabels[source]}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-line/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Notas
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {notes ?? "Sin notas adicionales para esta reserva."}
        </p>
      </div>

      <CalendarLinkActions
        calendarIcsUrl={calendarIcsUrl}
        googleCalendarUrl={googleCalendarUrl}
        className="mt-4 flex flex-wrap gap-3"
      />
    </article>
  );
}
