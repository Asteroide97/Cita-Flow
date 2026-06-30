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
    <section className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 2
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige el doctor
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Selecciona el profesional con quien deseas reservar. Solo se muestran
        doctores activos.
      </p>

      {!doctors.length ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          Este consultorio aun no tiene doctores disponibles para booking publico.
        </div>
      ) : (
        <form action={`/booking/${clinicSlug}`} method="get" className="mt-6">
          <input type="hidden" name="serviceId" value={selectedServiceId} />

          <fieldset className="grid gap-3">
            {doctors.map((doctor) => (
              <label
                key={doctor.id}
                className="cursor-pointer rounded-[24px] border border-line/80 bg-white/92 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="doctorId"
                    value={doctor.id}
                    defaultChecked={selectedDoctorId === doctor.id}
                    className="mt-1 h-4 w-4 border-line text-brand-600"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-ink">{doctor.name}</p>
                      <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        {doctor.specialty ?? "Consulta"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {doctor.bio ?? "Agenda disponible para reservas en linea."}
                    </p>
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
          Continuar con doctor
        </button>
      </form>
      )}
    </section>
  );
}
