import { AppointmentStatus } from "@prisma/client";

export type PublicAppointmentAction = "confirm" | "cancel" | "reschedule";

export function buildPublicAppointmentPath(
  action: PublicAppointmentAction,
  token: string,
  params: {
    date?: string | null;
    slotTime?: string | null;
    error?: string | null;
  } = {},
) {
  const query = new URLSearchParams();

  if (params.date) {
    query.set("date", params.date);
  }

  if (params.slotTime) {
    query.set("slotTime", params.slotTime);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();

  return `/cita/${action === "confirm" ? "confirmar" : action === "cancel" ? "cancelar" : "reagendar"}/${token}${serialized ? `?${serialized}` : ""}`;
}

export function canPatientConfirmAppointment(status: AppointmentStatus) {
  return (
    status !== AppointmentStatus.CANCELLED &&
    status !== AppointmentStatus.COMPLETED &&
    status !== AppointmentStatus.NO_SHOW
  );
}

export function canPatientCancelAppointment(status: AppointmentStatus) {
  return (
    status !== AppointmentStatus.CANCELLED &&
    status !== AppointmentStatus.COMPLETED &&
    status !== AppointmentStatus.NO_SHOW
  );
}

export function canPatientRescheduleAppointment(status: AppointmentStatus) {
  return (
    status !== AppointmentStatus.CANCELLED &&
    status !== AppointmentStatus.COMPLETED &&
    status !== AppointmentStatus.NO_SHOW
  );
}

export function resolvePublicAppointmentFlashMessage(error?: string) {
  if (!error) {
    return null;
  }

  switch (error) {
    case "appointment-action-invalid":
      return {
        tone: "error" as const,
        message:
          "La acción ya no está permitida para el estado actual de la reserva.",
      };
    case "date-required":
      return {
        tone: "error" as const,
        message: "Selecciona una fecha valida para cargar horarios reales.",
      };
    case "slot-required":
      return {
        tone: "error" as const,
        message: "Selecciona un horario disponible antes de guardar el cambio.",
      };
    case "slot-unavailable":
      return {
        tone: "error" as const,
        message:
          "Ese horario ya no esta disponible. Revisa las opciones actualizadas.",
      };
    default:
      return {
        tone: "error" as const,
        message: "No pudimos completar la accion solicitada.",
      };
  }
}

export function resolveTokenErrorCopy(
  reason:
    | "TOKEN_NOT_FOUND"
    | "TOKEN_TYPE_MISMATCH"
    | "TOKEN_EXPIRED"
    | "TOKEN_CONSUMED"
    | "CLINIC_INACTIVE"
    | "APPOINTMENT_NOT_FOUND"
    | "APPOINTMENT_CLINIC_MISMATCH",
) {
  switch (reason) {
    case "TOKEN_EXPIRED":
      return {
        title: "Este enlace ya expiro",
        description:
          "El enlace de autoservicio ya venció. Solicita uno nuevo al negocio.",
      };
    case "TOKEN_CONSUMED":
      return {
        title: "Este enlace ya fue usado",
        description:
          "Este enlace ya se usó antes. Si necesitas otra acción, pide uno nuevo al negocio.",
      };
    case "CLINIC_INACTIVE":
      return {
        title: "El negocio no está disponible",
        description:
          "El negocio ya no está aceptando acciones públicas sobre esta reserva.",
      };
    case "TOKEN_TYPE_MISMATCH":
      return {
        title: "El enlace no coincide con esta accion",
        description:
          "Abre el enlace correcto para confirmar, cancelar o reagendar la reserva.",
      };
    case "APPOINTMENT_CLINIC_MISMATCH":
    case "APPOINTMENT_NOT_FOUND":
    case "TOKEN_NOT_FOUND":
    default:
      return {
        title: "No pudimos validar este enlace",
        description:
          "El enlace no existe, la reserva ya no está disponible o fue modificado.",
      };
  }
}
