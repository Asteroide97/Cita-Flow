import {
  Prisma,
  WhatsAppConversationStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

export const runtime = "nodejs";

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: {
            body?: string;
          };
          interactive?: unknown;
        }>;
        statuses?: unknown[];
      };
    }>;
  }>;
};

type InboundWebhookMessage = {
  phoneNumberId: string | null;
  from: string;
  messageId: string | null;
  timestamp: string | null;
  type: string;
  body: string | null;
  contactName: string | null;
  raw: Record<string, unknown>;
};

function getVerifyToken() {
  return process.env.META_WHATSAPP_VERIFY_TOKEN?.trim() ?? "";
}

function resolveMessageType(type: string) {
  switch (type) {
    case "text":
      return WhatsAppMessageType.TEXT;
    case "interactive":
      return WhatsAppMessageType.INTERACTIVE;
    case "template":
      return WhatsAppMessageType.TEMPLATE;
    default:
      return WhatsAppMessageType.SYSTEM;
  }
}

function extractInboundMessages(payload: MetaWebhookPayload) {
  const items: InboundWebhookMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const contact = value?.contacts?.[0];

      for (const message of value?.messages ?? []) {
        if (!message.from) {
          continue;
        }

        items.push({
          phoneNumberId: value?.metadata?.phone_number_id ?? null,
          from: message.from,
          messageId: message.id ?? null,
          timestamp: message.timestamp ?? null,
          type: message.type ?? "system",
          body: message.text?.body?.trim() || null,
          contactName: contact?.profile?.name?.trim() || null,
          raw: message as Record<string, unknown>,
        });
      }
    }
  }

  return items;
}

async function resolveWebhookClinicContext(phoneE164: string) {
  const existingConversation = await prisma.whatsAppConversation.findFirst({
    where: {
      phoneE164,
      clinic: {
        isActive: true,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      clinicId: true,
      patientId: true,
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  const matchingPatients = await prisma.patient.findMany({
    where: {
      phoneE164,
      clinic: {
        isActive: true,
      },
    },
    select: {
      clinicId: true,
      id: true,
    },
    take: 2,
  });

  if (matchingPatients.length === 1) {
    return {
      clinicId: matchingPatients[0].clinicId,
      patientId: matchingPatients[0].id,
    };
  }

  const activeClinics = await prisma.clinic.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
    take: 2,
  });

  if (activeClinics.length === 1) {
    return {
      clinicId: activeClinics[0].id,
      patientId: null,
    };
  }

  return null;
}

async function persistInboundWebhookMessage(message: InboundWebhookMessage) {
  const normalizedPhone = normalizeWhatsAppPhone(message.from);

  if (!normalizedPhone) {
    return;
  }

  const resolvedContext = await resolveWebhookClinicContext(normalizedPhone);

  if (!resolvedContext) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    const conversation = await transaction.whatsAppConversation.upsert({
      where: {
        clinicId_phoneE164: {
          clinicId: resolvedContext.clinicId,
          phoneE164: normalizedPhone,
        },
      },
      update: {
        patientId: resolvedContext.patientId ?? undefined,
        status: WhatsAppConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      },
      create: {
        clinicId: resolvedContext.clinicId,
        patientId: resolvedContext.patientId,
        phoneE164: normalizedPhone,
        status: WhatsAppConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    await transaction.whatsAppMessage.create({
      data: {
        clinicId: resolvedContext.clinicId,
        conversationId: conversation.id,
        direction: WhatsAppMessageDirection.INBOUND,
        messageType: resolveMessageType(message.type),
        body: message.body,
        payloadJson: {
          provider: "META_CLOUD_API",
          providerMessageId: message.messageId,
          providerTimestamp: message.timestamp,
          phoneNumberId: message.phoneNumberId,
          contactName: message.contactName,
          raw: message.raw as Prisma.InputJsonValue,
        } satisfies Prisma.InputJsonObject,
        status: WhatsAppMessageStatus.RECEIVED,
      },
    });
  });
}

export async function GET(request: Request) {
  const verifyToken = getVerifyToken();

  if (!verifyToken) {
    return new NextResponse(
      "META_WHATSAPP_VERIFY_TOKEN no esta configurado.",
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Token de verificacion invalido.", { status: 403 });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as MetaWebhookPayload | null;

  if (!payload || payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const messages = extractInboundMessages(payload);

  const results = await Promise.allSettled(
    messages.map((message) => persistInboundWebhookMessage(message)),
  );

  const failed = results.some((result) => result.status === "rejected");

  if (failed) {
    console.error("Meta WhatsApp webhook recibió eventos con errores de persistencia.");
  }

  return NextResponse.json({ received: true });
}
