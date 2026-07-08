"use server";

import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
  WaitlistStatus,
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
  getBookingClinicDisplayName,
  isValidBookingEmail,
  normalizeBookingEmail,
  resolvePreferredTimeRange,
} from "@/lib/booking/public";
import {
  clearPublicBookingRateLimit,
  getPublicBookingRateLimitStatus,
  registerPublicBookingAttempt,
} from "@/lib/booking/rate-limit";
import {
  enqueueAppointmentCreatedNotifications,
  enqueueWaitlistEntryCreatedNotifications,
} from "@/lib/notifications/outbox";
import { buildAppointmentCalendarLinks } from "@/lib/notifications/email-calendar-links";
import { prisma } from "@/lib/prisma";
import type { BookingStepAnchor } from "@/types/booking";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

type BookingRedirectState = {
  clinicSlug: string;
  serviceId?: string | null;
  doctorId?: string | null;
  date?: string | null;
  slot?: string | null;
  slotTime?: string | null;
  error?: string | null;
  status?: string | null;
  focus?: BookingStepAnchor | null;
  waitlist?: boolean | null;
};

type PublicClinicContext = {
  id: string;
  name: string;
  publicName: string | null;
  slug: string;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  isActive: boolean;
};

type BookingDatabaseClient = Prisma.TransactionClient | typeof prisma;

const PUBLIC_BOOKING_IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;

const publicBookingAppointmentSelect = {
  id: true,
  startAt: true,
  endAt: true,
  status: true,
  source: true,
  notes: true,
} satisfies Prisma.AppointmentSelect;

