import Link from "next/link";

import { cn } from "@/lib/utils";
import type {
  CalendarAppointment,
  CalendarBlockedTime,
  CalendarDayDefinition,
} from "@/types/calendar";

import { CalendarAppointmentBlock } from "./calendar-appointment-block";
import { CalendarBlockedTimeBlock } from "./calendar-blocked-time-block";
import { CalendarEmptyState } from "./calendar-empty-state";
import {
  buildCalendarAppointmentLayouts,
  buildCalendarBlockedLayouts,
  buildCalendarHourRows,
  CALENDAR_TIMELINE_HEIGHT,
  filterCalendarBlockedTimesForDateValue,
  groupAppointmentsByDateValue,
} from "./calendar-helpers";

type CalendarWeekViewProps = {
  days: CalendarDayDefinition[];
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  timezone: string;
  selectedAppointmentId?: string;
  appointmentHrefsById: Record<string, string>;
  dayHrefByDateValue: Record<string, string>;
};

export function CalendarWeekView({
  days,
  appointments,
  blockedTimes,
  timezone,
  selectedAppointmentId,
  appointmentHrefsById,
  dayHrefByDateValue,
}: CalendarWeekViewProps) {
  const appointmentsByDay = groupAppointmentsByDateValue(appointments, timezone);
  const hourRows = buildCalendarHourRows();
  const hourLines = hourRows.slice(0, -1);

  if (!appointments.length && !blockedTimes.length) {
    return (
      <article className="surface-card p-6 sm:p-7">
        <CalendarEmptyState
          title="No hay reservas esta semana."
          description="Cambia de fecha o crea una nueva reserva desde el panel lateral."
        />
      </article>
    );
  }

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista semana
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
              Semana operativa
            </h2>
          </div>
          <p className="text-sm text-muted">{appointments.length} reservas visibles</p>
        </div>
      </div>

      <div className="hidden xl:block">
        <div
          className="grid border-b border-line/80"
          style={{
            gridTemplateColumns: `76px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="px-3 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Hora
          </div>

          {days.map((day) => {
            const dayAppointments = appointmentsByDay[day.dateValue] ?? [];
            const dayBlockedTimes = filterCalendarBlockedTimesForDateValue(
              blockedTimes,
              day.dateValue,
              timezone,
            );

            return (
              <Link
                key={day.key}
                href={dayHrefByDateValue[day.dateValue] ?? "/app/calendar"}
                className={cn(
                  "border-l border-line/80 px-4 py-4 transition-colors hover:bg-brand-50/50",
                  day.isSelected ? "bg-brand-50/70" : "bg-white/60",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  {day.shortLabel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <span>{dayAppointments.length} reservas</span>
                  {dayBlockedTimes.length ? <span>{dayBlockedTimes.length} bloqueos</span> : null}
                </div>
              </Link>
            );
          })}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `76px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="relative border-r border-line/80 bg-white/70">
            <div
              className="relative px-3"
              style={{ height: `${CALENDAR_TIMELINE_HEIGHT}px` }}
            >
              {hourRows.map((row) => (
                <span
                  key={row.key}
                  className="absolute left-3 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
                  style={{ top: `${row.top}px` }}
                >
                  {row.label}
                </span>
              ))}
            </div>
          </div>

          {days.map((day) => {
            const dayAppointments = appointmentsByDay[day.dateValue] ?? [];
            const dayBlockedTimes = filterCalendarBlockedTimesForDateValue(
              blockedTimes,
              day.dateValue,
              timezone,
            );
            const dayLayouts = buildCalendarAppointmentLayouts(dayAppointments, timezone);
            const dayBlockedLayouts = buildCalendarBlockedLayouts(
              dayBlockedTimes,
              day.dateValue,
              timezone,
            );

            return (
              <div
                key={day.key}
                className={cn(
                  "relative border-r border-line/80 last:border-r-0",
                  day.isSelected ? "bg-brand-50/30" : "bg-white/50",
                )}
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

                  {dayBlockedLayouts.map((layout) => (
                    <CalendarBlockedTimeBlock
                      key={layout.blockedTime.id}
                      blockedTime={layout.blockedTime}
                      timezone={timezone}
                      variant="week"
                      layout={layout}
                    />
                  ))}

                  {dayLayouts.map((layout) => (
                    <CalendarAppointmentBlock
                      key={layout.appointment.id}
                      appointment={layout.appointment}
                      timezone={timezone}
                      href={appointmentHrefsById[layout.appointment.id] ?? "/app/calendar"}
                      isSelected={selectedAppointmentId === layout.appointment.id}
                      variant="week"
                      layout={layout}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:hidden">
        {days.map((day) => {
          const dayAppointments = appointmentsByDay[day.dateValue] ?? [];
          const dayBlockedTimes = filterCalendarBlockedTimesForDateValue(
            blockedTimes,
            day.dateValue,
            timezone,
          );

          return (
            <details
              key={day.key}
              className={cn(
                "rounded-[24px] border px-4 py-4",
                day.isSelected
                  ? "border-brand-200 bg-brand-50/50"
                  : "border-line/80 bg-white/92",
              )}
              open={day.isSelected}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {day.shortLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {dayAppointments.length} reservas · {dayBlockedTimes.length} bloqueos
                    </p>
                  </div>

                  <Link
                    href={dayHrefByDateValue[day.dateValue] ?? "/app/calendar"}
                    className="rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink"
                  >
                    Abrir día
                  </Link>
                </div>
              </summary>

              <div className="mt-4 grid gap-3">
                {dayBlockedTimes.map((blockedTime) => (
                  <CalendarBlockedTimeBlock
                    key={blockedTime.id}
                    blockedTime={blockedTime}
                    timezone={timezone}
                    variant="list"
                  />
                ))}

                {dayAppointments.length ? (
                  dayAppointments.map((appointment) => (
                    <CalendarAppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      timezone={timezone}
                      href={appointmentHrefsById[appointment.id] ?? "/app/calendar"}
                      isSelected={selectedAppointmentId === appointment.id}
                      variant="list"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted">No hay reservas programadas.</p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </article>
  );
}
