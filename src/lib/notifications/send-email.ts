import {
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { brand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

type SendPendingEmailNotificationResult =
  | {
      ok: true;
      notificationId: string;
      providerMessageId: string | null;
    }
  | {
      ok: false;
      notificationId: string | null;
      reason:
        | "NOTIFICATION_NOT_FOUND"
        | "NOTIFICATION_NOT_PENDING"
        | "NOTIFICATION_NOT_EMAIL"
        | "EMAIL_NOT_CONFIGURED"
        | "SEND_FAILED";
      errorMessage: string;
    };

type EmailDeliveryConfigStatus = {
  isConfigured: boolean;
  provider: string | null;
  from: string | null;
  reason: string | null;
};

class EmailDeliveryConfigError extends Error {}

class EmailDeliveryRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: string | null,
  ) {
    super(message);
    this.name = "EmailDeliveryRequestError";
  }
}

function normalizeProvider(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";

  return normalized || null;
}

export function getEmailDeliveryConfigStatus(): EmailDeliveryConfigStatus {
  const provider = normalizeProvider(process.env.EMAIL_PROVIDER);
  const from = process.env.EMAIL_FROM?.trim() || null;

  if (!provider) {
    return {
      isConfigured: false,
      provider: null,
      from,
      reason: "Email real no configurado.",
    };
  }

  if (provider !== "resend") {
    return {
      isConfigured: false,
      provider,
      from,
      reason: "El proveedor de email configurado todavia no esta soportado.",
    };
  }

  if (!from || !process.env.RESEND_API_KEY?.trim()) {
    return {
      isConfigured: false,
      provider,
      from,
      reason: "Faltan EMAIL_FROM o RESEND_API_KEY para probar email real.",
    };
  }

  return {
    isConfigured: true,
    provider,
    from,
    reason: null,
  };
}

async function sendWithResend(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new EmailDeliveryConfigError("Email real no configurado.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });

  if (!response.ok) {
    let details: string | null = null;

    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      details = payload.message ?? payload.error ?? null;
    } catch {
      details = null;
    }

    throw new EmailDeliveryRequestError(
      "No se pudo enviar el email real.",
      response.status,
      details,
    );
  }

  const payload = (await response.json()) as {
    id?: string;
  };

  return {
    messageId: payload.id ?? null,
  };
}

function buildFailureMessage(error: unknown) {
  if (error instanceof EmailDeliveryConfigError) {
    return error.message;
  }

  if (error instanceof EmailDeliveryRequestError) {
    return error.details ? `${error.message} ${error.details}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo enviar el email real.";
}

export async function sendPendingEmailNotification(
  notificationId: string,
  options: {
    actorUserId?: string | null;
  } = {},
): Promise<SendPendingEmailNotificationResult> {
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
      subject: true,
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

  if (notification.channel !== NotificationChannel.EMAIL) {
    return {
      ok: false,
      notificationId: notification.id,
      reason: "NOTIFICATION_NOT_EMAIL",
      errorMessage: "Solo las notificaciones de email se pueden probar por este canal.",
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

  const config = getEmailDeliveryConfigStatus();

  if (!config.isConfigured || !config.from) {
    return {
      ok: false,
      notificationId: notification.id,
      reason: "EMAIL_NOT_CONFIGURED",
      errorMessage: config.reason ?? "Email real no configurado.",
    };
  }

  try {
    let providerMessageId: string | null = null;

    switch (config.provider) {
      case "resend": {
        const response = await sendWithResend({
          from: config.from,
          to: notification.recipient,
          subject: notification.subject?.trim() || `Mensaje de ${brand.name}`,
          text: notification.body,
        });
        providerMessageId = response.messageId;
        break;
      }
      default:
        throw new EmailDeliveryConfigError(
          "Email real no configurado.",
        );
    }

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
            provider: config.provider?.toUpperCase() ?? "EMAIL",
            providerMessageId,
          },
        },
        transaction,
      );
    });

    return {
      ok: true,
      notificationId: notification.id,
      providerMessageId,
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
            provider: config.provider?.toUpperCase() ?? "EMAIL",
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