const publicWaitlistEntrySelect = {
  id: true,
  preferredDate: true,
  status: true,
} satisfies Prisma.WaitlistEntrySelect;

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function buildBookingRedirectPath(state: BookingRedirectState) {
  return buildBookingPath(state.clinicSlug, {
    serviceId: state.serviceId,
    doctorId: state.doctorId,
    date: state.date,
    slot: state.slot,
    slotTime: state.slotTime,
    error: state.error,
    status: state.status,
    focus: state.focus,
    waitlist: state.waitlist,
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

async function loadPublicClinic(clinicSlug: string) {
  return prisma.clinic.findUnique({
    where: {
      slug: clinicSlug,
    },
    select: {
      id: true,
      name: true,
      publicName: true,
      slug: true,
      timezone: true,
      contactEmail: true,
      contactPhone: true,
      websiteUrl: true,
      isActive: true,
    },
  }) as Promise<PublicClinicContext | null>;
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

async function resolvePublicPatient(params: {
  transaction: Prisma.TransactionClient;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  createAuditAction: string;
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
      action: params.createAuditAction,
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

async function resolveActiveBookingCatalog(params: {
  clinicId: string;
  serviceId: string;
  doctorId?: string | null;
}) {
  const [service, doctor] = await Promise.all([
    prisma.service.findFirst({
      where: {
        id: params.serviceId,
        clinicId: params.clinicId,
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    params.doctorId
      ? prisma.doctor.findFirst({
          where: {
            id: params.doctorId,
            clinicId: params.clinicId,
            isActive: true,
            isPublic: true,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    service,
    doctor,
  };
}

async function findRecentPublicBookingAppointment(params: {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  startAt: Date;
  dedupeWindowStart: Date;
  patientId?: string;
  patientPhone?: string;
  db?: BookingDatabaseClient;
}) {
  const db = params.db ?? prisma;
  const where: Prisma.AppointmentWhereInput = {
    clinicId: params.clinicId,
    doctorId: params.doctorId,
    serviceId: params.serviceId,
    startAt: params.startAt,
    source: AppointmentSource.PUBLIC_BOOKING,
    status: {
      in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
    },
    createdAt: {
      gte: params.dedupeWindowStart,
    },
  };

  if (params.patientId) {
    where.patientId = params.patientId;
  } else if (params.patientPhone) {
    where.patient = {
      is: {
        phoneE164: params.patientPhone,
      },
    };
  } else {
    return null;
  }

  return db.appointment.findFirst({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: publicBookingAppointmentSelect,
  });
}

async function redirectToPublicBookingConfirmation(params: {
  clinic: PublicClinicContext;
  clinicSlug: string;
  appointmentId: string;
  serviceId: string;
  doctorId: string;
  date: string;
  slotTime: string;
  serviceName: string;
  doctorName: string;
  appointmentStartAt: Date;
  appointmentEndAt: Date;
  selfServiceLinks?: {
    confirmUrl: string;
    cancelUrl: string;
    rescheduleUrl: string;
  } | null;
  ipAddress: string;
  phoneRateLimitKey: string;
}) {
  clearPublicBookingRateLimit(params.ipAddress, params.phoneRateLimitKey);
  const calendarLinks = buildAppointmentCalendarLinks({
    appointmentId: params.appointmentId,
    clinicName: getBookingClinicDisplayName(params.clinic),
    clinicPublicName: params.clinic.publicName,
    serviceName: params.serviceName,
    doctorName: params.doctorName,
    statusLabel: "Pendiente de confirmación",
    startAt: params.appointmentStartAt,
    endAt: params.appointmentEndAt,
    timezone: params.clinic.timezone,
    contactEmail: params.clinic.contactEmail,
    contactPhone: params.clinic.contactPhone,
    websiteUrl: params.clinic.websiteUrl,
    selfServiceLinks: params.selfServiceLinks ?? null,
  });

  await setPublicBookingConfirmationCookie({
    clinicSlug: params.clinic.slug,
    clinicName: getBookingClinicDisplayName(params.clinic),
    serviceName: params.serviceName,
    doctorName: params.doctorName,
    startAtIso: params.appointmentStartAt.toISOString(),
    timezone: params.clinic.timezone,
    statusLabel: "Pendiente de confirmación",
    calendarIcsUrl: calendarLinks.calendarIcsUrl,
    googleCalendarUrl: calendarLinks.googleCalendarUrl,
  });

  redirect(
    buildBookingRedirectPath({
      clinicSlug: params.clinicSlug,
      serviceId: params.serviceId,
      doctorId: params.doctorId,
      date: params.date,
      slotTime: params.slotTime,
      status: "booking-created",
    }),
  );
}

async function findExistingPublicWaitlistEntry(params: {
  clinicId: string;
  serviceId: string;
  doctorId: string | null;
  preferredDate: Date | null;
  patientId?: string;
  patientPhone?: string;
  db?: BookingDatabaseClient;
}) {
  const db = params.db ?? prisma;
  const where: Prisma.WaitlistEntryWhereInput = {
    clinicId: params.clinicId,
    serviceId: params.serviceId,
    doctorId: params.doctorId,
    preferredDate: params.preferredDate,
    status: {
      in: [WaitlistStatus.ACTIVE, WaitlistStatus.OFFERED],
    },
  };

  if (params.patientId) {
    where.patientId = params.patientId;
  } else if (params.patientPhone) {
    where.patient = {
      is: {
        phoneE164: params.patientPhone,
      },
    };
  } else {
    return null;
  }

  return db.waitlistEntry.findFirst({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: publicWaitlistEntrySelect,
  });
}

async function redirectToPublicWaitlistSuccess(params: {
  clinicSlug: string;
  serviceId: string;
  doctorId: string | null;
  date: string;
  ipAddress: string;
  phoneRateLimitKey: string;
}) {
  clearPublicBookingRateLimit(params.ipAddress, params.phoneRateLimitKey);

  redirect(
    buildBookingRedirectPath({
      clinicSlug: params.clinicSlug,
      serviceId: params.serviceId,
      doctorId: params.doctorId,
      date: params.date,
      status: "waitlist-created",
      focus: "fecha-hora",
    }),
  );
}

export async function createPublicBookingAction(formData: FormData) {
  const requestHeaders = await headers();
  const ipAddress = getBookingClientIp(requestHeaders);
  const clinicSlug = String(formData.get("clinicSlug") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const slotTime = String(
    formData.get("slot") ?? formData.get("slotTime") ?? "",
  ).trim();
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

  const clinic = await loadPublicClinic(clinicSlug);

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
        focus: "datos",
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

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        error: "service-required",
        focus: "servicio",
      }),
    );
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
        focus: "fecha-hora",
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
        focus: "fecha",
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
        focus: "fecha-hora",
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
        focus: "datos",
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
        focus: "datos",
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
        focus: "datos",
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
        focus: "datos",
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
        focus: "fecha",
      }),
    );
  }

  const slotDateMarker = buildClinicDateMarker(dateParts, clinic.timezone);
  const dedupeWindowStart = new Date(
    Date.now() - PUBLIC_BOOKING_IDEMPOTENCY_WINDOW_MS,
  );
  const { service, doctor } = await resolveActiveBookingCatalog({
    clinicId: clinic.id,
    serviceId,
    doctorId,
  });

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
        focus: "servicio",
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
        focus: "fecha-hora",
      }),
    );
  }

  const availableSlotResult = await getAvailableSlots({
    clinicId: clinic.id,
    doctorId: doctor.id,
    serviceId: service.id,
    date: slotDateMarker,
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
        focus: "fecha-hora",
      }),
    );
  }

  let appointmentId: string | null = null;
  let appointmentStartAt: Date | null = null;
  let appointmentEndAt: Date | null = null;
  let appointmentSelfServiceLinks:
    | {
        confirmUrl: string;
        cancelUrl: string;
        rescheduleUrl: string;
      }
    | null = null;

  try {
    const appointment = await prisma.$transaction(async (transaction) => {
      const patient = await resolvePublicPatient({
        transaction,
        clinicId: clinic.id,
        patientName,
        patientPhone: normalizedPhone,
        patientEmail,
        createAuditAction: "PUBLIC_BOOKING_PATIENT_CREATED",
      });

      const existingAppointment = await findRecentPublicBookingAppointment({
        clinicId: clinic.id,
        doctorId: doctor.id,
        serviceId: service.id,
        startAt: selectedSlot.startAt,
        dedupeWindowStart,
        patientId: patient.id,
        db: transaction,
      });

      if (existingAppointment) {
        return {
          ...existingAppointment,
          selfServiceLinks: null,
        };
      }

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

      await enqueueAppointmentCreatedNotifications({
        clinicId: clinic.id,
        appointmentId: createdAppointment.id,
        selfServiceLinks: createdAppointment.selfServiceLinks,
        db: transaction,
      });

      return createdAppointment;
    });

    appointmentId = appointment.id;
    appointmentStartAt = appointment.startAt;
    appointmentEndAt = appointment.endAt;
    appointmentSelfServiceLinks = appointment.selfServiceLinks;
  } catch (error) {
    const duplicateAppointment = await findRecentPublicBookingAppointment({
      clinicId: clinic.id,
      doctorId: doctor.id,
      serviceId: service.id,
      startAt: selectedSlot.startAt,
      dedupeWindowStart,
      patientPhone: normalizedPhone,
    });

    if (duplicateAppointment) {
      await redirectToPublicBookingConfirmation({
        clinic,
        clinicSlug,
        appointmentId: duplicateAppointment.id,
        serviceId: service.id,
        doctorId: doctor.id,
        date,
        slotTime,
        serviceName: service.name,
        doctorName: doctor.name,
        appointmentStartAt: duplicateAppointment.startAt,
        appointmentEndAt: duplicateAppointment.endAt,
        ipAddress,
        phoneRateLimitKey,
      });
    }

    const refreshedSlots = await getAvailableSlots({
      clinicId: clinic.id,
      doctorId: doctor.id,
      serviceId: service.id,
      date: slotDateMarker,
    });
    const isSlotStillAvailable = refreshedSlots.slots.some(
      (slot) => slot.startTime === slotTime,
    );

    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

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
        focus: isSlotStillAvailable ? "datos" : "fecha-hora",
      }),
    );
  }

  if (!appointmentId || !appointmentStartAt || !appointmentEndAt) {
    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId: service.id,
        doctorId: doctor.id,
        date,
        slotTime,
        error: "booking-save",
        focus: "datos",
      }),
    );
  }

  await redirectToPublicBookingConfirmation({
    clinic,
    clinicSlug,
    appointmentId,
    serviceId: service.id,
    doctorId: doctor.id,
    date,
    slotTime,
    serviceName: service.name,
    doctorName: doctor.name,
    appointmentStartAt,
    appointmentEndAt,
    selfServiceLinks: appointmentSelfServiceLinks,
    ipAddress,
    phoneRateLimitKey,
  });
}

