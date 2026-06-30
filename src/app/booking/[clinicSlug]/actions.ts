"use server";

import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
} from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildClinicDateMarker,
  createAppointmentSafely,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { createAuditLog } from "@/lib/audit";
import { setPublicBookingConfirmationCookie } from "@/lib/booking/confirmation";
import {
  buildBookingPath,
  getBookingClientIp,
  isValidBookingEmail,
  normalizeBookingEmail,
} from "@/lib/booking/public";
import {
  clearPublicBookingRateLimit,
  getPublicBookingRateLimitStatus,
  registerPublicBookingAttempt,
} from "@/lib/booking/rate-limit";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

type BookingRedirectState = {
  clinicSlug: string;
  serviceId?: string | null;
  doctorId?: string | null;
  date?: string | null;
  slotTime?: string | null;
  error?: string | null;
  status?: string | null;
};

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function buildBookingRedirectPath(state: BookingRedirectState) {
  return buildBookingPath(state.clinicSlug, {
    serviceId: state.serviceId,
    doctorId: state.doctorId,
    date: state.date,
    slotTime: state.slotTime,
    error: state.error,
    status: state.status,
  });
}

function buildPhoneRateLimitKey(rawValue: string) {
  const normalizedPhone = normalizeWhatsAppPhone(rawValue);

  if (normalizedPhone) {
    return normalizedPhone;
  }

  const digits = rawValue.replace(/\D/g, "");

  return digits || "unknown";
}

async function registerPublicBookingFailure(params: {
  clinicId?: string | null;
  clinicSlug: string;
  reason: string;
  ipAddress: string;
  serviceId?: string | null;
  doctorId?: string | null;
  date?: string | null;
  slotTime?: string | null;
  phone?: string | null;
  retryAfterSeconds?: number;
  metadata?: Prisma.InputJsonValue;
}) {
  await createAuditLog({
    clinicId: params.clinicId ?? null,
    action: "PUBLIC_BOOKING_FAILED",
    entityType: "PUBLIC_BOOKING",
    metadata: {
      clinicSlug: params.clinicSlug,
      reason: params.reason,
      ipAddress: params.ipAddress,
      serviceId: params.serviceId ?? null,
      doctorId: params.doctorId ?? null,
      date: params.date ?? null,
      slotTime: params.slotTime ?? null,
      phone: params.phone ?? null,
      retryAfterSeconds: params.retryAfterSeconds ?? null,
      extra: params.metadata ?? null,
    },
  });
}

