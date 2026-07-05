"use server";

import { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildClinicDateMarker,
  buildClinicDateTime,
  createAppointmentSafely,
  getAvailableSlots,
  parseIsoDateInput,
  validateAppointmentSlot,
} from "@/lib/appointments/availability";
import { createAppointmentTokens } from "@/lib/appointments/tokens";
import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import {
  enqueueAppointmentCreatedNotifications,
  enqueueAppointmentStatusChangedNotification,
} from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";
import { processWaitlistForCancelledAppointment } from "@/lib/waitlist/matching";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";
import type { AppointmentSelfServiceLinksState } from "@/types/appointments";

type AppointmentsPathOptions = {
  status?: string;
  error?: string;
  formDoctorId?: string | null;
  formServiceId?: string | null;
  formDate?: string | null;
};

function buildAppointmentsPath(options: AppointmentsPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  if (options.formDoctorId) {
    params.set("formDoctorId", options.formDoctorId);
  }

  if (options.formServiceId) {
    params.set("formServiceId", options.formServiceId);
  }

  if (options.formDate) {
    params.set("formDate", options.formDate);
  }

  const query = params.toString();

  return `/app/appointments${query ? `?${query}` : ""}`;
}

function resolveSafeRedirectPath(
  value: FormDataEntryValue | null,
  fallbackPath: string,
) {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/app/")) {
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

function updatePathSearchParams(
  path: string,
  params: Record<string, string | null | undefined>,
) {
  const [pathname, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      query.delete(key);
      return;
    }

    query.set(key, value);
  });

  const serialized = query.toString();

  return `${pathname}${serialized ? `?${serialized}` : ""}`;
}

