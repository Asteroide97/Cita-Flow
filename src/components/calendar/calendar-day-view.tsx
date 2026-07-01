import type {
  CalendarAppointment,
  CalendarDayDefinition,
} from "@/types/calendar";

import { CalendarAppointmentBlock } from "./calendar-appointment-block";
import { CalendarEmptyState } from "./calendar-empty-state";
import {
  buildCalendarAppointmentLayouts,
  buildCalendarHourRows,
  buildCalendarPath,
  CALENDAR_TIMELINE_HEIGHT,
} from "./calendar-helpers";

type CalendarDayViewProps = {
  day: CalendarDayDefinition;
  appointments: CalendarAppointment[];
  timezone: string;
  doctorId: string;
  selectedAppointmentId?: string;
};

export function CalendarDayView({
  day,
  appointments,
  timezone,
  doctorId,
  selectedAppointmentId,
}: CalendarDayViewProps) {
  const hourRows = buildCalendarHourRows();
  const hourLines = hourRows.slice(0, -1);
  const layouts = buildCalendarAppointmentLayouts(appointments, timezone);

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

      {!appointments.length ? (
        <div className="p-6 sm:p-7">
          <CalendarEmptyState />
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <div className="grid grid-cols-[84px_minmax(0,1fr)]">
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

              <div className="relative bg-[linear-gradient(180deg,_rgba(248,251,255,0.92)_0%,_rgba(255,255,255,0.98)_100%)]">
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

                  {layouts.map((layout) => (
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
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {appointments.map((appointment) => (
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
        </>
      )}
    </article>
  );
}
