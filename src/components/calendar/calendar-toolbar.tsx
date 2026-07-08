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
    <article className="rounded-[28px] border border-line/80 bg-white/96 p-3 shadow-soft sm:p-4">
      <form action="/app/calendar" method="get" className="grid gap-3">
        <input type="hidden" name="view" value={view} />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link
              href={todayHref}
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              Hoy
            </Link>

            <div className="inline-flex h-11 overflow-hidden rounded-full border border-line/80 bg-white">
              <Link
                href={previousHref}
                className="inline-flex w-11 items-center justify-center text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
              >
                {"<"}
              </Link>
              <Link
                href={nextHref}
                className="inline-flex w-11 items-center justify-center border-l border-line/80 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
              >
                {">"}
              </Link>
            </div>

            <div className="min-w-0 px-1">
              <p className="truncate text-sm font-semibold text-ink">{rangeLabel}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {totalAppointments} reservas · {totalBlockedTimes} bloqueos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex w-full overflow-x-auto rounded-full border border-line/80 bg-surface-soft p-1 sm:w-auto">
              {[
                { key: "day" as const, label: "Día", href: dayHref },
                { key: "week" as const, label: "Semana", href: weekHref },
                { key: "month" as const, label: "Mes", href: monthHref },
              ].map((option) => (
                <Link
                  key={option.key}
                  href={option.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    view === option.key
                      ? "bg-brand-600 text-white shadow-soft"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <Link
              href={blockPanelHref}
              className="inline-flex h-11 items-center justify-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              Bloquear horario
            </Link>
            <Link
              href={createPanelHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Crear reserva
            </Link>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[160px_minmax(0,240px)_auto]">
          <label className="text-sm font-medium text-ink">
            <span className="sr-only">Fecha</span>
            <input
              type="date"
              name="date"
              defaultValue={dateValue}
              className={appointmentFieldClassName}
            />
          </label>

          <label className="text-sm font-medium text-ink">
            <span className="sr-only">Profesional</span>
            <select
              name="doctorId"
              defaultValue={doctorId}
              className={appointmentFieldClassName}
            >
              <option value="">Todos los profesionales</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                  {!doctor.isActive ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" className="h-11 w-full lg:w-auto">
              Aplicar
            </Button>
          </div>
        </div>
      </form>
    </article>
  );
}
