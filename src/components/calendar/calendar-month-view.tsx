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

const weekdayHeaders = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarMonthView({
  weeks,
  summariesByDate,
  dayHrefByDateValue,
}: CalendarMonthViewProps) {
  const hasItems = Object.values(summariesByDate).some(
    (summary) => summary.totalAppointments > 0 || summary.blockedCount > 0,
  );

  return (
    <article className="surface-card overflow-hidden">
      <div className="border-b border-line/80 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Vista mes
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-ink">
              Resumen mensual
            </h2>
          </div>
          <p className="text-sm text-muted">
            {hasItems ? "Toca un día para abrirlo." : "Sin reservas ni bloqueos."}
          </p>
        </div>
      </div>

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
                    "min-h-[96px] bg-white px-2 py-2 transition-colors hover:bg-brand-50/60 sm:min-h-[112px] sm:px-3 sm:py-3",
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
                    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:inline">
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
    </article>
  );
}
