import Link from "next/link";

import type {
  CalendarAppointment,
  CalendarDayDefinition,
  CalendarDoctorOption,
} from "@/types/calendar";

import { CalendarAppointmentBlock } from "./calendar-appointment-block";
import { CalendarEmptyState } from "./calendar-empty-state";
import {
  buildCalendarAppointmentLayouts,
  buildCalendarPath,
  buildCalendarHourRows,
  CALENDAR_TIMELINE_HEIGHT,
} from "./calendar-helpers";

type CalendarDayViewProps = {
  day: CalendarDayDefinition;
  appointments: CalendarAppointment[];
  timezone: string;
  doctorId: string;
  doctors: CalendarDoctorOption[];
  selectedAppointmentId?: string;
  selectedServiceLabel?: string | null;
  createLinksByDoctorId: Record<string, string>;
  availableSlotsByDoctorId: Record<
    string,
    Array<{
      startTime: string;
      endTime: string;
      href: string;
    }>
  >;
};

function DoctorSlotSummary({
  slots,
  selectedServiceLabel,
}: {
  slots: Array<{ startTime: string; endTime: string; href: string }>;
  selectedServiceLabel?: string | null;
}) {
  if (!slots.length) {
    return (
      <p className="text-sm leading-7 text-muted">
        {selectedServiceLabel
          ? `Sin huecos libres para ${selectedServiceLabel.toLowerCase()}.`
          : "Sin huecos libres calculados para hoy."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.slice(0, 4).map((slot) => (
        <Link
          key={`${slot.startTime}-${slot.endTime}`}
          href={slot.href}
          className="inline-flex rounded-full border border-dashed border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-100"
        >
          {slot.startTime}
        </Link>
      ))}
      {slots.length > 4 ? (
        <span className="inline-flex rounded-full border border-line/80 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          +{slots.length - 4} huecos
        </span>
      ) : null}
    </div>
  );
}

export function CalendarDayView({
  day,
  appointments,
  timezone,
  doctorId,
  doctors,
  selectedAppointmentId,
  selectedServiceLabel = null,
  createLinksByDoctorId,
  availableSlotsByDoctorId,
}: CalendarDayViewProps) {
  const hourRows = buildCalendarHourRows();
  const hourLines = hourRows.slice(0, -1);
  const visibleDoctors = doctors.length ? doctors : [];
  const appointmentsByDoctorId = appointments.reduce<Record<string, CalendarAppointment[]>>(
    (accumulator, appointment) => {
      if (!accumulator[appointment.doctor.id]) {
        accumulator[appointment.doctor.id] = [];
      }

      accumulator[appointment.doctor.id].push(appointment);

      return accumulator;
    },
    {},
  );
  const hasAnySlots = Object.values(availableSlotsByDoctorId).some((slots) => slots.length);

  if (!appointments.length && !hasAnySlots) {
    return (
      <article className="surface-card p-6 sm:p-7">
        <CalendarEmptyState
          title="No hay reservas para este día."
          description="No hay reservas ni huecos listos para crear una reserva rápida en la fecha seleccionada."
        />
      </article>
    );
  }

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-line/80 px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista diaria
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
              {day.label}
            </h2>
          </div>

          <p className="text-sm text-muted">
            {appointments.length} reserva{appointments.length === 1 ? "" : "s"} en agenda
          </p>
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <div
          className="grid border-b border-line/80"
          style={{
            gridTemplateColumns: `84px repeat(${Math.max(visibleDoctors.length, 1)}, minmax(260px, 1fr))`,
          }}
        >
          <div className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Hora
            </p>
          </div>

          {visibleDoctors.map((doctor) => {
            const dayAppointments = appointmentsByDoctorId[doctor.id] ?? [];
            const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];

            return (
              <div
                key={doctor.id}
                className="border-l border-line/80 bg-white/60 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  {doctor.name}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {dayAppointments.length} reserva
                  {dayAppointments.length === 1 ? "" : "s"}
                  {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={createLinksByDoctorId[doctor.id] ?? "#calendar-quick-create"}
                    className="inline-flex rounded-full border border-line/80 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                  >
                    Crear reserva
                  </Link>
                  <DoctorSlotSummary
                    slots={daySlots}
                    selectedServiceLabel={selectedServiceLabel}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `84px repeat(${Math.max(visibleDoctors.length, 1)}, minmax(260px, 1fr))`,
          }}
        >
          <div className="relative border-r border-line/80 bg-white/70">
            <div
              className="relative px-4"
              style={{ height: `${CALENDAR_TIMELINE_HEIGHT}px` }}
            >
              {hourRows.map((row) => (
                <span
                  key={row.key}
                  className="absolute left-4 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.16em] text-muted"
                  style={{ top: `${row.top}px` }}
                >
                  {row.label}
                </span>
              ))}
            </div>
          </div>

          {visibleDoctors.map((doctor) => {
            const dayAppointments = appointmentsByDoctorId[doctor.id] ?? [];
            const dayLayouts = buildCalendarAppointmentLayouts(dayAppointments, timezone);
            const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];

            return (
              <div
                key={doctor.id}
                className="relative border-r border-line/80 bg-[linear-gradient(180deg,_rgba(248,251,255,0.92)_0%,_rgba(255,255,255,0.98)_100%)] last:border-r-0"
              >
                <div
                  className="relative"
                  style={{ height: `${CALENDAR_TIMELINE_HEIGHT}px` }}
                >
                  {hourLines.map((row) => (
                    <div
                      key={row.key}
                      className="absolute inset-x-0 border-t border-dashed border-line/80"
                      style={{ top: `${row.top}px` }}
                    />
                  ))}

                  {!dayAppointments.length ? (
                    <div className="absolute inset-x-4 top-6 rounded-[20px] border border-dashed border-line/80 bg-white/80 px-4 py-4 text-sm text-muted">
                      {daySlots.length
                        ? "Sin reservas todavía. Puedes usar un hueco libre para crear una."
                        : "Sin reservas ni huecos libres visibles para este profesional."}
                    </div>
                  ) : null}

                  {dayLayouts.map((layout) => (
                    <CalendarAppointmentBlock
                      key={layout.appointment.id}
                      appointment={layout.appointment}
                      timezone={timezone}
                      href={buildCalendarPath({
                        view: "day",
                        date: day.dateValue,
                        doctorId: doctorId || undefined,
                        appointmentId: layout.appointment.id,
                      })}
                      isSelected={selectedAppointmentId === layout.appointment.id}
                      variant="day"
                      layout={layout}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {visibleDoctors.map((doctor) => {
          const dayAppointments = appointmentsByDoctorId[doctor.id] ?? [];
          const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];

          return (
            <section
              key={doctor.id}
              className="rounded-[26px] border border-line/80 bg-white/92 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
                    {doctor.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {doctor.specialty ?? "Agenda del día"}
                  </p>
                </div>

                <span className="text-sm font-medium text-muted">
                  {dayAppointments.length} reserva
                  {dayAppointments.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-3">
                  <Link
                    href={createLinksByDoctorId[doctor.id] ?? "#calendar-quick-create"}
                    className="inline-flex rounded-full border border-line/80 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    Crear reserva
                  </Link>
                </div>
                <DoctorSlotSummary
                  slots={daySlots}
                  selectedServiceLabel={selectedServiceLabel}
                />
              </div>

              {dayAppointments.length ? (
                <div className="mt-4 grid gap-3">
                  {dayAppointments.map((appointment) => (
                    <CalendarAppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      timezone={timezone}
                      href={buildCalendarPath({
                        view: "day",
                        date: day.dateValue,
                        doctorId: doctorId || undefined,
                        appointmentId: appointment.id,
                      })}
                      isSelected={selectedAppointmentId === appointment.id}
                      variant="list"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-muted">
                  No hay reservas para este profesional en el día seleccionado.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </article>
  );
}
