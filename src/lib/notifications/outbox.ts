import {
  AppointmentSource,
  AppointmentStatus,
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
  renderWaitlistNotificationTemplate,
  type WaitlistNotificationTemplateContext,
} from "./templates";
import { buildAppointmentCalendarLinks } from "./email-calendar-links";

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
      publicName: true,
      websiteUrl: true,
      contactEmail: true,
      contactPhone: true,
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

const waitlistEntryNotificationInclude = {
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
  doctor: {
    select: {
      id: true,
      name: true,
      specialty: true,
    },
  },
} satisfies Prisma.WaitlistEntryInclude;

type WaitlistEntryNotificationRecord = Prisma.WaitlistEntryGetPayload<{
  include: typeof waitlistEntryNotificationInclude;
}>;

const waitlistOfferNotificationInclude = {
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
  waitlistEntry: {
    include: waitlistEntryNotificationInclude,
  },
  appointment: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      source: true,
      status: true,
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
    },
  },
} satisfies Prisma.WaitlistOfferInclude;

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
    calendarLinks: buildAppointmentCalendarLinks({
      appointmentId: appointment.id,
      clinicName: appointment.clinic.name,
      clinicPublicName: appointment.clinic.publicName,
      serviceName: appointment.service.name,
      doctorName: appointment.doctor.name,
      statusLabel:
        appointment.status === AppointmentStatus.PENDING
          ? "Pendiente de confirmación"
          : appointment.status === AppointmentStatus.CONFIRMED
            ? "Confirmada"
            : appointment.status === AppointmentStatus.CANCELLED
              ? "Cancelada"
              : appointment.status === AppointmentStatus.RESCHEDULED
                ? "Reagendada"
                : appointment.status === AppointmentStatus.COMPLETED
                  ? "Completada"
                  : "No show",
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      timezone: appointment.clinic.timezone,
      contactEmail: appointment.clinic.contactEmail,
      contactPhone: appointment.clinic.contactPhone,
      websiteUrl: appointment.clinic.websiteUrl,
      selfServiceLinks,
    }),
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

