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
  "WAITLIST_ENTRY_CREATED",
  "WAITLIST_SLOT_OFFERED",
  "WAITLIST_AUTO_ASSIGNED",
  "WAITLIST_OFFER_ACCEPTED",
  "WAITLIST_OFFER_EXPIRED",
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
  WAITLIST_ENTRY_CREATED: "Entrada creada en lista de espera",
  WAITLIST_SLOT_OFFERED: "Espacio ofrecido desde lista de espera",
  WAITLIST_AUTO_ASSIGNED: "Horario asignado automaticamente desde lista de espera",
  WAITLIST_OFFER_ACCEPTED: "Oferta de lista de espera aceptada",
  WAITLIST_OFFER_EXPIRED: "Oferta de lista de espera expirada",
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

export type WaitlistNotificationTemplateContext = {
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
    brandColor: string | null;
  };
  patient: {
    id: string;
    name: string;
    phoneE164: string;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number | null;
    depositRequired: boolean;
    depositCents: number | null;
  };
  doctor?: {
    id: string;
    name: string;
    specialty: string | null;
  } | null;
  waitlistEntry: {
    id: string;
    preferredDate: Date | null;
    preferredStartTime: string | null;
    preferredEndTime: string | null;
    autoAccept: boolean;
    notes: string | null;
    createdAt: Date;
  };
  offer?: {
    id: string;
    offeredStartAt: Date;
    offeredEndAt: Date;
    expiresAt: Date;
    acceptUrl?: string | null;
    rejectUrl?: string | null;
  } | null;
  appointment?: {
    id: string;
    startAt: Date;
    endAt: Date;
    source: AppointmentSource;
    status: AppointmentStatus;
  } | null;
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

function buildWaitlistPreferenceLines(context: WaitlistNotificationTemplateContext) {
  const lines = [`Servicio: ${context.service.name}`];

  if (context.doctor) {
    lines.push(
      `Doctor preferido: ${context.doctor.name}${context.doctor.specialty ? ` - ${context.doctor.specialty}` : ""}`,
    );
  } else {
    lines.push("Doctor preferido: Cualquier doctor disponible");
  }

  if (context.waitlistEntry.preferredDate) {
    lines.push(
      `Fecha preferida: ${formatDateTimeInTimeZone(
        context.waitlistEntry.preferredDate,
        context.clinic.timezone,
      ).replace(/, 12:00$/, "")}`,
    );
  }

  if (
    context.waitlistEntry.preferredStartTime ||
    context.waitlistEntry.preferredEndTime
  ) {
    lines.push(
      `Horario preferido: ${context.waitlistEntry.preferredStartTime ?? "00:00"} - ${context.waitlistEntry.preferredEndTime ?? "23:59"}`,
    );
  } else {
    lines.push("Horario preferido: Cualquier horario");
  }

  lines.push(
    `Asignacion automatica: ${context.waitlistEntry.autoAccept ? "Si" : "No"}`,
  );

  if (context.waitlistEntry.notes) {
    lines.push(`Notas: ${context.waitlistEntry.notes}`);
  }

  return lines;
}

function buildWaitlistOfferLines(context: WaitlistNotificationTemplateContext) {
  if (!context.offer) {
    return [];
  }

  return [
    `Horario ofrecido: ${formatDateTimeInTimeZone(
      context.offer.offeredStartAt,
      context.clinic.timezone,
    )}`,
    `Vence: ${formatDateTimeInTimeZone(context.offer.expiresAt, context.clinic.timezone)}`,
  ];
}

function buildWaitlistOfferLinks(context: WaitlistNotificationTemplateContext) {
  if (!context.offer?.acceptUrl || !context.offer.rejectUrl) {
    return [];
  }

  return [
    "Responde a esta oferta desde estos enlaces:",
    `Aceptar: ${context.offer.acceptUrl}`,
    `Rechazar: ${context.offer.rejectUrl}`,
  ];
}

function buildWaitlistAppointmentLines(context: WaitlistNotificationTemplateContext) {
  if (!context.appointment || !context.doctor) {
    return [];
  }

  return [
    `Doctor asignado: ${context.doctor.name}${context.doctor.specialty ? ` - ${context.doctor.specialty}` : ""}`,
    `Horario asignado: ${formatDateTimeInTimeZone(
      context.appointment.startAt,
      context.clinic.timezone,
    )}`,
    `Estado inicial: ${getAppointmentStatusLabel(context.appointment.status)}`,
  ];
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

  throw new Error(`Template de notificacion no soportado: ${templateKey}`);
}

