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
  buildCalendarPath,
  CALENDAR_TIMELINE_HEIGHT,
  filterCalendarBlockedTimesForDateValue,
  groupAppointmentsByDateValue,
} from "./calendar-helpers";

type CalendarWeekViewProps = {
  days: CalendarDayDefinition[];
  appointments: CalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  timezone: string;
  doctorId: string;
  selectedAppointmentId?: string;
};

export function CalendarWeekView({
  days,
  appointments,
  blockedTimes,
  timezone,
  doctorId,
  selectedAppointmentId,
}: CalendarWeekViewProps) {
  const appointmentsByDay = groupAppointmentsByDateValue(appointments, timezone);
  const hourRows = buildCalendarHourRows();
  const hourLines = hourRows.slice(0, -1);

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-line/80 px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista semanal
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
              Semana operativa
            </h2>
          </div>

          <p className="text-sm text-muted">
            {appointments.length} reserva{appointments.length === 1 ? "" : "s"} distribuidas
            en la semana
          </p>
        </div>
      </div>

      {!appointments.length && !blockedTimes.length ? (
        <div className="p-6 sm:p-7">
          <CalendarEmptyState />
        </div>
      ) : (
        <>
          <div className="hidden xl:block">
            <div
              className="grid border-b border-line/80"
              style={{
                gridTemplateColumns: `84px repeat(${days.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Hora
                </p>
              </div>

              {days.map((day) => (
                <Link
                  key={day.key}
                  href={buildCalendarPath({
                    view: "day",
                    date: day.dateValue,
                    doctorId: doctorId || undefined,
                  })}
                  className={cn(
                    "border-l border-line/80 px-4 py-4 transition-colors hover:bg-brand-50/50",
                    day.isSelected ? "bg-brand-50/70" : "bg-white/60",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {day.shortLabel}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {(appointmentsByDay[day.dateValue] ?? []).length} reserva
                    {(appointmentsByDay[day.dateValue] ?? []).length === 1 ? "" : "s"}
                  </p>
                  {filterCalendarBlockedTimesForDateValue(
                    blockedTimes,
                    day.dateValue,
                    timezone,
                  ).length ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {filterCalendarBlockedTimesForDateValue(
                        blockedTimes,
                        day.dateValue,
                        timezone,
                      ).length}{" "}
                      bloqueo
                      {filterCalendarBlockedTimesForDateValue(
                        blockedTimes,
                        day.dateValue,
                        timezone,
                      ).length === 1
                        ? ""
                        : "s"}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: `84px repeat(${days.length}, minmax(0, 1fr))`,
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

              {days.map((day) => {
                const dayAppointments = appointmentsByDay[day.dateValue] ?? [];
                const dayBlockedTimes = filterCalendarBlockedTimesForDateValue(
                  blockedTimes,
                  day.dateValue,
                  timezone,
                );
                const dayLayouts = buildCalendarAppointmentLayouts(
                  dayAppointments,
                  timezone,
                );
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
                      day.isSelected ? "bg-brand-50/35" : "bg-white/50",
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
                          href={buildCalendarPath({
                            view: "week",
                            date:
                              day.isSelected
                                ? day.dateValue
                                : days.find((item) => item.isSelected)?.dateValue ??
                                  day.dateValue,
                            doctorId: doctorId || undefined,
                            appointmentId: layout.appointment.id,
                          })}
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
                <section
                  key={day.key}
                  className={cn(
                    "rounded-[26px] border px-4 py-4",
                    day.isSelected
                      ? "border-brand-200 bg-brand-50/50"
                      : "border-line/80 bg-white/92",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={buildCalendarPath({
                        view: "day",
                        date: day.dateValue,
                        doctorId: doctorId || undefined,
                      })}
                      className="text-left"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
                        {day.shortLabel}
                      </p>
                      <p className="mt-1 text-sm text-muted">Abrir vista diaria</p>
                    </Link>

                    <span className="text-sm font-medium text-muted">
                      {dayAppointments.length} reserva
                      {dayAppointments.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {dayBlockedTimes.length ? (
                    <div className="mt-4 grid gap-3">
                      {dayBlockedTimes.map((blockedTime) => (
                        <CalendarBlockedTimeBlock
                          key={blockedTime.id}
                          blockedTime={blockedTime}
                          timezone={timezone}
                          variant="list"
                        />
                      ))}
                    </div>
                  ) : null}

                  {dayAppointments.length ? (
                    <div className="mt-4 grid gap-3">
                      {dayAppointments.map((appointment) => (
                        <CalendarAppointmentBlock
                          key={appointment.id}
                          appointment={appointment}
                          timezone={timezone}
                          href={buildCalendarPath({
                            view: "week",
                            date:
                              days.find((item) => item.isSelected)?.dateValue ??
                              day.dateValue,
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
                      {dayBlockedTimes.length
                        ? "Sin reservas, pero hay bloqueos activos este día."
                        : "No hay reservas programadas."}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}
