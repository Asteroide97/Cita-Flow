import type {
  BookingClinic,
  BookingFlashMessage,
} from "@/types/booking";

const DEFAULT_BOOKING_BRAND_COLOR = "#2563eb";

function formatToParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getValue("year")),
    month: Number(getValue("month")),
    day: Number(getValue("day")),
  };
}

export function getBookingClientIp(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

export function normalizeBookingBrandColor(value: string | null | undefined) {
  if (value && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())) {
    return value.trim();
  }

  return DEFAULT_BOOKING_BRAND_COLOR;
}

export function buildBookingPath(
  clinicSlug: string,
  params: {
    serviceId?: string | null;
    doctorId?: string | null;
    date?: string | null;
    slotTime?: string | null;
    status?: string | null;
    error?: string | null;
  } = {},
) {
  const query = new URLSearchParams();

  if (params.serviceId) {
    query.set("serviceId", params.serviceId);
  }

  if (params.doctorId) {
    query.set("doctorId", params.doctorId);
  }

  if (params.date) {
    query.set("date", params.date);
  }

  if (params.slotTime) {
    query.set("slotTime", params.slotTime);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();

  return `/booking/${clinicSlug}${serialized ? `?${serialized}` : ""}`;
}

export function resolveBookingFlashMessage(
  status?: string,
  error?: string,
): BookingFlashMessage | null {
  if (error) {
    switch (error) {
      case "service-required":
        return {
          tone: "error",
          message: "Selecciona un servicio para continuar con la reserva.",
        };
      case "doctor-required":
        return {
          tone: "error",
          message: "Selecciona un doctor disponible para continuar.",
        };
      case "date-required":
        return {
          tone: "error",
          message: "Elige una fecha valida para consultar horarios reales.",
        };
      case "slot-required":
        return {
          tone: "error",
          message: "Selecciona un horario disponible antes de confirmar tu cita.",
        };
      case "service-unavailable":
        return {
          tone: "error",
          message: "Ese servicio ya no esta disponible para reservas publicas.",
        };
      case "doctor-unavailable":
        return {
          tone: "error",
          message: "Ese doctor ya no esta disponible en este consultorio.",
        };
      case "slot-unavailable":
        return {
          tone: "error",
          message:
            "Ese horario ya no esta disponible. Revisa la lista actualizada y elige otro.",
        };
      case "patient-name-required":
        return {
          tone: "error",
          message: "Necesitamos el nombre del paciente para crear la cita.",
        };
      case "patient-phone-required":
        return {
          tone: "error",
          message: "Comparte un telefono o WhatsApp para continuar.",
        };
      case "patient-phone-invalid":
        return {
          tone: "error",
          message: "El telefono no tiene un formato valido.",
        };
      case "patient-email-invalid":
        return {
          tone: "error",
          message: "El email no tiene un formato valido.",
        };
      case "clinic-unavailable":
        return {
          tone: "error",
          message: "Este enlace de reserva no esta disponible en este momento.",
        };
      case "rate-limited":
        return {
          tone: "error",
          message:
            "Detectamos demasiados intentos recientes. Espera unos minutos e intenta de nuevo.",
        };
      case "booking-save":
      default:
        return {
          tone: "error",
          message:
            "No pudimos completar tu reserva. Revisa los datos e intenta de nuevo.",
        };
    }
  }

  if (status === "booking-created") {
    return {
      tone: "success",
      message: "Tu solicitud de cita quedo registrada correctamente.",
    };
  }

  return null;
}

export function getBookingTodayDateValue(timezone: string) {
  const parts = formatToParts(new Date(), timezone);

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function normalizeBookingEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidBookingEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getBookingClinicDescription(clinic: BookingClinic) {
  return `Reserva una cita en ${clinic.name}. Elige servicio, doctor, fecha y horario usando la disponibilidad real del consultorio.`;
}
