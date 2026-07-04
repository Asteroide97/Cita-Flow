import {
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
  WaitlistStatus,
} from "@prisma/client";

export const patientFieldClassName =
  "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";

export const PATIENT_UPCOMING_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

export function isPatientUpcomingAppointment(
  appointment: {
    startAt: Date;
    status: AppointmentStatus;
  },
  now = new Date(),
) {
  return (
    appointment.startAt >= now &&
    PATIENT_UPCOMING_APPOINTMENT_STATUSES.includes(appointment.status)
  );
}

export function getPatientGeneralStatusLabel(hasUpcomingReservation: boolean) {
  return hasUpcomingReservation ? "Activo" : "Sin reservas proximas";
}

export function getPatientGeneralStatusClassName(hasUpcomingReservation: boolean) {
  return hasUpcomingReservation
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
    : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
}

export function getWaitlistStatusLabel(status: WaitlistStatus) {
  switch (status) {
    case WaitlistStatus.ACTIVE:
      return "Activa";
    case WaitlistStatus.OFFERED:
      return "Ofertada";
    case WaitlistStatus.CONVERTED:
      return "Convertida";
    case WaitlistStatus.CANCELLED:
      return "Cancelada";
    case WaitlistStatus.EXPIRED:
      return "Expirada";
  }
}

export function getWaitlistStatusClassName(status: WaitlistStatus) {
  switch (status) {
    case WaitlistStatus.ACTIVE:
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700";
    case WaitlistStatus.OFFERED:
      return "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
    case WaitlistStatus.CONVERTED:
      return "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700";
    case WaitlistStatus.CANCELLED:
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    case WaitlistStatus.EXPIRED:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
  }
}

export function getNotificationChannelLabel(channel: NotificationChannel) {
  switch (channel) {
    case NotificationChannel.WHATSAPP:
      return "WhatsApp";
    case NotificationChannel.EMAIL:
      return "Email";
  }
}

export function getNotificationStatusLabel(status: NotificationStatus) {
  switch (status) {
    case NotificationStatus.PENDING:
      return "Pendiente";
    case NotificationStatus.SENT:
      return "Enviada";
    case NotificationStatus.FAILED:
      return "Fallida";
    case NotificationStatus.CANCELLED:
      return "Cancelada";
  }
}

export function getNotificationStatusClassName(status: NotificationStatus) {
  switch (status) {
    case NotificationStatus.PENDING:
      return "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
    case NotificationStatus.SENT:
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700";
    case NotificationStatus.FAILED:
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    case NotificationStatus.CANCELLED:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
  }
}

export function isValidPatientEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function resolvePatientFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "patient-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese cliente dentro del negocio actual.",
        };
      case "patient-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del cliente es obligatorio.",
        };
      case "patient-phone-required":
        return {
          tone: "error" as const,
          message: "El telefono del cliente es obligatorio.",
        };
      case "patient-phone-invalid":
        return {
          tone: "error" as const,
          message: "El telefono del cliente no tiene un formato valido.",
        };
      case "patient-phone-duplicate":
        return {
          tone: "error" as const,
          message: "Ya existe otro cliente con ese telefono en este negocio.",
        };
      case "patient-email-invalid":
        return {
          tone: "error" as const,
          message: "El email del cliente no tiene un formato valido.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude guardar los cambios del cliente.",
        };
    }
  }

  switch (status) {
    case "patient-updated":
      return {
        tone: "success" as const,
        message: "Cliente actualizado correctamente.",
      };
    case "patient-unchanged":
      return {
        tone: "success" as const,
        message: "No habia cambios pendientes para este cliente.",
      };
    default:
      return null;
  }
}