function resolveCreateAppointmentRedirectPaths(params: {
  redirectPathValue: FormDataEntryValue | null;
  successRedirectPathValue: FormDataEntryValue | null;
  fallbackPath: string;
}) {
  const redirectPath = params.redirectPathValue
    ? resolveSafeRedirectPath(params.redirectPathValue, params.fallbackPath)
    : null;
  const successRedirectPath = params.successRedirectPathValue
    ? resolveSafeRedirectPath(
        params.successRedirectPathValue,
        redirectPath ?? params.fallbackPath,
      )
    : redirectPath;

  return {
    redirectPath,
    successRedirectPath,
  };
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function revalidateAppointmentViews() {
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/doctors");
  revalidatePath("/app/notifications");
  revalidatePath("/app/services");
  revalidatePath("/app/waitlist");
  revalidatePath("/app/whatsapp-simulator");
}

async function resolvePatientForAppointment({
  transaction,
  clinicId,
  userId,
  existingPatientId,
  patientName,
  patientPhoneRaw,
  patientEmail,
}: {
  transaction: Prisma.TransactionClient;
  clinicId: string;
  userId: string;
  existingPatientId: string | null;
  patientName: string | null;
  patientPhoneRaw: string | null;
  patientEmail: string | null;
}) {
  if (existingPatientId) {
    const patient = await transaction.patient.findFirst({
      where: {
        id: existingPatientId,
        clinicId,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      throw new Error("patient-not-found");
    }

    return patient.id;
  }

  if (!patientName) {
    throw new Error("patient-name-required");
  }

  if (!patientPhoneRaw) {
    throw new Error("patient-phone-required");
  }

  const normalizedPhone = normalizeWhatsAppPhone(patientPhoneRaw);

  if (!normalizedPhone) {
    throw new Error("patient-phone-invalid");
  }

  if (patientEmail && !isValidEmail(patientEmail)) {
    throw new Error("patient-email-invalid");
  }

  const existingPatient = await transaction.patient.findUnique({
    where: {
      clinicId_phoneE164: {
        clinicId,
        phoneE164: normalizedPhone,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPatient) {
    return existingPatient.id;
  }

  const patient = await transaction.patient.create({
    data: {
      clinicId,
      name: patientName,
      phoneE164: normalizedPhone,
      email: patientEmail,
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
      clinicId,
      userId,
      action: "PATIENT_CREATED_FROM_APPOINTMENT",
      entityType: "PATIENT",
      entityId: patient.id,
      metadata: {
        name: patient.name,
        phoneE164: patient.phoneE164,
        email: patient.email,
      },
    },
    transaction,
  );

  return patient.id;
}

export async function createAdminAppointmentAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const fallbackPath = buildAppointmentsPath();
  const explicitRedirects = resolveCreateAppointmentRedirectPaths({
    redirectPathValue: formData.get("redirectPath"),
    successRedirectPathValue: formData.get("successRedirectPath"),
    fallbackPath,
  });
  const formDoctorId = String(formData.get("doctorId") ?? "").trim();
  const formServiceId = String(formData.get("serviceId") ?? "").trim();
  const formDate = String(formData.get("date") ?? "").trim();
  const slotTime = String(formData.get("slotTime") ?? "").trim();
  const existingPatientId = String(formData.get("existingPatientId") ?? "").trim() || null;
  const patientName = normalizeOptionalText(formData.get("patientName"));
  const patientPhone = normalizeOptionalText(formData.get("patientPhone"));
  const patientEmail = normalizeOptionalText(formData.get("patientEmail"));
  const notes = normalizeOptionalText(formData.get("notes"));
  const returnDoctorId = String(formData.get("returnDoctorId") ?? "").trim() || formDoctorId;
  const returnServiceId =
    String(formData.get("returnServiceId") ?? "").trim() || formServiceId;
  const returnDate = String(formData.get("returnDate") ?? "").trim() || formDate;
  const buildErrorRedirect = (error: string) => {
    if (explicitRedirects.redirectPath) {
      return appendFeedbackToPath(explicitRedirects.redirectPath, { error });
    }

    return buildAppointmentsPath({
      error,
      formDoctorId: returnDoctorId,
      formServiceId: returnServiceId,
      formDate: returnDate,
    });
  };

  if (!formDoctorId) {
    redirect(
      explicitRedirects.redirectPath
        ? appendFeedbackToPath(explicitRedirects.redirectPath, {
            error: "doctor-required",
          })
        : buildAppointmentsPath({ error: "doctor-required" }),
    );
  }

  if (!formServiceId) {
    redirect(buildErrorRedirect("service-required"));
  }

  if (!formDate) {
    redirect(buildErrorRedirect("date-required"));
  }

  if (!slotTime) {
    redirect(buildErrorRedirect("slot-required"));
  }

  const dateParts = parseIsoDateInput(formDate);

  if (!dateParts) {
    redirect(buildErrorRedirect("date-required"));
  }

  const [doctor, service] = await Promise.all([
    prisma.doctor.findFirst({
      where: {
        id: formDoctorId,
        clinicId: authContext.clinic.id,
      },
      select: {
        id: true,
        isActive: true,
      },
    }),
    prisma.service.findFirst({
      where: {
        id: formServiceId,
        clinicId: authContext.clinic.id,
      },
      select: {
        id: true,
        isActive: true,
      },
    }),
  ]);

  if (!doctor || !doctor.isActive) {
    redirect(buildErrorRedirect("doctor-inactive"));
  }

  if (!service || !service.isActive) {
    redirect(buildErrorRedirect("service-inactive"));
  }

  let createdAppointmentId: string | null = null;

  try {
    await prisma.$transaction(async (transaction) => {
      const patientId = await resolvePatientForAppointment({
        transaction,
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        existingPatientId,
        patientName,
        patientPhoneRaw: patientPhone,
        patientEmail,
      });

      const selectedDate = buildClinicDateTime(
        dateParts,
        "12:00",
        authContext.clinic.timezone,
      );
      const availableSlotResult = await getAvailableSlots({
        clinicId: authContext.clinic.id,
        doctorId: formDoctorId,
        serviceId: formServiceId,
        date: selectedDate,
        db: transaction,
      });
      const selectedSlot = availableSlotResult.slots.find(
        (slot) => slot.startTime === slotTime,
      );

      if (!selectedSlot) {
        throw new Error("slot-unavailable");
      }

      const appointment = await createAppointmentSafely({
        clinicId: authContext.clinic.id,
        doctorId: formDoctorId,
        serviceId: formServiceId,
        patientId,
        startAt: selectedSlot.startAt,
        status: AppointmentStatus.CONFIRMED,
        source: AppointmentSource.ADMIN,
        notes,
        actorUserId: authContext.user.id,
        db: transaction,
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "APPOINTMENT_CREATED_ADMIN",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
          metadata: {
            doctorId: appointment.doctorId,
            serviceId: appointment.serviceId,
            patientId: appointment.patientId,
            startAt: appointment.startAt.toISOString(),
            endAt: appointment.endAt.toISOString(),
            status: appointment.status,
            source: appointment.source,
          },
        },
        transaction,
      );

      await enqueueAppointmentCreatedNotifications({
        clinicId: authContext.clinic.id,
        appointmentId: appointment.id,
        selfServiceLinks: appointment.selfServiceLinks,
        actorUserId: authContext.user.id,
        db: transaction,
      });

      createdAppointmentId = appointment.id;
    });
  } catch (error) {
    if (error instanceof Error) {
      const knownErrors = new Set([
        "patient-not-found",
        "patient-name-required",
        "patient-phone-required",
        "patient-phone-invalid",
        "patient-email-invalid",
        "slot-unavailable",
      ]);

      if (knownErrors.has(error.message)) {
        redirect(buildErrorRedirect(error.message));
      }
    }

    console.error("No se pudo crear la cita desde el panel.", error);
    redirect(buildErrorRedirect("appointment-save"));
  }

  revalidateAppointmentViews();

  if (explicitRedirects.successRedirectPath && createdAppointmentId) {
    redirect(
      updatePathSearchParams(explicitRedirects.successRedirectPath, {
        status: "appointment-created",
        error: null,
        appointmentId: createdAppointmentId,
      }),
    );
  }

  redirect(buildAppointmentsPath({ status: "appointment-created" }));
}

export async function rescheduleAdminAppointmentAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const selectedDate = String(formData.get("date") ?? "").trim();
  const selectedSlotTime = String(formData.get("slotTime") ?? "").trim();
  const fallbackPath = buildAppointmentsPath();
  const redirectPath = resolveSafeRedirectPath(
    formData.get("redirectPath"),
    fallbackPath,
  );
  const successRedirectPath = resolveSafeRedirectPath(
    formData.get("successRedirectPath"),
    redirectPath,
  );

  if (!appointmentId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-not-found" }));
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      clinicId: true,
      patientId: true,
      doctorId: true,
      serviceId: true,
      status: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!appointment) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-not-found" }));
  }

  if (
    appointment.status !== AppointmentStatus.PENDING &&
    appointment.status !== AppointmentStatus.CONFIRMED
  ) {
    redirect(
      appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }),
    );
  }

  if (!selectedDate) {
    redirect(appendFeedbackToPath(redirectPath, { error: "date-required" }));
  }

  if (!selectedSlotTime) {
    redirect(appendFeedbackToPath(redirectPath, { error: "slot-required" }));
  }

  const dateParts = parseIsoDateInput(selectedDate);

  if (!dateParts) {
    redirect(appendFeedbackToPath(redirectPath, { error: "date-required" }));
  }

  const availableSlotResult = await getAvailableSlots({
    clinicId: authContext.clinic.id,
    doctorId: appointment.doctorId,
    serviceId: appointment.serviceId,
    date: buildClinicDateMarker(dateParts, authContext.clinic.timezone),
    excludeAppointmentId: appointment.id,
  });
  const selectedSlot = availableSlotResult.slots.find(
    (slot) => slot.startTime === selectedSlotTime,
  );

  if (!selectedSlot) {
    redirect(appendFeedbackToPath(redirectPath, { error: "slot-unavailable" }));
  }

  const slotValidation = await validateAppointmentSlot({
    clinicId: authContext.clinic.id,
    doctorId: appointment.doctorId,
    serviceId: appointment.serviceId,
    patientId: appointment.patientId,
    startAt: selectedSlot.startAt,
    actorUserId: authContext.user.id,
    excludeAppointmentId: appointment.id,
  });

  if (!slotValidation.ok) {
    redirect(appendFeedbackToPath(redirectPath, { error: "slot-unavailable" }));
  }

  await prisma.$transaction(async (transaction) => {
    const updatedAppointment = await transaction.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        startAt: slotValidation.startAt,
        endAt: slotValidation.endAt,
      },
      select: {
        id: true,
        startAt: true,
      },
    });

    const tokenBundle = await createAppointmentTokens({
      clinicId: authContext.clinic.id,
      appointmentId: updatedAppointment.id,
      appointmentStartAt: updatedAppointment.startAt,
      db: transaction,
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "APPOINTMENT_RESCHEDULED_ADMIN",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          previousStatus: appointment.status,
          nextStatus: appointment.status,
          previousStartAt: appointment.startAt.toISOString(),
          previousEndAt: appointment.endAt.toISOString(),
          nextStartAt: slotValidation.startAt.toISOString(),
          nextEndAt: slotValidation.endAt.toISOString(),
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          serviceId: appointment.serviceId,
        },
      },
      transaction,
    );

    await enqueueAppointmentStatusChangedNotification({
      clinicId: authContext.clinic.id,
      appointmentId: updatedAppointment.id,
      changeType: "RESCHEDULED",
      selfServiceLinks: {
        confirmUrl: tokenBundle.confirm.url,
        cancelUrl: tokenBundle.cancel.url,
        rescheduleUrl: tokenBundle.reschedule.url,
      },
      actorUserId: authContext.user.id,
      db: transaction,
    });
  });

  revalidateAppointmentViews();
  redirect(
    updatePathSearchParams(successRedirectPath, {
      status: "appointment-rescheduled",
      error: null,
      appointmentId: appointment.id,
      rescheduleAppointmentId: null,
      rescheduleDate: null,
      rescheduleSlotTime: null,
    }),
  );
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const fallbackPath = buildAppointmentsPath();
  const redirectPath = resolveSafeRedirectPath(
    formData.get("redirectPath"),
    fallbackPath,
  );

  if (!appointmentId) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-not-found" }));
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      clinicId: true,
      status: true,
      patientId: true,
      doctorId: true,
      serviceId: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!appointment) {
    redirect(appendFeedbackToPath(redirectPath, { error: "appointment-not-found" }));
  }

  let nextStatus: AppointmentStatus | null = null;
  let auditAction = "";
  let successStatus = "";

  switch (intent) {
    case "confirm":
      if (appointment.status !== AppointmentStatus.PENDING) {
        redirect(appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }));
      }

      nextStatus = AppointmentStatus.CONFIRMED;
      auditAction = "APPOINTMENT_CONFIRMED_ADMIN";
      successStatus = "appointment-confirmed";
      break;
    case "cancel":
      if (
        appointment.status !== AppointmentStatus.PENDING &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }));
      }

      nextStatus = AppointmentStatus.CANCELLED;
      auditAction = "APPOINTMENT_CANCELLED_ADMIN";
      successStatus = "appointment-cancelled";
      break;
    case "complete":
      if (
        appointment.status !== AppointmentStatus.PENDING &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }));
      }

      nextStatus = AppointmentStatus.COMPLETED;
      auditAction = "APPOINTMENT_COMPLETED";
      successStatus = "appointment-completed";
      break;
    case "no-show":
      if (
        appointment.status !== AppointmentStatus.PENDING &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        redirect(appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }));
      }

      nextStatus = AppointmentStatus.NO_SHOW;
      auditAction = "APPOINTMENT_NO_SHOW";
      successStatus = "appointment-no-show";
      break;
    default:
      redirect(appendFeedbackToPath(redirectPath, { error: "appointment-action-invalid" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: nextStatus,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: auditAction,
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          previousStatus: appointment.status,
          nextStatus,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          serviceId: appointment.serviceId,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString(),
        },
      },
      transaction,
    );

    if (nextStatus === AppointmentStatus.CONFIRMED) {
      await enqueueAppointmentStatusChangedNotification({
        clinicId: authContext.clinic.id,
        appointmentId: appointment.id,
        changeType: "CONFIRMED",
        actorUserId: authContext.user.id,
        db: transaction,
      });
    }

    if (nextStatus === AppointmentStatus.CANCELLED) {
      await enqueueAppointmentStatusChangedNotification({
        clinicId: authContext.clinic.id,
        appointmentId: appointment.id,
        changeType: "CANCELLED",
        actorUserId: authContext.user.id,
        db: transaction,
      });

      await processWaitlistForCancelledAppointment({
        clinicId: authContext.clinic.id,
        cancelledAppointmentId: appointment.id,
        actorUserId: authContext.user.id,
        db: transaction,
      });
    }
  });

  revalidateAppointmentViews();
  redirect(appendFeedbackToPath(redirectPath, { status: successStatus }));
}

export async function generateAppointmentSelfServiceLinksAction(
  _previousState: AppointmentSelfServiceLinksState,
  formData: FormData,
): Promise<AppointmentSelfServiceLinksState> {
  const authContext = await requireAuthContext();
  const appointmentId = String(formData.get("appointmentId") ?? "").trim();

  if (process.env.NODE_ENV === "production") {
    return {
      error: "Los enlaces de prueba solo estan disponibles en desarrollo.",
      links: null,
    };
  }

  if (!appointmentId) {
    return {
      error: "No encontre la cita para generar enlaces de autoservicio.",
      links: null,
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      clinicId: true,
      startAt: true,
    },
  });

  if (!appointment) {
    return {
      error: "No encontré la reserva dentro del negocio actual.",
      links: null,
    };
  }

  const tokenBundle = await createAppointmentTokens({
    clinicId: appointment.clinicId,
    appointmentId: appointment.id,
    appointmentStartAt: appointment.startAt,
  });

  return {
    error: null,
    links: {
      confirmUrl: tokenBundle.confirm.url,
      cancelUrl: tokenBundle.cancel.url,
      rescheduleUrl: tokenBundle.reschedule.url,
    },
  };
}
