import {
  AppointmentSource,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@prisma/client";

import type { AppointmentSelfServiceLinks } from "@/lib/appointments/tokens";
import { getDevelopmentAppointmentLinks } from "@/lib/appointments/tokens";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

import {
  type AppointmentNotificationTemplateContext,
  type NotificationTemplateKey,
  renderNotificationTemplate,
} from "./templates";

type NotificationClient = Prisma.TransactionClient | typeof prisma;

const appointmentNotificationInclude = {
  clinic: {
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      currency: true,
      brandColor: true,
    },
  },
  patient: {
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
    },
  },
  doctor: {
    select: {
      id: true,
      name: true,
      specialty: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceCents: true,
      depositRequired: true,
      depositCents: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

type AppointmentNotificationRecord = Prisma.AppointmentGetPayload<{
  include: typeof appointmentNotificationInclude;
}>;

type EnqueueAppointmentNotificationInput = {
  clinicId: string;
  appointmentId?: string | null;
  patientId?: string | null;
  channel: NotificationChannel;
  recipient: string;
  templateKey: NotificationTemplateKey;
  subject?: string | null;
  body: string;
  payloadJson?: Prisma.InputJsonValue;
  scheduledFor?: Date | null;
  actorUserId?: string | null;
  db?: NotificationClient;
};

type AppointmentChangeType = "CONFIRMED" | "CANCELLED" | "RESCHEDULED";
type ReminderType = "24H" | "2H";

function toTemplateContext(
  appointment: AppointmentNotificationRecord,
  selfServiceLinks: AppointmentSelfServiceLinks | null,
): AppointmentNotificationTemplateContext {
  return {
    clinic: appointment.clinic,
    appointment: {
      id: appointment.id,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      source: appointment.source,
      notes: appointment.notes,
    },
    patient: appointment.patient,
    doctor: appointment.doctor,
    service: appointment.service,
    selfServiceLinks,
  };
}

function resolveCreatedTemplateKey(source: AppointmentSource): NotificationTemplateKey {
  switch (source) {
    case AppointmentSource.PUBLIC_BOOKING:
      return "APPOINTMENT_CREATED_PUBLIC";
    case AppointmentSource.WHATSAPP:
      return "APPOINTMENT_CREATED_WHATSAPP";
    case AppointmentSource.ADMIN:
    case AppointmentSource.IMPORT:
    default:
      return "APPOINTMENT_CREATED_ADMIN";
  }
}

function resolveStatusChangeTemplateKey(
  changeType: AppointmentChangeType,
): NotificationTemplateKey {
  switch (changeType) {
    case "CONFIRMED":
      return "APPOINTMENT_CONFIRMED";
    case "CANCELLED":
      return "APPOINTMENT_CANCELLED";
    case "RESCHEDULED":
      return "APPOINTMENT_RESCHEDULED";
  }
}

function resolveReminderTemplateKey(reminderType: ReminderType): NotificationTemplateKey {
  return reminderType === "24H"
    ? "APPOINTMENT_REMINDER_24H"
    : "APPOINTMENT_REMINDER_2H";
}

async function loadAppointmentNotificationRecord(
  clinicId: string,
  appointmentId: string,
  db: NotificationClient,
) {
  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId,
    },
    include: appointmentNotificationInclude,
  });

  if (!appointment) {
    throw new Error("notification-appointment-not-found");
  }

  return appointment;
}

function resolveSelfServiceLinks(params: {
  appointmentId: string;
  explicitLinks?: AppointmentSelfServiceLinks | null;
}) {
  if (params.explicitLinks) {
    return params.explicitLinks;
  }

  return getDevelopmentAppointmentLinks(params.appointmentId) ?? null;
}

export async function enqueueAppointmentNotification({
  clinicId,
  appointmentId = null,
  patientId = null,
  channel,
  recipient,
  templateKey,
  subject = null,
  body,
  payloadJson,
  scheduledFor = null,
  actorUserId = null,
  db = prisma,
}: EnqueueAppointmentNotificationInput) {
  const existingNotification = await db.notificationOutbox.findFirst({
    where: {
      clinicId,
      appointmentId,
      patientId,
      channel,
      recipient,
      templateKey,
      subject,
      body,
      status: NotificationStatus.PENDING,
      scheduledFor,
    },
    select: {
      id: true,
    },
  });

  if (existingNotification) {
    return {
      id: existingNotification.id,
      created: false,
    };
  }

  const notification = await db.notificationOutbox.create({
    data: {
      clinicId,
      appointmentId,
      patientId,
      channel,
      recipient,
      templateKey,
      subject,
      body,
      payloadJson,
      status: NotificationStatus.PENDING,
      scheduledFor,
    },
    select: {
      id: true,
    },
  });

  await createAuditLog(
    {
      clinicId,
      userId: actorUserId,
      action: "NOTIFICATION_ENQUEUED",
      entityType: "NOTIFICATION",
      entityId: notification.id,
      metadata: {
        appointmentId,
        patientId,
        channel,
        recipient,
        templateKey,
        scheduledFor: scheduledFor?.toISOString() ?? null,
      },
    },
    db,
  );

  return {
    id: notification.id,
    created: true,
  };
}

