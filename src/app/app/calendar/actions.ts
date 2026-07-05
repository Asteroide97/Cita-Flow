"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseDateTimeLocalInput,
  type LocalDateParts,
} from "@/lib/appointments/availability";
import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type CalendarFeedbackOptions = {
  status?: string;
  error?: string;
};

const MIN_BUSINESS_BLOCK_MINUTES = 15;

function resolveSafeCalendarPath(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/app/calendar")) {
    return "/app/calendar";
  }

  return normalized;
}

function appendCalendarFeedback(path: string, options: CalendarFeedbackOptions) {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);

  query.delete("status");
  query.delete("error");

  if (options.status) {
    query.set("status", options.status);
  }

  if (options.error) {
    query.set("error", options.error);
  }

  const serialized = query.toString();

  return `${pathname}${serialized ? `?${serialized}` : ""}`;
}

function normalizeReason(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function parseIsoDateParts(value: string): LocalDateParts | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

function combineDateAndTime(date: string, time: string) {
  return `${date}T${time}`;
}

function shiftDateParts(parts: LocalDateParts, amount: number) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  } satisfies LocalDateParts;
}

function minutesBetween(startAt: Date, endAt: Date) {
  return Math.round((endAt.getTime() - startAt.getTime()) / 60000);
}

function revalidateCalendarOperationalViews(clinicSlug: string) {
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/doctors");
  revalidatePath("/app/notifications");
  revalidatePath("/app/services");
  revalidatePath("/app/waitlist");
  revalidatePath("/app/whatsapp-simulator");
  revalidatePath(`/booking/${clinicSlug}`);
}

export async function createCalendarBusinessBlockAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const redirectPath = resolveSafeCalendarPath(formData.get("redirectPath"));
  const dateValue = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const blockMode = String(formData.get("blockMode") ?? "range").trim();
  const reason = normalizeReason(formData.get("reason"));

  const dateParts = parseIsoDateParts(dateValue);

  if (!dateParts) {
    redirect(appendCalendarFeedback(redirectPath, { error: "business-block-invalid" }));
  }

  const startAt =
    blockMode === "full-day"
      ? parseDateTimeLocalInput(combineDateAndTime(dateValue, "00:00"), authContext.clinic.timezone)
      : parseDateTimeLocalInput(
          combineDateAndTime(dateValue, startTime),
          authContext.clinic.timezone,
        );
  const endAt =
    blockMode === "full-day"
      ? parseDateTimeLocalInput(
          combineDateAndTime(
            `${String(shiftDateParts(dateParts, 1).year).padStart(4, "0")}-${String(shiftDateParts(dateParts, 1).month).padStart(2, "0")}-${String(shiftDateParts(dateParts, 1).day).padStart(2, "0")}`,
            "00:00",
          ),
          authContext.clinic.timezone,
        )
      : parseDateTimeLocalInput(
          combineDateAndTime(dateValue, endTime),
          authContext.clinic.timezone,
        );

  if (!startAt || !endAt || endAt <= startAt) {
    redirect(appendCalendarFeedback(redirectPath, { error: "business-block-invalid" }));
  }

  if (minutesBetween(startAt, endAt) < MIN_BUSINESS_BLOCK_MINUTES) {
    redirect(appendCalendarFeedback(redirectPath, { error: "business-block-too-short" }));
  }

  await prisma.$transaction(async (transaction) => {
    const blockedTime = await transaction.clinicBlockedTime.create({
      data: {
        clinicId: authContext.clinic.id,
        startAt,
        endAt,
        reason,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "BUSINESS_BLOCK_CREATED",
        entityType: "CLINIC_BLOCKED_TIME",
        entityId: blockedTime.id,
        metadata: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          reason,
          mode: blockMode,
        },
      },
      transaction,
    );
  });

  revalidateCalendarOperationalViews(authContext.clinic.slug);
  redirect(appendCalendarFeedback(redirectPath, { status: "business-block-created" }));
}

export async function cancelCalendarBusinessBlockAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const redirectPath = resolveSafeCalendarPath(formData.get("redirectPath"));
  const blockId = String(formData.get("blockId") ?? "").trim();

  if (!blockId) {
    redirect(appendCalendarFeedback(redirectPath, { error: "business-block-not-found" }));
  }

  const blockedTime = await prisma.clinicBlockedTime.findFirst({
    where: {
      id: blockId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      reason: true,
    },
  });

  if (!blockedTime) {
    redirect(appendCalendarFeedback(redirectPath, { error: "business-block-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.clinicBlockedTime.delete({
      where: {
        id: blockedTime.id,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "BUSINESS_BLOCK_CANCELLED",
        entityType: "CLINIC_BLOCKED_TIME",
        entityId: blockedTime.id,
        metadata: {
          startAt: blockedTime.startAt.toISOString(),
          endAt: blockedTime.endAt.toISOString(),
          reason: blockedTime.reason,
        },
      },
      transaction,
    );
  });

  revalidateCalendarOperationalViews(authContext.clinic.slug);
  redirect(appendCalendarFeedback(redirectPath, { status: "business-block-cancelled" }));
}
