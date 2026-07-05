"use server";

import { Prisma, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseDateTimeLocalInput,
  WEEKDAY_OPTIONS,
} from "@/lib/appointments/availability";
import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const VALID_WEEKDAYS = new Set(WEEKDAY_OPTIONS.map((option) => option.value));
const MIN_BLOCK_MINUTES = 15;

function buildAvailabilityPath(
  doctorId: string,
  options?: {
    status?: string;
    error?: string;
  },
) {
  const params = new URLSearchParams();

  if (options?.status) {
    params.set("status", options.status);
  }

  if (options?.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `/app/doctors/${doctorId}/availability${query ? `?${query}` : ""}`;
}

function normalizeReason(value: string) {
  const normalized = value.trim();

  return normalized ? normalized : null;
}

function toBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function parseTimeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function hasTimeOverlap(
  left: { startTime: string; endTime: string },
  right: { startTime: string; endTime: string },
) {
  const leftStart = parseTimeToMinutes(left.startTime);
  const leftEnd = parseTimeToMinutes(left.endTime);
  const rightStart = parseTimeToMinutes(right.startTime);
  const rightEnd = parseTimeToMinutes(right.endTime);

  if (
    leftStart === null ||
    leftEnd === null ||
    rightStart === null ||
    rightEnd === null
  ) {
    return false;
  }

  return leftStart < rightEnd && rightStart < leftEnd;
}

function minutesBetween(startAt: Date, endAt: Date) {
  return Math.round((endAt.getTime() - startAt.getTime()) / 60000);
}

function parseTargetDays(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim() as Weekday)
    .filter((item) => VALID_WEEKDAYS.has(item));
}

async function requireDoctorForClinic(doctorId: string, clinicId: string) {
  return prisma.doctor.findFirst({
    where: {
      id: doctorId,
      clinicId,
    },
    select: {
      id: true,
      clinicId: true,
      name: true,
    },
  });
}

