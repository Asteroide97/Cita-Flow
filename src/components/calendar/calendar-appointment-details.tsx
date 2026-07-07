import Link from "next/link";

import {
  appointmentFieldClassName,
  appointmentSourceLabels,
  formatAppointmentMoney,
  formatAppointmentPhone,
  getAppointmentActionAvailability,
} from "@/components/appointments/appointment-helpers";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { AvailableSlotsPicker } from "@/components/appointments/available-slots-picker";
import { Button } from "@/components/ui/button";
import type { GetAvailableSlotsResult } from "@/lib/appointments/availability";
import type { CalendarAppointment, CalendarViewMode } from "@/types/calendar";

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
  rescheduleAction: (formData: FormData) => void | Promise<void>;
  view: CalendarViewMode;
  calendarDateValue: string;
  doctorFilterId: string;
  rescheduleOpen: boolean;
  rescheduleDateValue: string;
  rescheduleSlotTime: string;
  rescheduleAvailableSlotResult: GetAvailableSlotsResult | null;
  rescheduleOpenHref: string;
  embedded?: boolean;
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
  rescheduleAction,
  view,
  calendarDateValue,
  doctorFilterId,
  rescheduleOpen,
  rescheduleDateValue,
  rescheduleSlotTime,
  rescheduleAvailableSlotResult,
  rescheduleOpenHref,
  embedded = false,
}: CalendarAppointmentDetailsProps) {
  const wrapperClassName = embedded ? "grid gap-5" : "surface-card p-6 sm:p-7";

  if (!appointment) {
    return (
      <article className={wrapperClassName}>
        {!embedded ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Detalle de reserva
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
              Selecciona una reserva
            </h2>
          </>
        ) : null}
        <p className="text-sm leading-7 text-muted">
          Selecciona una reserva de la agenda para ver acciones rápidas.
        </p>
      </article>
    );
  }

  const actionAvailability = getAppointmentActionAvailability(appointment.status);
  const canReschedule = actionAvailability.canCancel;

  return (
    <article id="calendar-appointment-details" className={wrapperClassName}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {!embedded ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Detalle de reserva
            </p>
          ) : null}
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink">
            {appointment.patient.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {formatAppointmentPhone(appointment.patient.phoneE164)}
            {appointment.patient.email ? ` · ${appointment.patient.email}` : ""}
          </p>
        </div>

        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="grid gap-3">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha y hora
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {formatCalendarDayTitle(appointment.startAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatCalendarTimeRange(appointment.startAt, appointment.endAt, timezone)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Cliente
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {appointment.patient.name}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Servicio
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {appointment.service.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointment.doctor.name} · {appointment.service.durationMinutes} min
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Origen
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {appointmentSourceLabels[appointment.source]}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatAppointmentMoney(appointment.service.priceCents, currency)}
          </p>
        </div>

        {appointment.notes ? (
          <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Notas
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{appointment.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
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
            label="Completar"
            redirectPath={redirectPath}
            action={action}
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
          />
        ) : null}

        {actionAvailability.canNoShow ? (
          <CalendarStatusActionButton
            appointmentId={appointment.id}
            intent="no-show"
            label="No-show"
            redirectPath={redirectPath}
            action={action}
            className="border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/app/patients/${appointment.patient.id}`}
          className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white/92 px-5 py-3 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
        >
          Ir al cliente
        </Link>

        {canReschedule ? (
          <Link
            href={rescheduleOpenHref}
            className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white/92 px-5 py-3 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
          >
            Reagendar
          </Link>
        ) : null}
      </div>

      {rescheduleOpen && canReschedule ? (
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <form action="/app/calendar" className="grid gap-4">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={calendarDateValue} />
            <input type="hidden" name="doctorId" value={doctorFilterId} />
            <input type="hidden" name="panel" value="appointment" />
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input
              type="hidden"
              name="rescheduleAppointmentId"
              value={appointment.id}
            />

            <label className="text-sm font-semibold text-ink">
              Nueva fecha
              <input
                type="date"
                name="rescheduleDate"
                defaultValue={rescheduleDateValue}
                className={appointmentFieldClassName}
              />
            </label>

            <Button type="submit" variant="secondary">
              Ver horarios
            </Button>
          </form>

          {rescheduleAvailableSlotResult ? (
            rescheduleAvailableSlotResult.slots.length ? (
              <form action={rescheduleAction} className="mt-4 grid gap-4">
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="date" value={rescheduleDateValue} />
                <input type="hidden" name="redirectPath" value={redirectPath} />
                <input
                  type="hidden"
                  name="successRedirectPath"
                  value={clearSelectionHref}
                />

                <AvailableSlotsPicker
                  slots={rescheduleAvailableSlotResult.slots}
                  selectedSlotTime={rescheduleSlotTime}
                />

                <Button type="submit">Guardar nuevo horario</Button>
              </form>
            ) : (
              <div className="mt-4 rounded-[20px] border border-dashed border-line/80 bg-white px-4 py-4 text-sm text-muted">
                No hay horarios disponibles para esa fecha.
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
