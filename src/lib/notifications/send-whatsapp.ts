import {
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import {
  MetaWhatsAppConfigError,
  MetaWhatsAppRequestError,
  sendWhatsAppTextMessage,
} from "@/lib/meta/whatsapp-client";
import { prisma } from "@/lib/prisma";

type SendPendingWhatsAppNotificationResult =
  | {
      ok: true;
      notificationId: string;
      messageId: string | null;
    }
  | {
      ok: false;
      notificationId: string | null;
      reason:
        | "NOTIFICATION_NOT_FOUND"
        | "NOTIFICATION_NOT_PENDING"
        | "NOTIFICATION_NOT_WHATSAPP"
        | "SEND_FAILED";
      errorMessage: string;
    };

function buildFailureMessage(error: unknown) {
  if (error instanceof MetaWhatsAppConfigError) {
    return error.message;
  }

  if (error instanceof MetaWhatsAppRequestError) {
    return error.details.details
      ? `${error.message} ${error.details.details}`
      : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo enviar el mensaje de WhatsApp.";
}

export async function sendPendingWhatsAppNotification(
  notificationId: string,
  options: {
    actorUserId?: string | null;
  } = {},
): Promise<SendPendingWhatsAppNotificationResult> {
  const normalizedId = notificationId.trim();

  if (!normalizedId) {
    return {
      ok: false,
      notificationId: null,
      reason: "NOTIFICATION_NOT_FOUND",
      errorMessage: "No encontré la notificación solicitada.",
    };
  }

  const notification = await prisma.notificationOutbox.findUnique({
    where: {
      id: normalizedId,
    },
    select: {
      id: true,
      clinicId: true,
      appointmentId: true,
      patientId: true,
      channel: true,
      recipient: true,
      templateKey: true,
      body: true,
      status: true,
    },
  });

  if (!notification) {
    return {
      ok: false,
      notificationId: normalizedId,
      reason: "NOTIFICATION_NOT_FOUND",
      errorMessage: "No encontré la notificación solicitada.",
    };
  }

  if (notification.channel !== NotificationChannel.WHATSAPP) {
    return {
      ok: false,
      notificationId: notification.id,
      reason: "NOTIFICATION_NOT_WHATSAPP",
      errorMessage: "Solo las notificaciones de canal WhatsApp se pueden enviar por Meta.",
    };
  }

  if (notification.status !== NotificationStatus.PENDING) {
    return {
      ok: false,
      notificationId: notification.id,
      reason: "NOTIFICATION_NOT_PENDING",
      errorMessage: "Solo las notificaciones pendientes se pueden enviar.",
    };
  }

  try {
    const response = await sendWhatsAppTextMessage({
      recipient: notification.recipient,
      body: notification.body,
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.notificationOutbox.update({
        where: {
          id: notification.id,
        },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          failedAt: null,
          errorMessage: null,
        },
      });

      await createAuditLog(
        {
          clinicId: notification.clinicId,
          userId: options.actorUserId ?? null,
          action: "NOTIFICATION_SENT",
          entityType: "NOTIFICATION",
          entityId: notification.id,
          metadata: {
            appointmentId: notification.appointmentId,
            patientId: notification.patientId,
            channel: notification.channel,
            recipient: notification.recipient,
            templateKey: notification.templateKey,
            provider: "META_CLOUD_API",
            providerMessageId: response.messageId,
          },
        },
        transaction,
      );
    });

    return {
      ok: true,
      notificationId: notification.id,
      messageId: response.messageId,
    };
  } catch (error) {
    const errorMessage = buildFailureMessage(error);

    await prisma.$transaction(async (transaction) => {
      await transaction.notificationOutbox.update({
        where: {
          id: notification.id,
        },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage,
        },
      });

      await createAuditLog(
        {
          clinicId: notification.clinicId,
          userId: options.actorUserId ?? null,
          action: "NOTIFICATION_FAILED",
          entityType: "NOTIFICATION",
          entityId: notification.id,
          metadata: {
            appointmentId: notification.appointmentId,
            patientId: notification.patientId,
            channel: notification.channel,
            recipient: notification.recipient,
            templateKey: notification.templateKey,
            provider: "META_CLOUD_API",
            errorMessage,
          },
        },
        transaction,
      );
    });

    return {
      ok: false,
      notificationId: notification.id,
      reason: "SEND_FAILED",
      errorMessage,
    };
  }
}
