import { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client";

import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import type { AppointmentSelfServiceLinks } from "@/lib/appointments/tokens";

export const notificationTemplateKeys = [
  "APPOINTMENT_CREATED_PUBLIC",
  "APPOINTMENT_CREATED_ADMIN",
  "APPOINTMENT_CREATED_WHATSAPP",
  "APPOINTMENT_CONFIRMED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_REMINDER_24H",
  "APPOINTMENT_REMINDER_2H",
] as const;

export type NotificationTemplateKey = (typeof notificationTemplateKeys)[number];

export const notificationTemplateLabels: Record<NotificationTemplateKey, string> = {
  APPOINTMENT_CREATED_PUBLIC: "Cita creada desde booking publico",
  APPOINTMENT_CREATED_ADMIN: "Cita creada desde panel",
  APPOINTMENT_CREATED_WHATSAPP: "Cita creada desde WhatsApp",
  APPOINTMENT_CONFIRMED: "Cita confirmada",
  APPOINTMENT_CANCELLED: "Cita cancelada",
  APPOINTMENT_RESCHEDULED: "Cita reagendada",
  APPOINTMENT_REMINDER_24H: "Recordatorio 24 horas",
  APPOINTMENT_REMINDER_2H: "Recordatorio 2 horas",
};

export type AppointmentNotificationTemplateContext = {
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
    brandColor: string | null;
  };
  appointment: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    source: AppointmentSource;
    notes: string | null;
  };
  patient: {
    id: string;
    name: string;
    phoneE164: string;
    email: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number | null;
    depositRequired: boolean;
    depositCents: number | null;
  };
  selfServiceLinks?: AppointmentSelfServiceLinks | null;
};

export type RenderedNotificationTemplate = {
  whatsappBody: string;
  email: {
    subject: string;
    body: string;
  } | null;
  payload: Prisma.InputJsonValue;
};

function formatMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "No configurado";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getAppointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.PENDING:
      return "Pendiente de confirmacion";
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

function getAppointmentSourceLabel(source: AppointmentSource) {
  switch (source) {
    case AppointmentSource.ADMIN:
      return "panel administrativo";
    case AppointmentSource.PUBLIC_BOOKING:
      return "booking publico";
    case AppointmentSource.WHATSAPP:
      return "WhatsApp";
    case AppointmentSource.IMPORT:
      return "importacion";
  }
}

function buildSelfServiceLines(links: AppointmentSelfServiceLinks | null | undefined) {
  if (!links) {
    return [];
  }

  return [
    "Enlaces de autoservicio:",
    `Confirmar: ${links.confirmUrl}`,
    `Cancelar: ${links.cancelUrl}`,
    `Reagendar: ${links.rescheduleUrl}`,
  ];
}

function buildAppointmentDetailLines(context: AppointmentNotificationTemplateContext) {
  const scheduleLabel = formatDateTimeInTimeZone(
    context.appointment.startAt,
    context.clinic.timezone,
  );

  return [
    `Consultorio: ${context.clinic.name}`,
    `Servicio: ${context.service.name} · ${context.service.durationMinutes} min`,
    `Doctor: ${context.doctor.name}${context.doctor.specialty ? ` · ${context.doctor.specialty}` : ""}`,
    `Fecha: ${scheduleLabel}`,
    `Estado: ${getAppointmentStatusLabel(context.appointment.status)}`,
  ];
}

function buildPricingLines(context: AppointmentNotificationTemplateContext) {
  const lines: string[] = [];

  if (context.service.priceCents !== null) {
    lines.push(
      `Precio: ${formatMoney(context.service.priceCents, context.clinic.currency)}`,
    );
  }

  if (context.service.depositRequired && context.service.depositCents) {
    lines.push(
      `Anticipo configurado: ${formatMoney(context.service.depositCents, context.clinic.currency)}`,
    );
  }

  return lines;
}

