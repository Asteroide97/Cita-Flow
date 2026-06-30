import Link from "next/link";

import { buildBookingPath } from "@/lib/booking/public";
import type { GetAvailableSlotsResult } from "@/lib/appointments/availability";

type SlotsStepProps = {
  clinicSlug: string;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlotTime: string;
  availableSlotResult: GetAvailableSlotsResult | null;
};

export function SlotsStep({
  clinicSlug,
  selectedServiceId,
  selectedDoctorId,
  selectedDate,
  selectedSlotTime,
  availableSlotResult,
}: SlotsStepProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 4
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige el horario
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Estos horarios salen del motor real de disponibilidad. Si alguien reserva
        antes que tu, la lista se actualiza automaticamente.
      </p>

      {!availableSlotResult?.slots.length ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          No hay horarios disponibles para la fecha seleccionada. Prueba con otro
          dia.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableSlotResult.slots.map((slot) => {
            const isSelected = selectedSlotTime === slot.startTime;

            return (
              <Link
                key={slot.startTime}
                href={buildBookingPath(clinicSlug, {
                  serviceId: selectedServiceId,
                  doctorId: selectedDoctorId,
                  date: selectedDate,
                  slotTime: slot.startTime,
                })}
                className={
                  isSelected
                    ? "rounded-[22px] border px-4 py-4 text-center text-sm font-semibold shadow-soft"
                    : "rounded-[22px] border border-line/80 bg-white px-4 py-4 text-center text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                }
                style={
                  isSelected
                    ? {
                        borderColor: "var(--booking-brand)",
                        backgroundColor: "color-mix(in srgb, var(--booking-brand) 10%, white)",
                        color: "var(--booking-brand)",
                      }
                    : undefined
                }
              >
                {slot.startTime}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
