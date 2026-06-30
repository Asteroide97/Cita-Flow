import { AppointmentStatus } from "@prisma/client";

import {
  appointmentStatusLabels,
  getAppointmentStatusBadgeClassName,
} from "./appointment-helpers";

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
};

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return (
    <span className={getAppointmentStatusBadgeClassName(status)}>
      {appointmentStatusLabels[status]}
    </span>
  );
}
