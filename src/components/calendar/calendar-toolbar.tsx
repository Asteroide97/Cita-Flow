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
  timezone: string;
  totalAppointments: number;
  previousHref: string;
  nextHref: string;
  todayHref: string;
  dayHref: string;
  weekHref: string;
};

export function CalendarToolbar({
  view,
  dateValue,
  doctorId,
  doctors,
  rangeLabel,
  timezone,
  totalAppointments,
  previousHref,
  nextHref,
  todayHref,
  dayHref,
  weekHref,
}: CalendarToolbarProps) {
  const navigationLabel = view === "day" ? "día" : "semana";

  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Agenda visual
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-ink">
            {rangeLabel}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Vista {view === "day" ? "diaria" : "semanal"} de las reservas reales del
            negocio actual. Se cargan solo datos del tenant en la zona horaria{" "}
            <span className="font-semibold text-ink">{timezone}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
          <div className="inline-flex rounded-full border border-line/80 bg-surface-soft p-1">
            <Link
              href={dayHref}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                view === "day"
                  ? "bg-brand-600 text-white shadow-soft"
                  : "text-muted hover:text-ink",
              )}
            >
              Vista diaria
            </Link>
            <Link
              href={weekHref}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                view === "week"
                  ? "bg-brand-600 text-white shadow-soft"
                  : "text-muted hover:text-ink",
              )}
            >
              Vista semanal
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={previousHref}
              className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
            >
              Anterior {navigationLabel}
            </Link>
            <Link
              href={todayHref}
              className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-brand-100"
            >
              Ir a hoy
            </Link>
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
            >
              Siguiente {navigationLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Reservas en vista
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">
            {totalAppointments}
          </p>
          <p className="mt-1 text-sm text-muted">
            Incluye pendientes, confirmadas, canceladas y cerradas.
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Filtro actual
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {doctorId
              ? doctors.find((doctor) => doctor.id === doctorId)?.name ?? "Profesional filtrado"
              : "Todos los profesionales"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Cambia la fecha o el profesional para navegar la agenda.
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Horario visible
          </p>
          <p className="mt-3 text-base font-semibold text-ink">08:00 - 20:00</p>
          <p className="mt-1 text-sm text-muted">
            La grilla muestra el tramo operativo principal del día.
          </p>
        </div>
      </div>

      <form action="/app/calendar" method="get" className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,240px)_minmax(0,280px)_auto]">
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
                {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                {!doctor.isActive ? " (inactivo)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button type="submit" className="w-full xl:w-auto">
            Aplicar filtros
          </Button>
        </div>
      </form>
    </article>
  );
}
