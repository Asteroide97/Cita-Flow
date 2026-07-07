import Link from "next/link";

import type {
  CalendarAppointment,
  CalendarBlockedTime,
  CalendarDayDefinition,
  CalendarDoctorOption,
} from "@/types/calendar";

import { CalendarAppointmentBlock } from "./calendar-appointment-block";
import { CalendarAvailableSlotBlock } from "./calendar-available-slot-block";
import { CalendarBlockedTimeBlock } from "./calendar-blocked-time-block";
import { CalendarEmptyState } from "./calendar-empty-state";
import {
  buildCalendarAppointmentLayouts,
  buildCalendarAvailableSlotLayouts,
  buildCalendarBlockedLayouts,
  buildCalendarHourRows,
  CALENDAR_TIMELINE_HEIGHT,
} from "./calendar-helpers";

type CalendarSlotLink = {
  startAt: Date;
  endAt: Date;
  startTime: string;
  endTime: string;
  href: string;
};

type CalendarDayViewProps = {
  day: CalendarDayDefinition;
  appointments: CalendarAppointment[];
  timezone: string;
  doctors: CalendarDoctorOption[];
  selectedAppointmentId?: string;
  selectedServiceLabel?: string | null;
  createLinksByDoctorId: Record<string, string>;
  appointmentHrefsById: Record<string, string>;
  blockedTimes: CalendarBlockedTime[];
  availableSlotsByDoctorId: Record<string, CalendarSlotLink[]>;
};

function DoctorSlotSummary({
  slots,
}: {
  slots: CalendarSlotLink[];
}) {
  if (!slots.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.slice(0, 5).map((slot) => (
        <Link
          key={`${slot.startTime}-${slot.endTime}`}
          href={slot.href}
          className="inline-flex rounded-full border border-dashed border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
        >
          {slot.startTime}
        </Link>
      ))}
      {slots.length > 5 ? (
        <span className="inline-flex rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          +{slots.length - 5}
        </span>
      ) : null}
    </div>
  );
}

export function CalendarDayView({
  day,
  appointments,
  timezone,
  doctors,
  selectedAppointmentId,
  selectedServiceLabel = null,
  createLinksByDoctorId,
  appointmentHrefsById,
  blockedTimes,
  availableSlotsByDoctorId,
}: CalendarDayViewProps) {
  const hourRows = buildCalendarHourRows();
  const hourLines = hourRows.slice(0, -1);
  const blockedLayouts = buildCalendarBlockedLayouts(
    blockedTimes,
    day.dateValue,
    timezone,
  );
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

  if (!appointments.length && !blockedTimes.length && !hasAnySlots) {
    return (
      <article className="surface-card p-6 sm:p-7">
        <CalendarEmptyState
          title="No hay reservas para este día."
          description="Abre el panel lateral para crear una reserva o bloquear horario."
        />
      </article>
    );
  }

  const mobileTimelineItems = [
    ...appointments.map((appointment) => ({
      key: appointment.id,
      type: "appointment" as const,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      appointment,
    })),
    ...blockedTimes.map((blockedTime) => ({
      key: blockedTime.id,
      type: "blocked" as const,
      startAt: blockedTime.startAt,
      endAt: blockedTime.endAt,
      blockedTime,
    })),
  ].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista día
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
              {day.label}
            </h2>
          </div>

          {selectedServiceLabel ? (
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              Huecos para {selectedServiceLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div
          className="grid border-b border-line/80"
          style={{
            gridTemplateColumns: `76px repeat(${Math.max(doctors.length, 1)}, minmax(220px, 1fr))`,
          }}
        >
          <div className="px-3 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Hora
          </div>

          {doctors.map((doctor) => {
            const dayAppointments = appointmentsByDoctorId[doctor.id] ?? [];
            const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];

            return (
              <div
                key={doctor.id}
                className="border-l border-line/80 bg-white/70 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{doctor.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {doctor.specialty ?? "Agenda"}
                    </p>
                  </div>

                  <Link
                    href={createLinksByDoctorId[doctor.id] ?? "/app/calendar"}
                    className="inline-flex rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    Crear
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <span>{dayAppointments.length} reservas</span>
                  {daySlots.length ? <span>{daySlots.length} huecos</span> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `76px repeat(${Math.max(doctors.length, 1)}, minmax(220px, 1fr))`,
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

          {doctors.map((doctor) => {
            const dayAppointments = appointmentsByDoctorId[doctor.id] ?? [];
            const dayLayouts = buildCalendarAppointmentLayouts(dayAppointments, timezone);
            const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];
            const slotLayouts = buildCalendarAvailableSlotLayouts(daySlots, timezone);

            return (
              <div
                key={doctor.id}
                className="relative border-r border-line/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.92)_0%,rgba(255,255,255,0.98)_100%)] last:border-r-0"
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

                  {slotLayouts.map((layout, index) => (
                    <CalendarAvailableSlotBlock
                      key={`${doctor.id}-${layout.startLabel}-${index}`}
                      layout={layout}
                      href={daySlots[index]?.href ?? "/app/calendar"}
                    />
                  ))}

                  {blockedLayouts.map((layout) => (
                    <CalendarBlockedTimeBlock
                      key={`${doctor.id}-${layout.blockedTime.id}`}
                      blockedTime={layout.blockedTime}
                      timezone={timezone}
                      variant="day"
                      layout={layout}
                    />
                  ))}

                  {!dayAppointments.length && !daySlots.length && !blockedLayouts.length ? (
                    <div className="absolute inset-x-4 top-6 rounded-[18px] border border-dashed border-line/80 bg-white/80 px-4 py-4 text-sm text-muted">
                      Sin reservas ni huecos visibles.
                    </div>
                  ) : null}

                  {dayLayouts.map((layout) => (
                    <CalendarAppointmentBlock
                      key={layout.appointment.id}
                      appointment={layout.appointment}
                      timezone={timezone}
                      href={appointmentHrefsById[layout.appointment.id] ?? "/app/calendar"}
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
        {selectedServiceLabel && hasAnySlots ? (
          <section className="rounded-[24px] border border-line/80 bg-surface-soft px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Huecos disponibles
            </p>
            <div className="mt-3 grid gap-3">
              {doctors.map((doctor) => {
                const daySlots = availableSlotsByDoctorId[doctor.id] ?? [];

                if (!daySlots.length) {
                  return null;
                }

                return (
                  <div key={doctor.id}>
                    <p className="text-sm font-semibold text-ink">{doctor.name}</p>
                    <div className="mt-2">
                      <DoctorSlotSummary slots={daySlots} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {mobileTimelineItems.length ? (
          mobileTimelineItems.map((item) =>
            item.type === "appointment" ? (
              <CalendarAppointmentBlock
                key={item.key}
                appointment={item.appointment}
                timezone={timezone}
                href={appointmentHrefsById[item.appointment.id] ?? "/app/calendar"}
                isSelected={selectedAppointmentId === item.appointment.id}
                variant="list"
              />
            ) : (
              <CalendarBlockedTimeBlock
                key={item.key}
                blockedTime={item.blockedTime}
                timezone={timezone}
                variant="list"
              />
            ),
          )
        ) : (
          <CalendarEmptyState
            title="No hay reservas para este día."
            description="Abre el panel lateral para crear una reserva o bloquear horario."
          />
        )}

        {!selectedServiceLabel && hasAnySlots ? (
          <div className="rounded-[22px] border border-dashed border-line/80 bg-white px-4 py-4 text-sm text-muted">
            Selecciona un servicio en “Crear reserva” para ver huecos disponibles en la agenda.
          </div>
        ) : null}
      </div>
    </article>
  );
}
