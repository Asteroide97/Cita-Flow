import Link from "next/link";

import {
  appointmentSourceLabels,
  formatAppointmentMoney,
  formatAppointmentPhone,
  getAppointmentActionAvailability,
} from "@/components/appointments/appointment-helpers";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Button } from "@/components/ui/button";
import type { CalendarAppointment } from "@/types/calendar";

import {
  formatCalendarDayTitle,
  formatCalendarTimeRange,
} from "./calendar-helpers";

type CalendarAppointmentDetailsProps = {
  appointment: CalendarAppointment | null;
  timezone: string;
  currency: string;
  redirectPath: string;
  clearSelectionHref: string;
  action: (formData: FormData) => void | Promise<void>;
};

function CalendarStatusActionButton({
  appointmentId,
  intent,
  label,
  redirectPath,
  action,
  className,
}: {
  appointmentId: string;
  intent: "confirm" | "cancel" | "complete" | "no-show";
  label: string;
  redirectPath: string;
  action: (formData: FormData) => void | Promise<void>;
  className: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <Button type="submit" variant="secondary" className={className}>
        {label}
      </Button>
    </form>
  );
}

export function CalendarAppointmentDetails({
  appointment,
  timezone,
  currency,
  redirectPath,
  clearSelectionHref,
  action,
}: CalendarAppointmentDetailsProps) {
  if (!appointment) {
    return (
      <article className="surface-card p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          Detalle de reserva
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
          Selecciona una reserva
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Haz clic sobre un bloque de la agenda para revisar al cliente, el servicio,
          la hora y ejecutar acciones rápidas desde esta vista.
        </p>
      </article>
    );
  }

  const actionAvailability = getAppointmentActionAvailability(appointment.status);

  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Detalle de reserva
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            {appointment.patient.name}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {formatAppointmentPhone(appointment.patient.phoneE164)}
            {appointment.patient.email ? ` - ${appointment.patient.email}` : ""}
          </p>
        </div>

        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha y hora
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatCalendarDayTitle(appointment.startAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatCalendarTimeRange(appointment.startAt, appointment.endAt, timezone)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Profesional y servicio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {appointment.doctor.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.service.name} - {appointment.service.durationMinutes} min
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Precio y origen
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatAppointmentMoney(appointment.service.priceCents, currency)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointmentSourceLabels[appointment.source]}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Notas internas
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            {appointment.notes ?? "Sin notas internas registradas."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {actionAvailability.canConfirm ? (
          <CalendarStatusActionButton
            appointmentId={appointment.id}
            intent="confirm"
            label="Confirmar"
            redirectPath={redirectPath}
            action={action}
            className="border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100"
          />
        ) : null}

        {actionAvailability.canCancel ? (
          <CalendarStatusActionButton
            appointmentId={appointment.id}
            intent="cancel"
            label="Cancelar"
            redirectPath={redirectPath}
            action={action}
            className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
          />
        ) : null}

        {actionAvailability.canComplete ? (
          <CalendarStatusActionButton
            appointmentId={appointment.id}
            intent="complete"
            label="Marcar completada"
            redirectPath={redirectPath}
            action={action}
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
          />
        ) : null}

        {actionAvailability.canNoShow ? (
          <CalendarStatusActionButton
            appointmentId={appointment.id}
            intent="no-show"
            label="Marcar no-show"
            redirectPath={redirectPath}
            action={action}
            className="border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
          />
        ) : null}
      </div>

      <div className="mt-6">
        <Link
          href={clearSelectionHref}
          className="inline-flex items-center rounded-full border border-line/80 bg-white px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-ink"
        >
          Cerrar detalle
        </Link>
      </div>
    </article>
  );
}
