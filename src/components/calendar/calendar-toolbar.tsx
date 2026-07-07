import Link from "next/link";

import { appointmentFieldClassName } from "@/components/appointments/appointment-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarDoctorOption, CalendarViewMode } from "@/types/calendar";

type CalendarToolbarProps = {
  view: CalendarViewMode;
  dateValue: string;
  doctorId: string;
  doctors: CalendarDoctorOption[];
  rangeLabel: string;
  totalAppointments: number;
  totalBlockedTimes: number;
  previousHref: string;
  nextHref: string;
  todayHref: string;
  dayHref: string;
  weekHref: string;
  monthHref: string;
  createPanelHref: string;
  blockPanelHref: string;
};

export function CalendarToolbar({
  view,
  dateValue,
  doctorId,
  doctors,
  rangeLabel,
  totalAppointments,
  totalBlockedTimes,
  previousHref,
  nextHref,
  todayHref,
  dayHref,
  weekHref,
  monthHref,
  createPanelHref,
  blockPanelHref,
}: CalendarToolbarProps) {
  return (
    <article className="surface-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={todayHref}
            className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            Hoy
          </Link>

          <div className="inline-flex overflow-hidden rounded-full border border-line/80 bg-white shadow-soft">
            <Link
              href={previousHref}
              className="px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              ←
            </Link>
            <div className="border-l border-r border-line/80 px-4 py-2 text-sm font-semibold text-ink">
              {rangeLabel}
            </div>
            <Link
              href={nextHref}
              className="px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              →
            </Link>
          </div>

          <div className="inline-flex rounded-full border border-line/80 bg-surface-soft p-1">
            {[
              { key: "day" as const, label: "Día", href: dayHref },
              { key: "week" as const, label: "Semana", href: weekHref },
              { key: "month" as const, label: "Mes", href: monthHref },
            ].map((option) => (
              <Link
                key={option.key}
                href={option.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  view === option.key
                    ? "bg-brand-600 text-white shadow-soft"
                    : "text-muted hover:text-ink",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={blockPanelHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-line/80 bg-white/92 px-5 py-3 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 sm:w-auto"
          >
            Bloquear horario
          </Link>
          <Link
            href={createPanelHref}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 sm:w-auto"
          >
            Crear reserva
          </Link>
        </div>
      </div>

      <form
        action="/app/calendar"
        method="get"
        className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,180px)_minmax(0,240px)_auto]"
      >
        <input type="hidden" name="view" value={view} />

        <label className="text-sm font-medium text-ink">
          Fecha
          <input
            type="date"
            name="date"
            defaultValue={dateValue}
            className={appointmentFieldClassName}
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Profesional
          <select
            name="doctorId"
            defaultValue={doctorId}
            className={appointmentFieldClassName}
          >
            <option value="">Todos los profesionales</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
                {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                {!doctor.isActive ? " (inactivo)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button type="submit" variant="secondary" className="w-full lg:w-auto">
            Aplicar
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="rounded-full border border-line/80 bg-white px-3 py-1.5">
          {totalAppointments} reservas
        </span>
        <span className="rounded-full border border-line/80 bg-white px-3 py-1.5">
          {totalBlockedTimes} bloqueos
        </span>
      </div>
    </article>
  );
}