function buildWaitlistPayload(
  templateKey: NotificationTemplateKey,
  context: WaitlistNotificationTemplateContext,
) {
  return {
    templateKey,
    clinic: context.clinic,
    patient: context.patient,
    service: context.service,
    doctor: context.doctor ?? null,
    waitlistEntry: {
      id: context.waitlistEntry.id,
      preferredDate: context.waitlistEntry.preferredDate?.toISOString() ?? null,
      preferredStartTime: context.waitlistEntry.preferredStartTime,
      preferredEndTime: context.waitlistEntry.preferredEndTime,
      autoAccept: context.waitlistEntry.autoAccept,
      notes: context.waitlistEntry.notes,
      createdAt: context.waitlistEntry.createdAt.toISOString(),
    },
    offer: context.offer
      ? {
          id: context.offer.id,
          offeredStartAt: context.offer.offeredStartAt.toISOString(),
          offeredEndAt: context.offer.offeredEndAt.toISOString(),
          expiresAt: context.offer.expiresAt.toISOString(),
          acceptUrl: context.offer.acceptUrl ?? null,
          rejectUrl: context.offer.rejectUrl ?? null,
        }
      : null,
    appointment: context.appointment
      ? {
          id: context.appointment.id,
          startAt: context.appointment.startAt.toISOString(),
          endAt: context.appointment.endAt.toISOString(),
          source: context.appointment.source,
          status: context.appointment.status,
        }
      : null,
  } satisfies Prisma.InputJsonValue;
}

export function renderWaitlistNotificationTemplate(
  templateKey: Extract<
    NotificationTemplateKey,
    | "WAITLIST_ENTRY_CREATED"
    | "WAITLIST_SLOT_OFFERED"
    | "WAITLIST_AUTO_ASSIGNED"
    | "WAITLIST_OFFER_ACCEPTED"
    | "WAITLIST_OFFER_EXPIRED"
  >,
  context: WaitlistNotificationTemplateContext,
): RenderedNotificationTemplate {
  const preferences = buildWaitlistPreferenceLines(context);
  const offerLines = buildWaitlistOfferLines(context);
  const offerLinks = buildWaitlistOfferLinks(context);
  const appointmentLines = buildWaitlistAppointmentLines(context);

  switch (templateKey) {
    case "WAITLIST_ENTRY_CREATED": {
      const subject = `Te agregamos a la lista de espera - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, tu solicitud para lista de espera ya quedo registrada en ${context.clinic.name}.`,
        ],
        details: preferences,
        footer: [
          context.waitlistEntry.autoAccept
            ? "Si se libera un espacio compatible, podremos asignarlo automaticamente en estado pendiente."
            : "Si se libera un espacio compatible, te enviaremos una oferta para que la aceptes.",
        ],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildWaitlistPayload(templateKey, context),
      };
    }

    case "WAITLIST_SLOT_OFFERED": {
      const subject = `Se libero un horario para ti - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, encontramos un espacio compatible con tu lista de espera en ${context.clinic.name}.`,
        ],
        details: [...preferences, ...offerLines],
        links: offerLinks,
        footer: ["La oferta caduca automaticamente cuando venza el tiempo indicado."],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildWaitlistPayload(templateKey, context),
      };
    }

    case "WAITLIST_AUTO_ASSIGNED": {
      const subject = `Te asignamos un horario compatible - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, se libero un espacio compatible y te lo asignamos automaticamente en ${context.clinic.name}.`,
        ],
        details: [...preferences, ...appointmentLines],
        footer: [
          "La cita se creo en estado pendiente para que el consultorio termine de confirmarla.",
        ],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildWaitlistPayload(templateKey, context),
      };
    }

    case "WAITLIST_OFFER_ACCEPTED": {
      const subject = `Confirmamos tu lugar desde lista de espera - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, registramos tu aceptacion de la oferta en ${context.clinic.name}.`,
        ],
        details: [...preferences, ...appointmentLines],
        footer: ["Tu cita ya quedo creada y el consultorio dara seguimiento al horario."],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildWaitlistPayload(templateKey, context),
      };
    }

    case "WAITLIST_OFFER_EXPIRED": {
      const subject = `La oferta de lista de espera expiro - ${context.clinic.name}`;
      const body = buildMessage({
        intro: [
          `Hola ${context.patient.name}, la oferta que te hicimos desde la lista de espera ya expiro en ${context.clinic.name}.`,
        ],
        details: [...preferences, ...offerLines],
        footer: ["Si sigues interesado, mantendremos tu entrada activa para futuras coincidencias."],
      });

      return {
        whatsappBody: body,
        email: context.patient.email ? { subject, body } : null,
        payload: buildWaitlistPayload(templateKey, context),
      };
    }
  }

  throw new Error(`Template de lista de espera no soportado: ${templateKey}`);
}
