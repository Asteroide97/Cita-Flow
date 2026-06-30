import type { AppointmentPatientOption } from "@/types/appointments";

import {
  appointmentFieldClassName,
  formatAppointmentPhone,
} from "./appointment-helpers";

type PatientPickerProps = {
  patients: AppointmentPatientOption[];
};

export function PatientPicker({ patients }: PatientPickerProps) {
  return (
    <>
      <label className="text-sm font-semibold text-ink">
        Paciente existente opcional
        <select name="existingPatientId" className={appointmentFieldClassName}>
          <option value="">Crear o detectar paciente por telefono</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} - {formatAppointmentPhone(patient.phoneE164)}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm text-muted">
        Si no eliges un paciente existente, CitaFlow intentara reutilizar uno del
        mismo clinic si encuentra el mismo telefono.
      </div>

      <label className="text-sm font-semibold text-ink">
        Nombre del paciente
        <input
          name="patientName"
          className={appointmentFieldClassName}
          placeholder="Ana Lopez"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">
          Telefono
          <input
            name="patientPhone"
            className={appointmentFieldClassName}
            placeholder="+525511223344"
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Email opcional
          <input
            name="patientEmail"
            type="email"
            className={appointmentFieldClassName}
            placeholder="ana@example.com"
          />
        </label>
      </div>
    </>
  );
}
