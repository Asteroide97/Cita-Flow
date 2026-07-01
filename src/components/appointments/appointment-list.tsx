import type { AppointmentListItem } from "@/types/appointments";

import { AppointmentCard } from "./appointment-card";

type AppointmentListProps = {
  appointments: AppointmentListItem[];
  timezone: string;
  currency: string;
  statusAction: (formData: FormData) => void | Promise<void>;
};

export function AppointmentList({
  appointments,
  timezone,
  currency,
  statusAction,
}: AppointmentListProps) {
  if (!appointments.length) {
    return (
      <article className="surface-card p-7">
        <p className="text-lg font-semibold text-ink">
          No hay reservas para los filtros seleccionados.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Ajusta los filtros o crea una reserva nueva desde el panel izquierdo.
        </p>
      </article>
    );
  }

  return (
    <>
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          timezone={timezone}
          currency={currency}
          statusAction={statusAction}
        />
      ))}
    </>
  );
}
