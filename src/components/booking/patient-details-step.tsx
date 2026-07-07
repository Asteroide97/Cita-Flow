import type {
  BookingDoctorOption,
  BookingServiceOption,
} from "@/types/booking";

import { BookingSubmitButton } from "./booking-submit-button";

type PatientDetailsStepProps = {
  clinicSlug: string;
  serviceId: string;
  doctorId: string;
  date: string;
  slot: string;
  selectedService: BookingServiceOption;
  selectedDoctor: BookingDoctorOption;
  action: (formData: FormData) => void | Promise<void>;
};

export function PatientDetailsStep({
  clinicSlug,
  serviceId,
  doctorId,
  date,
  slot,
  selectedService,
  selectedDoctor,
  action,
}: PatientDetailsStepProps) {
  return (
    <section
      id="datos"
      className="surface-card min-w-0 scroll-mt-6 p-6 sm:p-7"
      tabIndex={-1}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 4
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Completa tus datos para reservar
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Tu reserva quedará pendiente de confirmación.
      </p>
      <p className="mt-2 text-sm leading-7 text-muted">
        Reservarás {selectedService.name} con {selectedDoctor.name}.
      </p>

      <form action={action} className="mt-6 grid gap-4">
        <input type="hidden" name="clinicSlug" value={clinicSlug} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="doctorId" value={doctorId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="slot" value={slot} />

        <label className="text-sm font-medium text-ink">
          Nombre completo
          <input
            type="text"
            name="patientName"
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            placeholder="Nombre y apellido"
          />
        </label>

        <label className="text-sm font-medium text-ink">
          WhatsApp o teléfono
          <input
            type="tel"
            name="patientPhone"
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            placeholder="+52 5512345678"
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Email opcional
          <input
            type="email"
            name="patientEmail"
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            placeholder="correo@ejemplo.com"
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Notas opcionales
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            placeholder="Preferencias, indicaciones o contexto para el negocio"
          />
        </label>

        <BookingSubmitButton />
      </form>
    </section>
  );
}
