"use server";

import { redirect } from "next/navigation";

import { requireAuthContext } from "@/lib/auth/session";
import {
  normalizeWhatsAppPhone,
  processWhatsAppSimulatorMessage,
  type WhatsAppSimulatorSender,
} from "@/lib/whatsapp/engine";

type SimulatorErrorCode = "invalid-phone" | "empty-message" | "processing";

function resolveSenderRole(value: FormDataEntryValue | null): WhatsAppSimulatorSender {
  return value === "clinic" ? "clinic" : "patient";
}

function buildSimulatorUrl(
  senderRole: WhatsAppSimulatorSender,
  phoneE164: string,
  error?: SimulatorErrorCode,
) {
  const query = new URLSearchParams({
    sender: senderRole,
    phone: phoneE164,
  });

  if (error) {
    query.set("error", error);
  }

  return `/app/whatsapp-simulator?${query.toString()}`;
}

export async function sendWhatsAppSimulatorMessage(formData: FormData) {
  const authContext = await requireAuthContext();
  const senderRole = resolveSenderRole(formData.get("senderRole"));
  const rawPhone = String(formData.get("phoneE164") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const normalizedPhone = normalizeWhatsAppPhone(rawPhone);

  if (!normalizedPhone) {
    redirect(buildSimulatorUrl(senderRole, rawPhone.trim(), "invalid-phone"));
  }

  if (!message) {
    redirect(buildSimulatorUrl(senderRole, normalizedPhone, "empty-message"));
  }

  try {
    await processWhatsAppSimulatorMessage({
      clinicId: authContext.clinic.id,
      userId: authContext.user.id,
      senderRole,
      phoneE164: normalizedPhone,
      message,
    });
  } catch (error) {
    console.error("No se pudo procesar el mensaje del simulador de WhatsApp.", error);
    redirect(buildSimulatorUrl(senderRole, normalizedPhone, "processing"));
  }

  redirect(buildSimulatorUrl(senderRole, normalizedPhone));
}
