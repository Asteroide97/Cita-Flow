import Link from "next/link";

import { formatAppointmentMoney } from "@/components/appointments/appointment-helpers";
import { getServiceCategoryLabel } from "@/data/service-categories";
import { buildBookingAnchorHref } from "@/lib/booking/public";
import type { BookingServiceOption } from "@/types/booking";

type ServiceStepProps = {
  clinicSlug: string;
  services: BookingServiceOption[];
  selectedDate: string;
  selectedServiceId: string;
  currency: string;
};

export function ServiceStep({
  clinicSlug,
  services,
  selectedDate,
  selectedServiceId,
  currency,
}: ServiceStepProps) {
  return (
    <section id="servicio" className="surface-card scroll-mt-6 p-6 sm:p-7" tabIndex={-1}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 2
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige el servicio
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Te mostraremos solo servicios activos y públicos. Al elegir uno calculamos
        qué profesionales tienen horarios reales ese día.
      </p>

      {!services.length ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          Este negocio aún no tiene servicios públicos disponibles.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {services.map((service) => {
            const isSelected = selectedServiceId === service.id;

            return (
              <Link
                key={service.id}
                href={buildBookingAnchorHref(clinicSlug, "fecha-hora", {
                  date: selectedDate,
                  serviceId: service.id,
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
                      <p className="text-base font-semibold text-ink">{service.name}</p>
                      {service.category ? (
                        <span className="rounded-full border border-line/80 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                          {getServiceCategoryLabel(service.category)}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        {service.durationMinutes} min
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-7 text-muted">
                      {service.description ?? "Servicio disponible para reserva pública."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                      <span>{formatAppointmentMoney(service.priceCents, currency)}</span>
                    </div>
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
