import { getCalendarStatusLegend } from "./calendar-helpers";

type CalendarStatusLegendProps = {
  totalAppointments: number;
  rangeLabel: string;
  doctorLabel: string | null;
};

export function CalendarStatusLegend({
  totalAppointments,
  rangeLabel,
  doctorLabel,
}: CalendarStatusLegendProps) {
  const items = getCalendarStatusLegend();

  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
        Estado de agenda
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        {totalAppointments} reservas en {rangeLabel}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        {doctorLabel
          ? `Mostrando solo la agenda de ${doctorLabel}.`
          : "Mostrando reservas de todos los profesionales del negocio actual."}
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item.status}
            className="rounded-[22px] border border-line/70 bg-white/94 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${item.tone.dotClassName}`}
                aria-hidden="true"
              />
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.tone.badgeClassName}`}
              >
                {item.label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{item.note}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
