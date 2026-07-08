import Link from "next/link";

import { cn } from "@/lib/utils";
import type { CalendarMonthCell } from "@/types/calendar";

type CalendarMonthSummary = {
  totalAppointments: number;
  pendingCount: number;
  confirmedCount: number;
  blockedCount: number;
};

type CalendarMonthViewProps = {
  weeks: CalendarMonthCell[][];
  summariesByDate: Record<string, CalendarMonthSummary>;
  dayHrefByDateValue: Record<string, string>;
};

const weekdayHeaders = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export function CalendarMonthView({
  weeks,
  summariesByDate,
  dayHrefByDateValue,
}: CalendarMonthViewProps) {
  const hasItems = Object.values(summariesByDate).some(
    (summary) => summary.totalAppointments > 0 || summary.blockedCount > 0,
  );
  const currentMonthDays = weeks
    .flat()
    .filter((day) => day.isCurrentMonth)
    .map((day) => ({
      ...day,
      summary: summariesByDate[day.dateValue] ?? {
        totalAppointments: 0,
        pendingCount: 0,
        confirmedCount: 0,
        blockedCount: 0,
      },
    }));

  return (
    <article className="overflow-hidden rounded-[28px] border border-line/80 bg-white shadow-soft">
      <div className="border-b border-line/80 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista mes
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-ink sm:text-xl">
              Resumen mensual
            </h2>
          </div>
          <p className="text-sm text-muted">
            {hasItems ? "Toca un dia para abrirlo." : "Sin reservas ni bloqueos."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:hidden">
        {currentMonthDays.map((day) => (
          <Link
            key={day.key}
            href={dayHrefByDateValue[day.dateValue] ?? "/app/calendar"}
            className={cn(
              "rounded-[22px] border px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50",
              day.isSelected
                ? "border-brand-200 bg-brand-50/70"
                : "border-line/80 bg-white",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {day.dayLabel} · {day.shortWeekdayLabel}
                </p>
                <p className="mt-1 text-xs text-muted">{day.dateValue}</p>
              </div>
              {day.isToday ? (
                <span className="rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  Hoy
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-xs font-semibold text-ink">
                {day.summary.totalAppointments} reservas
              </span>
              {day.summary.pendingCount ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pendientes {day.summary.pendingCount}
                </span>
              ) : null}
              {day.summary.confirmedCount ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Confirmadas {day.summary.confirmedCount}
                </span>
              ) : null}
              {day.summary.blockedCount ? (
                <span className="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  Bloqueos {day.summary.blockedCount}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-line/80 bg-surface-soft/70">
          {weekdayHeaders.map((weekday) => (
            <div
              key={weekday}
              className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:px-3"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid gap-px bg-line/70">
          {weeks.map((week, index) => (
            <div key={`week-${index}`} className="grid grid-cols-7 gap-px bg-line/70">
              {week.map((day) => {
                const summary = summariesByDate[day.dateValue] ?? {
                  totalAppointments: 0,
                  pendingCount: 0,
                  confirmedCount: 0,
                  blockedCount: 0,
                };

                return (
                  <Link
                    key={day.key}
                    href={dayHrefByDateValue[day.dateValue] ?? "/app/calendar"}
                    className={cn(
                      "min-h-[112px] bg-white px-3 py-3 transition-colors hover:bg-brand-50/60",
                      day.isSelected ? "bg-brand-50/80" : "",
                      !day.isCurrentMonth ? "bg-surface-soft/70 text-muted" : "",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold",
                          day.isToday
                            ? "bg-brand-600 text-white"
                            : day.isSelected
                              ? "bg-brand-100 text-brand-700"
                              : "text-ink",
                        )}
                      >
                        {day.dayLabel}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        {day.shortWeekdayLabel}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1">
                      <span className="text-xs font-semibold text-ink">
                        {summary.totalAppointments} reserva
                        {summary.totalAppointments === 1 ? "" : "s"}
                      </span>

                      <div className="flex flex-wrap gap-1">
                        {summary.pendingCount ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                            P {summary.pendingCount}
                          </span>
                        ) : null}
                        {summary.confirmedCount ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            C {summary.confirmedCount}
                          </span>
                        ) : null}
                        {summary.blockedCount ? (
                          <span className="rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                            B {summary.blockedCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
