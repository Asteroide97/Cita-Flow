import { formatAppointmentMoney } from "@/components/appointments/appointment-helpers";
import type {
  BookingClinic,
  BookingDoctorOption,
  BookingServiceOption,
} from "@/types/booking";

type BookingSummaryProps = {
  clinic: BookingClinic;
  selectedDate: string;
  selectedService: BookingServiceOption | null;
  selectedDoctor: BookingDoctorOption | null;
  selectedSlotDateTime: Date | null;
};

function formatSelectedDay(value: string, timezone: string) {
  if (!value) {
    return "Elige un día";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  );

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(date);
}

function formatSelectedTime(value: Date | null, timezone: string) {
  if (!value) {
    return "Elige profesional y horario";
  }

  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(value);
}

function getNextStepLabel(params: {
  selectedDate: string;
  selectedService: BookingServiceOption | null;
  selectedDoctor: BookingDoctorOption | null;
  selectedSlotDateTime: Date | null;
}) {
  if (!params.selectedDate) {
    return "Elige un día";
  }

  if (!params.selectedService) {
    return "Elige un servicio";
  }

  if (!params.selectedDoctor || !params.selectedSlotDateTime) {
    return "Elige profesional y horario";
  }

  return "Completa tus datos";
}

export function BookingSummary({
  clinic,
  selectedDate,
  selectedService,
  selectedDoctor,
  selectedSlotDateTime,
}: BookingSummaryProps) {
  const nextStepLabel = getNextStepLabel({
    selectedDate,
    selectedService,
    selectedDoctor,
    selectedSlotDateTime,
  });

  return (
    <aside className="surface-card min-w-0 p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Resumen de reserva
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        {clinic.name}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Tu reserva quedará pendiente de confirmación.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Día
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {formatSelectedDay(selectedDate, clinic.timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedDate
              ? "La fecha filtra la disponibilidad real."
              : "Empieza seleccionando el día que prefieres."}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Servicio
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedService?.name ?? "Elige un servicio"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedService
              ? `${selectedService.durationMinutes} min · ${formatAppointmentMoney(selectedService.priceCents, clinic.currency)}`
              : "Selecciona el servicio para ver horarios reales."}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Profesional
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {selectedDoctor?.name ?? "Elige profesional y horario"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedDoctor?.specialty ??
              "Mostramos solo profesionales con horarios reales para ese día."}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Horario
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {formatSelectedTime(selectedSlotDateTime, clinic.timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedSlotDateTime
              ? "Ya puedes completar tus datos para solicitar la reserva."
              : "Selecciona un horario para continuar."}
          </p>
        </div>

        <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Siguiente paso
          </p>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            {nextStepLabel}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            {selectedSlotDateTime
              ? "Envía el formulario para dejar la reserva pendiente."
              : "Completa cada paso para continuar con la reserva."}
          </p>
        </div>

        <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Estado
          </p>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            Pendiente de confirmación
          </p>
          <p className="mt-1 text-sm text-brand-700">
            El negocio confirmará tu solicitud después de recibirla.
          </p>
        </div>
      </div>
    </aside>
  );
}
