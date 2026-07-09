"use server";

import {
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { getMetaWhatsAppConfigStatus } from "@/lib/meta/whatsapp-client";
import {
  getEmailDeliveryConfigStatus,
  sendPendingEmailNotification,
} from "@/lib/notifications/send-email";
import { sendPendingWhatsAppNotification } from "@/lib/notifications/send-whatsapp";
import { prisma } from "@/lib/prisma";
import { processWaitlistForCancelledAppointment } from "@/lib/waitlist/matching";

type NotificationsPathOptions = {
  status?: string;
  error?: string;
};

type NotificationIntent = "mark-sent" | "mark-failed" | "cancel";
type BulkNotificationIntent =
  | "cancel-pending"
  | "mark-sent"
  | "mark-failed"
  | "archive-failed";

const NOTIFICATIONS_PATH = "/app/notifications";
const FAKE_APPOINTMENT_NOTE = "Marcada como reserva falsa desde notificaciones.";

function buildNotificationsPath(options: NotificationsPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `${NOTIFICATIONS_PATH}${query ? `?${query}` : ""}`;
}

function resolveSafeRedirectPath(
  value: FormDataEntryValue | null,
  fallbackPath = NOTIFICATIONS_PATH,
) {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith(NOTIFICATIONS_PATH)) {
    return fallbackPath;
  }

  return normalized;
}

function appendFeedbackToPath(
  path: string,
  params: {
    status?: string;
    error?: string;
  },
) {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);

  query.delete("status");
  query.delete("error");

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();

  return `${pathname}${serialized ? `?${serialized}` : ""}`;
}

function revalidateNotificationViews() {
  revalidatePath("/app/notifications");
}

function revalidateOperationalViews() {
  [
    "/app/notifications",
    "/app/appointments",
    "/app/calendar",
    "/app/dashboard",
    "/app/waitlist",
    "/app/reports",
    "/app/patients",
  ].forEach((path) => {
    revalidatePath(path);
  });
}

function parseNotificationIds(value: FormDataEntryValue | null) {
  return [...new Set(String(value ?? "").split(",").map((id) => id.trim()).filter(Boolean))];
}

async function transitionNotification(params: {
  notificationId: string;
  intent: NotificationIntent;
  redirectPathValue?: FormDataEntryValue | null;
  errorMessage?: string | null;
}) {
  const authContext = await requireAuthContext();
  const redirectPath = resolveSafeRedirectPath(
    params.redirectPathValue ?? null,
    buildNotificationsPath(),
  );

  if (!params.notificationId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  const notification = await prisma.notificationOutbox.findFirst({
    where: {
      id: params.notificationId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      clinicId: true,
      appointmentId: true,
      patientId: true,
      channel: true,
      recipient: true,
      templateKey: true,
      status: true,
    },
  });

  if (!notification) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  let nextStatus: NotificationStatus;
  let successStatus: string;
  let auditAction: string;
  let data: {
    status: NotificationStatus;
    sentAt?: Date | null;
    failedAt?: Date | null;
    errorMessage?: string | null;
  };

  switch (params.intent) {
    case "mark-sent":
      if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.CANCELLED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
      }

      nextStatus = NotificationStatus.SENT;
      successStatus = "notification-sent";
      auditAction = "NOTIFICATION_MARKED_SENT";
      data = {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        failedAt: null,
        errorMessage: null,
      };
      break;
    case "mark-failed":
      if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.CANCELLED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
      }

      nextStatus = NotificationStatus.FAILED;
      successStatus = "notification-failed";
      auditAction = "NOTIFICATION_MARKED_FAILED";
      data = {
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        sentAt: null,
        errorMessage:
          params.errorMessage?.trim() ||
          "Marcada manualmente como fallida desde el panel.",
      };
      break;
    case "cancel":
      if (
        notification.status !== NotificationStatus.PENDING &&
        notification.status !== NotificationStatus.FAILED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
      }

      nextStatus = NotificationStatus.CANCELLED;
      successStatus = "notification-cancelled";
      auditAction = "NOTIFICATION_CANCELLED";
      data = {
        status: NotificationStatus.CANCELLED,
      };
      break;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.notificationOutbox.update({
      where: {
        id: notification.id,
      },
      data,
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: auditAction,
        entityType: "NOTIFICATION",
        entityId: notification.id,
        metadata: {
          previousStatus: notification.status,
          nextStatus,
          appointmentId: notification.appointmentId,
          patientId: notification.patientId,
          channel: notification.channel,
          recipient: notification.recipient,
          templateKey: notification.templateKey,
        },
      },
      transaction,
    );
  });

  revalidateNotificationViews();
  redirect(appendFeedbackToPath(redirectPath, { status: successStatus }));
}