export async function enqueueAppointmentCreatedNotifications({
  clinicId,
  appointmentId,
  selfServiceLinks,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  appointmentId: string;
  selfServiceLinks?: AppointmentSelfServiceLinks | null;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const appointment = await loadAppointmentNotificationRecord(
    clinicId,
    appointmentId,
    db,
  );
  const resolvedLinks = resolveSelfServiceLinks({
    appointmentId,
    explicitLinks: selfServiceLinks,
  });
  const templateKey = resolveCreatedTemplateKey(appointment.source);
  const rendered = renderNotificationTemplate(
    templateKey,
    toTemplateContext(appointment, resolvedLinks),
  );

  const results = [];

  if (appointment.patient.phoneE164) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.WHATSAPP,
        recipient: appointment.patient.phoneE164,
        templateKey,
        body: rendered.whatsappBody,
        payloadJson: rendered.payload,
        actorUserId,
        db,
      }),
    );
  }

  if (appointment.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: appointment.patient.email,
        templateKey,
        subject: rendered.email.subject,
        body: rendered.email.body,
        payloadJson: rendered.payload,
        actorUserId,
        db,
      }),
    );
  }

  return results;
}

export async function enqueueAppointmentStatusChangedNotification({
  clinicId,
  appointmentId,
  changeType,
  selfServiceLinks,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  appointmentId: string;
  changeType: AppointmentChangeType;
  selfServiceLinks?: AppointmentSelfServiceLinks | null;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const appointment = await loadAppointmentNotificationRecord(
    clinicId,
    appointmentId,
    db,
  );
  const resolvedLinks = resolveSelfServiceLinks({
    appointmentId,
    explicitLinks: selfServiceLinks,
  });
  const templateKey = resolveStatusChangeTemplateKey(changeType);
  const rendered = renderNotificationTemplate(
    templateKey,
    toTemplateContext(appointment, resolvedLinks),
  );

  const results = [];

  if (appointment.patient.phoneE164) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.WHATSAPP,
        recipient: appointment.patient.phoneE164,
        templateKey,
        body: rendered.whatsappBody,
        payloadJson: rendered.payload,
        actorUserId,
        db,
      }),
    );
  }

  if (appointment.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: appointment.patient.email,
        templateKey,
        subject: rendered.email.subject,
        body: rendered.email.body,
        payloadJson: rendered.payload,
        actorUserId,
        db,
      }),
    );
  }

  return results;
}

export async function enqueueAppointmentReminderNotification({
  clinicId,
  appointmentId,
  reminderType,
  scheduledFor = null,
  selfServiceLinks,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  appointmentId: string;
  reminderType: ReminderType;
  scheduledFor?: Date | null;
  selfServiceLinks?: AppointmentSelfServiceLinks | null;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const appointment = await loadAppointmentNotificationRecord(
    clinicId,
    appointmentId,
    db,
  );
  const resolvedLinks = resolveSelfServiceLinks({
    appointmentId,
    explicitLinks: selfServiceLinks,
  });
  const templateKey = resolveReminderTemplateKey(reminderType);
  const rendered = renderNotificationTemplate(
    templateKey,
    toTemplateContext(appointment, resolvedLinks),
  );

  const results = [];

  if (appointment.patient.phoneE164) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.WHATSAPP,
        recipient: appointment.patient.phoneE164,
        templateKey,
        body: rendered.whatsappBody,
        payloadJson: rendered.payload,
        scheduledFor,
        actorUserId,
        db,
      }),
    );
  }

  if (appointment.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: appointment.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: appointment.patient.email,
        templateKey,
        subject: rendered.email.subject,
        body: rendered.email.body,
        payloadJson: rendered.payload,
        scheduledFor,
        actorUserId,
        db,
      }),
    );
  }

  return results;
}

export async function listNotificationOutbox({
  clinicId,
  limit,
  db = prisma,
}: {
  clinicId: string;
  limit?: number;
  db?: NotificationClient;
}) {
  return db.notificationOutbox.findMany({
    where: {
      clinicId,
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
        },
      },
      appointment: {
        select: {
          id: true,
          status: true,
          source: true,
          startAt: true,
          endAt: true,
          patient: {
            select: {
              name: true,
            },
          },
          doctor: {
            select: {
              name: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}