function buildMessage(params: {
  intro: string[];
  details: string[];
  pricing?: string[];
  links?: string[];
  footer?: string[];
}) {
  return [
    ...params.intro,
    "",
    ...params.details,
    ...(params.pricing && params.pricing.length ? ["", ...params.pricing] : []),
    ...(params.links && params.links.length ? ["", ...params.links] : []),
    ...(params.footer && params.footer.length ? ["", ...params.footer] : []),
  ].join("\n");
}

function buildPayload(
  templateKey: NotificationTemplateKey,
  context: AppointmentNotificationTemplateContext,
) {
  return {
    templateKey,
    clinic: {
      id: context.clinic.id,
      name: context.clinic.name,
      slug: context.clinic.slug,
      timezone: context.clinic.timezone,
      currency: context.clinic.currency,
      brandColor: context.clinic.brandColor,
    },
    appointment: {
      id: context.appointment.id,
      startAt: context.appointment.startAt.toISOString(),
      endAt: context.appointment.endAt.toISOString(),
      status: context.appointment.status,
      source: context.appointment.source,
      notes: context.appointment.notes,
    },
    patient: {
      id: context.patient.id,
      name: context.patient.name,
      phoneE164: context.patient.phoneE164,
      email: context.patient.email,
    },
    doctor: {
      id: context.doctor.id,
      name: context.doctor.name,
      specialty: context.doctor.specialty,
    },
    service: {
      id: context.service.id,
      name: context.service.name,
      durationMinutes: context.service.durationMinutes,
      priceCents: context.service.priceCents,
      depositRequired: context.service.depositRequired,
      depositCents: context.service.depositCents,
    },
    selfServiceLinks: context.selfServiceLinks ?? null,
  } satisfies Prisma.InputJsonValue;
}

export function renderNotificationTemplate(
  templateKey: NotificationTemplateKey,
  context: AppointmentNotificationTemplateContext,
): RenderedNotificationTemplate {
  const details = buildAppointmentDetailLines(context);
  const pricing = buildPricingLines(context);
  const links = buildSelfServiceLines(context.selfServiceLinks);

  switch (templateKey) {
    case "APPOINTMENT_CREATED_PUBLIC": {
      const subject = `Solicitud de cita recibida - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, recibimos tu solicitud de cita en ${context.clinic.name}.`,
          "El consultorio revisara el horario y te confirmara a la brevedad.",
        ],
        details,
        pricing,
        links,
        footer: [
          `Origen: ${getAppointmentSourceLabel(context.appointment.source)}.`,
        ],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_CREATED_ADMIN": {
      const subject = `Cita registrada - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, el consultorio registro una cita para ti en ${context.clinic.name}.`,
        ],
        details,
        pricing,
        links,
        footer: ["Si necesitas ajustar el horario, usa los enlaces incluidos en este mensaje."],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_CREATED_WHATSAPP": {
      const subject = `Cita registrada por WhatsApp - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu cita ya quedo registrada desde WhatsApp en ${context.clinic.name}.`,
        ],
        details,
        pricing,
        links,
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_CONFIRMED": {
      const subject = `Cita confirmada - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu cita fue confirmada por ${context.clinic.name}.`,
        ],
        details,
        pricing,
        links,
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_CANCELLED": {
      const subject = `Cita cancelada - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu cita fue cancelada en ${context.clinic.name}.`,
        ],
        details,
        pricing,
        footer: ["Si necesitas una nueva cita, puedes volver a reservar con el consultorio."],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_RESCHEDULED": {
      const subject = `Cita reagendada - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu cita fue reagendada en ${context.clinic.name}.`,
        ],
        details,
        pricing,
        links,
        footer: [
          "Revisa el nuevo horario y conserva este mensaje para futuras acciones.",
        ],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_REMINDER_24H": {
      const subject = `Recordatorio de cita para manana - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, este es un recordatorio de tu cita de manana en ${context.clinic.name}.`,
        ],
        details,
        pricing,
        links,
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }

    case "APPOINTMENT_REMINDER_2H": {
      const subject = `Recordatorio de cita en 2 horas - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu cita en ${context.clinic.name} comienza en aproximadamente 2 horas.`,
        ],
        details,
        pricing,
        links,
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildPayload(templateKey, context),
      };
    }
  }
}
