import Link from "next/link";

import type { GetAvailableSlotsResult } from "@/lib/appointments/availability";
import {
  buildBookingAnchorHref,
} from "@/lib/booking/public";
import type {
  BookingDateOption,
  BookingDoctorOption,
  BookingServiceOption,
} from "@/types/booking";

import { SlotsStep } from "./slots-step";
import { WaitlistRequestForm } from "./waitlist-request-form";

type DateStepProps = {
  clinicSlug: string;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlotTime: string;
  minDate: string;
  dateOptions: BookingDateOption[];
  availableSlotResult: GetAvailableSlotsResult | null;
  waitlistOpen: boolean;
  selectedService: BookingServiceOption;
  selectedDoctor: BookingDoctorOption;
  waitlistAction: (formData: FormData) => void | Promise<void>;
};

export function DateStep({
  clinicSlug,
  selectedServiceId,
  selectedDoctorId,
  selectedDate,
  selectedSlotTime,
  minDate,
  dateOptions,
  availableSlotResult,
  waitlistOpen,
  selectedService,
  selectedDoctor,
  waitlistAction,
}: DateStepProps) {
  return (
    <section
      id="fecha-hora"
      className="surface-card scroll-mt-6 p-6 sm:p-7"
      tabIndex={-1}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 3
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige fecha y hora
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Te mostramos los proximos dias disponibles y cargamos horarios reales en
        cuanto eliges una fecha.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-7">
        {dateOptions.map((option) => {
          const isSelected = selectedDate === option.value;

          return (
            <Link
              key={option.value}
              href={buildBookingAnchorHref(clinicSlug, "fecha-hora", {
                serviceId: selectedServiceId,
                doctorId: selectedDoctorId,
                date: option.value,
                waitlist: waitlistOpen,
              })}
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={
                isSelected
                  ? "rounded-[24px] border px-4 py-4 text-left shadow-soft"
                  : "rounded-[24px] border border-line/80 bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
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
          action={`/booking/${clinicSlug}#fecha-hora`}
          method="get"
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <input type="hidden" name="serviceId" value={selectedServiceId} />
          <input type="hidden" name="doctorId" value={selectedDoctorId} />
          <input type="hidden" name="focus" value="fecha-hora" />
          {waitlistOpen ? <input type="hidden" name="waitlist" value="1" /> : null}
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

      {selectedDate ? (
        <SlotsStep
          clinicSlug={clinicSlug}
          selectedServiceId={selectedServiceId}
          selectedDoctorId={selectedDoctorId}
          selectedDate={selectedDate}
          selectedSlotTime={selectedSlotTime}
          availableSlotResult={availableSlotResult}
          waitlistOpen={waitlistOpen}
        />
      ) : null}

      {waitlistOpen && !selectedSlotTime ? (
        <div className="mt-6">
          <WaitlistRequestForm
            clinicSlug={clinicSlug}
            serviceId={selectedServiceId}
            doctorId={selectedDoctorId}
            selectedDate={selectedDate}
            minDate={minDate}
            selectedService={selectedService}
            selectedDoctor={selectedDoctor}
            action={waitlistAction}
          />
        </div>
      ) : null}
    </section>
  );
}
