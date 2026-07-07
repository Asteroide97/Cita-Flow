import Link from "next/link";

import type {
  AppointmentDoctorOption,
  AppointmentFilterValues,
  AppointmentServiceOption,
} from "@/types/appointments";

import {
  appointmentFieldClassName,
  appointmentStatusLabels,
  appointmentStatusOptions,
} from "./appointment-helpers";

type AppointmentFiltersProps = {
  doctors: AppointmentDoctorOption[];
  services: AppointmentServiceOption[];
  values: AppointmentFilterValues;
};

export function AppointmentFilters({
  doctors,
  services,
  values,
}: AppointmentFiltersProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Filtros
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Filtra por fecha, profesional, estado o servicio.
          </p>
        </div>
      </div>

      <form action="/app/appointments" className="mt-6 grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-semibold text-ink">
          Fecha
          <input
            name="filterDate"
            type="date"
            defaultValue={values.filterDate}
            className={appointmentFieldClassName}
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Profesional
          <select
            name="filterDoctorId"
            defaultValue={values.filterDoctorId}
            className={appointmentFieldClassName}
          >
            <option value="">Todos</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Estado
          <select
            name="filterStatus"
            defaultValue={values.filterStatus}
            className={appointmentFieldClassName}
          >
            <option value="">Todos</option>
            {appointmentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {appointmentStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Servicio
          <select
            name="filterServiceId"
            defaultValue={values.filterServiceId}
            className={appointmentFieldClassName}
          >
            <option value="">Todos</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:flex sm:flex-wrap lg:col-span-4">
          <button
            type="submit"
            className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 sm:w-auto"
          >
            Aplicar filtros
          </button>
          <Link
            href="/app/appointments"
            className="inline-flex w-full items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700 sm:w-auto"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </article>
  );
}
