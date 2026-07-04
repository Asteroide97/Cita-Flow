"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

import { isValidPatientEmail } from "./helpers";

function normalizeRequiredText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized ? normalized : null;
}

function resolveSafePatientPath(value: FormDataEntryValue | null, fallbackPath: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/app/patients")) {
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

function revalidatePatientViews(patientId: string) {
  revalidatePath("/app/patients");
  revalidatePath(`/app/patients/${patientId}`);
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/notifications");
  revalidatePath("/app/waitlist");
}

export async function updatePatientAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const patientId = String(formData.get("patientId") ?? "").trim();
  const fallbackPath = patientId ? `/app/patients/${patientId}` : "/app/patients";
  const redirectPath = resolveSafePatientPath(formData.get("returnPath"), fallbackPath);
  const name = normalizeRequiredText(formData.get("name"));
  const phoneRaw = normalizeRequiredText(formData.get("phoneE164"));
  const email = normalizeOptionalEmail(formData.get("email"));
  const notes = normalizeOptionalText(formData.get("notes"));

  if (!patientId) {
    redirect("/app/patients");
  }

  if (!name) {
    redirect(appendFeedbackToPath(redirectPath, { error: "patient-name-required" }));
  }

  if (!phoneRaw) {
    redirect(appendFeedbackToPath(redirectPath, { error: "patient-phone-required" }));
  }

  const normalizedPhone = normalizeWhatsAppPhone(phoneRaw);

  if (!normalizedPhone) {
    redirect(appendFeedbackToPath(redirectPath, { error: "patient-phone-invalid" }));
  }

  if (email && !isValidPatientEmail(email)) {
    redirect(appendFeedbackToPath(redirectPath, { error: "patient-email-invalid" }));
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
      notes: true,
    },
  });

  if (!patient) {
    redirect(appendFeedbackToPath("/app/patients", { error: "patient-not-found" }));
  }

  const duplicatePatient = await prisma.patient.findUnique({
    where: {
      clinicId_phoneE164: {
        clinicId: authContext.clinic.id,
        phoneE164: normalizedPhone,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicatePatient && duplicatePatient.id !== patient.id) {
    redirect(appendFeedbackToPath(redirectPath, { error: "patient-phone-duplicate" }));
  }

  const changedFields = [
    patient.name !== name ? "name" : null,
    patient.phoneE164 !== normalizedPhone ? "phoneE164" : null,
    patient.email !== email ? "email" : null,
    patient.notes !== notes ? "notes" : null,
  ].filter((value): value is string => Boolean(value));

  if (!changedFields.length) {
    redirect(appendFeedbackToPath(redirectPath, { status: "patient-unchanged" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.patient.update({
      where: {
        id: patient.id,
      },
      data: {
        name,
        phoneE164: normalizedPhone,
        email,
        notes,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "CLIENT_UPDATED",
        entityType: "PATIENT",
        entityId: patient.id,
        metadata: {
          changedFields,
          previousName: patient.name,
          nextName: name,
          previousPhoneE164: patient.phoneE164,
          nextPhoneE164: normalizedPhone,
          previousEmail: patient.email,
          nextEmail: email,
        },
      },
      transaction,
    );
  });

  revalidatePatientViews(patient.id);
  redirect(appendFeedbackToPath(redirectPath, { status: "patient-updated" }));
}