function toWaitlistTemplateContext(
  entry: WaitlistEntryNotificationRecord,
  options: {
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
    doctorOverride?: WaitlistNotificationTemplateContext["doctor"];
  } = {},
): WaitlistNotificationTemplateContext {
  return {
    clinic: entry.clinic,
    patient: entry.patient,
    service: entry.service,
    doctor: options.doctorOverride ?? entry.doctor,
    waitlistEntry: {
      id: entry.id,
      preferredDate: entry.preferredDate,
      preferredStartTime: entry.preferredStartTime,
      preferredEndTime: entry.preferredEndTime,
      autoAccept: entry.autoAccept,
      notes: entry.notes,
      createdAt: entry.createdAt,
    },
    offer: options.offer ?? null,
    appointment: options.appointment ?? null,
  };
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

async function loadWaitlistEntryNotificationRecord(
  clinicId: string,
  waitlistEntryId: string,
  db: NotificationClient,
) {
  const waitlistEntry = await db.waitlistEntry.findFirst({
    where: {
      id: waitlistEntryId,
      clinicId,
    },
    include: waitlistEntryNotificationInclude,
  });

  if (!waitlistEntry) {
    throw new Error("notification-waitlist-entry-not-found");
  }

  return waitlistEntry;
}

async function loadWaitlistOfferNotificationRecord(
  clinicId: string,
  waitlistOfferId: string,
  db: NotificationClient,
) {
  const waitlistOffer = await db.waitlistOffer.findFirst({
    where: {
      id: waitlistOfferId,
      clinicId,
    },
    include: waitlistOfferNotificationInclude,
  });

  if (!waitlistOffer) {
    throw new Error("notification-waitlist-offer-not-found");
  }

  return waitlistOffer;
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

export async function enqueueWaitlistEntryCreatedNotifications({
  clinicId,
  waitlistEntryId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistEntryId: string;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const waitlistEntry = await loadWaitlistEntryNotificationRecord(
    clinicId,
    waitlistEntryId,
    db,
  );
  const templateKey = "WAITLIST_ENTRY_CREATED" as const;
  const rendered = renderWaitlistNotificationTemplate(
    templateKey,
    toWaitlistTemplateContext(waitlistEntry),
  );

  const results = [];

  results.push(
    await enqueueAppointmentNotification({
      clinicId,
      patientId: waitlistEntry.patient.id,
      channel: NotificationChannel.WHATSAPP,
      recipient: waitlistEntry.patient.phoneE164,
      templateKey,
      body: rendered.whatsappBody,
      payloadJson: rendered.payload,
      actorUserId,
      db,
    }),
  );

  if (waitlistEntry.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        patientId: waitlistEntry.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: waitlistEntry.patient.email,
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

export async function enqueueWaitlistSlotOfferedNotifications({
  clinicId,
  waitlistOfferId,
  acceptUrl,
  rejectUrl,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistOfferId: string;
  acceptUrl: string;
  rejectUrl: string;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const waitlistOffer = await loadWaitlistOfferNotificationRecord(
    clinicId,
    waitlistOfferId,
    db,
  );
  const templateKey = "WAITLIST_SLOT_OFFERED" as const;
  const doctorContext =
    waitlistOffer.waitlistEntry.doctor ?? waitlistOffer.appointment?.doctor ?? null;
  const rendered = renderWaitlistNotificationTemplate(
    templateKey,
    toWaitlistTemplateContext(waitlistOffer.waitlistEntry, {
      doctorOverride: doctorContext,
      offer: {
        id: waitlistOffer.id,
        offeredStartAt: waitlistOffer.offeredStartAt,
        offeredEndAt: waitlistOffer.offeredEndAt,
        expiresAt: waitlistOffer.expiresAt,
        acceptUrl,
        rejectUrl,
      },
    }),
  );

  const results = [];

  results.push(
    await enqueueAppointmentNotification({
      clinicId,
      appointmentId: waitlistOffer.appointmentId,
      patientId: waitlistOffer.waitlistEntry.patient.id,
      channel: NotificationChannel.WHATSAPP,
      recipient: waitlistOffer.waitlistEntry.patient.phoneE164,
      templateKey,
      body: rendered.whatsappBody,
      payloadJson: rendered.payload,
      scheduledFor: waitlistOffer.expiresAt,
      actorUserId,
      db,
    }),
  );

  if (waitlistOffer.waitlistEntry.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId: waitlistOffer.appointmentId,
        patientId: waitlistOffer.waitlistEntry.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: waitlistOffer.waitlistEntry.patient.email,
        templateKey,
        subject: rendered.email.subject,
        body: rendered.email.body,
        payloadJson: rendered.payload,
        scheduledFor: waitlistOffer.expiresAt,
        actorUserId,
        db,
      }),
    );
  }

  return results;
}

export async function enqueueWaitlistAutoAssignedNotifications({
  clinicId,
  waitlistEntryId,
  appointmentId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistEntryId: string;
  appointmentId: string;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const [waitlistEntry, appointment] = await Promise.all([
    loadWaitlistEntryNotificationRecord(clinicId, waitlistEntryId, db),
    loadAppointmentNotificationRecord(clinicId, appointmentId, db),
  ]);
  const templateKey = "WAITLIST_AUTO_ASSIGNED" as const;
  const rendered = renderWaitlistNotificationTemplate(
    templateKey,
    toWaitlistTemplateContext(waitlistEntry, {
      doctorOverride: appointment.doctor,
      appointment: {
        id: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        source: appointment.source,
        status: appointment.status,
      },
    }),
  );

  const results = [];

  results.push(
    await enqueueAppointmentNotification({
      clinicId,
      appointmentId,
      patientId: waitlistEntry.patient.id,
      channel: NotificationChannel.WHATSAPP,
      recipient: waitlistEntry.patient.phoneE164,
      templateKey,
      body: rendered.whatsappBody,
      payloadJson: rendered.payload,
      actorUserId,
      db,
    }),
  );

  if (waitlistEntry.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: waitlistEntry.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: waitlistEntry.patient.email,
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

export async function enqueueWaitlistOfferAcceptedNotifications({
  clinicId,
  waitlistOfferId,
  appointmentId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistOfferId: string;
  appointmentId: string;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const [waitlistOffer, appointment] = await Promise.all([
    loadWaitlistOfferNotificationRecord(clinicId, waitlistOfferId, db),
    loadAppointmentNotificationRecord(clinicId, appointmentId, db),
  ]);
  const templateKey = "WAITLIST_OFFER_ACCEPTED" as const;
  const rendered = renderWaitlistNotificationTemplate(
    templateKey,
    toWaitlistTemplateContext(waitlistOffer.waitlistEntry, {
      doctorOverride: appointment.doctor,
      offer: {
        id: waitlistOffer.id,
        offeredStartAt: waitlistOffer.offeredStartAt,
        offeredEndAt: waitlistOffer.offeredEndAt,
        expiresAt: waitlistOffer.expiresAt,
      },
      appointment: {
        id: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        source: appointment.source,
        status: appointment.status,
      },
    }),
  );

  const results = [];

  results.push(
    await enqueueAppointmentNotification({
      clinicId,
      appointmentId,
      patientId: waitlistOffer.waitlistEntry.patient.id,
      channel: NotificationChannel.WHATSAPP,
      recipient: waitlistOffer.waitlistEntry.patient.phoneE164,
      templateKey,
      body: rendered.whatsappBody,
      payloadJson: rendered.payload,
      actorUserId,
      db,
    }),
  );

  if (waitlistOffer.waitlistEntry.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId,
        patientId: waitlistOffer.waitlistEntry.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: waitlistOffer.waitlistEntry.patient.email,
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

export async function enqueueWaitlistOfferExpiredNotifications({
  clinicId,
  waitlistOfferId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistOfferId: string;
  actorUserId?: string | null;
  db?: NotificationClient;
}) {
  const waitlistOffer = await loadWaitlistOfferNotificationRecord(
    clinicId,
    waitlistOfferId,
    db,
  );
  const templateKey = "WAITLIST_OFFER_EXPIRED" as const;
  const doctorContext =
    waitlistOffer.waitlistEntry.doctor ?? waitlistOffer.appointment?.doctor ?? null;
  const rendered = renderWaitlistNotificationTemplate(
    templateKey,
    toWaitlistTemplateContext(waitlistOffer.waitlistEntry, {
      doctorOverride: doctorContext,
      offer: {
        id: waitlistOffer.id,
        offeredStartAt: waitlistOffer.offeredStartAt,
        offeredEndAt: waitlistOffer.offeredEndAt,
        expiresAt: waitlistOffer.expiresAt,
      },
    }),
  );

  const results = [];

  results.push(
    await enqueueAppointmentNotification({
      clinicId,
      appointmentId: waitlistOffer.appointmentId,
      patientId: waitlistOffer.waitlistEntry.patient.id,
      channel: NotificationChannel.WHATSAPP,
      recipient: waitlistOffer.waitlistEntry.patient.phoneE164,
      templateKey,
      body: rendered.whatsappBody,
      payloadJson: rendered.payload,
      actorUserId,
      db,
    }),
  );

  if (waitlistOffer.waitlistEntry.patient.email && rendered.email) {
    results.push(
      await enqueueAppointmentNotification({
        clinicId,
        appointmentId: waitlistOffer.appointmentId,
        patientId: waitlistOffer.waitlistEntry.patient.id,
        channel: NotificationChannel.EMAIL,
        recipient: waitlistOffer.waitlistEntry.patient.email,
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
