import {
  buildClinicDateMarker,
  formatDateInTimeZone,
  type LocalDateParts,
  type GetAvailableSlotsResult,
} from "@/lib/appointments/availability";
import type {
  AppointmentDoctorOption,
  AppointmentPatientOption,
  AppointmentServiceOption,
} from "@/types/appointments";

import { appointmentFieldClassName } from "./appointment-helpers";
import { AvailableSlotsPicker } from "./available-slots-picker";
import { PatientPicker } from "./patient-picker";

type AppointmentCreateFormProps = {
  activeDoctors: AppointmentDoctorOption[];
  activeServices: AppointmentServiceOption[];
  patients: AppointmentPatientOption[];
  selectedDoctorId: string;
  selectedServiceId: string;
  selectedFormDate: string;
  selectedDateParts: LocalDateParts | null;
  selectedDoctor: AppointmentDoctorOption | null;
  selectedService: AppointmentServiceOption | null;
  availableSlotResult: GetAvailableSlotsResult | null;
  timezone: string;
  createAction: (formData: FormData) => void | Promise<void>;
};

export function AppointmentCreateForm({
  activeDoctors,
  activeServices,
  patients,
  selectedDoctorId,
  selectedServiceId,
  selectedFormDate,
  selectedDateParts,
  selectedDoctor,
  selectedService,
  availableSlotResult,
  timezone,
  createAction,
}: AppointmentCreateFormProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
        Crear cita manual
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">
        La cita del panel se crea como <strong>CONFIRMED</strong> con origen{" "}
        <strong>ADMIN</strong>. Solo puedes reservar horarios reales disponibles.
      </p>

      {activeDoctors.length && activeServices.length ? (
        <>
          <form action="/app/appointments" className="mt-6 grid gap-4">
            <label className="text-sm font-semibold text-ink">
              Doctor
              <select
                name="formDoctorId"
                defaultValue={selectedDoctorId}
                className={appointmentFieldClassName}
              >
                <option value="">Selecciona un doctor</option>
                {activeDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                    {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-ink">
              Servicio
              <select
                name="formServiceId"
                defaultValue={selectedServiceId}
                className={appointmentFieldClassName}
              >
                <option value="">Selecciona un servicio</option>
                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.durationMinutes} min
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-ink">
              Fecha
              <input
                name="formDate"
                type="date"
                defaultValue={selectedFormDate}
                className={appointmentFieldClassName}
              />
            </label>

            <button
              type="submit"
              className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
            >
              Ver horarios disponibles
            </button>
          </form>

          {selectedDoctor && selectedService && selectedFormDate ? (
            <div className="mt-6 rounded-[24px] border border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-ink">
                {selectedDoctor.name} - {selectedService.name}
              </p>
              <p className="mt-2">
                Fecha seleccionada:{" "}
                {selectedDateParts
                  ? formatDateInTimeZone(
                      buildClinicDateMarker(selectedDateParts, timezone),
                      timezone,
                    )
                  : selectedFormDate}
              </p>
            </div>
          ) : null}

          {availableSlotResult ? (
            availableSlotResult.slots.length ? (
              <form action={createAction} className="mt-6 grid gap-4">
                <input type="hidden" name="doctorId" value={selectedDoctorId} />
                <input type="hidden" name="serviceId" value={selectedServiceId} />
                <input type="hidden" name="date" value={selectedFormDate} />
                <input type="hidden" name="returnDoctorId" value={selectedDoctorId} />
                <input type="hidden" name="returnServiceId" value={selectedServiceId} />
                <input type="hidden" name="returnDate" value={selectedFormDate} />

                <AvailableSlotsPicker slots={availableSlotResult.slots} />
                <PatientPicker patients={patients} />

                <label className="text-sm font-semibold text-ink">
                  Notas opcionales
                  <textarea
                    name="notes"
                    rows={3}
                    className={appointmentFieldClassName}
                    placeholder="Motivo de consulta, comentarios internos o contexto adicional."
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                >
                  Crear cita confirmada
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
                No hay horarios disponibles para esta combinacion. Prueba con otra
                fecha, doctor o servicio.
              </div>
            )
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
          Necesitas al menos un doctor activo y un servicio activo para crear citas
          desde el panel.
        </div>
      )}
    </article>
  );
}
