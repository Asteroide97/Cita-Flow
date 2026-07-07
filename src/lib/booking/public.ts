import type {
  BookingClinic,
  BookingDateOption,
  BookingFlashMessage,
  BookingPreferredRange,
  BookingStepAnchor,
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

function formatDateValue(value: number) {
  return String(value).padStart(2, "0");
}

function buildDateValueFromParts(parts: { year: number; month: number; day: number }) {
  return `${String(parts.year).padStart(4, "0")}-${formatDateValue(parts.month)}-${formatDateValue(parts.day)}`;
}

function shiftDateParts(
  parts: { year: number; month: number; day: number },
  amount: number,
) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function buildDisplayDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return new Date();
  }

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  );
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
    slot?: string | null;
    slotTime?: string | null;
    status?: string | null;
    error?: string | null;
    focus?: BookingStepAnchor | null;
    waitlist?: boolean | null;
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

  const slotValue = params.slot ?? params.slotTime;

  if (slotValue) {
    query.set("slot", slotValue);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  if (params.focus) {
    query.set("focus", params.focus);
  }

  if (params.waitlist) {
    query.set("waitlist", "1");
  }

  const serialized = query.toString();

  return `/booking/${clinicSlug}${serialized ? `?${serialized}` : ""}`;
}

export function buildBookingAnchorHref(
  clinicSlug: string,
  anchor: BookingStepAnchor,
  params: Parameters<typeof buildBookingPath>[1] = {},
) {
  return `${buildBookingPath(clinicSlug, {
    ...params,
    focus: anchor,
  })}#${anchor}`;
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
          message: "Elige un profesional y un horario disponible para continuar.",
        };
      case "date-required":
        return {
          tone: "error",
          message: "Elige un día válido para consultar horarios reales.",
        };
      case "slot-required":
        return {
          tone: "error",
          message: "Selecciona un horario disponible antes de confirmar tu reserva.",
        };
      case "service-unavailable":
        return {
          tone: "error",
          message: "Ese servicio ya no está disponible para reservas públicas.",
        };
      case "doctor-unavailable":
        return {
          tone: "error",
          message: "Ese profesional ya no está disponible para este día o ya no es público.",
        };
      case "slot-unavailable":
        return {
          tone: "error",
          message: "Ese horario acaba de ocuparse. Elige otro.",
        };
      case "patient-name-required":
        return {
          tone: "error",
          message: "Necesitamos tu nombre para crear la reserva.",
        };
      case "patient-phone-required":
        return {
          tone: "error",
          message: "Comparte un teléfono o WhatsApp para continuar.",
        };
      case "patient-phone-invalid":
        return {
          tone: "error",
          message: "El teléfono no tiene un formato válido.",
        };
      case "patient-email-invalid":
        return {
          tone: "error",
          message: "El email no tiene un formato válido.",
        };
      case "waitlist-name-required":
        return {
          tone: "error",
          message: "Necesitamos tu nombre para agregarte a la lista de espera.",
        };
      case "waitlist-phone-required":
        return {
          tone: "error",
          message: "Comparte tu WhatsApp o teléfono para avisarte si se libera un espacio.",
        };
      case "waitlist-phone-invalid":
        return {
          tone: "error",
          message: "El teléfono para la lista de espera no tiene un formato válido.",
        };
      case "waitlist-email-invalid":
        return {
          tone: "error",
          message: "El email para la lista de espera no tiene un formato válido.",
        };
      case "clinic-unavailable":
        return {
          tone: "error",
          message: "Este enlace de reserva no está disponible en este momento.",
        };
      case "rate-limited":
        return {
          tone: "error",
          message:
            "Detectamos demasiados intentos recientes. Espera unos minutos e intenta de nuevo.",
        };
      case "waitlist-save":
        return {
          tone: "error",
          message: "No pudimos guardarte en lista de espera. Intenta de nuevo.",
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
      message: "Tu solicitud de reserva quedó registrada correctamente.",
    };
  }

  if (status === "waitlist-created") {
    return {
      tone: "success",
      message: "Listo. Te agregamos a la lista de espera.",
    };
  }

  return null;
}

export function getBookingTodayDateValue(timezone: string) {
  const parts = formatToParts(new Date(), timezone);

  return buildDateValueFromParts(parts);
}

export function getBookingDateOptions(timezone: string, count = 7): BookingDateOption[] {
  const todayParts = formatToParts(new Date(), timezone);

  return Array.from({ length: count }, (_, index) => {
    const currentParts = shiftDateParts(todayParts, index);
    const value = buildDateValueFromParts(currentParts);
    const displayDate = buildDisplayDate(value);

    return {
      value,
      dayLabel: new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        timeZone: timezone,
      }).format(displayDate),
      monthLabel: new Intl.DateTimeFormat("es-MX", {
        month: "short",
        timeZone: timezone,
      }).format(displayDate),
      weekdayLabel: new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        timeZone: timezone,
      }).format(displayDate),
      fullLabel: new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: timezone,
      }).format(displayDate),
      isToday: index === 0,
    } satisfies BookingDateOption;
  });
}

export function normalizeBookingEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getBookingClinicDisplayName(
  clinic: Pick<BookingClinic, "name" | "publicName">,
) {
  return clinic.publicName?.trim() || clinic.name;
}

export function isValidBookingEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function resolvePreferredTimeRange(
  range: BookingPreferredRange | string | null | undefined,
) {
  switch (range) {
    case "MORNING":
      return {
        startTime: "08:00",
        endTime: "13:59",
        label: "Mañana",
      };
    case "AFTERNOON":
      return {
        startTime: "14:00",
        endTime: "20:00",
        label: "Tarde",
      };
    case "ANY":
    default:
      return {
        startTime: null,
        endTime: null,
        label: "Cualquier horario",
      };
  }
}

export function getBookingClinicDescription(clinic: BookingClinic) {
  if (clinic.publicDescription?.trim()) {
    return clinic.publicDescription.trim();
  }

  return `Reserva en ${getBookingClinicDisplayName(clinic)}. Elige día, servicio, profesional y horario usando la disponibilidad real del negocio.`;
}