async function applyBulkNotificationTransition(params: {
  formData: FormData;
  intent: BulkNotificationIntent;
}) {
  const authContext = await requireAuthContext();
  const redirectPath = resolveSafeRedirectPath(
    params.formData.get("redirectPath"),
    buildNotificationsPath(),
  );
  const notificationIds = parseNotificationIds(params.formData.get("notificationIds"));

  if (!notificationIds.length) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-bulk-empty" }));
  }

  const notifications = await prisma.notificationOutbox.findMany({
    where: {
      clinicId: authContext.clinic.id,
      id: {
        in: notificationIds,
      },
    },
    select: {
      id: true,
      appointmentId: true,
      patientId: true,
      channel: true,
      recipient: true,
      templateKey: true,
      status: true,
    },
  });

  let eligibleStatuses: NotificationStatus[];
  let nextStatus: NotificationStatus;
  let successStatus: string;
  let auditAction: string;
  let data: {
    status: NotificationStatus;
    sentAt?: Date | null;
    failedAt?: Date | null;
    errorMessage?: string | null;
  };

  switch (params.intent) {
    case "cancel-pending":
      eligibleStatuses = [NotificationStatus.PENDING];
      nextStatus = NotificationStatus.CANCELLED;
      successStatus = "notifications-bulk-cancelled";
      auditAction = "NOTIFICATION_BULK_CANCELLED";
      data = {
        status: NotificationStatus.CANCELLED,
      };
      break;
    case "mark-sent":
      eligibleStatuses = [NotificationStatus.PENDING, NotificationStatus.FAILED];
      nextStatus = NotificationStatus.SENT;
      successStatus = "notifications-bulk-sent";
      auditAction = "NOTIFICATION_BULK_MARKED_SENT";
      data = {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        failedAt: null,
        errorMessage: null,
      };
      break;
    case "mark-failed":
      eligibleStatuses = [NotificationStatus.PENDING];
      nextStatus = NotificationStatus.FAILED;
      successStatus = "notifications-bulk-failed";
      auditAction = "NOTIFICATION_BULK_MARKED_FAILED";
      data = {
        status: NotificationStatus.FAILED,
        sentAt: null,
        failedAt: new Date(),
        errorMessage: "Marcada manualmente como fallida desde la bandeja.",
      };
      break;
    case "archive-failed":
      eligibleStatuses = [NotificationStatus.FAILED];
      nextStatus = NotificationStatus.CANCELLED;
      successStatus = "notifications-bulk-failed-archived";
      auditAction = "NOTIFICATION_BULK_CANCELLED";
      data = {
        status: NotificationStatus.CANCELLED,
      };
      break;
  }

  const eligibleNotifications = notifications.filter((notification) =>
    eligibleStatuses.includes(notification.status),
  );

  if (!eligibleNotifications.length) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-bulk-empty" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.notificationOutbox.updateMany({
      where: {
        clinicId: authContext.clinic.id,
        id: {
          in: eligibleNotifications.map((notification) => notification.id),
        },
        status: {
          in: eligibleStatuses,
        },
      },
      data,
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: auditAction,
        entityType: "NOTIFICATION_BULK",
        metadata: {
          notificationIds: eligibleNotifications.map((notification) => notification.id),
          totalNotifications: eligibleNotifications.length,
          eligibleStatuses,
          nextStatus,
          redirectPath,
        },
      },
      transaction,
    );
  });

  revalidateNotificationViews();
  redirect(appendFeedbackToPath(redirectPath, { status: successStatus }));
}

export async function markNotificationSentAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "mark-sent",
    redirectPathValue: formData.get("redirectPath"),
  });
}

export async function markNotificationFailedAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "mark-failed",
    redirectPathValue: formData.get("redirectPath"),
    errorMessage: String(formData.get("errorMessage") ?? "").trim(),
  });
}

export async function cancelNotificationAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "cancel",
    redirectPathValue: formData.get("redirectPath"),
  });
}

export async function bulkCancelPendingNotificationsAction(formData: FormData) {
  await applyBulkNotificationTransition({
    formData,
    intent: "cancel-pending",
  });
}

export async function bulkMarkNotificationsSentAction(formData: FormData) {
  await applyBulkNotificationTransition({
    formData,
    intent: "mark-sent",
  });
}

export async function bulkMarkNotificationsFailedAction(formData: FormData) {
  await applyBulkNotificationTransition({
    formData,
    intent: "mark-failed",
  });
}

export async function bulkArchiveFailedNotificationsAction(formData: FormData) {
  await applyBulkNotificationTransition({
    formData,
    intent: "archive-failed",
  });
}

