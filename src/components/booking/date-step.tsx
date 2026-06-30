type DateStepProps = {
  clinicSlug: string;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDate: string;
  minDate: string;
};

export function DateStep({
  clinicSlug,
  selectedServiceId,
  selectedDoctorId,
  selectedDate,
  minDate,
}: DateStepProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 3
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige la fecha
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Consultamos la disponibilidad real del doctor para ese dia antes de mostrar
        horarios.
      </p>

      <form action={`/booking/${clinicSlug}`} method="get" className="mt-6">
        <input type="hidden" name="serviceId" value={selectedServiceId} />
        <input type="hidden" name="doctorId" value={selectedDoctorId} />

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
          className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--booking-brand)" }}
        >
          Ver horarios disponibles
        </button>
      </form>
    </section>
  );
}
