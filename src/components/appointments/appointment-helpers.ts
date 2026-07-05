import { AppointmentStatus } from "@prisma/client";

import type {
  AppointmentFlashMessage,
  AppointmentSourceLabels,
  AppointmentStatusLabels,
} from "@/types/appointments";

export const appointmentFieldClassName =
  "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";

export const appointmentStatusOptions = Object.values(AppointmentStatus);

export const appointmentStatusLabels: AppointmentStatusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
  COMPLETED: "Completada",
  NO_SHOW: "No-show",
};

export const appointmentSourceLabels: AppointmentSourceLabels = {
  ADMIN: "Panel",
  PUBLIC_BOOKING: "Booking público",
  WHATSAPP: "WhatsApp",
  IMPORT: "Importación",
};

export function formatAppointmentMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "Sin precio";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatAppointmentPhone(phoneE164: string) {
  return phoneE164.startsWith("+52") && phoneE164.length >= 13
    ? `${phoneE164.slice(0, 3)} ${phoneE164.slice(3, 6)} ${phoneE164.slice(6, 9)} ${phoneE164.slice(9)}`
    : phoneE164;
}

export function getAppointmentStatusBadgeClassName(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700";
    case AppointmentStatus.PENDING:
      return "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
    case AppointmentStatus.CANCELLED:
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    case AppointmentStatus.COMPLETED:
      return "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700";
    case AppointmentStatus.NO_SHOW:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
    case AppointmentStatus.RESCHEDULED:
    default:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600";
  }
}

export function resolveAppointmentsFlashMessage(
  status?: string,
  error?: string,
): AppointmentFlashMessage | null {
  if (error) {
    switch (error) {
      case "doctor-required":
        return {
          tone: "error",
          message: "Selecciona un profesional antes de buscar o crear la reserva.",
        };
      case "service-required":
        return {
          tone: "error",
          message: "Selecciona un servicio antes de continuar.",
        };
      case "date-required":
        return {
          tone: "error",
          message: "Selecciona una fecha válida para cargar horarios.",
        };
      case "slot-required":
        return {
          tone: "error",
          message: "Selecciona un horario disponible para crear la reserva.",
        };
      case "slot-unavailable":
        return {
          tone: "error",
          message: "Ese horario ya no está disponible. Revisa las opciones actualizadas.",
        };
      case "doctor-inactive":
        return {
          tone: "error",
          message: "El profesional seleccionado está inactivo o no pertenece a este negocio.",
        };
      case "service-inactive":
        return {
          tone: "error",
          message: "El servicio seleccionado está inactivo o no pertenece a este negocio.",
        };
      case "patient-not-found":
        return {
          tone: "error",
          message: "No encontré ese cliente dentro del negocio actual.",
        };
      case "patient-name-required":
        return {
          tone: "error",
          message: "Si no eliges un cliente existente, el nombre es obligatorio.",
        };
      case "patient-phone-required":
        return {
          tone: "error",
          message: "Si no eliges un cliente existente, el teléfono es obligatorio.",
        };
      case "patient-phone-invalid":
        return {
          tone: "error",
          message: "El teléfono no tiene un formato válido.",
        };
      case "patient-email-invalid":
        return {
          tone: "error",
          message: "El email del cliente no es válido.",
        };
      case "appointment-not-found":
        return {
          tone: "error",
          message: "No encontré esa reserva dentro del negocio actual.",
        };
      case "appointment-action-invalid":
        return {
          tone: "error",
          message: "La acción solicitada no está permitida para el estado actual de la reserva.",
        };
      case "appointment-save":
        return {
          tone: "error",
          message: "No pude guardar la reserva. Intenta de nuevo.",
        };
      default:
        return {
          tone: "error",
          message: "No pude completar la acción solicitada.",
        };
    }
  }

  switch (status) {
    case "appointment-created":
      return {
        tone: "success",
        message: "Reserva creada correctamente desde el panel.",
      };
    case "appointment-confirmed":
      return {
        tone: "success",
        message: "La reserva quedó confirmada nuevamente.",
      };
    case "appointment-cancelled":
      return {
        tone: "success",
        message: "La reserva fue cancelada sin borrar historial.",
      };
    case "appointment-completed":
      return {
        tone: "success",
        message: "La reserva fue marcada como completada.",
      };
    case "appointment-no-show":
      return {
        tone: "success",
        message: "La reserva fue marcada como no-show.",
      };
    case "appointment-rescheduled":
      return {
        tone: "success",
        message: "La reserva fue reagendada correctamente.",
      };
    default:
      return null;
  }
}

export function shiftAppointmentDatePartsByOneDay(parts: {
  year: number;
  month: number;
  day: number;
}) {
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));

  return {
    year: nextDay.getUTCFullYear(),
    month: nextDay.getUTCMonth() + 1,
    day: nextDay.getUTCDate(),
  };
}

export function getAppointmentActionAvailability(status: AppointmentStatus) {
  const canConfirm = status === AppointmentStatus.PENDING;
  const canCancel =
    status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;
  const canComplete =
    status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;
  const canNoShow =
    status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;

  return {
    canConfirm,
    canCancel,
    canComplete,
    canNoShow,
  };
}