async function resolvePublicBookingPatient(params: {
  transaction: Prisma.TransactionClient;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
}) {
  const existingPatient = await params.transaction.patient.findUnique({
    where: {
      clinicId_phoneE164: {
        clinicId: params.clinicId,
        phoneE164: params.patientPhone,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPatient) {
    await params.transaction.patient.update({
      where: {
        id: existingPatient.id,
      },
      data: {
        name: params.patientName,
        email: params.patientEmail,
      },
    });

    return {
      id: existingPatient.id,
      wasCreated: false,
    };
  }

  const createdPatient = await params.transaction.patient.create({
    data: {
      clinicId: params.clinicId,
      name: params.patientName,
      phoneE164: params.patientPhone,
      email: params.patientEmail,
    },
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
    },
  });

  await createAuditLog(
    {
      clinicId: params.clinicId,
      action: "PUBLIC_BOOKING_PATIENT_CREATED",
      entityType: "PATIENT",
      entityId: createdPatient.id,
      metadata: {
        name: createdPatient.name,
        phoneE164: createdPatient.phoneE164,
        email: createdPatient.email,
      },
    },
    params.transaction,
  );

  return {
    id: createdPatient.id,
    wasCreated: true,
  };
}

export async function createPublicBookingAction(formData: FormData) {
  const requestHeaders = await headers();
  const ipAddress = getBookingClientIp(requestHeaders);
  const clinicSlug = String(formData.get("clinicSlug") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const slotTime = String(formData.get("slotTime") ?? "").trim();
  const patientName = normalizeOptionalText(formData.get("patientName"));
  const patientPhoneRaw = normalizeOptionalText(formData.get("patientPhone"));
  const patientEmailRaw = normalizeOptionalText(formData.get("patientEmail"));
  const notes = normalizeOptionalText(formData.get("notes"));
  const patientEmail = patientEmailRaw
    ? normalizeBookingEmail(patientEmailRaw)
    : null;
  const phoneRateLimitKey = buildPhoneRateLimitKey(patientPhoneRaw ?? "");

  if (!clinicSlug) {
    redirect("/");
  }

  const clinic = await prisma.clinic.findUnique({
    where: {
      slug: clinicSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      isActive: true,
    },
  });

  if (!clinic || !clinic.isActive) {
    await registerPublicBookingFailure({
      clinicId: clinic?.id ?? null,
      clinicSlug,
      reason: "CLINIC_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(buildBookingRedirectPath({ clinicSlug, error: "clinic-unavailable" }));
  }

  await createAuditLog({
    clinicId: clinic.id,
    action: "PUBLIC_BOOKING_STARTED",
    entityType: "PUBLIC_BOOKING",
    metadata: {
      clinicSlug,
      ipAddress,
      serviceId: serviceId || null,
      doctorId: doctorId || null,
      date: date || null,
      slotTime: slotTime || null,
    },
  });

  const rateLimitStatus = getPublicBookingRateLimitStatus(
    ipAddress,
    phoneRateLimitKey,
  );

  if (!rateLimitStatus.allowed) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "RATE_LIMITED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
      retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        slotTime,
        error: "rate-limited",
      }),
    );
  }

  if (!serviceId) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "SERVICE_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(buildBookingRedirectPath({ clinicSlug, error: "service-required" }));
  }

  if (!doctorId) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "DOCTOR_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        error: "doctor-required",
      }),
    );
  }

  if (!date) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "DATE_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        error: "date-required",
      }),
    );
  }

  if (!slotTime) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "SLOT_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        error: "slot-required",
      }),
    );
  }

  if (!patientName) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "PATIENT_NAME_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        slotTime,
        error: "patient-name-required",
      }),
    );
  }

  if (!patientPhoneRaw) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "PATIENT_PHONE_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        slotTime,
        error: "patient-phone-required",
      }),
    );
  }

  const normalizedPhone = normalizeWhatsAppPhone(patientPhoneRaw);

  if (!normalizedPhone) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "PATIENT_PHONE_INVALID",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        slotTime,
        error: "patient-phone-invalid",
      }),
    );
  }

  if (patientEmail && !isValidBookingEmail(patientEmail)) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "PATIENT_EMAIL_INVALID",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        slotTime,
        error: "patient-email-invalid",
      }),
    );
  }

  const dateParts = parseIsoDateInput(date);

  if (!dateParts) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "DATE_INVALID",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        error: "date-required",
      }),
    );
  }

  const [service, doctor] = await Promise.all([
    prisma.service.findFirst({
      where: {
        id: serviceId,
        clinicId: clinic.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.doctor.findFirst({
      where: {
        id: doctorId,
        clinicId: clinic.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!service) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "SERVICE_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        error: "service-unavailable",
      }),
    );
  }

  if (!doctor) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "DOCTOR_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        error: "doctor-unavailable",
      }),
    );
  }

  const availableSlotResult = await getAvailableSlots({
    clinicId: clinic.id,
    doctorId: doctor.id,
    serviceId: service.id,
    date: buildClinicDateMarker(dateParts, clinic.timezone),
  });
  const selectedSlot = availableSlotResult.slots.find(
    (slot) => slot.startTime === slotTime,
  );

  if (!selectedSlot) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "SLOT_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
      metadata: {
        availableSlots: availableSlotResult.slots.map((slot) => slot.startTime),
      },
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        error: "slot-unavailable",
      }),
    );
  }

  try {
    const appointment = await prisma.$transaction(async (transaction) => {
      const patient = await resolvePublicBookingPatient({
        transaction,
        clinicId: clinic.id,
        patientName,
        patientPhone: normalizedPhone,
        patientEmail,
      });

      const createdAppointment = await createAppointmentSafely({
        clinicId: clinic.id,
        doctorId: doctor.id,
        serviceId: service.id,
        patientId: patient.id,
        startAt: selectedSlot.startAt,
        status: AppointmentStatus.PENDING,
        source: AppointmentSource.PUBLIC_BOOKING,
        notes,
        db: transaction,
      });

      await createAuditLog(
        {
          clinicId: clinic.id,
          action: "PUBLIC_BOOKING_CREATED",
          entityType: "APPOINTMENT",
          entityId: createdAppointment.id,
          metadata: {
            patientId: patient.id,
            doctorId: doctor.id,
            serviceId: service.id,
            startAt: createdAppointment.startAt.toISOString(),
            endAt: createdAppointment.endAt.toISOString(),
            source: createdAppointment.source,
            status: createdAppointment.status,
          },
        },
        transaction,
      );

      return createdAppointment;
    });

    clearPublicBookingRateLimit(ipAddress, phoneRateLimitKey);

    await setPublicBookingConfirmationCookie({
      clinicSlug: clinic.slug,
      clinicName: clinic.name,
      serviceName: service.name,
      doctorName: doctor.name,
      startAtIso: appointment.startAt.toISOString(),
      timezone: clinic.timezone,
      statusLabel: "Pendiente de confirmacion",
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId: service.id,
        doctorId: doctor.id,
        date,
        slotTime,
        status: "booking-created",
      }),
    );
  } catch (error) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    const refreshedSlots = await getAvailableSlots({
      clinicId: clinic.id,
      doctorId: doctor.id,
      serviceId: service.id,
      date: buildClinicDateMarker(dateParts, clinic.timezone),
    });
    const isSlotStillAvailable = refreshedSlots.slots.some(
      (slot) => slot.startTime === slotTime,
    );

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: isSlotStillAvailable ? "BOOKING_SAVE_FAILED" : "SLOT_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date,
      slotTime,
      phone: normalizedPhone,
      metadata: {
        errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        availableSlots: refreshedSlots.slots.map((slot) => slot.startTime),
      },
    });

    console.error("No se pudo crear la cita publica.", error);

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date,
        error: isSlotStillAvailable ? "booking-save" : "slot-unavailable",
      }),
    );
  }
}
