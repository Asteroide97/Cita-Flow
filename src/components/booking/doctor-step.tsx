import Link from "next/link";

import { buildBookingAnchorHref } from "@/lib/booking/public";
import type { BookingDoctorOption } from "@/types/booking";

type DoctorStepProps = {
  clinicSlug: string;
  doctors: BookingDoctorOption[];
  selectedServiceId: string;
  selectedDoctorId: string;
};

export function DoctorStep({
  clinicSlug,
  doctors,
  selectedServiceId,
  selectedDoctorId,
}: DoctorStepProps) {
  return (
    <section id="doctor" className="surface-card scroll-mt-6 p-6 sm:p-7" tabIndex={-1}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 2
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige el profesional
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Selecciona a la persona con quien deseas reservar. Solo se muestran
        profesionales activos.
      </p>

      {!doctors.length ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          Este negocio aún no tiene profesionales disponibles para booking público.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {doctors.map((doctor) => {
            const isSelected = selectedDoctorId === doctor.id;

            return (
              <Link
                key={doctor.id}
                href={buildBookingAnchorHref(clinicSlug, "fecha-hora", {
                  serviceId: selectedServiceId,
                  doctorId: doctor.id,
                })}
                scroll={false}
                aria-current={isSelected ? "step" : undefined}
                className={
                  isSelected
                    ? "rounded-[24px] border px-5 py-4 shadow-soft"
                    : "rounded-[24px] border border-line/80 bg-white/92 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
                }
                style={
                  isSelected
                    ? {
                        borderColor: "var(--booking-brand)",
                        backgroundColor:
                          "color-mix(in srgb, var(--booking-brand) 8%, white)",
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-4">
                  <span
                    className={
                      isSelected
                        ? "mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold"
                        : "mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-line/80 text-[10px] font-bold text-muted"
                    }
                    style={
                      isSelected
                        ? {
                            borderColor: "var(--booking-brand)",
                            color: "var(--booking-brand)",
                          }
                        : undefined
                    }
                  >
                    {isSelected ? "✓" : "2"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-ink">{doctor.name}</p>
                      <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        {doctor.specialty ?? "Atención"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {doctor.bio ?? "Agenda disponible para reservas en línea."}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
