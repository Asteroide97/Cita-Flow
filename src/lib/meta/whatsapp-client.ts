import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

const DEFAULT_META_WHATSAPP_API_VERSION = "v20.0";

type MetaWhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
};

export type MetaWhatsAppConfigStatus = {
  isConfigured: boolean;
  missingKeys: string[];
  apiVersion: string;
};

type MetaGraphApiErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_data?: {
      details?: string;
    };
    fbtrace_id?: string;
  };
};

type MetaSendMessageResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;
};

export type ParsedMetaError = {
  status: number | null;
  message: string;
  type: string | null;
  code: number | null;
  subcode: number | null;
  details: string | null;
  traceId: string | null;
};

export type SendWhatsAppTextMessageResult = {
  messageId: string | null;
  recipient: string;
  raw: MetaSendMessageResponse | null;
};

export type SendWhatsAppTemplateMessageInput = {
  recipient: string;
  templateName: string;
  languageCode?: string;
  components?: Array<Record<string, unknown>>;
};

export class MetaWhatsAppConfigError extends Error {
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(
      `Faltan variables de entorno de Meta WhatsApp: ${missingKeys.join(", ")}.`,
    );
    this.name = "MetaWhatsAppConfigError";
    this.missingKeys = missingKeys;
  }
}

export class MetaWhatsAppRequestError extends Error {
  details: ParsedMetaError;

  constructor(details: ParsedMetaError) {
    super(details.message);
    this.name = "MetaWhatsAppRequestError";
    this.details = details;
  }
}

function getMetaWhatsAppConfig(): MetaWhatsAppConfig {
  const status = getMetaWhatsAppConfigStatus();
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";

  if (status.missingKeys.length) {
    throw new MetaWhatsAppConfigError(status.missingKeys);
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion: status.apiVersion,
  };
}

export function getMetaWhatsAppConfigStatus(): MetaWhatsAppConfigStatus {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  const apiVersion =
    process.env.META_WHATSAPP_API_VERSION?.trim() || DEFAULT_META_WHATSAPP_API_VERSION;

  const missingKeys = [
    !accessToken ? "META_WHATSAPP_ACCESS_TOKEN" : null,
    !phoneNumberId ? "META_WHATSAPP_PHONE_NUMBER_ID" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    apiVersion,
  };
}

export function normalizeWhatsAppRecipient(rawValue: string) {
  const normalizedPhone = normalizeWhatsAppPhone(rawValue);

  if (!normalizedPhone) {
    return null;
  }

  return normalizedPhone.startsWith("+")
    ? normalizedPhone.slice(1)
    : normalizedPhone;
}

export function parseMetaError(input: {
  status?: number | null;
  body?: unknown;
  fallbackMessage?: string;
}): ParsedMetaError {
  const payload =
    input.body && typeof input.body === "object"
      ? (input.body as MetaGraphApiErrorPayload)
      : null;

  return {
    status: input.status ?? null,
    message:
      payload?.error?.message?.trim() ||
      input.fallbackMessage ||
      "Meta Cloud API devolvió un error.",
    type: payload?.error?.type ?? null,
    code: payload?.error?.code ?? null,
    subcode: payload?.error?.error_subcode ?? null,
    details: payload?.error?.error_data?.details ?? null,
    traceId: payload?.error?.fbtrace_id ?? null,
  };
}

async function postMetaWhatsAppMessage(
  payload: Record<string, unknown>,
): Promise<SendWhatsAppTextMessageResult> {
  const { accessToken, phoneNumberId, apiVersion } = getMetaWhatsAppConfig();
  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    throw new MetaWhatsAppRequestError(
      parseMetaError({
        fallbackMessage:
          error instanceof Error
            ? `No se pudo conectar con Meta Cloud API: ${error.message}`
            : "No se pudo conectar con Meta Cloud API.",
      }),
    );
  }

  const raw = (await response.json().catch(() => null)) as MetaSendMessageResponse | null;

  if (!response.ok) {
    throw new MetaWhatsAppRequestError(
      parseMetaError({
        status: response.status,
        body: raw,
        fallbackMessage: `Meta Cloud API respondió con HTTP ${response.status}.`,
      }),
    );
  }

  return {
    messageId: raw?.messages?.[0]?.id ?? null,
    recipient: String(payload.to ?? ""),
    raw,
  };
}

export async function sendWhatsAppTextMessage(params: {
  recipient: string;
  body: string;
}) {
  const normalizedRecipient = normalizeWhatsAppRecipient(params.recipient);

  if (!normalizedRecipient) {
    throw new Error("El destinatario de WhatsApp no tiene un formato válido.");
  }

  return postMetaWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizedRecipient,
    type: "text",
    text: {
      preview_url: false,
      body: params.body,
    },
  });
}

export async function sendWhatsAppTemplateMessage({
  recipient,
  templateName,
  languageCode = "es_MX",
  components,
}: SendWhatsAppTemplateMessageInput) {
  const normalizedRecipient = normalizeWhatsAppRecipient(recipient);

  if (!normalizedRecipient) {
    throw new Error("El destinatario de WhatsApp no tiene un formato válido.");
  }

  return postMetaWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizedRecipient,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      ...(components?.length ? { components } : {}),
    },
  });
}
