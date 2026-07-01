import type {
  BookingDoctorOption,
  BookingServiceOption,
} from "@/types/booking";

type WaitlistRequestFormProps = {
  clinicSlug: string;
  serviceId: string;
  doctorId: string;
  selectedDate: string;
  minDate: string;
  selectedService: BookingServiceOption;
  selectedDoctor: BookingDoctorOption;
  action: (formData: FormData) => void | Promise<void>;
};

export function WaitlistRequestForm({
  clinicSlug,
  serviceId,
  doctorId,
  selectedDate,
  minDate,
  selectedService,
  selectedDoctor,
  action,
}: WaitlistRequestFormProps) {
  return (
    <div
      id="lista-espera"
      className="rounded-[28px] border border-line/80 bg-slate-50/80 px-5 py-6 scroll-mt-6"
      tabIndex={-1}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Lista de espera
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-ink">
        No veo un horario que me sirva
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">
        Te agregamos para {selectedService.name} con {selectedDoctor.name}. Si se
        libera un espacio compatible, te avisamos por WhatsApp o email.
      </p>

      <form action={action} className="mt-6 grid gap-4">
        <input type="hidden" name="clinicSlug" value={clinicSlug} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="doctorId" value={doctorId} />
        <input type="hidden" name="returnDate" value={selectedDate} />

        <div className="grid gap-4 md:grid-cols-2">
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
            WhatsApp o telefono
            <input
              type="tel"
              name="patientPhone"
              className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              placeholder="+52 5512345678"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
            Fecha preferida opcional
            <input
              type="date"
              name="preferredDate"
              defaultValue={selectedDate}
              min={minDate}
              className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-ink">Horario preferido</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm font-medium text-ink transition hover:border-brand-200 hover:bg-brand-50">
              <input
                type="radio"
                name="preferredRange"
                value="MORNING"
                className="mr-3 h-4 w-4 border-line text-brand-600"
              />
              Manana
            </label>
            <label className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm font-medium text-ink transition hover:border-brand-200 hover:bg-brand-50">
              <input
                type="radio"
                name="preferredRange"
                value="AFTERNOON"
                className="mr-3 h-4 w-4 border-line text-brand-600"
              />
              Tarde
            </label>
            <label className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm font-medium text-ink transition hover:border-brand-200 hover:bg-brand-50">
              <input
                type="radio"
                name="preferredRange"
                value="ANY"
                defaultChecked
                className="mr-3 h-4 w-4 border-line text-brand-600"
              />
              Cualquier horario
            </label>
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-ink">
          <input
            type="checkbox"
            name="autoAccept"
            value="1"
            className="mt-1 h-4 w-4 border-line text-brand-600"
          />
          <span>
            Acepto que me asignen automaticamente un horario si se libera uno
            compatible.
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Notas opcionales
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            placeholder="Preferencias, sintomas o contexto para recepcion"
          />
        </label>

        <button
          type="submit"
          className="inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--booking-brand)" }}
        >
          Unirme a la lista de espera
        </button>
      </form>
    </div>
  );
}
