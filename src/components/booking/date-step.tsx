import Link from "next/link";

import { buildBookingAnchorHref } from "@/lib/booking/public";
import type { BookingDateOption } from "@/types/booking";

type DateStepProps = {
  clinicSlug: string;
  selectedDate: string;
  minDate: string;
  dateOptions: BookingDateOption[];
  selectedServiceId?: string;
};

export function DateStep({
  clinicSlug,
  selectedDate,
  minDate,
  dateOptions,
  selectedServiceId,
}: DateStepProps) {
  return (
    <section
      id="fecha"
      className="surface-card min-w-0 scroll-mt-6 p-6 sm:p-7"
      tabIndex={-1}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 1
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-ink sm:text-2xl">
        Elige el dia
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Empieza por la fecha. Despues te mostraremos servicios y profesionales con
        horarios reales para ese dia.
      </p>

      <div className="mt-6 flex w-full max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {dateOptions.map((option) => {
          const isSelected = selectedDate === option.value;

          return (
            <Link
              key={option.value}
              href={buildBookingAnchorHref(clinicSlug, "servicio", {
                date: option.value,
                serviceId: selectedServiceId ?? null,
              })}
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={
                isSelected
                  ? "min-w-[132px] shrink-0 rounded-[24px] border px-4 py-4 text-left shadow-soft sm:min-w-[148px]"
                  : "min-w-[132px] shrink-0 rounded-[24px] border border-line/80 bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 sm:min-w-[148px]"
              }
              style={
                isSelected
                  ? {
                      borderColor: "var(--booking-brand)",
                      backgroundColor:
                        "color-mix(in srgb, var(--booking-brand) 10%, white)",
                    }
                  : undefined
              }
            >
              <p
                className={
                  isSelected
                    ? "text-xs font-semibold uppercase tracking-[0.18em]"
                    : "text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                }
                style={isSelected ? { color: "var(--booking-brand)" } : undefined}
              >
                {option.weekdayLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
                {option.dayLabel}
              </p>
              <p className="mt-1 text-sm text-muted">{option.monthLabel}</p>
              {option.isToday ? (
                <span className="mt-3 inline-flex rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Hoy
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <details className="mt-4 rounded-[22px] border border-line/80 bg-slate-50/80 px-4 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Ver mas fechas
        </summary>
        <form
          action={`/booking/${clinicSlug}`}
          method="get"
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          {selectedServiceId ? (
            <input type="hidden" name="serviceId" value={selectedServiceId} />
          ) : null}
          <input type="hidden" name="focus" value="servicio" />
          <label className="text-sm font-medium text-ink">
            Fecha deseada
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              min={minDate}
              className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <button
            type="submit"
            className="self-end rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--booking-brand)" }}
          >
            Aplicar fecha
          </button>
        </form>
      </details>
    </section>
  );
}
