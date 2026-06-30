"use server";

import { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildClinicDateTime,
  createAppointmentSafely,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/engine";

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
  revalidatePath("/app/services");
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

  if (!formDoctorId) {
    redirect(buildAppointmentsPath({ error: "doctor-required" }));
  }

  if (!formServiceId) {
    redirect(
      buildAppointmentsPath({
        error: "service-required",
        formDoctorId: returnDoctorId,
      }),
    );
  }

  if (!formDate) {
    redirect(
      buildAppointmentsPath({
        error: "date-required",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
      }),
    );
  }

  if (!slotTime) {
    redirect(
      buildAppointmentsPath({
        error: "slot-required",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
        formDate: returnDate,
      }),
    );
  }

  const dateParts = parseIsoDateInput(formDate);

  if (!dateParts) {
    redirect(
      buildAppointmentsPath({
        error: "date-required",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
        formDate: returnDate,
      }),
    );
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
    redirect(
      buildAppointmentsPath({
        error: "doctor-inactive",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
        formDate: returnDate,
      }),
    );
  }

  if (!service || !service.isActive) {
    redirect(
      buildAppointmentsPath({
        error: "service-inactive",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
        formDate: returnDate,
      }),
    );
  }

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
        redirect(
          buildAppointmentsPath({
            error: error.message,
            formDoctorId: returnDoctorId,
            formServiceId: returnServiceId,
            formDate: returnDate,
          }),
        );
      }
    }

    console.error("No se pudo crear la cita desde el panel.", error);
    redirect(
      buildAppointmentsPath({
        error: "appointment-save",
        formDoctorId: returnDoctorId,
        formServiceId: returnServiceId,
        formDate: returnDate,
      }),
    );
  }

  revalidateAppointmentViews();
  redirect(buildAppointmentsPath({ status: "appointment-created" }));
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
  });

  revalidateAppointmentViews();
  redirect(appendFeedbackToPath(redirectPath, { status: successStatus }));
}
