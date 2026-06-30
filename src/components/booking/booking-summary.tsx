import { formatAppointmentMoney } from "@/components/appointments/appointment-helpers";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import type {
  BookingClinic,
  BookingDoctorOption,
  BookingServiceOption,
} from "@/types/booking";

type BookingSummaryProps = {
  clinic: BookingClinic;
  selectedService: BookingServiceOption | null;
  selectedDoctor: BookingDoctorOption | null;
  selectedDate: string;
  selectedSlotDateTime: Date | null;
};

export function BookingSummary({
  clinic,
  selectedService,
  selectedDoctor,
  selectedDate,
  selectedSlotDateTime,
}: BookingSummaryProps) {
  return (
    <aside className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Resumen de reserva
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        {clinic.name}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        El booking publico crea la cita en estado pendiente de confirmacion y el
        consultorio valida el horario desde su panel.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Servicio
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedService?.name ?? "Pendiente"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedService
              ? `${selectedService.durationMinutes} min - ${formatAppointmentMoney(selectedService.priceCents, clinic.currency)}`
              : "Selecciona un servicio para continuar."}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Doctor
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedDoctor?.name ?? "Pendiente"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedDoctor?.specialty ?? "Selecciona un doctor para ver la agenda."}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Fecha
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedSlotDateTime
              ? formatDateTimeInTimeZone(selectedSlotDateTime, clinic.timezone)
              : selectedDate || "Pendiente"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedSlotDateTime
              ? "Horario validado contra la disponibilidad real."
              : "La hora se definira despues de elegir un slot disponible."}
          </p>
        </div>

        <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Estado inicial
          </p>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            Pendiente de confirmacion
          </p>
          <p className="mt-1 text-sm text-brand-700">
            El consultorio revisara y confirmara la cita contigo.
          </p>
        </div>
      </div>
    </aside>
  );
}
