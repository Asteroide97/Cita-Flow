import { getCalendarAgendaLegend } from "./calendar-helpers";

type CalendarStatusLegendProps = {
  totalAppointments: number;
  totalBlockedTimes: number;
  doctorLabel: string | null;
  selectedServiceLabel: string | null;
};

export function CalendarStatusLegend({
  totalAppointments,
  totalBlockedTimes,
  doctorLabel,
  selectedServiceLabel,
}: CalendarStatusLegendProps) {
  const items = getCalendarAgendaLegend();

  return (
    <article className="rounded-[24px] border border-line/80 bg-white/92 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
            {doctorLabel ?? "Todos los profesionales"}
          </span>
          {selectedServiceLabel ? (
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Huecos para {selectedServiceLabel}
            </span>
          ) : null}
          <span className="rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {totalAppointments} reservas
          </span>
          <span className="rounded-full border border-line/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {totalBlockedTimes} bloqueos
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item) => (
            <span
              key={item.key}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${item.tone.badgeClassName}`}
            >
              <span className={`h-2 w-2 rounded-full ${item.tone.dotClassName}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
