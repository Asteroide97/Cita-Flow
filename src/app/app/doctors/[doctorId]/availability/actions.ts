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

function isValidTimeInput(value: string) {
  return /^(\d{2}):(\d{2})$/.test(value);
}

function normalizeReason(value: string) {
  const normalized = value.trim();

  return normalized ? normalized : null;
}

function toBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
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

function revalidateDoctorAvailabilityViews(doctorId: string) {
  revalidatePath("/app/doctors");
  revalidatePath(`/app/doctors/${doctorId}/availability`);
  revalidatePath("/app/whatsapp-simulator");
}

export async function createDoctorAvailabilityAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "").trim() as Weekday;
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();

  if (
    !doctorId ||
    !VALID_WEEKDAYS.has(dayOfWeek) ||
    !isValidTimeInput(startTime) ||
    !isValidTimeInput(endTime) ||
    startTime >= endTime
  ) {
    redirect(buildAvailabilityPath(doctorId || "sin-doctor", { error: "availability-invalid" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildAvailabilityPath(doctorId, { error: "doctor-not-found" }));
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

  revalidateDoctorAvailabilityViews(doctorId);
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
    },
  });

  if (!availability) {
    redirect(buildAvailabilityPath(doctorId, { error: "availability-not-found" }));
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
          isActive: nextIsActive,
        },
      },
      transaction,
    );
  });

  revalidateDoctorAvailabilityViews(doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "availability-updated" }));
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

  revalidateDoctorAvailabilityViews(doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "timeoff-created" }));
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
        action: "CLINIC_BLOCKED_TIME_CREATED",
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

  revalidateDoctorAvailabilityViews(doctorId);
  redirect(buildAvailabilityPath(doctorId, { status: "blocked-created" }));
}
