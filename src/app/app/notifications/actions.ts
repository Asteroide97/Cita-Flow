"use server";

import { NotificationChannel, NotificationStatus } from "@prisma/client";
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

type NotificationsPathOptions = {
  status?: string;
  error?: string;
};

type NotificationIntent = "mark-sent" | "mark-failed" | "cancel";

function buildNotificationsPath(options: NotificationsPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `/app/notifications${query ? `?${query}` : ""}`;
}

function revalidateNotificationViews() {
  revalidatePath("/app/notifications");
}

async function transitionNotification(params: {
  notificationId: string;
  intent: NotificationIntent;
  errorMessage?: string | null;
}) {
  const authContext = await requireAuthContext();

  if (!params.notificationId) {
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
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
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
  }

  let nextStatus: NotificationStatus;
  let successStatus: string;
  let auditAction: string;
  let data:
    | {
        status: NotificationStatus;
        sentAt?: Date | null;
        failedAt?: Date | null;
        errorMessage?: string | null;
      }
    | undefined;

  switch (params.intent) {
    case "mark-sent":
      if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.CANCELLED
      ) {
        redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
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
        redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
      }

      nextStatus = NotificationStatus.FAILED;
      successStatus = "notification-failed";
      auditAction = "NOTIFICATION_MARKED_FAILED";
      data = {
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        errorMessage:
          params.errorMessage?.trim() ||
          "Marcada manualmente como fallida desde el panel de desarrollo.",
      };
      break;
    case "cancel":
      if (notification.status !== NotificationStatus.PENDING) {
        redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
      }

      nextStatus = NotificationStatus.CANCELLED;
      successStatus = "notification-cancelled";
      auditAction = "NOTIFICATION_CANCELLED";
      data = {
        status: NotificationStatus.CANCELLED,
        errorMessage: null,
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
  redirect(buildNotificationsPath({ status: successStatus }));
}

export async function markNotificationSentAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "mark-sent",
  });
}

export async function markNotificationFailedAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "mark-failed",
    errorMessage: String(formData.get("errorMessage") ?? "").trim(),
  });
}

export async function cancelNotificationAction(formData: FormData) {
  await transitionNotification({
    notificationId: String(formData.get("notificationId") ?? "").trim(),
    intent: "cancel",
  });
}

export async function sendWhatsAppNotificationAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const metaConfig = getMetaWhatsAppConfigStatus();

  if (!notificationId) {
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
  }

  if (!metaConfig.isConfigured) {
    redirect(buildNotificationsPath({ error: "notification-whatsapp-not-configured" }));
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
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
  }

  if (
    notification.channel !== NotificationChannel.WHATSAPP ||
    notification.status !== NotificationStatus.PENDING
  ) {
    redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
  }

  const result = await sendPendingWhatsAppNotification(notification.id, {
    actorUserId: authContext.user.id,
  });

  revalidateNotificationViews();

  if (result.ok) {
    redirect(buildNotificationsPath({ status: "notification-whatsapp-sent" }));
  }

  if (result.reason === "SEND_FAILED") {
    redirect(buildNotificationsPath({ status: "notification-whatsapp-failed" }));
  }

  redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
}

export async function sendEmailNotificationAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const emailConfig = getEmailDeliveryConfigStatus();

  if (!notificationId) {
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
  }

  if (!emailConfig.isConfigured) {
    redirect(buildNotificationsPath({ error: "notification-email-not-configured" }));
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
    redirect(buildNotificationsPath({ error: "notification-not-found" }));
  }

  if (
    notification.channel !== NotificationChannel.EMAIL ||
    notification.status !== NotificationStatus.PENDING
  ) {
    redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
  }

  const result = await sendPendingEmailNotification(notification.id, {
    actorUserId: authContext.user.id,
  });

  revalidateNotificationViews();

  if (result.ok) {
    redirect(buildNotificationsPath({ status: "notification-email-sent" }));
  }

  if (result.reason === "SEND_FAILED") {
    redirect(buildNotificationsPath({ status: "notification-email-failed" }));
  }

  if (result.reason === "EMAIL_NOT_CONFIGURED") {
    redirect(buildNotificationsPath({ error: "notification-email-not-configured" }));
  }

  redirect(buildNotificationsPath({ error: "notification-action-invalid" }));
}
