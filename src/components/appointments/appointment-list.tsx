import type { AppointmentListItem } from "@/types/appointments";

import { EmptyState } from "@/components/ui/empty-state";
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
        <EmptyState
          title="No hay reservas para los filtros seleccionados."
          description="Ajusta los filtros o crea una reserva nueva."
        />
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
