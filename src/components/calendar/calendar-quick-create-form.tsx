import {
  buildClinicDateMarker,
  formatDateInTimeZone,
  type GetAvailableSlotsResult,
  type LocalDateParts,
} from "@/lib/appointments/availability";
import type {
  AppointmentDoctorOption,
  AppointmentPatientOption,
  AppointmentServiceOption,
} from "@/types/appointments";
import type { CalendarViewMode } from "@/types/calendar";

import { AvailableSlotsPicker } from "@/components/appointments/available-slots-picker";
import { PatientPicker } from "@/components/appointments/patient-picker";
import { Button } from "@/components/ui/button";
import { appointmentFieldClassName } from "@/components/appointments/appointment-helpers";

type CalendarQuickCreateFormProps = {
  activeDoctors: AppointmentDoctorOption[];
  activeServices: AppointmentServiceOption[];
  patients: AppointmentPatientOption[];
  selectedDoctorId: string;
  selectedServiceId: string;
  selectedDate: string;
  selectedSlotTime: string;
  selectedDateParts: LocalDateParts | null;
  selectedDoctor: AppointmentDoctorOption | null;
  selectedService: AppointmentServiceOption | null;
  availableSlotResult: GetAvailableSlotsResult | null;
  timezone: string;
  view: CalendarViewMode;
  calendarDateValue: string;
  filterDoctorId: string;
  loadActionPath: string;
  createAction: (formData: FormData) => void | Promise<void>;
  redirectPath: string;
  successRedirectPath: string;
};

export function CalendarQuickCreateForm({
  activeDoctors,
  activeServices,
  patients,
  selectedDoctorId,
  selectedServiceId,
  selectedDate,
  selectedSlotTime,
  selectedDateParts,
  selectedDoctor,
  selectedService,
  availableSlotResult,
  timezone,
  view,
  calendarDateValue,
  filterDoctorId,
  loadActionPath,
  createAction,
  redirectPath,
  successRedirectPath,
}: CalendarQuickCreateFormProps) {
  return (
    <article id="calendar-quick-create" className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
        Reserva rápida
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Crear reserva desde agenda
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Usa un horario disponible del día o prepárala manualmente. Se crea como{" "}
        <strong>CONFIRMED</strong> con origen <strong>ADMIN</strong>.
      </p>

      {activeDoctors.length && activeServices.length ? (
        <>
          <form action={loadActionPath} className="mt-6 grid gap-4">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={calendarDateValue} />
            <input type="hidden" name="doctorId" value={filterDoctorId} />

            <label className="text-sm font-semibold text-ink">
              Profesional
              <select
                name="createDoctorId"
                defaultValue={selectedDoctorId}
                className={appointmentFieldClassName}
              >
                <option value="">Selecciona un profesional</option>
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
                name="createServiceId"
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
                name="createDate"
                type="date"
                defaultValue={selectedDate}
                className={appointmentFieldClassName}
              />
            </label>

            <Button type="submit" variant="secondary">
              Ver horarios disponibles
            </Button>
          </form>

          {selectedDoctor && selectedService && selectedDate ? (
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
                  : selectedDate}
              </p>
            </div>
          ) : null}

          {availableSlotResult ? (
            availableSlotResult.slots.length ? (
              <form action={createAction} className="mt-6 grid gap-4">
                <input type="hidden" name="doctorId" value={selectedDoctorId} />
                <input type="hidden" name="serviceId" value={selectedServiceId} />
                <input type="hidden" name="date" value={selectedDate} />
                <input type="hidden" name="returnDoctorId" value={selectedDoctorId} />
                <input type="hidden" name="returnServiceId" value={selectedServiceId} />
                <input type="hidden" name="returnDate" value={selectedDate} />
                <input type="hidden" name="redirectPath" value={redirectPath} />
                <input
                  type="hidden"
                  name="successRedirectPath"
                  value={successRedirectPath}
                />

                <AvailableSlotsPicker
                  slots={availableSlotResult.slots}
                  selectedSlotTime={selectedSlotTime}
                />
                <PatientPicker patients={patients} />

                <label className="text-sm font-semibold text-ink">
                  Notas opcionales
                  <textarea
                    name="notes"
                    rows={3}
                    className={appointmentFieldClassName}
                    placeholder="Motivo, comentarios internos o contexto adicional."
                  />
                </label>

                <Button type="submit">Crear reserva confirmada</Button>
              </form>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
                No hay horarios disponibles para esta combinación. Prueba con otra
                fecha, profesional o servicio.
              </div>
            )
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
          Necesitas al menos un profesional activo y un servicio activo para crear
          reservas desde la agenda.
        </div>
      )}
    </article>
  );
}
