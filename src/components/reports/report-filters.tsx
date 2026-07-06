import type {
  ReportDoctorOption,
  ReportFilterValues,
  ReportServiceOption,
} from "@/types/reports";

type ReportFiltersProps = {
  doctors: ReportDoctorOption[];
  services: ReportServiceOption[];
  values: ReportFilterValues;
};

export function ReportFilters({
  doctors,
  services,
  values,
}: ReportFiltersProps) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Filtros
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            Ajusta el rango del reporte
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Filtra por fechas, profesional o servicio para revisar el desempeno del
            negocio sin salir del panel.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="text-sm font-semibold text-ink">
          Desde
          <input
            type="date"
            name="from"
            defaultValue={values.from}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Hasta
          <input
            type="date"
            name="to"
            defaultValue={values.to}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Profesional
          <select
            name="doctorId"
            defaultValue={values.doctorId}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Todos</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
                {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                {doctor.isActive ? "" : " (Inactivo)"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Servicio
          <select
            name="serviceId"
            defaultValue={values.serviceId}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Todos</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
                {service.isActive ? "" : " (Inactivo)"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 xl:w-auto"
          >
            Aplicar filtros
          </button>
        </div>
      </form>
    </section>
  );
}
