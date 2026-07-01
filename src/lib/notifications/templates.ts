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
  APPOINTMENT_CREATED_PUBLIC: "Reserva creada desde booking público",
  APPOINTMENT_CREATED_ADMIN: "Reserva creada desde panel",
  APPOINTMENT_CREATED_WHATSAPP: "Reserva creada desde WhatsApp",
  APPOINTMENT_CONFIRMED: "Reserva confirmada",
  APPOINTMENT_CANCELLED: "Reserva cancelada",
  APPOINTMENT_RESCHEDULED: "Reserva reagendada",
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

function buildWhatsappMessage(lines: string[]) {
  return lines.filter(Boolean).join("\n");
}

function buildEmailMessage(params: {
  headline: string;
  lines: string[];
  links?: string[];
  footer?: string[];
}) {
  return [
    params.headline,
    "",
    ...params.lines,
    ...(params.links?.length ? ["", ...params.links] : []),
    ...(params.footer?.length ? ["", ...params.footer] : []),
  ].join("\n");
}

function buildAppointmentSummaryLine(context: AppointmentNotificationTemplateContext) {
  return `${context.service.name} con ${context.doctor.name}.`;
}

function buildAppointmentScheduleLine(context: AppointmentNotificationTemplateContext) {
  const scheduleLabel = formatDateTimeInTimeZone(
    context.appointment.startAt,
    context.clinic.timezone,
  );

  return `${scheduleLabel}. Estado: ${getAppointmentStatusLabel(context.appointment.status).toLowerCase()}.`;
}

