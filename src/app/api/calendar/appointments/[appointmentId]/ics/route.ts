import { AppointmentStatus } from "@prisma/client";

import { getPublicAppointmentByToken } from "@/lib/appointments/tokens";
import { buildAppointmentIcs } from "@/lib/calendar/ics";

function getAppointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.PENDING:
      return "Pendiente de confirmación";
    case AppointmentStatus.CONFIRMED:
      return "Confirmada";
    case AppointmentStatus.CANCELLED:
      return "Cancelada";
    case AppointmentStatus.RESCHEDULED:
      return "Reagendada";
    case AppointmentStatus.COMPLETED:
      return "Completada";
    case AppointmentStatus.NO_SHOW:
      return "No show";
  }
}

function getOptionalSearchParam(
  searchParams: URLSearchParams,
  key: string,
) {
  const value = searchParams.get(key)?.trim() ?? "";

  return value || null;
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      appointmentId: string;
    }>;
  },
) {
  const { appointmentId } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";

  if (!appointmentId.trim() || !token) {
    return new Response("No pudimos generar el archivo de calendario.", {
      status: 400,
    });
  }

  const validation = await getPublicAppointmentByToken({
    token,
  });

  if (!validation || validation.appointment.id !== appointmentId.trim()) {
    return new Response("No encontramos esta reserva para calendario.", {
      status: 404,
    });
  }

  const searchParams = new URL(request.url).searchParams;
  const icsFile = buildAppointmentIcs({
    appointmentId: validation.appointment.id,
    clinicName:
      validation.appointment.clinic.publicName?.trim() ||
      validation.appointment.clinic.name,
    serviceName: validation.appointment.service.name,
    doctorName: validation.appointment.doctor.name,
    statusLabel: getAppointmentStatusLabel(validation.appointment.status),
    startAt: validation.appointment.startAt,
    endAt: validation.appointment.endAt,
    timezone: validation.appointment.clinic.timezone,
    websiteUrl: validation.appointment.clinic.websiteUrl,
    contactEmail: validation.appointment.clinic.contactEmail,
    contactPhone: validation.appointment.clinic.contactPhone,
    selfServiceLinks: {
      confirmUrl: getOptionalSearchParam(searchParams, "confirm"),
      cancelUrl: getOptionalSearchParam(searchParams, "cancel"),
      rescheduleUrl: getOptionalSearchParam(searchParams, "reschedule"),
    },
  });

  return new Response(icsFile, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reserva-agenda-viva.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