export async function markAppointmentFakeAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const redirectPath = resolveSafeRedirectPath(
    formData.get("redirectPath"),
    buildNotificationsPath(),
  );

  if (!appointmentId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-fake-not-found" }));
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      status: true,
      notes: true,
      patientId: true,
      doctorId: true,
      serviceId: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!appointment) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-fake-not-found" }));
  }

  if (
    appointment.status === AppointmentStatus.COMPLETED ||
    appointment.status === AppointmentStatus.NO_SHOW
  ) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-fake-invalid" }));
  }

  await prisma.$transaction(async (transaction) => {
    if (appointment.status !== AppointmentStatus.CANCELLED) {
      const notesAlreadyTagged = appointment.notes?.includes(FAKE_APPOINTMENT_NOTE) ?? false;

      await transaction.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: notesAlreadyTagged
            ? appointment.notes
            : appointment.notes?.trim()
              ? `${appointment.notes}\n${FAKE_APPOINTMENT_NOTE}`
              : FAKE_APPOINTMENT_NOTE,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "APPOINTMENT_MARKED_FAKE",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
          metadata: {
            previousStatus: appointment.status,
            nextStatus: AppointmentStatus.CANCELLED,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            serviceId: appointment.serviceId,
            startAt: appointment.startAt.toISOString(),
            endAt: appointment.endAt.toISOString(),
            noteAppended: !notesAlreadyTagged,
          },
        },
        transaction,
      );

      await processWaitlistForCancelledAppointment({
        clinicId: authContext.clinic.id,
        cancelledAppointmentId: appointment.id,
        actorUserId: authContext.user.id,
        db: transaction,
      });
    }

    const relatedPendingNotifications = await transaction.notificationOutbox.findMany({
      where: {
        clinicId: authContext.clinic.id,
        appointmentId: appointment.id,
        status: NotificationStatus.PENDING,
      },
      select: {
        id: true,
        channel: true,
        templateKey: true,
      },
    });

    if (relatedPendingNotifications.length) {
      await transaction.notificationOutbox.updateMany({
        where: {
          clinicId: authContext.clinic.id,
          id: {
            in: relatedPendingNotifications.map((notification) => notification.id),
          },
          status: NotificationStatus.PENDING,
        },
        data: {
          status: NotificationStatus.CANCELLED,
        },
      });
    }

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "RELATED_NOTIFICATIONS_CANCELLED",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          notificationIds: relatedPendingNotifications.map((notification) => notification.id),
          cancelledNotifications: relatedPendingNotifications.length,
          source: "NOTIFICATIONS_PANEL",
        },
      },
      transaction,
    );
  });

  revalidateOperationalViews();
  redirect(appendFeedbackToPath(redirectPath, { status: "appointment-marked-fake" }));
}

export async function sendWhatsAppNotificationAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const redirectPath = resolveSafeRedirectPath(
    formData.get("redirectPath"),
    buildNotificationsPath(),
  );
  const metaConfig = getMetaWhatsAppConfigStatus();

  if (!notificationId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  if (!metaConfig.isConfigured) {
    redirect(
      appendFeedbackToPath(redirectPath, {
        error: "notification-whatsapp-not-configured",
      }),
    );
  }

  const notification = await prisma.notificationOutbox.findFirst({
    where: {
      id: notificationId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      channel: true,
      status: true,
    },
  });

  if (!notification) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  if (
    notification.channel !== NotificationChannel.WHATSAPP ||
    notification.status !== NotificationStatus.PENDING
  ) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
  }

  const result = await sendPendingWhatsAppNotification(notification.id, {
    actorUserId: authContext.user.id,
  });

  revalidateNotificationViews();

  if (result.ok) {
    redirect(appendFeedbackToPath(redirectPath, { status: "notification-whatsapp-sent" }));
  }

  if (result.reason === "SEND_FAILED") {
    redirect(appendFeedbackToPath(redirectPath, { status: "notification-whatsapp-failed" }));
  }

  redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
}

export async function sendEmailNotificationAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const redirectPath = resolveSafeRedirectPath(
    formData.get("redirectPath"),
    buildNotificationsPath(),
  );
  const emailConfig = getEmailDeliveryConfigStatus();

  if (!notificationId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  if (!emailConfig.isConfigured) {
    redirect(
      appendFeedbackToPath(redirectPath, {
        error: "notification-email-not-configured",
      }),
    );
  }

  const notification = await prisma.notificationOutbox.findFirst({
    where: {
      id: notificationId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      channel: true,
      status: true,
    },
  });

  if (!notification) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-not-found" }));
  }

  if (
    notification.channel !== NotificationChannel.EMAIL ||
    notification.status !== NotificationStatus.PENDING
  ) {
    redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
  }

  const result = await sendPendingEmailNotification(notification.id, {
    actorUserId: authContext.user.id,
  });

  revalidateNotificationViews();

  if (result.ok) {
    redirect(appendFeedbackToPath(redirectPath, { status: "notification-email-sent" }));
  }

  if (result.reason === "SEND_FAILED") {
    redirect(appendFeedbackToPath(redirectPath, { status: "notification-email-failed" }));
  }

  if (result.reason === "EMAIL_NOT_CONFIGURED") {
    redirect(
      appendFeedbackToPath(redirectPath, {
        error: "notification-email-not-configured",
      }),
    );
  }

  redirect(appendFeedbackToPath(redirectPath, { error: "notification-action-invalid" }));
}