async function findOverlappingActiveAvailability(params: {
  clinicId: string;
  doctorId: string;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  excludeAvailabilityId?: string;
}) {
  const existingBlocks = await prisma.doctorAvailability.findMany({
    where: {
      clinicId: params.clinicId,
      doctorId: params.doctorId,
      dayOfWeek: params.dayOfWeek,
      isActive: true,
      ...(params.excludeAvailabilityId
        ? {
            id: {
              not: params.excludeAvailabilityId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  return existingBlocks.find((block) =>
    hasTimeOverlap(
      { startTime: params.startTime, endTime: params.endTime },
      block,
    ),
  );
}

function revalidateDoctorAvailabilityViews(clinicSlug: string, doctorId: string) {
  revalidatePath("/app/doctors");
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/doctors/${doctorId}/availability`);
  revalidatePath("/app/whatsapp-simulator");
  revalidatePath(`/booking/${clinicSlug}`);
}

async function syncAvailabilityPattern(params: {
  transaction: Prisma.TransactionClient;
  clinicId: string;
  doctorId: string;
  sourceDay: Weekday;
  targetDays: Weekday[];
}) {
  const sourceBlocks = await params.transaction.doctorAvailability.findMany({
    where: {
      clinicId: params.clinicId,
      doctorId: params.doctorId,
      dayOfWeek: params.sourceDay,
      isActive: true,
    },
    orderBy: {
      startTime: "asc",
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  if (!sourceBlocks.length) {
    return {
      ok: false as const,
      reason: "availability-copy-source-empty",
    };
  }

  for (const targetDay of params.targetDays) {
    await params.transaction.doctorAvailability.updateMany({
      where: {
        clinicId: params.clinicId,
        doctorId: params.doctorId,
        dayOfWeek: targetDay,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    for (const block of sourceBlocks) {
      await params.transaction.doctorAvailability.upsert({
        where: {
          doctorId_dayOfWeek_startTime_endTime: {
            doctorId: params.doctorId,
            dayOfWeek: targetDay,
            startTime: block.startTime,
            endTime: block.endTime,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          clinicId: params.clinicId,
          doctorId: params.doctorId,
          dayOfWeek: targetDay,
          startTime: block.startTime,
          endTime: block.endTime,
          isActive: true,
        },
      });
    }
  }

  return {
    ok: true as const,
    copiedBlocks: sourceBlocks.length,
  };
}

export async function createDoctorAvailabilityAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "").trim() as Weekday;
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (
    !doctorId ||
    !VALID_WEEKDAYS.has(dayOfWeek) ||
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "availability-invalid" }));
  }

  if (endMinutes - startMinutes < MIN_BLOCK_MINUTES) {
    redirect(buildAvailabilityPath(doctorId, { error: "availability-too-short" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  const overlappingBlock = await findOverlappingActiveAvailability({
    clinicId: authContext.clinic.id,
    doctorId,
    dayOfWeek,
    startTime,
    endTime,
  });

  if (overlappingBlock) {
    redirect(buildAvailabilityPath(doctorId, { error: "availability-overlap" }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const availability = await transaction.doctorAvailability.create({
        data: {
          clinicId: authContext.clinic.id,
          doctorId,
          dayOfWeek,
          startTime,
          endTime,
          isActive: true,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "DOCTOR_AVAILABILITY_CREATED",
          entityType: "DOCTOR_AVAILABILITY",
          entityId: availability.id,
          metadata: {
            doctorId,
            dayOfWeek,
            startTime,
            endTime,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildAvailabilityPath(doctorId, { error: "availability-duplicate" }));
    }

    console.error("No se pudo crear el bloque de disponibilidad.", error);
    redirect(buildAvailabilityPath(doctorId, { error: "availability-save" }));
  }

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "availability-created" }));
}

export async function toggleDoctorAvailabilityAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const availabilityId = String(formData.get("availabilityId") ?? "").trim();
  const nextIsActive = toBoolean(formData.get("nextIsActive"));

  if (!doctorId || !availabilityId) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "availability-invalid" }));
  }

  const availability = await prisma.doctorAvailability.findFirst({
    where: {
      id: availabilityId,
      clinicId: authContext.clinic.id,
      doctorId,
    },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isActive: true,
    },
  });

  if (!availability) {
    redirect(buildAvailabilityPath(doctorId, { error: "availability-not-found" }));
  }

  if (nextIsActive) {
    const overlappingBlock = await findOverlappingActiveAvailability({
      clinicId: authContext.clinic.id,
      doctorId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      excludeAvailabilityId: availability.id,
    });

    if (overlappingBlock) {
      redirect(buildAvailabilityPath(doctorId, { error: "availability-overlap" }));
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.doctorAvailability.update({
      where: {
        id: availability.id,
      },
      data: {
        isActive: nextIsActive,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_AVAILABILITY_UPDATED",
        entityType: "DOCTOR_AVAILABILITY",
        entityId: availability.id,
        metadata: {
          doctorId,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
          previousIsActive: availability.isActive,
          nextIsActive,
        },
      },
      transaction,
    );

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: nextIsActive
          ? "DOCTOR_AVAILABILITY_REACTIVATED"
          : "DOCTOR_AVAILABILITY_DEACTIVATED",
        entityType: "DOCTOR_AVAILABILITY",
        entityId: availability.id,
        metadata: {
          doctorId,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
          previousIsActive: availability.isActive,
          nextIsActive,
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(
    buildAvailabilityPath(doctorId, {
      status: nextIsActive ? "availability-reactivated" : "availability-deactivated",
    }),
  );
}

export async function copyDoctorAvailabilityPatternAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const sourceDay = String(formData.get("sourceDayOfWeek") ?? "").trim() as Weekday;
  const targetDays = parseTargetDays(formData.get("targetDays"));

  if (
    !doctorId ||
    !VALID_WEEKDAYS.has(sourceDay) ||
    !targetDays.length ||
    targetDays.includes(sourceDay)
  ) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "availability-copy-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  const uniqueTargetDays = Array.from(new Set(targetDays));

  const result = await prisma.$transaction(async (transaction) => {
    const syncResult = await syncAvailabilityPattern({
      transaction,
      clinicId: authContext.clinic.id,
      doctorId,
      sourceDay,
      targetDays: uniqueTargetDays,
    });

    if (!syncResult.ok) {
      return syncResult;
    }

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_AVAILABILITY_UPDATED",
        entityType: "DOCTOR_AVAILABILITY",
        metadata: {
          doctorId,
          sourceDay,
          targetDays: uniqueTargetDays,
          copiedBlocks: syncResult.copiedBlocks,
          updateMode: "copy-pattern",
        },
      },
      transaction,
    );

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_AVAILABILITY_COPIED",
        entityType: "DOCTOR_AVAILABILITY",
        metadata: {
          doctorId,
          sourceDay,
          targetDays: uniqueTargetDays,
          copiedBlocks: syncResult.copiedBlocks,
        },
      },
      transaction,
    );

    return syncResult;
  });

  if (!result.ok) {
    redirect(buildAvailabilityPath(doctorId, { error: result.reason }));
  }

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "availability-copied" }));
}

export async function clearDoctorAvailabilityDayAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "").trim() as Weekday;

  if (!doctorId || !VALID_WEEKDAYS.has(dayOfWeek)) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "availability-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    const activeBlocks = await transaction.doctorAvailability.findMany({
      where: {
        clinicId: authContext.clinic.id,
        doctorId,
        dayOfWeek,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (activeBlocks.length) {
      await transaction.doctorAvailability.updateMany({
        where: {
          clinicId: authContext.clinic.id,
          doctorId,
          dayOfWeek,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_AVAILABILITY_UPDATED",
        entityType: "DOCTOR_AVAILABILITY",
        metadata: {
          doctorId,
          dayOfWeek,
          deactivatedBlocks: activeBlocks.length,
          updateMode: "clear-day",
        },
      },
      transaction,
    );

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_AVAILABILITY_DEACTIVATED",
        entityType: "DOCTOR_AVAILABILITY",
        metadata: {
          doctorId,
          dayOfWeek,
          deactivatedBlocks: activeBlocks.length,
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "availability-cleared" }));
}

export async function createDoctorTimeOffAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const startAtValue = String(formData.get("startAt") ?? "").trim();
  const endAtValue = String(formData.get("endAt") ?? "").trim();
  const reason = normalizeReason(String(formData.get("reason") ?? ""));

  if (!doctorId || !startAtValue || !endAtValue) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "timeoff-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  const startAt = parseDateTimeLocalInput(startAtValue, authContext.clinic.timezone);
  const endAt = parseDateTimeLocalInput(endAtValue, authContext.clinic.timezone);

  if (!startAt || !endAt || endAt <= startAt) {
    redirect(buildAvailabilityPath(doctorId, { error: "timeoff-invalid" }));
  }

  await prisma.$transaction(async (transaction) => {
    const timeOff = await transaction.doctorTimeOff.create({
      data: {
        clinicId: authContext.clinic.id,
        doctorId,
        startAt,
        endAt,
        reason,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_TIME_OFF_CREATED",
        entityType: "DOCTOR_TIME_OFF",
        entityId: timeOff.id,
        metadata: {
          doctorId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          reason,
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "timeoff-created" }));
}

export async function cancelDoctorTimeOffAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const timeOffId = String(formData.get("timeOffId") ?? "").trim();

  if (!doctorId || !timeOffId) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "timeoff-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  const timeOff = await prisma.doctorTimeOff.findFirst({
    where: {
      id: timeOffId,
      clinicId: authContext.clinic.id,
      doctorId,
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      reason: true,
    },
  });

  if (!timeOff) {
    redirect(buildAvailabilityPath(doctorId, { error: "timeoff-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.doctorTimeOff.delete({
      where: {
        id: timeOff.id,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_TIME_OFF_CANCELLED",
        entityType: "DOCTOR_TIME_OFF",
        entityId: timeOff.id,
        metadata: {
          doctorId,
          startAt: timeOff.startAt.toISOString(),
          endAt: timeOff.endAt.toISOString(),
          reason: timeOff.reason,
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "timeoff-cancelled" }));
}

export async function createClinicBlockedTimeAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const startAtValue = String(formData.get("startAt") ?? "").trim();
  const endAtValue = String(formData.get("endAt") ?? "").trim();
  const reason = normalizeReason(String(formData.get("reason") ?? ""));

  if (!doctorId || !startAtValue || !endAtValue) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "blocked-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
  }

  const startAt = parseDateTimeLocalInput(startAtValue, authContext.clinic.timezone);
  const endAt = parseDateTimeLocalInput(endAtValue, authContext.clinic.timezone);

  if (!startAt || !endAt || endAt <= startAt) {
    redirect(buildAvailabilityPath(doctorId, { error: "blocked-invalid" }));
  }

  if (minutesBetween(startAt, endAt) < MIN_BLOCK_MINUTES) {
    redirect(buildAvailabilityPath(doctorId, { error: "blocked-invalid" }));
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
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(authContext.clinic.slug, doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "blocked-created" }));
}