function buildSelfServiceLines(links: AppointmentSelfServiceLinks | null | undefined) {
  if (!links) {
    return [];
  }

  return [
    `Confirmar: ${links.confirmUrl}`,
    `Cancelar: ${links.cancelUrl}`,
    `Reagendar: ${links.rescheduleUrl}`,
  ];
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

function renderAppointmentMessage(params: {
  templateKey: NotificationTemplateKey;
  subject: string;
  headline: string;
  context: AppointmentNotificationTemplateContext;
  includeLinks?: boolean;
  footer?: string[];
}) {
  const lines = [
    buildAppointmentSummaryLine(params.context),
    buildAppointmentScheduleLine(params.context),
  ];
  const links = params.includeLinks
    ? buildSelfServiceLines(params.context.selfServiceLinks)
    : [];
  const whatsappBody = buildWhatsappMessage([params.headline, ...lines, ...links]);
  const emailBody = buildEmailMessage({
    headline: params.headline,
    lines,
    links,
    footer: params.footer,
  });

  return {
    whatsappBody,
    email: params.context.patient.email
      ? {
          subject: params.subject,
          body: emailBody,
        }
      : null,
    payload: buildPayload(params.templateKey, params.context),
  } satisfies RenderedNotificationTemplate;
}

export function renderNotificationTemplate(
  templateKey: NotificationTemplateKey,
  context: AppointmentNotificationTemplateContext,
): RenderedNotificationTemplate {
  switch (templateKey) {
    case "APPOINTMENT_CREATED_PUBLIC":
      return renderAppointmentMessage({
        templateKey,
        subject: `Solicitud de reserva recibida - ${context.clinic.name}`,
        headline: `Reserva solicitada en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_CREATED_ADMIN":
      return renderAppointmentMessage({
        templateKey,
        subject: `Reserva registrada - ${context.clinic.name}`,
        headline: `Reserva registrada en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_CREATED_WHATSAPP":
      return renderAppointmentMessage({
        templateKey,
        subject: `Reserva registrada por WhatsApp - ${context.clinic.name}`,
        headline: `Reserva registrada por WhatsApp en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_CONFIRMED":
      return renderAppointmentMessage({
        templateKey,
        subject: `Reserva confirmada - ${context.clinic.name}`,
        headline: `Reserva confirmada en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_CANCELLED":
      return renderAppointmentMessage({
        templateKey,
        subject: `Reserva cancelada - ${context.clinic.name}`,
        headline: `Reserva cancelada en ${context.clinic.name}.`,
        context,
      });

    case "APPOINTMENT_RESCHEDULED":
      return renderAppointmentMessage({
        templateKey,
        subject: `Reserva reagendada - ${context.clinic.name}`,
        headline: `Reserva reagendada en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_REMINDER_24H":
      return renderAppointmentMessage({
        templateKey,
        subject: `Recordatorio de reserva para mañana - ${context.clinic.name}`,
        headline: `Recordatorio de reserva en ${context.clinic.name}.`,
        context,
        includeLinks: true,
      });

    case "APPOINTMENT_REMINDER_2H":
      return renderAppointmentMessage({
        templateKey,
        subject: `Recordatorio de reserva en 2 horas - ${context.clinic.name}`,
        headline: `Tu reserva en ${context.clinic.name} es hoy.`,
        context,
        includeLinks: true,
      });
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

function buildWaitlistDoctorLine(context: WaitlistNotificationTemplateContext) {
  if (!context.doctor) {
    return `${context.service.name} con doctor disponible.`;
  }

  return `${context.service.name} con ${context.doctor.name}.`;
}

function buildWaitlistPreferenceLine(context: WaitlistNotificationTemplateContext) {
  const segments: string[] = [];

  if (context.waitlistEntry.preferredDate) {
    segments.push(
      formatDateTimeInTimeZone(
        context.waitlistEntry.preferredDate,
        context.clinic.timezone,
      ).replace(/, 12:00$/, ""),
    );
  }

  if (
    context.waitlistEntry.preferredStartTime ||
    context.waitlistEntry.preferredEndTime
  ) {
    segments.push(
      `${context.waitlistEntry.preferredStartTime ?? "00:00"}-${context.waitlistEntry.preferredEndTime ?? "23:59"}`,
    );
  }

  if (!segments.length) {
    return "Preferencia: cualquier horario.";
  }

  return `Preferencia: ${segments.join(" ")}.`;
}

function buildWaitlistOfferLine(context: WaitlistNotificationTemplateContext) {
  if (!context.offer) {
    return null;
  }

  return `Horario: ${formatDateTimeInTimeZone(
    context.offer.offeredStartAt,
    context.clinic.timezone,
  )}.`;
}

function buildWaitlistAppointmentLine(context: WaitlistNotificationTemplateContext) {
  if (!context.appointment) {
    return null;
  }

  return `Cita: ${formatDateTimeInTimeZone(
    context.appointment.startAt,
    context.clinic.timezone,
  )}.`;
}

function buildWaitlistOfferLinks(context: WaitlistNotificationTemplateContext) {
  if (!context.offer?.acceptUrl || !context.offer.rejectUrl) {
    return [];
  }

  return [
    `Aceptar: ${context.offer.acceptUrl}`,
    `Rechazar: ${context.offer.rejectUrl}`,
  ];
}

function renderWaitlistMessage(params: {
  templateKey: Extract<
    NotificationTemplateKey,
    | "WAITLIST_ENTRY_CREATED"
    | "WAITLIST_SLOT_OFFERED"
    | "WAITLIST_AUTO_ASSIGNED"
    | "WAITLIST_OFFER_ACCEPTED"
    | "WAITLIST_OFFER_EXPIRED"
  >;
  subject: string;
  headline: string;
  context: WaitlistNotificationTemplateContext;
  extraLines?: Array<string | null>;
  links?: string[];
  footer?: string[];
}) {
  const lines = [
    buildWaitlistDoctorLine(params.context),
    buildWaitlistPreferenceLine(params.context),
    ...(params.extraLines ?? []).filter(
      (line): line is string => typeof line === "string" && line.length > 0,
    ),
  ];
  const whatsappBody = buildWhatsappMessage([
    params.headline,
    ...lines,
    ...(params.links ?? []),
  ]);
  const emailBody = buildEmailMessage({
    headline: params.headline,
    lines,
    links: params.links,
    footer: params.footer,
  });

  return {
    whatsappBody,
    email: params.context.patient.email
      ? {
          subject: params.subject,
          body: emailBody,
        }
      : null,
    payload: buildWaitlistPayload(params.templateKey, params.context),
  } satisfies RenderedNotificationTemplate;
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
  switch (templateKey) {
    case "WAITLIST_ENTRY_CREATED":
      return renderWaitlistMessage({
        templateKey,
        subject: `Lista de espera registrada - ${context.clinic.name}`,
        headline: `Lista de espera registrada en ${context.clinic.name}.`,
        context,
        extraLines: [
          context.waitlistEntry.autoAccept
            ? "Si se libera un espacio, lo asignaremos automaticamente."
            : "Te avisaremos si se libera un espacio.",
        ],
      });

    case "WAITLIST_SLOT_OFFERED":
      return renderWaitlistMessage({
        templateKey,
        subject: `Se libero un horario para ti - ${context.clinic.name}`,
        headline: `Se libero un horario en ${context.clinic.name}.`,
        context,
        extraLines: [buildWaitlistOfferLine(context)],
        links: buildWaitlistOfferLinks(context),
      });

    case "WAITLIST_AUTO_ASSIGNED":
      return renderWaitlistMessage({
        templateKey,
        subject: `Horario asignado desde lista de espera - ${context.clinic.name}`,
        headline: `Te asignamos un horario en ${context.clinic.name}.`,
        context,
        extraLines: [buildWaitlistAppointmentLine(context)],
      });

    case "WAITLIST_OFFER_ACCEPTED":
      return renderWaitlistMessage({
        templateKey,
        subject: `Oferta aceptada - ${context.clinic.name}`,
        headline: `Registramos tu aceptacion en ${context.clinic.name}.`,
        context,
        extraLines: [buildWaitlistAppointmentLine(context)],
      });

    case "WAITLIST_OFFER_EXPIRED":
      return renderWaitlistMessage({
        templateKey,
        subject: `Oferta expirada - ${context.clinic.name}`,
        headline: `La oferta expiro en ${context.clinic.name}.`,
        context,
        extraLines: [buildWaitlistOfferLine(context)],
        footer: ["Tu solicitud sigue activa para futuras coincidencias."],
      });
  }

  throw new Error(`Template de lista de espera no soportado: ${templateKey}`);
}