export async function createPublicWaitlistEntryAction(formData: FormData) {
  const requestHeaders = await headers();
  const ipAddress = getBookingClientIp(requestHeaders);
  const clinicSlug = String(formData.get("clinicSlug") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "").trim() || null;
  const selectedDate = String(formData.get("returnDate") ?? "").trim();
  const patientName = normalizeOptionalText(formData.get("patientName"));
  const patientPhoneRaw = normalizeOptionalText(formData.get("patientPhone"));
  const patientEmailRaw = normalizeOptionalText(formData.get("patientEmail"));
  const preferredDateRaw = normalizeOptionalText(formData.get("preferredDate"));
  const preferredRange = String(formData.get("preferredRange") ?? "ANY").trim();
  const autoAccept = String(formData.get("autoAccept") ?? "") === "1";
  const notes = normalizeOptionalText(formData.get("notes"));
  const patientEmail = patientEmailRaw
    ? normalizeBookingEmail(patientEmailRaw)
    : null;
  const phoneRateLimitKey = buildPhoneRateLimitKey(patientPhoneRaw ?? "");

  if (!clinicSlug) {
    redirect("/");
  }

  const clinic = await loadPublicClinic(clinicSlug);

  if (!clinic || !clinic.isActive) {
    await registerPublicBookingFailure({
      clinicId: clinic?.id ?? null,
      clinicSlug,
      reason: "CLINIC_UNAVAILABLE",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: patientPhoneRaw,
    });

    redirect(buildBookingRedirectPath({ clinicSlug, error: "clinic-unavailable" }));
  }

  const rateLimitStatus = getPublicBookingRateLimitStatus(
    ipAddress,
    phoneRateLimitKey,
  );

  if (!rateLimitStatus.allowed) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_RATE_LIMITED",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: patientPhoneRaw,
      retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: selectedDate,
        error: "rate-limited",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  if (!serviceId) {
    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        error: "service-required",
        focus: "servicio",
      }),
    );
  }

  if (!patientName) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_NAME_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: selectedDate,
        error: "waitlist-name-required",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  if (!patientPhoneRaw) {
    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_PHONE_REQUIRED",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: selectedDate,
        error: "waitlist-phone-required",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  const normalizedPhone = normalizeWhatsAppPhone(patientPhoneRaw);

  if (!normalizedPhone) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_PHONE_INVALID",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: patientPhoneRaw,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: selectedDate,
        error: "waitlist-phone-invalid",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  if (patientEmail && !isValidBookingEmail(patientEmail)) {
    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_EMAIL_INVALID",
      ipAddress,
      serviceId,
      doctorId,
      date: selectedDate,
      phone: normalizedPhone,
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: selectedDate,
        error: "waitlist-email-invalid",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  const { service, doctor } = await resolveActiveBookingCatalog({
    clinicId: clinic.id,
    serviceId,
    doctorId,
  });

  if (!service) {
    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        error: "service-unavailable",
        focus: "servicio",
      }),
    );
  }

  if (doctorId && !doctor) {
    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        error: "doctor-unavailable",
        focus: "fecha-hora",
        waitlist: true,
      }),
    );
  }

  const preferredDateParts = preferredDateRaw
    ? parseIsoDateInput(preferredDateRaw)
    : null;
  const preferredDate = preferredDateParts
    ? buildClinicDateMarker(preferredDateParts, clinic.timezone)
    : null;
  const preferredWindow = resolvePreferredTimeRange(preferredRange);
  const waitlistDate = preferredDateRaw ?? selectedDate;

  try {
    await prisma.$transaction(async (transaction) => {
      const patient = await resolvePublicPatient({
        transaction,
        clinicId: clinic.id,
        patientName,
        patientPhone: normalizedPhone,
        patientEmail,
        createAuditAction: "PUBLIC_BOOKING_PATIENT_CREATED",
      });

      const existingWaitlistEntry = await findExistingPublicWaitlistEntry({
        clinicId: clinic.id,
        serviceId: service.id,
        doctorId: doctor?.id ?? null,
        preferredDate,
        patientId: patient.id,
        db: transaction,
      });

      if (existingWaitlistEntry) {
        return existingWaitlistEntry;
      }

      const waitlistEntry = await transaction.waitlistEntry.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          serviceId: service.id,
          doctorId: doctor?.id ?? null,
          preferredDate,
          preferredStartTime: preferredWindow.startTime,
          preferredEndTime: preferredWindow.endTime,
          notes,
          autoAccept,
          status: WaitlistStatus.ACTIVE,
        },
        select: {
          id: true,
          preferredDate: true,
        },
      });

      await createAuditLog(
        {
          clinicId: clinic.id,
          action: "WAITLIST_ENTRY_CREATED",
          entityType: "WAITLIST_ENTRY",
          entityId: waitlistEntry.id,
          metadata: {
            patientId: patient.id,
            serviceId: service.id,
            doctorId: doctor?.id ?? null,
            preferredDate: waitlistEntry.preferredDate?.toISOString() ?? null,
            preferredRange,
            autoAccept,
            notes,
          },
        },
        transaction,
      );

      await enqueueWaitlistEntryCreatedNotifications({
        clinicId: clinic.id,
        waitlistEntryId: waitlistEntry.id,
        db: transaction,
      });

      return waitlistEntry;
    });
  } catch (error) {
    const duplicateWaitlistEntry = await findExistingPublicWaitlistEntry({
      clinicId: clinic.id,
      serviceId: service.id,
      doctorId: doctor?.id ?? null,
      preferredDate,
      patientPhone: normalizedPhone,
    });

    if (duplicateWaitlistEntry) {
      await redirectToPublicWaitlistSuccess({
        clinicSlug,
        serviceId: service.id,
        doctorId: doctor?.id ?? null,
        date: waitlistDate,
        ipAddress,
        phoneRateLimitKey,
      });
    }

    registerPublicBookingAttempt(ipAddress, phoneRateLimitKey);
    console.error("No se pudo registrar la lista de espera publica.", error);

    await registerPublicBookingFailure({
      clinicId: clinic.id,
      clinicSlug,
      reason: "WAITLIST_SAVE_FAILED",
      ipAddress,
      serviceId,
      doctorId,
      date: waitlistDate,
      phone: normalizedPhone,
      metadata: {
        errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        preferredRange,
        autoAccept,
      },
    });

    redirect(
      buildBookingRedirectPath({
        clinicSlug,
        serviceId,
        doctorId,
        date: waitlistDate,
        error: "waitlist-save",
        focus: "lista-espera",
        waitlist: true,
      }),
    );
  }

  await redirectToPublicWaitlistSuccess({
    clinicSlug,
    serviceId: service.id,
    doctorId: doctor?.id ?? null,
    date: waitlistDate,
    ipAddress,
    phoneRateLimitKey,
  });
}
