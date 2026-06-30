import { formatAppointmentMoney } from "@/components/appointments/appointment-helpers";
import type { BookingServiceOption } from "@/types/booking";

type ServiceStepProps = {
  clinicSlug: string;
  services: BookingServiceOption[];
  selectedServiceId: string;
  currency: string;
};

export function ServiceStep({
  clinicSlug,
  services,
  selectedServiceId,
  currency,
}: ServiceStepProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 1
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige el servicio
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Selecciona el motivo de tu cita. Solo se muestran servicios activos del
        consultorio.
      </p>

      {!services.length ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          Este consultorio aun no tiene servicios publicos disponibles.
        </div>
      ) : (
        <form action={`/booking/${clinicSlug}`} method="get" className="mt-6">
          <fieldset className="grid gap-3">
            {services.map((service) => (
              <label
                key={service.id}
                className="cursor-pointer rounded-[24px] border border-line/80 bg-white/92 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="serviceId"
                    value={service.id}
                    defaultChecked={selectedServiceId === service.id}
                    className="mt-1 h-4 w-4 border-line text-brand-600"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-ink">{service.name}</p>
                      <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        {service.durationMinutes} min
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {service.description ?? "Servicio disponible para reserva publica."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                      <span>{formatAppointmentMoney(service.priceCents, currency)}</span>
                      <span>
                        {service.depositRequired && service.depositCents
                          ? `Anticipo futuro: ${formatAppointmentMoney(service.depositCents, currency)}`
                          : "Sin anticipo por ahora"}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--booking-brand)" }}
          >
            Continuar con servicio
          </button>
        </form>
      )}
    </section>
  );
}
